// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Provider untuk React Query yang mengatur caching dan data fetching
// Dikonfigurasi khusus untuk aplikasi IoT monitoring dengan data real-time
export function ReactQueryProvider({ children }) {
  // Membuat QueryClient dengan konfigurasi yang tepat untuk IoT monitoring
  // Menggunakan useState dengan lazy initialization untuk menghindari recreate client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Konfigurasi untuk query (data fetching)
            // Untuk data real-time IoT, kita ingin refetch lebih sering
            staleTime: 5 * 1000, // Data dianggap stale setelah 5 detik
            gcTime: 10 * 60 * 1000, // Garbage collection setelah 10 menit (menggantikan cacheTime di v4)
            retry: 3, // Retry maksimal 3 kali jika request gagal
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff delay
            refetchOnWindowFocus: true, // Refetch saat window kembali fokus
            refetchOnReconnect: true, // Refetch saat koneksi internet kembali
          },
          mutations: {
            // Konfigurasi untuk mutation (data modification)
            retry: 1, // Retry hanya 1 kali untuk mutation
            retryDelay: 1000, // Delay 1 detik sebelum retry
          },
        },
      })
  );

  // Return provider yang membungkus children dengan QueryClient
  // Semua komponen anak akan bisa menggunakan React Query hooks
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
