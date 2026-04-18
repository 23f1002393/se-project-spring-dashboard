export const API_BASE_URL = "http://localhost:5000/api/v1";

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const config: RequestInit = {
    method: data ? "POST" : "GET",
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "omit", // Using token or session based on what the backend requires.
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
