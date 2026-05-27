import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "markerPress" && onMarkerPress) {
          onMarkerPress(String(data.id));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMarkerPress]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={iframeStyle}
        title="Mapa Explora+"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden", backgroundColor: "#EEEEF1" },
});

const iframeStyle: React.CSSProperties = {
  border: 0,
  width: "100%",
  height: "100%",
  display: "block",
};

export type { LatLng, MapMarker, MapViewProps } from "./types";
