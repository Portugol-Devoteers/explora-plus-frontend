import { api } from "./api";

export type TourRouteCategory = "culture" | "park" | "food";
export type TourRouteMode = "tour" | "direct_fallback";

export type TourRoutePoint = {
  lat: number;
  lng: number;
};

export type TourRouteResolvedPoint = {
  label: string;
  location: TourRoutePoint;
};

export type TourRoutePlaceToPass = {
  order: number;
  name: string;
  category: TourRouteCategory;
  location: TourRoutePoint;
  distance_from_route_m: number;
  source: string;
  included_in_route: boolean;
  waypoint_order: number | null;
};

export type TourRouteSummary = {
  distance_m: number;
  duration_s: number;
  polyline_points: TourRoutePoint[];
};

export type TourRoutePayload = {
  mode: TourRouteMode;
  origin: TourRouteResolvedPoint;
  destination: TourRouteResolvedPoint;
  distance_m: number;
  duration_s: number;
  polyline_points: TourRoutePoint[];
  direct_route: TourRouteSummary;
  places_to_pass: TourRoutePlaceToPass[];
};

export type TourRouteMapGeometry =
  | {
      type: "LineString";
      coordinates: [number, number][];
    }
  | {
      type: "Point";
      coordinates: [number, number];
    };

export type TourRouteMapFeatureProperties = {
  kind: "route_tour" | "route_direct" | "origin" | "destination" | "stop" | "poi";
  active?: boolean;
  label?: string;
  order?: number;
  waypoint_order?: number | null;
  name?: string;
  category?: TourRouteCategory;
  source?: string;
  included_in_route?: boolean;
  distance_from_route_m?: number;
  distance_m?: number;
  duration_s?: number;
};

export type TourRouteMapFeature = {
  type: "Feature";
  geometry: TourRouteMapGeometry;
  properties: TourRouteMapFeatureProperties;
};

export type TourRouteMap = {
  type: "FeatureCollection";
  features: TourRouteMapFeature[];
};

export type TourRouteResponse = {
  route: TourRoutePayload;
  map: TourRouteMap;
};

export type PlanTourRouteRequest = {
  origin: { address: string };
  destination: { address: string };
};

export async function planTourRoute(
  payload: PlanTourRouteRequest,
): Promise<TourRouteResponse> {
  return api<TourRouteResponse>("/api/tour-routes/", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
