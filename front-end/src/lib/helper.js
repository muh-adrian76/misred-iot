// Utility function untuk mendeteksi authentication errors berdasarkan response
// Digunakan untuk auto-redirect ke halaman 401 saat token expired/invalid
const isAuthError = (response, errorData, errorText, endpoint) => {
  // Skip auto-redirect untuk endpoint auth - biarkan form handle sendiri
  if (endpoint && (endpoint.includes('/auth'))) {
    return false;
  }
  
  // 1. Status 401 selalu auth error (token expired/invalid)
  if (response.status === 401) return true;
  
  // 2. Status 500 dengan message pattern auth-related
  if (response.status === 500) {
    // Check JSON error message
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
    
    // Check text response untuk pattern yang sama
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

// Fungsi untuk handle authentication error dengan cleanup dan redirect
const handleAuthError = (response, errorDetails) => {
  console.error("❌ Authentication error detected - redirecting to 401 page");
  console.error("Response status:", response.status);
  console.error("Error details:", errorDetails);
  
  // Clear auth state dari localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Redirect ke halaman 401
    window.location.href = '/401';
  }
};

// Fungsi utama untuk fetch data dari backend API dengan error handling otomatis
// Includes: credentials, auto auth error detection, dan redirect handling
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

    // Handle direct 401 responses (token expired/invalid)
    if (response.status === 401) {
      if (isAuthError(response, null, null, endpoint)) {
        handleAuthError(response, "Direct 401 response");
        return response; // Return untuk compatibility
      }
    }

    // Handle 500 errors yang mungkin auth-related (refresh token issues)
    if (response.status === 500) {
      try {
        const errorData = await response.clone().json();
        
        // Detect auth-related 500 errors
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
          // Ignore parsing errors for non-auth 500 errors
        }
      }
    }

    return response;
  } catch (networkError) {
    console.error("❌ Network error in fetchFromBackend:", networkError);
    
    // For network errors, don't auto-redirect, let the calling component handle it
    throw networkError;
  }
}

// Direktori logo
export const brandLogo = `/${process.env.NEXT_PUBLIC_LOGO}`;

// Timezone Configuration
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

// Export timezone config untuk digunakan di file lain
export const timezoneConfig = getTimezoneConfig();

// Fungsi untuk konversi UTC ke timezone yang dikonfigurasi
export function convertUTCToLocalTime(utcTimestamp) {
  if (!utcTimestamp) return null;
  
  let utcTime;
  if (typeof utcTimestamp === 'string') {
    // Pastikan string diparsing sebagai UTC
    if (!utcTimestamp.includes('Z') && !utcTimestamp.includes('+') && !utcTimestamp.includes('-')) {
      utcTime = new Date(utcTimestamp + 'Z');
    } else {
      utcTime = new Date(utcTimestamp);
    }
  } else {
    utcTime = new Date(utcTimestamp);
  }
  
  if (isNaN(utcTime.getTime())) {
    console.warn('Invalid timestamp for convertUTCToLocalTime:', utcTimestamp);
    return null;
  }
  
  // Tambahkan offset timezone sesuai konfigurasi (misal GMT+7)
  const localDate = new Date(utcTime.getTime() + (timezoneConfig.offset * 60 * 60 * 1000));
  return localDate;
}

// Fungsi untuk konversi tanggal ke zona waktu yang dikonfigurasi
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
