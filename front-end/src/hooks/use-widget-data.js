"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend } from "@/lib/helper";

export function useWidgetData(widget, timeRange = "1m", dataCount = "100", filterType = "time", pairsInput) {
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

  // Helper function untuk memfilter data berdasarkan time range
  const filterDataByTimeRange = useCallback((data, timeRange) => {
    if (!data || data.length === 0) return data;
    
    const now = new Date();
    const rangeMs = getTimeRangeInMs(timeRange);
    const cutoffTime = new Date(now.getTime() - rangeMs);
    
    return data.filter(item => {
      const itemTime = new Date(item.timestamp || item.device_time);
      return itemTime >= cutoffTime;
    });
  }, []);

  // Helper function untuk memfilter data berdasarkan jumlah data
  const filterDataByCount = useCallback((data, count) => {
    if (!data || data.length === 0) return data;
    
    const countNum = parseInt(count);
    if (isNaN(countNum) || count === "all") return data;
    
    // Sort by timestamp descending and take the latest count
    return [...data]
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || a.device_time);
        const timeB = new Date(b.timestamp || b.device_time);
        return timeB - timeA;
      })
      .slice(0, countNum)
      .reverse(); // Reverse to get chronological order
  }, []);

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
      const results = await Promise.all(
        pairs.map(async (pair) => {
          // Tentukan endpoint berdasarkan filter type
          let endpoint;
          if (filterType === "time") {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          } else if (filterType === "count") {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?limit=${dataCount}`;
          } else {
            endpoint = `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`;
          }
          
          const response = await fetchFromBackend(endpoint);
          if (!response.ok) return [];
          const data = await response.json();
          return (data.result || []).map((item) => ({
            ...item,
            device_id: pair.device_id,
            datastream_id: pair.datastream_id,
          }));
        })
      );
      // Gabungkan semua hasil
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
      // Ambil data terbaru (prioritas device_time, fallback server_time)
      const all = latestDataRaw.filter(Boolean);
      if (all.length === 0) return;
      const sorted = [...all].sort(
        (a, b) => {
          const timeA = new Date(a.device_time || a.server_time);
          const timeB = new Date(b.device_time || b.server_time);
          return timeB - timeA;
        }
      );
      setLatestValue(sorted[0]);
    }
  }, [latestDataRaw]);

  // Initialize real-time data dengan data dari server saat berhasil di-fetch
  useEffect(() => {
    if (timeSeriesDataRaw) {
      const initialData = {};
      timeSeriesDataRaw.forEach(pairData => {
        pairData.forEach(item => {
          if (!initialData[item.datastream_id]) {
            initialData[item.datastream_id] = [];
          }
          initialData[item.datastream_id].push(item);
        });
      });
      setRealtimeTimeSeriesData(initialData);
    }
  }, [timeSeriesDataRaw]);

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
          
          // Update latest value langsung
          setLatestValue({
            value: data.value,
            server_time: data.timestamp,
            device_time: data.device_time || data.timestamp, // Prioritas device_time
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
            timestamp: data.device_time || data.timestamp,
            device_time: data.device_time || data.timestamp,
            server_time: data.timestamp,
            device_name: data.device_name,
            sensor_name: data.sensor_name,
            unit: data.unit,
          };

          // Update real-time chart data
          setRealtimeTimeSeriesData(prevData => {
            const updated = { ...prevData };
            const datastreamId = newDataPoint.datastream_id;
            
            if (!updated[datastreamId]) {
              updated[datastreamId] = [];
            }
            
            // Tambah data point baru
            updated[datastreamId] = [...updated[datastreamId], newDataPoint];
            
            // Filter berdasarkan time range untuk menghindari memory leak (simpan max 1000 points per datastream)
            if (updated[datastreamId].length > 1000) {
              updated[datastreamId] = updated[datastreamId].slice(-1000);
            }
            
            return updated;
          });

          lastUpdateTime.current = Date.now();
          
          // HAPUS setTimeout refetch karena data sudah update via WebSocket
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, pairs, user, timeRange]); // Tambah timeRange ke dependency

  // Gabungkan time series data semua pair berdasarkan waktu
  const formattedTimeSeriesData = useMemo(() => {
    if (!Array.isArray(timeSeriesDataRaw) || timeSeriesDataRaw.length === 0) {
      return [];
    }

    // Kumpulkan SEMUA data dari semua pair tanpa penggabungan
    const allData = [];
    timeSeriesDataRaw.forEach((pairData, idx) => {
      pairData.forEach((item) => {
        // Gunakan timestamp prioritas: device_time -> server_time
        const timestamp = item.device_time || item.server_time;
        allData.push({
          timestamp: new Date(timestamp),
          originalTimestamp: timestamp, // Simpan timestamp asli untuk tooltip
          server_time: timestamp,
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
    const deviceDatastreamKeys = pairs.map(pair => `value_${pair.device_id}_${pair.datastream_id}`);
    
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

    // TIDAK ADA INTERPOLASI - tampilkan data asli
    return sortedData;
  }, [timeSeriesDataRaw, pairs]);

  // Function untuk mendapatkan chart data yang sudah difilter berdasarkan time range atau count
  const getFilteredTimeSeriesData = useCallback(() => {
    // Jika real-time data sudah tersedia, gunakan itu
    if (Object.keys(realtimeTimeSeriesData).length > 0) {
      const allData = [];
      Object.values(realtimeTimeSeriesData).forEach(datastreamData => {
        datastreamData.forEach(item => {
          const timestamp = item.device_time || item.timestamp;
          allData.push({
            timestamp: new Date(timestamp),
            originalTimestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            [`value_${item.device_id}_${item.datastream_id}`]: parseFloat(item.value),
            device_id: item.device_id,
            datastream_id: item.datastream_id,
            value: parseFloat(item.value),
            device_name: item.device_name,
            sensor_name: item.sensor_name,
            unit: item.unit,
          });
        });
      });

      // Filter berdasarkan filter type
      let filteredData;
      if (filterType === "time") {
        filteredData = filterDataByTimeRange(allData, timeRange);
      } else if (filterType === "count") {
        filteredData = filterDataByCount(allData, dataCount);
      } else {
        filteredData = allData;
      }
      
      // Sort by timestamp
      return filteredData.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Fallback ke data dari server jika real-time data belum ready
    return formattedTimeSeriesData;
  }, [realtimeTimeSeriesData, formattedTimeSeriesData, timeRange, dataCount, filterType, filterDataByTimeRange, filterDataByCount]);

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
        timestamp: latestValue.device_time || latestValue.server_time, // Prioritas device_time
        timeAgo: latestValue.device_time || latestValue.server_time
          ? getTimeAgo(latestValue.device_time || latestValue.server_time)
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
      "1m": "1 menit terakhir",
      "1h": "1 jam terakhir",
      "12h": "12 jam terakhir",
      "1d": "1 hari terakhir",
      "1w": "1 minggu terakhir",
      "1M": "1 bulan terakhir",
      "1y": "1 tahun terakhir",
      all: "semua waktu",
    };
    return labels[range] || "1 menit terakhir";
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

// Helper function untuk konversi time range ke milliseconds
function getTimeRangeInMs(range) {
  switch (range) {
    case '1m': return 1 * 60 * 1000; // 1 menit
    case '1h': return 1 * 60 * 60 * 1000; // 1 jam
    case '12h': return 12 * 60 * 60 * 1000; // 12 jam
    case '1d': return 24 * 60 * 60 * 1000; // 1 hari
    case '1w': return 7 * 24 * 60 * 60 * 1000; // 1 minggu
    case '1M': return 30 * 24 * 60 * 60 * 1000; // 1 bulan
    case '1y': return 365 * 24 * 60 * 60 * 1000; // 1 tahun
    default: return 1 * 60 * 60 * 1000; // Default 1 jam
  }
}

// Helper function untuk menghitung waktu relatif
function getTimeAgo(timestamp) {
  if (!timestamp) return "Unknown";

  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
    // return 'Baru saja';
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
}
