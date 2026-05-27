import type { StyleProp, ViewStyle } from "react-native";

export type LatLng = { lat: number; lng: number };

export type MapMarkerKind =
  | "monumento"
  | "evento"
  | "transporte"
  | "user"
  | "destination";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind?: MapMarkerKind;
  label?: string;
};

export type MapViewProps = {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  polyline?: LatLng[];
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};
