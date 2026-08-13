// Use backend URL from environment
// In development: Vite proxies /api to backend (via vite.config.ts)
// In production: Direct URL from VITE_API_URL or .env.production
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Socket.IO URL - Use localhost in dev, production URL in build
const SOCKET_URL = import.meta.env.DEV 
  ? "https://pfapi.jyada.in" 
  : "https://pfapi.jyada.in";

export { SOCKET_URL };

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "An error occurred");
    }
    
    return data;
  } catch (error: any) {
    console.error("API Error:", error);
    throw error;
  }
};
