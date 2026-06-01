import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "./html";
import type { MapPolyline, MapViewProps } from "./types";

export function MapView({
  center,
  zoom = 14,
  markers = [],
  polyline = [],
  polylines = [],
  onMarkerPress,
  style,
}: MapViewProps) {
  const normalizedPolylines = useMemo<MapPolyline[]>(
    () =>
      polylines.length > 0
        ? polylines
        : polyline.length > 0
          ? [{ id: "legacy-route", points: polyline, kind: "legacy" }]
          : [],
    [polylines, polyline],
  );

  const html = useMemo(
    () => buildMapHtml({ center, zoom, markers, polylines: normalizedPolylines }),
    [center, zoom, markers, normalizedPolylines],
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === "markerPress" && onMarkerPress) {
              onMarkerPress(String(data.id));
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden", backgroundColor: "#EEEEF1" },
  web: { flex: 1, backgroundColor: "transparent" },
});

export type { LatLng, MapMarker, MapPolyline, MapViewProps } from "./types";
