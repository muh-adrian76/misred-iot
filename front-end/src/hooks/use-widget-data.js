// Hook untuk widget data management - handles time series data, real-time updates, dan aggregations
// Supports: chart widgets, value widgets, real-time streaming via WebSocket
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend, timezoneConfig, convertUTCToLocalTime } from "@/lib/helper";

export function useWidgetData(widget, timeRange = "1h", dataCount = "100", filterType = "count", pairsInput) {
  const { user } = useUser();
  const { ws } = useWebSocket();
  
  // States untuk real-time data dan time series
  const [realTimeData, setRealTimeData] = useState(null); // Latest single values
  const [latestValue, setLatestValue] = useState(null); // For value widgets
  const [realtimeTimeSeriesData, setRealtimeTimeSeriesData] = useState({}); // Real-time chart data
  const [dynamicTimeAgo, setDynamicTimeAgo] = useState(null); // Dynamic timeAgo yang update setiap menit
  const lastUpdateTime = useRef(null);
  const timeAgoIntervalRef = useRef(null);
  const latestTimestampRef = useRef(null); // Ref untuk menyimpan timestamp terbaru
  const latestDataTypeRef = useRef(null); // Ref untuk menyimpan data_type terbaru

  // Extract device-datastream pairs dari berbagai format widget input
  // Supports multiple input formats untuk backward compatibility
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

  // Query untuk mendapatkan time series data semua pair - HANYA INITIAL LOAD
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
      // agar count filter bekerja per datastream, bukan gabungan semua datastream
      const results = await Promise.all(
        pairs.map(async (pair) => {
          // Tentukan endpoint berdasarkan filter type
          let endpoint;
          if (filterType === "time") {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          } else if (filterType === "count") {
            // Filter by count - SETIAP datastream mendapat ${dataCount} data terakhir
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?count=${dataCount}`;
          } else {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          }
          
          const response = await fetchFromBackend(endpoint);
          if (!response.ok) return [];
          const data = await response.json();
          
          // Debug log untuk melihat data yang diterima
          // console.log(`📊 Data received for Device ${pair.device_id} Datastream ${pair.datastream_id}:`, {
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
    // HAPUS refetchInterval - hanya fetch sekali saat initial load
    refetchInterval: false,
    staleTime: Infinity, // Data tidak pernah stale karena update via WebSocket
  });

  // Query untuk mendapatkan datastream info (type, min_value, max_value)
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
    staleTime: 30000, // Datastream info rarely changes
  });

  // Query untuk mendapatkan latest value semua pair - HANYA INITIAL LOAD
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
    // HAPUS refetchInterval - hanya fetch sekali saat initial load
    refetchInterval: false,
    staleTime: Infinity, // Data tidak pernah stale karena update via WebSocket
  });

  // Set latest value dari semua pair (ambil yang terbaru)
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

  // Effect untuk memperbarui timeAgo secara berkala (setiap 1 menit)
  useEffect(() => {
    // Function untuk update timeAgo menggunakan ref
    const updateTimeAgo = () => {
      if (latestTimestampRef.current) {
        const newTimeAgo = getTimeAgo(latestTimestampRef.current, latestDataTypeRef.current);
        // console.log('🕐 TimeAgo updated:', {
        //   timestamp: latestTimestampRef.current,
        //   oldTimeAgo: dynamicTimeAgo,
        //   newTimeAgo: newTimeAgo,
        //   time: new Date().toLocaleTimeString()
        // });
        setDynamicTimeAgo(newTimeAgo);
      }
    };

    // Set initial timeAgo ketika latestValue berubah
    if (latestValue) {
      const timestamp = latestValue.timestamp || latestValue.device_time;
      latestTimestampRef.current = timestamp;
      latestDataTypeRef.current = latestValue.data_type;
      
      // console.log('📍 Setting up timeAgo interval for:', {
      //   timestamp: timestamp,
      //   dataType: latestValue.data_type
      // });
      
      updateTimeAgo();
      
      // Clear interval sebelumnya jika ada
      if (timeAgoIntervalRef.current) {
        clearInterval(timeAgoIntervalRef.current);
        // console.log('🧹 Cleared previous interval');
      }
      
      // Set interval untuk update setiap 10 detik untuk testing (nanti ubah ke 60000ms)
      timeAgoIntervalRef.current = setInterval(() => {
        // console.log('⏰ Interval triggered at:', new Date().toLocaleTimeString());
        updateTimeAgo();
      }, 30000); // 10 detik untuk testing
      
      // console.log('✅ New interval set with ID:', timeAgoIntervalRef.current);
    }

    // Cleanup interval saat component unmount atau latestValue berubah
    return () => {
      if (timeAgoIntervalRef.current) {
        // console.log('🗑️ Cleaning up interval:', timeAgoIntervalRef.current);
        clearInterval(timeAgoIntervalRef.current);
        timeAgoIntervalRef.current = null;
      }
    };
  }, [latestValue]); // Re-run ketika latestValue berubah

  // Initialize real-time data dengan data dari server saat berhasil di-fetch
  useEffect(() => {
    if (timeSeriesDataRaw) {
      const initialData = {};
      timeSeriesDataRaw.forEach(pairData => {
        pairData.forEach(item => {
          if (!initialData[item.datastream_id]) {
            initialData[item.datastream_id] = [];
          }
          // Konversi timestamp dari UTC ke local time untuk initial data
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

  // Effect untuk re-apply sliding window ketika filter berubah
  useEffect(() => {
    if (filterType === "count" && Object.keys(realtimeTimeSeriesData).length > 0) {
      const countNum = parseInt(dataCount);
      if (!isNaN(countNum) && dataCount !== "all") {
        setRealtimeTimeSeriesData(prevData => {
          const updated = { ...prevData };
          
          // Re-apply sliding window untuk semua datastream
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

  // WebSocket real-time update listener
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
          
          // Update latest value langsung
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

          // Update dynamic timeAgo untuk data real-time baru
          const newTimeAgo = getTimeAgo(timestamp, data.data_type);
          setDynamicTimeAgo(newTimeAgo);

          // Update ref dengan timestamp dan data_type terbaru
          latestTimestampRef.current = timestamp;
          latestDataTypeRef.current = data.data_type;

          console.log('📡 WebSocket data received, setting up new interval:', {
            timestamp: timestamp,
            dataType: data.data_type,
            timeAgo: newTimeAgo
          });

          // Reset interval untuk timeAgo ketika ada data real-time baru
          if (timeAgoIntervalRef.current) {
            clearInterval(timeAgoIntervalRef.current);
            console.log('🧹 Cleared WebSocket interval');
          }
          // Set interval baru untuk update timeAgo setiap 10 detik untuk testing
          timeAgoIntervalRef.current = setInterval(() => {
            console.log('⏰ WebSocket interval triggered at:', new Date().toLocaleTimeString());
            if (latestTimestampRef.current) {
              const updatedTimeAgo = getTimeAgo(latestTimestampRef.current, latestDataTypeRef.current);
              console.log('🕐 WebSocket TimeAgo updated:', {
                timestamp: latestTimestampRef.current,
                newTimeAgo: updatedTimeAgo
              });
              setDynamicTimeAgo(updatedTimeAgo);
            }
          }, 10000); // 10 detik untuk testing
          
          console.log('✅ New WebSocket interval set with ID:', timeAgoIntervalRef.current);

          // TAMBAH DATA BARU KE CHART SECARA REAL-TIME
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

          // Update real-time chart data dengan sliding window management
          setRealtimeTimeSeriesData(prevData => {
            const updated = { ...prevData };
            const datastreamId = newDataPoint.datastream_id;
            
            if (!updated[datastreamId]) {
              updated[datastreamId] = [];
            }
            
            // Tambah data point baru
            updated[datastreamId] = [...updated[datastreamId], newDataPoint];
            
            // SLIDING WINDOW MANAGEMENT berdasarkan filter type
            if (filterType === "count") {
              const countNum = parseInt(dataCount);
              if (!isNaN(countNum) && dataCount !== "all") {
                // Untuk count filter: pertahankan hanya N data terakhir per datastream
                updated[datastreamId] = updated[datastreamId]
                  .sort((a, b) => {
                    const timeA = new Date(a.timestamp || a.device_time);
                    const timeB = new Date(b.timestamp || b.device_time);
                    return timeB - timeA; // Descending (terbaru dulu)
                  })
                  .slice(0, countNum); // Ambil N data terakhir
              }
            } else {
              // Untuk time filter: batasi memory usage (max 1000 points per datastream)
              if (updated[datastreamId].length > 1000) {
                updated[datastreamId] = updated[datastreamId]
                  .sort((a, b) => {
                    const timeA = new Date(a.timestamp || a.device_time);
                    const timeB = new Date(b.timestamp || b.device_time);
                    return timeB - timeA; // Descending (terbaru dulu)
                  })
                  .slice(0, 1000); // Keep latest 1000                
              }
            }
            
            return updated;
          });
          lastUpdateTime.current = Date.now();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, pairs, user, timeRange, filterType, dataCount]); // Tetap perlu filterType dan dataCount untuk sliding window management

  // Gabungkan time series data semua pair berdasarkan waktu
  const formattedTimeSeriesData = useMemo(() => {
    if (!Array.isArray(timeSeriesDataRaw) || timeSeriesDataRaw.length === 0) {
      return [];
    }

    if (filterType === "count") {
      // Untuk count filter, proses setiap datastream terpisah untuk mempertahankan balance
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
            console.warn('Invalid timestamp in formattedTimeSeriesData:', timestamp);
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
      
      // Sort timestamp dan ambil hanya data yang dibutuhkan untuk menjaga balance
      const sortedTimestamps = Array.from(timestampSet).sort();
      
      // Buat chart data dengan mempertahankan balance per datastream
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
        
        // Initialize semua datastream keys dengan null
        deviceDatastreamKeys.forEach(dsKey => {
          dataPoint[dsKey] = null;
        });
        
        // Set nilai untuk setiap datastream jika ada data pada timestamp ini
        allDataPoints
          .filter(point => point.timeKey === timeKey)
          .forEach(point => {
            dataPoint[`value_${point.device_id}_${point.datastream_id}`] = point.value;
          });
        
        chartData.push(dataPoint);
      });
      
      // Sort berdasarkan timestamp
      const sortedData = chartData.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );      
      return sortedData;
    }
    
    // LOGIKA LAMA UNTUK TIME FILTERING:
    // Untuk time filter, gabungkan data berdasarkan timestamp seperti sebelumnya
    const allData = [];
    const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
    
    // Proses setiap pair (datastream) secara terpisah
    timeSeriesDataRaw.forEach((pairData, pairIndex) => {
      const pair = pairs[pairIndex];
      
      pairData.forEach((item) => {
        // Gunakan utility function untuk konversi timestamp
        const timestamp = item.timestamp || item.device_time;
        const utcTime = convertUTCToLocalTime(timestamp);
        
        if (!utcTime) {
          console.warn('Invalid timestamp in formattedTimeSeriesData:', timestamp);
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

    // Urutkan SEMUA data berdasarkan waktu
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
        // Initialize semua datastream keys dengan null
        deviceDatastreamKeys.forEach(dsKey => {
          timeMap[key][dsKey] = null;
        });
      }
      
      // Set nilai untuk datastream ini
      timeMap[key][`value_${item.device_id}_${item.datastream_id}`] = item.value;
    });

    // Convert ke array dan urutkan
    const sortedData = Object.values(timeMap).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return sortedData;
  }, [timeSeriesDataRaw, pairs, filterType, dataCount, timeRange]);

  // Function untuk mendapatkan chart data yang sudah difilter berdasarkan time range atau count
  const getFilteredTimeSeriesData = useCallback(() => {
    if (filterType === "count") {
      // Jika ada real-time data, gunakan sliding window approach
      if (Object.keys(realtimeTimeSeriesData).length > 0) {
        const countNum = parseInt(dataCount);
        if (isNaN(countNum) || dataCount === "all") {
          return formattedTimeSeriesData;
        }
        
        const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
        const allDataPoints = [];
        const timestampSet = new Set();
        
        // Proses setiap datastream untuk mendapat count data terakhir per datastream
        pairs.forEach(pair => {
          const datastreamId = pair.datastream_id;
          const datastreamData = realtimeTimeSeriesData[datastreamId] || [];
          
          // Sort berdasarkan timestamp dan ambil N data terakhir per datastream
          const sortedData = [...datastreamData]
            .sort((a, b) => {
              const timeA = new Date(a.timestamp || a.device_time);
              const timeB = new Date(b.timestamp || b.device_time);
              return timeB - timeA; // Descending (terbaru dulu)
            })
            .slice(0, countNum) // Ambil N data terakhir
            .reverse(); // Kembali ke chronological order
          
          // Convert ke format yang dibutuhkan chart
          sortedData.forEach(item => {
            const timestamp = item.timestamp || item.device_time;
            // PERBAIKAN: Untuk real-time data, timestamp sudah dalam format yang benar
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
        
        // Buat chart data yang balanced
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
          
          // Initialize semua datastream keys dengan null
          deviceDatastreamKeys.forEach(dsKey => {
            dataPoint[dsKey] = null;
          });
          
          // Set nilai untuk setiap datastream jika ada data pada timestamp ini
          allDataPoints
            .filter(point => point.timeKey === timeKey)
            .forEach(point => {
              dataPoint[`value_${point.device_id}_${point.datastream_id}`] = point.value;
            });
          
          chartData.push(dataPoint);
        });
        
        // Sort berdasarkan timestamp
        const sortedData = chartData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        // Debug log untuk hasil filter count
        // console.log('Real-time count filter result:', {
        //   totalDataPoints: allDataPoints.length,
        //   chartDataLength: sortedData.length,
        //   countPerDatastream: countNum
        // });
        
        return sortedData;
      }
      
      // Fallback ke database data jika belum ada real-time data
      return formattedTimeSeriesData;
    }
    
    // Untuk time filtering, bisa gunakan real-time data jika tersedia
    if (Object.keys(realtimeTimeSeriesData).length > 0) {
      const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
      const allDataPoints = [];
      const timestampSet = new Set();
      
      // Kumpulkan semua data dari real-time data
      Object.values(realtimeTimeSeriesData).forEach(datastreamData => {
        datastreamData.forEach(item => {
          const timestamp = item.timestamp || item.device_time;
          // PERBAIKAN: Untuk real-time data, timestamp sudah dalam format yang benar
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

      // PERBAIKAN: Untuk time filtering, jangan filter lagi di frontend karena:
      // 1. Backend sudah melakukan filtering berdasarkan time range
      // 2. Real-time data adalah update incremental, bukan replacement lengkap
      // 3. Double filtering bisa menyebabkan data hilang
      // Jadi kita akan langsung buat chart data dari semua data yang sudah ada
      // Langsung buat chart data tanpa filtering tambahan
      const timeMap = {};
      
      allDataPoints.forEach((item) => {
        const key = item.timeKey;
        
        if (!timeMap[key]) {
          timeMap[key] = {
            timestamp: key,
            originalTimestamp: item.originalTimestamp, // Ini sekarang sudah timestamp yang dikonversi
            time: item.timestamp.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezoneConfig.timezone
            }),
          };
          // Initialize semua datastream keys dengan null
          deviceDatastreamKeys.forEach(dsKey => {
            timeMap[key][dsKey] = null;
          });
        }
        
        // Set nilai untuk datastream ini
        timeMap[key][`value_${item.device_id}_${item.datastream_id}`] = item.value;
      });

      // Convert ke array dan urutkan
      const chartData = Object.values(timeMap).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      return chartData;
    }
    
    // Fallback ke initial data
    return formattedTimeSeriesData;
  }, [realtimeTimeSeriesData, formattedTimeSeriesData, timeRange, dataCount, filterType, pairs]);

  // Legend data untuk chart
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

  // Format latest value untuk display
  const formattedLatestValue = latestValue
    ? {
        value: parseFloat(latestValue.value),
        timestamp: latestValue.timestamp || latestValue.device_time, // Gunakan device_time
        timeAgo: dynamicTimeAgo || // Gunakan dynamic timeAgo yang ter-update otomatis
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

  // Helper function untuk menerjemahkan time range ke bahasa Indonesia
  const getTimeRangeLabel = (range) => {
    const labels = {
      "1h": "1 jam terakhir",
      "12h": "12 jam terakhir", 
      "1d": "1 hari terakhir",
      "1w": "1 minggu terakhir",
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
    datastreamInfo, // Add datastream info to return
    realtimeTimeSeriesData, // Expose real-time data untuk debugging jika diperlukan
  };
}

// Helper function untuk menghitung waktu relatif dengan konversi UTC ke local
function getTimeAgo(timestamp, dataType) {
  if (!timestamp) return "Unknown";
  if(dataType === "offline" || dataType === "pending") return "Baru saja";
  try {
    // Gunakan utility function dari helper.js
    const localTime = convertUTCToLocalTime(timestamp);
    
    if (!localTime) {
      console.warn('Failed to convert timestamp for getTimeAgo:', timestamp);
      return "Unknown";
    }
    
    const now = new Date(); // Waktu lokal user
    
    // Hitung selisih waktu
    const diffInSeconds = Math.floor((now - localTime) / 1000);
    
    // Debug log untuk melihat perhitungan waktu
    // console.log('getTimeAgo calculation:', {
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
    console.error('Error in getTimeAgo:', error, 'timestamp:', timestamp);
    return "Unknown";
  }
}