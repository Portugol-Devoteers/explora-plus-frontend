import type { StyleProp, ViewStyle } from "react-native";

export type LatLng = { lat: number; lng: number };
export type MapPoiCategory = "culture" | "park" | "food";

export type MapMarkerKind =
  | "poi"
  | "stop"
  | "culture"
  | "park"
  | "food"
  | "origin"
  | "destination"
  | "monumento"
  | "evento"
  | "transporte"
  | "user";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind?: MapMarkerKind;
  category?: MapPoiCategory;
  badge?: string;
  label?: string;
};

export type MapPolylineKind = "route_tour" | "route_direct" | "legacy";

export type MapPolyline = {
  id: string;
  points: LatLng[];
  kind?: MapPolylineKind;
};

export type MapViewProps = {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  polyline?: LatLng[];
  polylines?: MapPolyline[];
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};
