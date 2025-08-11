// Hook untuk manajemen data widget - menangani data time series, pembaruan real-time, dan agregasi
// Mendukung: widget chart, widget nilai, dan streaming real-time via WebSocket
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend, timezoneConfig, convertUTCToLocalTime } from "@/lib/helper";

export function useWidgetData(widget, timeRange = "1h", dataCount = "100", filterType = "count", pairsInput) {
  const { user } = useUser();
  const { ws } = useWebSocket();
  
  // State untuk data real-time dan time series
  const [realTimeData, setRealTimeData] = useState(null); // Nilai terbaru tunggal
  const [latestValue, setLatestValue] = useState(null); // Untuk widget nilai
  const [realtimeTimeSeriesData, setRealtimeTimeSeriesData] = useState({}); // Data chart real-time
  const [dynamicTimeAgo, setDynamicTimeAgo] = useState(null); // timeAgo dinamis yang diperbarui tiap menit
  const lastUpdateTime = useRef(null);
  const timeAgoIntervalRef = useRef(null);
  const latestTimestampRef = useRef(null); // Menyimpan timestamp terbaru
  const latestDataTypeRef = useRef(null); // Menyimpan data_type terbaru

  // Ekstrak pasangan device-datastream dari berbagai format input widget
  // Mendukung banyak format input untuk kompatibilitas mundur
  const pairs =
    Array.isArray(pairsInput) && pairsInput.length > 0
      ? pairsInput
      : widget?.inputs && Array.isArray(widget.inputs)
        ? widget.inputs
        : widget?.datastream_ids && Array.isArray(widget.datastream_ids)
          ? widget.datastream_ids
          : widget?.device_id && widget?.datastream_id
            ? [
                {
                  device_id: widget.device_id,
                  datastream_id: widget.datastream_id,
                },
              ]
            : [];

  const isValidWidget = pairs.length > 0;

  // Query untuk mendapatkan data time series semua pair - HANYA SAAT MUAT AWAL
  const {
    data: timeSeriesDataRaw,
    isLoading: isLoadingTimeSeries,
    error: timeSeriesError,
    refetch: refetchTimeSeries,
  } = useQuery({
    queryKey: ["widget-timeseries-multi", pairs, timeRange, dataCount, filterType],
    queryFn: async () => {
      if (!isValidWidget) return [];
      // PENTING: Untuk multi-datastream, setiap datastream harus mendapat request terpisah
      // agar filter count bekerja per datastream, bukan gabungan semua datastream
      const results = await Promise.all(
        pairs.map(async (pair) => {
          // Tentukan endpoint berdasarkan tipe filter
          let endpoint;
          if (filterType === "time") {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          } else if (filterType === "count") {
            // Filter berdasarkan jumlah - SETIAP datastream mendapat ${dataCount} data terakhir
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?count=${dataCount}`;
          } else {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          }
          
          const response = await fetchFromBackend(endpoint);
          if (!response.ok) return [];
          const data = await response.json();
          
          // Log debug untuk melihat data yang diterima
          // console.log(`📊 Data diterima untuk Device ${pair.device_id} Datastream ${pair.datastream_id}:`, {
          //   count: data.result?.length || 0,
          //   filterType: data.filterType,
          //   dataCount: data.dataCount
          // });
          
          return (data.result || []).map((item) => ({
            ...item,
            device_id: pair.device_id,
            datastream_id: pair.datastream_id,
          }));
        })
      );
      return results;
    },
    enabled: isValidWidget,
    // HAPUS refetchInterval - hanya fetch sekali saat muat awal
    refetchInterval: false,
    staleTime: Infinity, // Data tidak pernah stale karena update via WebSocket
  });

  // Query untuk mendapatkan info datastream (type, min_value, max_value)
  const {
    data: datastreamInfo,
    isLoading: isLoadingDatastream
  } = useQuery({
    queryKey: ["widget-datastream-info", pairs],
    queryFn: async () => {
      if (!isValidWidget) return [];
      const results = await Promise.all(
        pairs.map(async (pair) => {
          const response = await fetchFromBackend(
            `/datastream/${pair.datastream_id}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          return {
            ...data.result,
            device_id: pair.device_id,
            datastream_id: pair.datastream_id,
          };
        })
      );
      return results.filter(Boolean);
    },
    enabled: isValidWidget,
    staleTime: 30000, // Info datastream jarang berubah
  });

  // Query untuk mendapatkan nilai terbaru semua pair - HANYA SAAT MUAT AWAL
  const {
    data: latestDataRaw,
    isLoading: isLoadingLatest,
    error: latestError,
    refetch: refetchLatest,
  } = useQuery({
    queryKey: ["widget-latest-multi", pairs],
    queryFn: async () => {
      if (!isValidWidget) return [];
      const results = await Promise.all(
        pairs.map(async (pair) => {
          const response = await fetchFromBackend(
            `/payload/${pair.device_id}/${pair.datastream_id}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          const result = data.result || [];
          return result.length > 0
            ? {
                ...result[0],
                device_id: pair.device_id,
                datastream_id: pair.datastream_id,
              }
            : null;
        })
      );
      return results;
    },
    enabled: isValidWidget,
    // HAPUS refetchInterval - hanya fetch sekali saat muat awal
    refetchInterval: false,
    staleTime: Infinity, // Data tidak pernah stale karena update via WebSocket
  });

  // Set nilai terbaru dari semua pair (ambil yang paling baru)
  useEffect(() => {
    if (latestDataRaw && Array.isArray(latestDataRaw)) {
      // Ambil data terbaru berdasarkan device_time
      const all = latestDataRaw.filter(Boolean);
      if (all.length === 0) return;
      const sorted = [...all].sort(
        (a, b) => {
          const timeA = new Date(a.timestamp || a.device_time);
          const timeB = new Date(b.timestamp || b.device_time);
          return timeB - timeA;
        }
      );
      setLatestValue(sorted[0]);
    }
  }, [latestDataRaw]);

  // Efek untuk memperbarui timeAgo secara berkala (setiap 1 menit)
  useEffect(() => {
    // Fungsi untuk memperbarui timeAgo menggunakan ref
    const updateTimeAgo = () => {
      if (latestTimestampRef.current) {
        const newTimeAgo = getTimeAgo(latestTimestampRef.current, latestDataTypeRef.current);
        // console.log('🕐 TimeAgo diperbarui:', {
        //   timestamp: latestTimestampRef.current,
        //   oldTimeAgo: dynamicTimeAgo,
        //   newTimeAgo: newTimeAgo,
        //   time: new Date().toLocaleTimeString()
        // });
        setDynamicTimeAgo(newTimeAgo);
      }
    };

    // Set timeAgo awal ketika latestValue berubah
    if (latestValue) {
      const timestamp = latestValue.timestamp || latestValue.device_time;
      latestTimestampRef.current = timestamp;
      latestDataTypeRef.current = latestValue.data_type;
      
      // console.log('📍 Mengatur interval timeAgo untuk:', {
      //   timestamp: timestamp,
      //   dataType: latestValue.data_type
      // });
      
      updateTimeAgo();
      
      // Bersihkan interval sebelumnya jika ada
      if (timeAgoIntervalRef.current) {
        clearInterval(timeAgoIntervalRef.current);
        // console.log('🧹 Interval sebelumnya dibersihkan');
      }
      
      // Set interval untuk update setiap 10 detik untuk pengujian (nanti ubah ke 60000ms)
      timeAgoIntervalRef.current = setInterval(() => {
        // console.log('⏰ Interval dipicu pada:', new Date().toLocaleTimeString());
        updateTimeAgo();
      }, 10000); // 10 detik untuk pengujian
      
      // console.log('✅ Interval baru disetel dengan ID:', timeAgoIntervalRef.current);
    }

    // Cleanup interval saat komponen unmount atau latestValue berubah
    return () => {
      if (timeAgoIntervalRef.current) {
        // console.log('🗑️ Membersihkan interval:', timeAgoIntervalRef.current);
        clearInterval(timeAgoIntervalRef.current);
        timeAgoIntervalRef.current = null;
      }
    };
  }, [latestValue]); // Jalankan ulang ketika latestValue berubah

  // Inisialisasi data real-time dengan data dari server saat fetch berhasil
  useEffect(() => {
    if (timeSeriesDataRaw) {
      const initialData = {};
      timeSeriesDataRaw.forEach(pairData => {
        pairData.forEach(item => {
          if (!initialData[item.datastream_id]) {
            initialData[item.datastream_id] = [];
          }
          // Konversi timestamp dari UTC ke waktu lokal untuk data awal
          const timestamp = item.timestamp || item.device_time;
          const convertedTime = convertUTCToLocalTime(timestamp);
          
          const normalizedItem = {
            ...item,
            timestamp: convertedTime || timestamp, // Gunakan timestamp yang sudah dikonversi
          };
          initialData[item.datastream_id].push(normalizedItem);
        });
      });
      setRealtimeTimeSeriesData(initialData);
    }
  }, [timeSeriesDataRaw]);

  // Efek untuk menerapkan kembali sliding window ketika filter berubah
  useEffect(() => {
    if (filterType === "count" && Object.keys(realtimeTimeSeriesData).length > 0) {
      const countNum = parseInt(dataCount);
      if (!isNaN(countNum) && dataCount !== "all") {
        setRealtimeTimeSeriesData(prevData => {
          const updated = { ...prevData };
          
          // Terapkan kembali sliding window untuk semua datastream
          Object.keys(updated).forEach(datastreamId => {
            if (updated[datastreamId] && updated[datastreamId].length > countNum) {
              updated[datastreamId] = updated[datastreamId]
                .sort((a, b) => {
                  const timeA = new Date(a.timestamp || a.device_time);
                  const timeB = new Date(b.timestamp || b.device_time);
                  return timeB - timeA; // Descending (terbaru dulu)
                })
                .slice(0, countNum); // Ambil N data terakhir
            }
          });
          
          return updated;
        });
      }
    }
  }, [filterType, dataCount]);

  // Efek untuk membersihkan data real-time ketika time range berubah untuk mode "time"
  useEffect(() => {
    if (filterType === "time" && Object.keys(realtimeTimeSeriesData).length > 0) {
      setRealtimeTimeSeriesData(prevData => {
        const updated = { ...prevData };
        
        // Hapus data yang sudah di luar jangkauan waktu untuk semua datastream
        Object.keys(updated).forEach(datastreamId => {
          if (updated[datastreamId]) {
            updated[datastreamId] = updated[datastreamId].filter(item => 
              isWithinTimeRange(item.timestamp, timeRange)
            );
          }
        });
        
        return updated;
      });
    }
  }, [filterType, timeRange]);

  // Listener pembaruan real-time via WebSocket
  useEffect(() => {
    if (!ws || !isValidWidget || !user) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "sensor_update" &&
          data.user_id === user.id &&
          pairs.some(
            (pair) =>
              pair.device_id === data.device_id &&
              pair.datastream_id === data.datastream_id
          )
        ) {
          setRealTimeData(data);
          
          // PERBAIKAN: Untuk WebSocket real-time, gunakan timestamp langsung tanpa konversi
          // karena backend sudah mengirim device timestamp yang benar
          const timestamp = data.device_time || data.timestamp;
          
          // Perbarui nilai terbaru secara langsung
          setLatestValue({
            value: data.value,
            timestamp: timestamp, // Gunakan timestamp langsung dari WebSocket
            device_time: data.device_time || data.timestamp, // Raw timestamp untuk referensi
            sensor_name: data.sensor_name,
            unit: data.unit,
            device_name: data.device_name,
            device_id: data.device_id,
            datastream_id: data.datastream_id,
            data_type: data.data_type,
          });

          // Perbarui timeAgo dinamis untuk data real-time baru
          const newTimeAgo = getTimeAgo(timestamp, data.data_type);
          setDynamicTimeAgo(newTimeAgo);

          // Simpan ref timestamp dan data_type terbaru
          latestTimestampRef.current = timestamp;
          latestDataTypeRef.current = data.data_type;

          // Reset interval untuk timeAgo ketika ada data real-time baru
          if (timeAgoIntervalRef.current) {
            clearInterval(timeAgoIntervalRef.current);
          }
          // Set interval baru untuk memperbarui timeAgo setiap 10 detik untuk pengujian
          timeAgoIntervalRef.current = setInterval(() => {
            if (latestTimestampRef.current) {
              const updatedTimeAgo = getTimeAgo(latestTimestampRef.current, latestDataTypeRef.current);
              setDynamicTimeAgo(updatedTimeAgo);
            }
          }, 10000); // 10 detik untuk pengujian

          // TAMBAHKAN DATA BARU KE CHART SECARA REAL-TIME
          const newDataPoint = {
            id: data.id,
            device_id: data.device_id,
            datastream_id: data.datastream_id,
            value: parseFloat(data.value),
            timestamp: timestamp, // Gunakan timestamp langsung dari WebSocket
            device_time: data.device_time || data.timestamp, // Simpan raw timestamp untuk referensi
            device_name: data.device_name,
            sensor_name: data.sensor_name,
            unit: data.unit,
          };

          // Perbarui data chart real-time dengan manajemen sliding window
          setRealtimeTimeSeriesData(prevData => {
            const updated = { ...prevData };
            const datastreamId = newDataPoint.datastream_id;
            
            if (!updated[datastreamId]) {
              updated[datastreamId] = [];
            }
            
            // Untuk filter time, cek apakah data baru masih dalam jangkauan waktu
            if (filterType === "time" && !isWithinTimeRange(newDataPoint.timestamp, timeRange)) {
              // Jika data baru di luar jangkauan waktu, jangan tambahkan
              return updated;
            }
            
            // Tambahkan data point baru
            updated[datastreamId] = [...updated[datastreamId], newDataPoint];
            
            // Manajemen SLIDING WINDOW berdasarkan tipe filter
            if (filterType === "count") {
              const countNum = parseInt(dataCount);
              if (!isNaN(countNum) && dataCount !== "all") {
                // Untuk count filter: simpan hanya N data terakhir per datastream
                updated[datastreamId] = updated[datastreamId]
                  .sort((a, b) => {
                    const timeA = new Date(a.timestamp || a.device_time);
                    const timeB = new Date(b.timestamp || b.device_time);
                    return timeB - timeA; // Descending (terbaru dulu)
                  })
                  .slice(0, countNum); // Ambil N data terakhir
              }
            } else {
              // Untuk filter time, hapus data yang sudah di luar jangkauan waktu
              updated[datastreamId] = updated[datastreamId].filter(item => 
                isWithinTimeRange(item.timestamp, timeRange)
              );
              
              // Batasi penggunaan memori (maks 1000 data per datastream)
              if (updated[datastreamId].length > 1000) {
                updated[datastreamId] = updated[datastreamId]
                  .sort((a, b) => {
                    const timeA = new Date(a.timestamp || a.device_time);
                    const timeB = new Date(b.timestamp || b.device_time);
                    return timeB - timeA; // Descending (terbaru dulu)
                  })
                  .slice(0, 1000); // Simpan 1000 data terbaru                
              }
            }
            
            return updated;
          });
          lastUpdateTime.current = Date.now();
        }
      } catch (error) {
        console.error("Kesalahan saat menguraikan pesan WebSocket:", error);
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, pairs, user, timeRange, filterType, dataCount]); // Tetap perlu filterType dan dataCount untuk manajemen sliding window

  // Gabungkan data time series semua pair berdasarkan waktu
  const formattedTimeSeriesData = useMemo(() => {
    if (!Array.isArray(timeSeriesDataRaw) || timeSeriesDataRaw.length === 0) {
      return [];
    }

    if (filterType === "count") {
      // Untuk filter count, proses setiap datastream terpisah untuk mempertahankan keseimbangan
      const allDataPoints = [];
      const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
      
      // Kumpulkan semua timestamp unik dari semua datastream
      const timestampSet = new Set();
      
      timeSeriesDataRaw.forEach((pairData, pairIndex) => {
        const pair = pairs[pairIndex];
        
        pairData.forEach((item) => {
          const timestamp = item.timestamp || item.device_time;
          const utcTime = convertUTCToLocalTime(timestamp);
          
          if (!utcTime) {
            console.warn('Timestamp tidak valid di formattedTimeSeriesData:', timestamp);
            return;
          }
          
          const timeKey = utcTime.toISOString();
          timestampSet.add(timeKey);
          
          allDataPoints.push({
            timeKey,
            timestamp: utcTime,
            originalTimestamp: timestamp,
            device_id: item.device_id,
            datastream_id: item.datastream_id,
            value: parseFloat(item.value),
            device_name: item.device_name,
            sensor_name: item.sensor_name,
            unit: item.unit,
            pair_index: pairIndex
          });
        });
      });
      
      // Urutkan timestamp dan ambil hanya data yang dibutuhkan untuk menjaga keseimbangan
      const sortedTimestamps = Array.from(timestampSet).sort();
      
      // Buat data chart dengan mempertahankan keseimbangan per datastream
      const chartData = [];
      
      sortedTimestamps.forEach(timeKey => {
        const dataPoint = {
          timestamp: timeKey,
          originalTimestamp: timeKey,
          time: new Date(timeKey).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezoneConfig.timezone
          }),
        };
        
        // Inisialisasi semua key datastream dengan null
        deviceDatastreamKeys.forEach(dsKey => {
          dataPoint[dsKey] = null;
        });
        
        // Tetapkan nilai untuk setiap datastream jika ada data pada timestamp ini
        allDataPoints
          .filter(point => point.timeKey === timeKey)
          .forEach(point => {
            dataPoint[`value_${point.device_id}_${point.datastream_id}`] = point.value;
          });
        
        chartData.push(dataPoint);
      });
      
      // Urutkan berdasarkan timestamp
      const sortedData = chartData.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );      
      return sortedData;
    }
    
    // LOGIKA LAMA UNTUK TIME FILTERING:
    // Untuk filter time, gabungkan data berdasarkan timestamp seperti sebelumnya
    const allData = [];
    const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
    
    // Proses setiap pair (datastream) secara terpisah
    timeSeriesDataRaw.forEach((pairData, pairIndex) => {
      const pair = pairs[pairIndex];
      
      pairData.forEach((item) => {
        // Gunakan fungsi utilitas untuk konversi timestamp
        const timestamp = item.timestamp || item.device_time;
        const utcTime = convertUTCToLocalTime(timestamp);
        
        if (!utcTime) {
          console.warn('Timestamp tidak valid di formattedTimeSeriesData:', timestamp);
          return;
        }
        
        allData.push({
          timestamp: utcTime,
          originalTimestamp: utcTime.toISOString(), // Gunakan waktu yang sudah dikonversi
          device_id: item.device_id,
          datastream_id: item.datastream_id,
          value: parseFloat(item.value),
          device_name: item.device_name,
          sensor_name: item.sensor_name,
          unit: item.unit,
        });
      });
    });

    // Urutkan semua data berdasarkan waktu
    allData.sort((a, b) => a.timestamp - b.timestamp);

    // Buat map waktu yang presisi (tanpa pembulatan)
    const timeMap = {};
    
    allData.forEach((item) => {
      // Gunakan timestamp presisi tanpa pembulatan
      const key = item.timestamp.toISOString();
      
      if (!timeMap[key]) {
        timeMap[key] = {
          timestamp: key,
          originalTimestamp: item.originalTimestamp,
          time: item.timestamp.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezoneConfig.timezone
          }),
        };
        // Inisialisasi semua key datastream dengan null
        deviceDatastreamKeys.forEach(dsKey => {
          timeMap[key][dsKey] = null;
        });
      }
      
      // Tetapkan nilai untuk datastream ini
      timeMap[key][`value_${item.device_id}_${item.datastream_id}`] = item.value;
    });

    // Konversi ke array dan urutkan
    const sortedData = Object.values(timeMap).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return sortedData;
  }, [timeSeriesDataRaw, pairs, filterType, dataCount, timeRange]);

  // Fungsi untuk mendapatkan data chart yang sudah difilter berdasarkan time range atau count
  const getFilteredTimeSeriesData = useCallback(() => {
    if (filterType === "count") {
      // Jika ada data real-time, gunakan pendekatan sliding window
      if (Object.keys(realtimeTimeSeriesData).length > 0) {
        const countNum = parseInt(dataCount);
        if (isNaN(countNum) || dataCount === "all") {
          return formattedTimeSeriesData;
        }
        
        const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
        const allDataPoints = [];
        const timestampSet = new Set();
        
        // Proses setiap datastream untuk memperoleh N data terakhir per datastream
        pairs.forEach(pair => {
          const datastreamId = pair.datastream_id;
          const datastreamData = realtimeTimeSeriesData[datastreamId] || [];
          
          // Urutkan berdasarkan timestamp dan ambil N data terakhir per datastream
          const sortedData = [...datastreamData]
            .sort((a, b) => {
              const timeA = new Date(a.timestamp || a.device_time);
              const timeB = new Date(b.timestamp || b.device_time);
              return timeB - timeA; // Descending (terbaru dulu)
            })
            .slice(0, countNum) // Ambil N data terakhir
            .reverse(); // Kembali ke urutan kronologis
          
          // Konversi ke format yang dibutuhkan chart
          sortedData.forEach(item => {
            const timestamp = item.timestamp || item.device_time;
            // Untuk data real-time, timestamp sudah dalam format yang benar
            const timeKey = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
            timestampSet.add(timeKey);
            
            allDataPoints.push({
              timeKey,
              timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
              originalTimestamp: timeKey, // Gunakan timestamp langsung
              device_id: item.device_id,
              datastream_id: item.datastream_id,
              value: parseFloat(item.value),
              device_name: item.device_name,
              sensor_name: item.sensor_name,
              unit: item.unit,
            });
          });
        });
        
        // Bangun data chart yang seimbang
        const sortedTimestamps = Array.from(timestampSet).sort();
        const chartData = [];
        
        sortedTimestamps.forEach(timeKey => {
          const dataPoint = {
            timestamp: timeKey,
            originalTimestamp: timeKey,
            time: new Date(timeKey).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezoneConfig.timezone
            }),
          };
          
          // Inisialisasi semua key datastream dengan null
          deviceDatastreamKeys.forEach(dsKey => {
            dataPoint[dsKey] = null;
          });
          
          // Tetapkan nilai untuk setiap datastream jika ada data pada timestamp ini
          allDataPoints
            .filter(point => point.timeKey === timeKey)
            .forEach(point => {
              dataPoint[`value_${point.device_id}_${point.datastream_id}`] = point.value;
            });
          
          chartData.push(dataPoint);
        });
        
        // Urutkan berdasarkan timestamp
        const sortedData = chartData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        // Log debug untuk hasil filter count
        // console.log('Hasil filter count real-time:', {
        //   totalDataPoints: allDataPoints.length,
        //   chartDataLength: sortedData.length,
        //   countPerDatastream: countNum
        // });
        
        return sortedData;
      }
      
      // Fallback ke data database jika belum ada data real-time
      return formattedTimeSeriesData;
    }
    
    // PERBAIKAN UNTUK TIME FILTERING:
    // Untuk pemfilteran berdasarkan waktu, SELALU prioritaskan data dari database (formattedTimeSeriesData)
    // karena backend sudah melakukan filtering berdasarkan rentang waktu yang dipilih.
    // Data real-time hanya untuk pembaruan tambahan, bukan pengganti keseluruhan.
    
    // Jika ada data real-time, gabungkan dengan data database untuk mendapatkan yang paling baru
    if (Object.keys(realtimeTimeSeriesData).length > 0) {
      // Gabungkan data database dengan pembaruan real-time
      const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
      const allDataPoints = [];
      const timestampSet = new Set();
      
      // 1. Tambahkan semua data dari database (sudah difilter berdasarkan rentang waktu)
      if (Array.isArray(formattedTimeSeriesData)) {
        formattedTimeSeriesData.forEach(dbItem => {
          const timestamp = dbItem.timestamp;
          timestampSet.add(timestamp);
          
          // Ambil nilai datastream individual dari item database
          deviceDatastreamKeys.forEach(key => {
            if (dbItem[key] !== null && dbItem[key] !== undefined) {
              const [, deviceId, datastreamId] = key.split('_');
              allDataPoints.push({
                timeKey: timestamp,
                timestamp: new Date(timestamp),
                originalTimestamp: timestamp,
                device_id: parseInt(deviceId),
                datastream_id: parseInt(datastreamId),
                value: parseFloat(dbItem[key]),
                device_name: dbItem.device_name || '',
                sensor_name: dbItem.sensor_name || '',
                unit: dbItem.unit || '',
                source: 'database'
              });
            }
          });
        });
      }
      
      // 2. Tambahkan data real-time yang belum ada di database
      Object.values(realtimeTimeSeriesData).forEach(datastreamData => {
        datastreamData.forEach(rtItem => {
          const timestamp = rtItem.timestamp || rtItem.device_time;
          const timeKey = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
          
          // Tambahkan hanya jika timestamp ini belum ada di data database
          if (!timestampSet.has(timeKey)) {
            timestampSet.add(timeKey);
            allDataPoints.push({
              timeKey,
              timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
              originalTimestamp: timeKey,
              device_id: rtItem.device_id,
              datastream_id: rtItem.datastream_id,
              value: parseFloat(rtItem.value),
              device_name: rtItem.device_name,
              sensor_name: rtItem.sensor_name,
              unit: rtItem.unit,
              source: 'realtime'
            });
          }
        });
      });
      
      // 3. Susun data chart dari gabungan data database dan real-time
      const timeMap = {};
      
      allDataPoints.forEach((item) => {
        const key = item.timeKey;
        
        if (!timeMap[key]) {
          timeMap[key] = {
            timestamp: key,
            originalTimestamp: item.originalTimestamp,
            time: item.timestamp.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezoneConfig.timezone
            }),
          };
          // Inisialisasi semua key datastream dengan null
          deviceDatastreamKeys.forEach(dsKey => {
            timeMap[key][dsKey] = null;
          });
        }
        
        // Tetapkan nilai untuk datastream ini
        timeMap[key][`value_${item.device_id}_${item.datastream_id}`] = item.value;
      });

      // Konversi ke array dan urutkan
      const chartData = Object.values(timeMap).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      return chartData;
    }
    
    // Fallback ke data database jika tidak ada data real-time
    return formattedTimeSeriesData;
  }, [realtimeTimeSeriesData, formattedTimeSeriesData, timeRange, dataCount, filterType, pairs]);

  // Data legenda untuk chart
  const legendData = pairs.map((pair, idx) => {
    // Cari info sensor dari latestDataRaw
    const latest = Array.isArray(latestDataRaw)
      ? latestDataRaw.find(
          (d) =>
            d &&
            d.device_id === pair.device_id &&
            d.datastream_id === pair.datastream_id
        )
      : null;
    return {
      device_id: pair.device_id,
      datastream_id: pair.datastream_id,
      device_name: latest?.device_name,
      sensor_name: latest?.sensor_name,
      unit: latest?.unit || "",
    };
  });

  // Format nilai terbaru untuk tampilan
  const formattedLatestValue = latestValue
    ? {
        value: parseFloat(latestValue.value),
        timestamp: latestValue.timestamp || latestValue.device_time, // Gunakan device_time
        timeAgo: dynamicTimeAgo || // Gunakan timeAgo dinamis yang ter-update otomatis
          (latestValue.timestamp || latestValue.device_time
            ? getTimeAgo(latestValue.timestamp || latestValue.device_time, latestValue.data_type)
            : "none"),
        unit: latestValue.unit || "",
        sensor_name: latestValue.sensor_name || "none",
        device_name: latestValue.device_name || "none",
        device_id: latestValue.device_id,
        datastream_id: latestValue.datastream_id,
      }
    : null;

  // Fungsi bantu untuk menerjemahkan time range ke bahasa Indonesia
  const getTimeRangeLabel = (range) => {
    const labels = {
      "1h": "1 jam terakhir",
      "12h": "12 jam terakhir", 
      "1d": "1 hari terakhir",
      "1w": "1 minggu terakhir",
      "1m": "1 bulan terakhir",
    };
    return labels[range] || "1 jam terakhir";
  };

  return {
    timeSeriesData: getFilteredTimeSeriesData(), // Gunakan data real-time yang sudah difilter
    latestValue: formattedLatestValue,
    realTimeData,
    legendData,
    isLoading: isLoadingTimeSeries || isLoadingLatest || isLoadingDatastream,
    isLoadingTimeSeries,
    isLoadingLatest,
    error: timeSeriesError || latestError,
    timeSeriesError,
    latestError,
    refetchTimeSeries,
    refetchLatest,
    refetchAll: () => {
      refetchTimeSeries();
      refetchLatest();
    },
    isValidWidget,
    lastUpdateTime: lastUpdateTime.current,
    isRealTimeConnected: !!ws,
    timeRange,
    timeRangeLabel: getTimeRangeLabel(timeRange),
    datastreamInfo, // Sertakan info datastream di return
    realtimeTimeSeriesData, // Ekspos data real-time untuk debugging bila diperlukan
  };
}

// Fungsi bantu untuk menghitung waktu relatif dengan konversi UTC ke waktu lokal
function getTimeAgo(timestamp, dataType) {
  if (!timestamp) return "Tidak diketahui";
  if(dataType === "offline" || dataType === "pending") return "Baru saja";
  try {
    // Gunakan fungsi utilitas dari helper.js
    const localTime = convertUTCToLocalTime(timestamp);
    
    if (!localTime) {
      console.warn('Gagal mengonversi timestamp di getTimeAgo:', timestamp);
      return "Tidak diketahui";
    }
    
    const now = new Date(); // Waktu lokal pengguna
    
    // Hitung selisih waktu
    const diffInSeconds = Math.floor((now - localTime) / 1000);
    
    // Log debug untuk melihat perhitungan waktu
    // console.log('Perhitungan getTimeAgo:', {
    //   originalTimestamp: timestamp,
    //   localTime: localTime.toISOString(),
    //   now: now.toISOString(),
    //   diffInSeconds,
    //   timezone: timezoneConfig.display
    // });
    
    if (diffInSeconds < 0) {
      return "Baru saja"; // Jika timestamp di masa depan
    } else if (diffInSeconds < 60) {
      return 'Baru saja';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} menit yang lalu`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} jam yang lalu`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} hari yang lalu`;
    }
  } catch (error) {
    console.error('Kesalahan pada getTimeAgo:', error, 'timestamp:', timestamp);
    return "Tidak diketahui";
  }
}

// Fungsi bantu untuk mengecek apakah timestamp berada dalam rentang waktu yang dipilih
function isWithinTimeRange(timestamp, timeRange) {
  if (!timeRange || timeRange === "all") return true;
  
  const now = new Date();
  const dataTime = new Date(timestamp);
  
  // Hitung milidetik berdasarkan rentang waktu
  let rangeInMs;
  switch (timeRange) {
    case "1h":
      rangeInMs = 60 * 60 * 1000; // 1 jam
      break;
    case "12h":
      rangeInMs = 12 * 60 * 60 * 1000; // 12 jam
      break;
    case "1d":
      rangeInMs = 24 * 60 * 60 * 1000; // 1 hari
      break;
    case "1w":
      rangeInMs = 7 * 24 * 60 * 60 * 1000; // 1 minggu
      break;
    case "1m":
      rangeInMs = 30 * 24 * 60 * 60 * 1000; // 1 bulan (perkiraan)
      break;
    default:
      return true; // Rentang tidak dikenali, izinkan semua data
  }
  
  const timeDiff = now - dataTime;
  return timeDiff >= 0 && timeDiff <= rangeInMs;
}