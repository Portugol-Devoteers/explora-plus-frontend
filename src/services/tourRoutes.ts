import { api } from "./api";

export type TourRouteCategory = "culture" | "park" | "food";
export type TourRouteMode = "tour" | "direct_fallback";
export type TourRouteStopState = "active" | "visited";

export type TourRoutePoint = {
  lat: number;
  lng: number;
};

export type TourRouteResolvedPoint = {
  label: string;
  location: TourRoutePoint;
};

export type TourRoutePlaceToPass = {
  stop_id: string;
  order: number;
  name: string;
  category: TourRouteCategory;
  location: TourRoutePoint;
  distance_from_route_m: number;
  source: string;
  included_in_route: boolean;
  waypoint_order: number | null;
  state: TourRouteStopState;
};

export type TourRouteSummary = {
  distance_m: number;
  duration_s: number;
  polyline_points: TourRoutePoint[];
};

export type TourRoutePayload = {
  saved_route_id?: number | null;
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
  stop_id?: string;
  active?: boolean;
  state?: TourRouteStopState;
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

export type TourRoutePoiDetail = {
  stop_id: string;
  name: string;
  category: TourRouteCategory;
  address: string;
  summary: string;
  image_url: string | null;
  source_url: string | null;
  opening_hours: string | null;
  website: string | null;
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
  });
}

export async function removeTourRouteStop(
  savedRouteId: number,
  stopId: string,
): Promise<TourRouteResponse> {
  return api<TourRouteResponse>(
    `/api/tour-routes/saved/${savedRouteId}/stops/${encodeURIComponent(stopId)}/`,
    {
      method: "DELETE",
    },
  );
}

export async function fetchTourRoutePoiDetail(
  stopId: string,
): Promise<TourRoutePoiDetail> {
  return api<TourRoutePoiDetail>(
    `/api/tour-routes/pois/${encodeURIComponent(stopId)}/`,
  );
}

export async function updateTourRouteStopState(
  savedRouteId: number,
  stopId: string,
  state: TourRouteStopState,
): Promise<TourRouteResponse> {
  return api<TourRouteResponse>(
    `/api/tour-routes/saved/${savedRouteId}/stops/${encodeURIComponent(stopId)}/state/`,
    {
      method: "PATCH",
      body: { state },
    },
  );
}
