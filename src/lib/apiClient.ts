import { ApiResponse } from "./types";
import { puterClient } from "@/features/auth/puter";

export class ApiError extends Error {
  code: string;
  constructor(message: string, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function getBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_API_BASE;
  if (envBase && envBase.trim() !== "") {
    return envBase.replace(/\/$/, "");
  }
  return "/api";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  try {
    const token = await puterClient.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // If not in browser or not signed in, proceed without auth header
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(`Failed to parse response: ${response.statusText}`, `HTTP_${response.status}`);
  }

  if (!response.ok || !data.success) {
    const errorMessage = data?.error?.message || response.statusText || "Request failed";
    const errorCode = data?.error?.code || `HTTP_${response.status}`;
    throw new ApiError(errorMessage, errorCode);
  }

  return data.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined | null>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const query = searchParams.toString();
      if (query) {
        url += (url.includes("?") ? "&" : "?") + query;
      }
    }
    return request<T>(url, { method: "GET" });
  },

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: "DELETE",
    }),
};
