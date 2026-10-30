import { ApiResponse } from "./types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
  return envBase?.trim() ? envBase.replace(/\/$/, "") : "/api";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const client = getSupabaseBrowserClient();
  const { data } = client
    ? await client.auth.getSession()
    : { data: { session: null } };
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(`${getBaseUrl()}${normalizedEndpoint}`, {
    ...options,
    headers,
  });
  let dataResponse: ApiResponse<T>;
  try {
    dataResponse = await response.json();
  } catch {
    throw new ApiError(`Failed to parse response: ${response.statusText}`, `HTTP_${response.status}`);
  }
  if (!response.ok || !dataResponse.success) {
    throw new ApiError(
      dataResponse?.error?.message || response.statusText || "Request failed",
      dataResponse?.error?.code || `HTTP_${response.status}`
    );
  }
  return dataResponse.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined | null>) => {
    const url = new URL(endpoint, "http://local");
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
    return request<T>(url.pathname + url.search, { method: "GET" });
  },
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
