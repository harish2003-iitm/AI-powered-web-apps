// Central configuration for API access
export const API_BASE_URL = '';

// Helper for making API requests with proper error handling
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Make sure the endpoint starts with a slash
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  console.log("[API Debug] Fetching:", url);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log("[API Debug] Response:", response);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Received non-JSON response:", text);
      throw new Error("Received non-JSON response from server");
    }
    
    const data = await response.json();
    console.log("[API Debug] Data:", data);
    return data;
  } catch (error) {
    console.error("[API Error]:", error);
    throw error;
  }
} 