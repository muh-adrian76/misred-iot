// Fungsi untuk mendeteksi apakah ini auth error berdasarkan response
const isAuthError = (response, errorData, errorText, endpoint) => {
  // Skip auto-redirect untuk login endpoint - biarkan form handle error sendiri
  if (endpoint && (endpoint.includes('/auth'))) {
    return false;
  }
  
  // 1. Status 401 untuk endpoint selain login/register adalah auth error (token expired, etc)
  if (response.status === 401) return true;
  
  // 2. Status 500 dengan message pattern dari authorizeRequest atau auth-related errors
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
    
    // Check text response
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

// Fungsi untuk handle auth error redirect
const handleAuthError = (response, errorDetails) => {
  console.error("❌ Authentication error detected - redirecting to 401 page");
  console.error("Response status:", response.status);
  console.error("Error details:", errorDetails);
  
  // Clear auth state
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Redirect ke halaman 401
    window.location.href = '/401';
  }
};

// Fungsi fetch ke API Backend dengan error handling untuk auth
export async function fetchFromBackend(endpoint, options = {}) {
  const server = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(`${server}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include", // penting untuk cookie
    });

    // Handle authentication errors - tapi skip untuk login/register endpoints
    if (response.status === 401) {
      if (isAuthError(response, null, null, endpoint)) {
        handleAuthError(response, "Direct 401 response");
        return response; // Return response untuk compatibility
      }
    }

    // Handle server errors yang mungkin terkait auth (refresh token expired)
    if (response.status === 500) {
      try {
        const errorData = await response.clone().json();
        
        // Use isAuthError function to detect auth-related errors
        if (isAuthError(response, errorData, null, endpoint)) {
          handleAuthError(response, errorData);
          return response; // Return response untuk compatibility
        }
      } catch (parseError) {
        // Jika tidak bisa parse response, cek text response
        try {
          const errorText = await response.clone().text();
          
          // Use isAuthError function for text response
          if (isAuthError(response, null, errorText, endpoint)) {
            handleAuthError(response, errorText);
            return response; // Return response untuk compatibility
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

// Fungsi untuk konversi tanggal ke zona waktu Jakarta
export function convertDate(dateString) {
  const date = new Date(dateString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", // GMT+7
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${date} (GMT +7)`;
}
