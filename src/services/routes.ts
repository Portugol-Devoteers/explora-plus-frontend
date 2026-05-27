import type { Ionicons } from "@expo/vector-icons";
import { api } from "./api";

export type TransportMode = "transit" | "rideshare" | "walking" | "driving";

export type Route = {
  id: string;
  destinationPlaceId: string;
  destinationName: string;
  thumb: string;
  origin: string;
  generatedAt: string;
  distanceKm: number;
  durationMin: number;
  mode: TransportMode;
  saved: boolean;
};

export const TRANSPORT_META: Record<
  TransportMode,
  { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  transit: { label: "Ônibus / Metrô", icon: "bus" },
  rideshare: { label: "Carro de App", icon: "car" },
  walking: { label: "A pé", icon: "walk" },
  driving: { label: "Carro", icon: "car-sport" },
};

export async function fetchRoutes(): Promise<Route[]> {
  const data = await api<unknown>("/api/routes/");
  if (!Array.isArray(data)) return [];
  return data as Route[];
}

export type CreateRoutePayload = {
  placeId: string;
  mode: TransportMode;
  origin?: { lat: number; lng: number };
};

export async function createRoute(payload: CreateRoutePayload): Promise<Route | null> {
  const data = await api<unknown>("/api/routes/", {
    method: "POST",
    body: payload,
  });
  if (!data || typeof data !== "object" || !("id" in (data as object))) return null;
  return data as Route;
}
