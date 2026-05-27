import { api } from "./api";

export type PlaceKind = "monumento" | "evento" | "transporte";

export type LatLng = { lat: number; lng: number };

export type Place = {
  id: string;
  slug: string;
  kind: PlaceKind;
  name: string;
  about: string;
  images: string[];
  hours: string;
  priceLabel: string;
  distanceKm: number;
  location: LatLng;
};

export const SANTOS_CENTER: LatLng = { lat: -23.9608, lng: -46.3331 };
export const SANTOS_ZOOM = 14;

export async function fetchPlaces(): Promise<Place[]> {
  const data = await api<unknown>("/api/places/", { auth: false });
  if (!Array.isArray(data)) return [];
  return data as Place[];
}

export async function fetchPlaceBySlug(slug: string): Promise<Place | null> {
  try {
    const data = await api<unknown>(`/api/places/${slug}/`, { auth: false });
    if (!data || typeof data !== "object") return null;
    if (!("name" in (data as object))) return null;
    return data as Place;
  } catch {
    return null;
  }
}
