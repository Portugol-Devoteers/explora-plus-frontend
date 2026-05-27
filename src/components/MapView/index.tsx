import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "./html";
import type { MapViewProps } from "./types";

export function MapView({
  center,
  zoom = 14,
  markers = [],
  polyline = [],
  onMarkerPress,
  style,
}: MapViewProps) {
  const html = useMemo(
    () => buildMapHtml({ center, zoom, markers, polyline }),
    [center, zoom, markers, polyline],
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

export type { LatLng, MapMarker, MapViewProps } from "./types";
