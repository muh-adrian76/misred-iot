"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend } from "@/lib/helper";

export function useWidgetData(widget, timeRange = "1h", pairsInput) {
  const { user } = useUser();
  const { ws } = useWebSocket();
  const [realTimeData, setRealTimeData] = useState(null);
  const [latestValue, setLatestValue] = useState(null);
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

  // Query untuk mendapatkan time series data semua pair
  const {
    data: timeSeriesDataRaw,
    isLoading: isLoadingTimeSeries,
    error: timeSeriesError,
    refetch: refetchTimeSeries,
  } = useQuery({
    queryKey: ["widget-timeseries-multi", pairs, timeRange],
    queryFn: async () => {
      if (!isValidWidget) return [];
      // Ambil data semua pair
      const results = await Promise.all(
        pairs.map(async (pair) => {
          const response = await fetchFromBackend(
            `/payload/timeseries/${pair.device_id}/${pair.datastream_id}?range=${timeRange}`
          );
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
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Query untuk mendapatkan latest value semua pair
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
    refetchInterval: 30000,
    staleTime: 5000,
  });

  // Set latest value dari semua pair (ambil yang terbaru)
  useEffect(() => {
    if (latestDataRaw && Array.isArray(latestDataRaw)) {
      // Ambil data terbaru (paling baru server_time)
      const all = latestDataRaw.filter(Boolean);
      if (all.length === 0) return;
      const sorted = [...all].sort(
        (a, b) => new Date(b.server_time) - new Date(a.server_time)
      );
      setLatestValue(sorted[0]);
    }
  }, [latestDataRaw]);

  // WebSocket listener untuk real-time updates (multi-pair)
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
          setLatestValue({
            value: data.value,
            server_time: data.timestamp,
            sensor_name: data.sensor_name,
            unit: data.unit,
            device_name: data.device_name,
            device_id: data.device_id,
            datastream_id: data.datastream_id,
          });
          lastUpdateTime.current = Date.now();
          setTimeout(() => {
            refetchLatest();
          }, 2000);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, pairs, user, refetchLatest]);

  // Gabungkan time series data semua pair berdasarkan waktu
  let formattedTimeSeriesData = [];
  if (Array.isArray(timeSeriesDataRaw) && timeSeriesDataRaw.length > 0) {
    // Buat map waktu
    const timeMap = {};
    timeSeriesDataRaw.forEach((pairData, idx) => {
      pairData.forEach((item) => {
        const key = new Date(item.server_time).toISOString();
        if (!timeMap[key]) {
          timeMap[key] = {
            timestamp: key,
            time: new Date(item.server_time).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        }
        timeMap[key][`value_${item.device_id}_${item.datastream_id}`] =
          parseFloat(item.value);
      });
    });
    // Urutkan berdasarkan waktu
    formattedTimeSeriesData = Object.values(timeMap).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  }

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
        timestamp: latestValue.server_time,
        timeAgo: latestValue.server_time
          ? getTimeAgo(latestValue.server_time)
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
    timeSeriesData: formattedTimeSeriesData,
    latestValue: formattedLatestValue,
    realTimeData,
    legendData,
    isLoading: isLoadingTimeSeries || isLoadingLatest,
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
  };
}

// Helper function untuk menghitung waktu relatif
function getTimeAgo(timestamp) {
  if (!timestamp) return "Unknown";

  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return 'Live';
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
