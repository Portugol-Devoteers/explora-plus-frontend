export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

let tokenProvider: () => string | null = () => null;

export function setTokenProvider(fn: () => string | null) {
  tokenProvider = fn;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, auth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };

  if (auth !== false) {
    const token = tokenProvider();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && extractMessage(data)) ||
      `Erro ${res.status} em ${path}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data: any): string | null {
  if (typeof data.detail === "string") return data.detail;
  for (const key of Object.keys(data)) {
    const v = data[key];
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
  return null;
}

export type HealthResponse = {
  status: string;
  db: string;
  postgis: string;
};

export const getHealth = () => api<HealthResponse>("/api/health/", { auth: false });
