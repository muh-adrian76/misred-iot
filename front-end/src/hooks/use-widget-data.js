"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import {
  fetchFromBackend,
  timezoneConfig,
  convertUTCToLocalTime,
} from "@/lib/helper";

export function useWidgetData(
  widget,
  timeRange = "1h",
  dataCount = "100",
  filterType = "time",
  pairsInput
) {
  const { user } = useUser();
  const { ws } = useWebSocket();
  const [realTimeData, setRealTimeData] = useState(null);
  const [latestValue, setLatestValue] = useState(null);
  const [realtimeTimeSeriesData, setRealtimeTimeSeriesData] = useState({}); // State untuk real-time chart data
  const lastUpdateTime = useRef(null);

  // Ambil pairs dari widget atau argumen
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
    queryKey: [
      "widget-timeseries-multi",
      pairs,
      timeRange,
      dataCount,
      filterType,
    ],
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
  const { data: datastreamInfo, isLoading: isLoadingDatastream } = useQuery({
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
      const sorted = [...all].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.device_time);
        const timeB = new Date(b.timestamp || b.device_time);
        return timeB - timeA;
      });
      setLatestValue(sorted[0]);
    }
  }, [latestDataRaw]);

  // Initialize real-time data dengan data dari server saat berhasil di-fetch
  useEffect(() => {
    if (timeSeriesDataRaw) {
      const initialData = {};
      timeSeriesDataRaw.forEach((pairData) => {
        pairData.forEach((item) => {
          if (!initialData[item.datastream_id]) {
            initialData[item.datastream_id] = [];
          }
          // PERBAIKAN: Konversi timezone untuk initial data juga
          const rawTimestamp = item.timestamp || item.device_time;
          const convertedTime = convertUTCToLocalTime(rawTimestamp);

          const normalizedItem = {
            ...item,
            timestamp: convertedTime || rawTimestamp, // Gunakan timestamp yang sudah dikonversi
          };
          initialData[item.datastream_id].push(normalizedItem);
        });
      });
      setRealtimeTimeSeriesData(initialData);
    }
  }, [timeSeriesDataRaw]);

  // Effect untuk re-apply sliding window ketika filter berubah
  useEffect(() => {
    if (
      filterType === "count" &&
      Object.keys(realtimeTimeSeriesData).length > 0
    ) {
      const countNum = parseInt(dataCount);
      if (!isNaN(countNum) && dataCount !== "all") {
        setRealtimeTimeSeriesData((prevData) => {
          const updated = { ...prevData };

          // Re-apply sliding window untuk semua datastream
          Object.keys(updated).forEach((datastreamId) => {
            if (
              updated[datastreamId] &&
              updated[datastreamId].length > countNum
            ) {
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

          // PERBAIKAN: Deklarasikan variabel timezone conversion dulu
          const rawTimestamp = data.device_time || data.timestamp;
          const convertedTimestamp = convertUTCToLocalTime(rawTimestamp);

          // Update latest value langsung
          setLatestValue({
            value: data.value,
            timestamp: convertedTimestamp || rawTimestamp, // Gunakan timestamp yang sudah dikonversi
            device_time: data.device_time || data.timestamp, // Raw timestamp untuk referensi
            sensor_name: data.sensor_name,
            unit: data.unit,
            device_name: data.device_name,
            device_id: data.device_id,
            datastream_id: data.datastream_id,
          });

          // TAMBAH DATA BARU KE CHART SECARA REAL-TIME
          const newDataPoint = {
            id: data.id,
            device_id: data.device_id,
            datastream_id: data.datastream_id,
            value: parseFloat(data.value),
            timestamp: convertedTimestamp || rawTimestamp, // Gunakan timestamp yang sudah dikonversi
            device_time: data.device_time || data.timestamp, // Simpan raw timestamp untuk referensi
            device_name: data.device_name,
            sensor_name: data.sensor_name,
            unit: data.unit,
          };

          // Update real-time chart data dengan sliding window management
          setRealtimeTimeSeriesData((prevData) => {
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
      const deviceDatastreamKeys = pairs.map(
        (pair) => `value_${pair.device_id}_${pair.datastream_id}`
      );

      // Kumpulkan semua timestamp unik dari semua datastream
      const timestampSet = new Set();

      timeSeriesDataRaw.forEach((pairData, pairIndex) => {
        const pair = pairs[pairIndex];

        pairData.forEach((item) => {
          const timestamp = item.timestamp || item.device_time;
          const utcTime = convertUTCToLocalTime(timestamp);

          if (!utcTime) {
            console.warn(
              "Invalid timestamp in formattedTimeSeriesData:",
              timestamp
            );
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
            pair_index: pairIndex,
          });
        });
      });

      // Sort timestamp dan ambil hanya data yang dibutuhkan untuk menjaga balance
      const sortedTimestamps = Array.from(timestampSet).sort();

      // Buat chart data dengan mempertahankan balance per datastream
      const chartData = [];

      sortedTimestamps.forEach((timeKey) => {
        const dataPoint = {
          timestamp: timeKey,
          originalTimestamp: timeKey,
          time: new Date(timeKey).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezoneConfig.timezone,
          }),
        };

        // Initialize semua datastream keys dengan null
        deviceDatastreamKeys.forEach((dsKey) => {
          dataPoint[dsKey] = null;
          // Also initialize unit keys
          const unitKey = dsKey.replace("value_", "unit_");
          dataPoint[unitKey] = null;
        });

        // Set nilai untuk setiap datastream jika ada data pada timestamp ini
        allDataPoints
          .filter((point) => point.timeKey === timeKey)
          .forEach((point) => {
            dataPoint[`value_${point.device_id}_${point.datastream_id}`] =
              point.value;
            dataPoint[`unit_${point.device_id}_${point.datastream_id}`] =
              point.unit;
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
    const deviceDatastreamKeys = pairs.map(
      (pair) => `value_${pair.device_id}_${pair.datastream_id}`
    );

    // Proses setiap pair (datastream) secara terpisah
    timeSeriesDataRaw.forEach((pairData, pairIndex) => {
      const pair = pairs[pairIndex];

      pairData.forEach((item) => {
        // Gunakan utility function untuk konversi timestamp
        const timestamp = item.timestamp || item.device_time;
        const utcTime = convertUTCToLocalTime(timestamp);

        if (!utcTime) {
          console.warn(
            "Invalid timestamp in formattedTimeSeriesData:",
            timestamp
          );
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
            timeZone: timezoneConfig.timezone,
          }),
        };
        // Initialize semua datastream keys dengan null
        deviceDatastreamKeys.forEach((dsKey) => {
          timeMap[key][dsKey] = null;
          // Also initialize unit keys
          const unitKey = dsKey.replace("value_", "unit_");
          timeMap[key][unitKey] = null;
        });
      }

      // Set nilai untuk datastream ini
      timeMap[key][`value_${item.device_id}_${item.datastream_id}`] =
        item.value;
      // Set unit untuk datastream ini
      timeMap[key][`unit_${item.device_id}_${item.datastream_id}`] = item.unit;
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

        const deviceDatastreamKeys = pairs.map(
          (pair) => `value_${pair.device_id}_${pair.datastream_id}`
        );
        const allDataPoints = [];
        const timestampSet = new Set();

        // Proses setiap datastream untuk mendapat count data terakhir per datastream
        pairs.forEach((pair) => {
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
          sortedData.forEach((item) => {
            const timestamp = item.timestamp || item.device_time;
            // PERBAIKAN: Timestamp sudah dikonversi saat disimpan, jadi langsung gunakan
            const timeKey =
              timestamp instanceof Date
                ? timestamp.toISOString()
                : new Date(timestamp).toISOString();
            timestampSet.add(timeKey);

            allDataPoints.push({
              timeKey,
              timestamp:
                timestamp instanceof Date ? timestamp : new Date(timestamp),
              originalTimestamp: timeKey, // Gunakan timestamp yang sudah dikonversi
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

        sortedTimestamps.forEach((timeKey) => {
          const dataPoint = {
            timestamp: timeKey,
            originalTimestamp: timeKey,
            time: new Date(timeKey).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezoneConfig.timezone,
            }),
          };

          // Initialize semua datastream keys dengan null
          deviceDatastreamKeys.forEach((dsKey) => {
            dataPoint[dsKey] = null;
            // Also initialize unit keys
            const unitKey = dsKey.replace("value_", "unit_");
            dataPoint[unitKey] = null;
          });

          // Set nilai untuk setiap datastream jika ada data pada timestamp ini
          allDataPoints
            .filter((point) => point.timeKey === timeKey)
            .forEach((point) => {
              dataPoint[`value_${point.device_id}_${point.datastream_id}`] =
                point.value;
              dataPoint[`unit_${point.device_id}_${point.datastream_id}`] =
                point.unit;
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
      const deviceDatastreamKeys = pairs.map(
        (pair) => `value_${pair.device_id}_${pair.datastream_id}`
      );
      const allDataPoints = [];
      const timestampSet = new Set();

      // Kumpulkan semua data dari real-time data
      Object.values(realtimeTimeSeriesData).forEach((datastreamData) => {
        datastreamData.forEach((item) => {
          const timestamp = item.timestamp || item.device_time;
          // PERBAIKAN: Timestamp sudah dikonversi saat disimpan, jadi langsung gunakan
          const timeKey =
            timestamp instanceof Date
              ? timestamp.toISOString()
              : new Date(timestamp).toISOString();
          timestampSet.add(timeKey);

          allDataPoints.push({
            timeKey,
            timestamp:
              timestamp instanceof Date ? timestamp : new Date(timestamp),
            originalTimestamp: timeKey, // Gunakan timestamp yang sudah dikonversi untuk tooltip
            device_id: item.device_id,
            datastream_id: item.datastream_id,
            value: parseFloat(item.value),
            device_name: item.device_name,
            sensor_name: item.sensor_name,
            unit: item.unit,
          });
        });
      });

      // PERBAIKAN: Untuk time filtering, HARUS filter berdasarkan time range yang dipilih
      // Karena real-time data mengakumulasi semua data, kita perlu filter sesuai time range
      // Hitung cutoff time berdasarkan time range yang dipilih
      const now = new Date();
      let cutoffTime = null;

      switch (timeRange) {
        case "1h":
          cutoffTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 jam yang lalu
          break;
        case "12h":
          cutoffTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 jam yang lalu
          break;
        case "1d":
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 hari yang lalu
          break;
        case "1w":
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 minggu yang lalu
          break;
        case "1m":
          cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 bulan yang lalu
          break;
        default:
          cutoffTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Default 1 jam
      }

      // Filter data berdasarkan cutoff time
      const filteredDataPoints = allDataPoints.filter((item) => {
        return item.timestamp >= cutoffTime;
      });

      // Buat chart data dari data yang sudah difilter
      const timeMap = {};

      filteredDataPoints.forEach((item) => {
        const key = item.timeKey;

        if (!timeMap[key]) {
          timeMap[key] = {
            timestamp: key,
            originalTimestamp: item.originalTimestamp, // Ini sekarang sudah timestamp yang dikonversi
            time: item.timestamp.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezoneConfig.timezone,
            }),
          };
          // Initialize semua datastream keys dengan null
          deviceDatastreamKeys.forEach((dsKey) => {
            timeMap[key][dsKey] = null;
            // Juga initialize unit keys
            const unitKey = dsKey.replace("value_", "unit_");
            timeMap[key][unitKey] = null;
          });
        }

        // Set nilai untuk datastream ini
        timeMap[key][`value_${item.device_id}_${item.datastream_id}`] =
          item.value;
        // Set unit untuk datastream ini
        timeMap[key][`unit_${item.device_id}_${item.datastream_id}`] =
          item.unit;
      });

      // Convert ke array dan urutkan
      const chartData = Object.values(timeMap).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      return chartData;
    }

    // Fallback ke initial data
    return formattedTimeSeriesData;
  }, [
    realtimeTimeSeriesData,
    formattedTimeSeriesData,
    timeRange,
    dataCount,
    filterType,
    pairs,
  ]);

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
      device_name: latest?.device_name || `Device ${pair.device_id}`,
      sensor_name: latest?.sensor_name || `Datastream ${pair.datastream_id}`,
      unit: latest?.unit || "",
    };
  });

  // Format latest value untuk display
  const formattedLatestValue = latestValue
    ? {
        value: parseFloat(latestValue.value),
        timestamp: latestValue.timestamp || latestValue.device_time, // Gunakan device_time
        timeAgo:
          latestValue.timestamp || latestValue.device_time
            ? getTimeAgo(
                latestValue.timestamp || latestValue.device_time,
                latestValue.data_type
              )
            : "Unknown",
        unit: latestValue.unit || "",
        sensor_name: latestValue.sensor_name || "Unknown Sensor",
        device_name: latestValue.device_name || "Unknown Device",
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

  if (dataType === "offline") return "Baru saja";

  try {
    // Gunakan utility function dari helper.js
    const localTime = convertUTCToLocalTime(timestamp);

    if (!localTime) {
      console.warn("Failed to convert timestamp for getTimeAgo:", timestamp);
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
      return "Baru saja";
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
    console.error("Error in getTimeAgo:", error, "timestamp:", timestamp);
    return "Unknown";
  }
}
