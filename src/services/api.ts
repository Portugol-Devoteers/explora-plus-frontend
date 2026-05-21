export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export type HealthResponse = {
  status: string;
  db: string;
  postgis: string;
};

export const getHealth = () => api<HealthResponse>("/api/health/");
