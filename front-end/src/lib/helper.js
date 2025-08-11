// Fungsi utilitas untuk mendeteksi error autentikasi berdasarkan response
// Dipakai untuk auto-redirect ke halaman 401 saat token kedaluwarsa/tidak valid
const isAuthError = (response, errorData, errorText, endpoint) => {
  // Lewati auto-redirect untuk endpoint auth - biarkan form menangani sendiri
  if (endpoint && (endpoint.includes('/auth'))) {
    return false;
  }
  
  // 1. Status 401 selalu error autentikasi (token kedaluwarsa/tidak valid)
  if (response.status === 401) return true;
  
  // 2. Status 500 dengan pola pesan terkait autentikasi
  if (response.status === 500) {
    // Cek pesan error JSON
    if (errorData?.message) {
      const message = errorData.message.toLowerCase();
      return message.includes('unauthorized') ||
             message.includes('token tidak ditemukan') ||
             message.includes('token tidak valid') ||
             message.includes('refresh token tidak valid') ||
             message.includes('gagal memperbarui access token') ||
             message.includes('authentication failed') ||
             message.includes('token') && (message.includes('expired') || message.includes('kadaluwarsa'));
    }
    
    // Cek text response untuk pola yang sama
    if (errorText) {
      const text = errorText.toLowerCase();
      return text.includes('unauthorized') ||
             text.includes('token tidak ditemukan') ||
             text.includes('token tidak valid') ||
             text.includes('refresh token tidak valid') ||
             text.includes('gagal memperbarui access token') ||
             text.includes('authentication failed') ||
             text.includes('token') && (text.includes('expired') || text.includes('kadaluwarsa'));
    }
  }
  
  return false;
};

// Fungsi untuk menangani error autentikasi dengan pembersihan state dan redirect
const handleAuthError = (response, errorDetails) => {
  console.error("❌ Terdeteksi error autentikasi - mengalihkan ke halaman 401");
  console.error("Status response:", response.status);
  console.error("Detail error:", errorDetails);
  
  // Bersihkan state autentikasi dari localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Arahkan ke halaman 401
    window.location.href = '/401';
  }
};

// Fungsi utama untuk fetch data dari backend API dengan penanganan error otomatis
// Termasuk: credentials, deteksi otomatis error autentikasi, dan redirect
export async function fetchFromBackend(endpoint, options = {}) {
  const server = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(`${server}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include", // penting untuk HttpOnly cookies
    });

    // Tangani response 401 langsung (token kedaluwarsa/tidak valid)
    if (response.status === 401) {
      if (isAuthError(response, null, null, endpoint)) {
        handleAuthError(response, "Response 401 langsung");
        return response; // Kembalikan untuk kompatibilitas
      }
    }

    // Tangani error 500 yang mungkin terkait autentikasi (refresh token issues)
    if (response.status === 500) {
      try {
        const errorData = await response.clone().json();
        
        // Deteksi error 500 terkait autentikasi
        if (isAuthError(response, errorData, null, endpoint)) {
          handleAuthError(response, errorData);
          return response;
        }
      } catch (parseError) {
        // Fallback: cek text response jika JSON parse gagal
        try {
          const errorText = await response.clone().text();
          
          if (isAuthError(response, null, errorText, endpoint)) {
            handleAuthError(response, errorText);
            return response;
          }
        } catch (textError) {
          // Abaikan error parsing untuk error 500 yang bukan autentikasi
        }
      }
    }

    return response;
  } catch (networkError) {
    console.error("❌ Kesalahan jaringan pada fetchFromBackend:", networkError);
    
    // Untuk kesalahan jaringan, jangan auto-redirect, biarkan komponen pemanggil yang menangani
    throw networkError;
  }
}

// Direktori logo/brand
export const brandLogo = `/${process.env.NEXT_PUBLIC_LOGO}`;

// Konfigurasi Timezone
const getTimezoneConfig = () => {
  const gmtZone = process.env.NEXT_PUBLIC_GMT_ZONE || '+7';
  const zoneNumber = parseInt(gmtZone.replace('+', '').replace('-', ''));
  const isPositive = gmtZone.startsWith('+') || !gmtZone.startsWith('-');
  
  return {
    offset: isPositive ? zoneNumber : -zoneNumber,
    offsetMs: (isPositive ? zoneNumber : -zoneNumber) * 60 * 60 * 1000,
    display: `GMT ${gmtZone}`,
    timezone: zoneNumber === 7 ? 'Asia/Jakarta' : 
              zoneNumber === 8 ? 'Asia/Singapore' :
              zoneNumber === 9 ? 'Asia/Tokyo' :
              zoneNumber === 0 ? 'UTC' :
              zoneNumber === -5 ? 'America/New_York' :
              zoneNumber === -8 ? 'America/Los_Angeles' :
              'UTC' // fallback
  };
};

// Ekspor konfigurasi timezone untuk dipakai di file lain
export const timezoneConfig = getTimezoneConfig();

// Fungsi untuk konversi UTC ke timezone terkonfigurasi
export function convertUTCToLocalTime(utcTimestamp) {
  if (!utcTimestamp) return null;
  
  let utcTime;
  if (typeof utcTimestamp === 'string') {
    // Pastikan string diparse sebagai UTC
    if (!utcTimestamp.includes('Z') && !utcTimestamp.includes('+') && !utcTimestamp.includes('-')) {
      utcTime = new Date(utcTimestamp + 'Z');
    } else {
      utcTime = new Date(utcTimestamp);
    }
  } else {
    utcTime = new Date(utcTimestamp);
  }
  
  if (isNaN(utcTime.getTime())) {
    console.warn('Timestamp tidak valid untuk convertUTCToLocalTime:', utcTimestamp);
    return null;
  }
  
  // Tambahkan offset timezone sesuai konfigurasi (mis. GMT+7)
  const localDate = new Date(utcTime.getTime() + (timezoneConfig.offset * 60 * 60 * 1000));
  return localDate;
}

// Fungsi untuk konversi tanggal ke zona waktu terkonfigurasi
export function convertDate(dateString) {
  const date = new Date(dateString).toLocaleString("id-ID", {
    timeZone: timezoneConfig.timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${date} (${timezoneConfig.display})`;
}
