import type { LatLng, MapMarker, MapMarkerKind } from "./types";

const PIN_STYLES: Record<MapMarkerKind, { bg: string; ring: string; icon: string }> = {
  monumento: { bg: "#FF6B35", ring: "#FFFFFF", icon: "★" },
  evento: { bg: "#E5447A", ring: "#FFFFFF", icon: "✦" },
  transporte: { bg: "#3B82F6", ring: "#FFFFFF", icon: "▲" },
  user: { bg: "#3B82F6", ring: "#FFFFFF", icon: "●" },
  destination: { bg: "#1A1A1A", ring: "#FFFFFF", icon: "◉" },
};

export function buildMapHtml(opts: {
  center: LatLng;
  zoom: number;
  markers: MapMarker[];
  polyline: LatLng[];
}): string {
  const { center, zoom, markers, polyline } = opts;

  const markersJson = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      kind: m.kind ?? "monumento",
      label: m.label ?? "",
    })),
  );
  const polylineJson = JSON.stringify(polyline.map((p) => [p.lat, p.lng]));
  const pinStylesJson = JSON.stringify(PIN_STYLES);

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EEEEF1; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
  .pin {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%;
    color: #fff; font-weight: 700; font-size: 14px; line-height: 1;
    box-shadow: 0 4px 10px rgba(0,0,0,0.22);
    transform: translate(-50%, -50%);
  }
  .pin.user { width: 18px; height: 18px; font-size: 0; }
  .pin.user::after {
    content: ""; position: absolute; width: 36px; height: 36px; border-radius: 50%;
    background: rgba(59,130,246,0.25); animation: pulse 1.8s ease-out infinite; z-index: -1;
  }
  @keyframes pulse {
    0% { transform: scale(0.5); opacity: 0.9; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  .leaflet-popup-content { font-size: 13px; }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
  (function () {
    var CENTER = [${center.lat}, ${center.lng}];
    var ZOOM = ${zoom};
    var MARKERS = ${markersJson};
    var POLYLINE = ${polylineJson};
    var PIN_STYLES = ${pinStylesJson};

    function sendMessage(payload) {
      var msg = JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    }

    var map = L.map("map", { zoomControl: true, attributionControl: true }).setView(CENTER, ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    function makePinIcon(kind) {
      var style = PIN_STYLES[kind] || PIN_STYLES.monumento;
      var html = '<div class="pin ' + kind + '" style="background:' + style.bg + '; border: 2px solid ' + style.ring + ';">' + (kind === "user" ? "" : style.icon) + '</div>';
      var size = kind === "user" ? [18, 18] : [32, 32];
      return L.divIcon({ html: html, className: "pin-wrapper", iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });
    }

    MARKERS.forEach(function (m) {
      var marker = L.marker([m.lat, m.lng], { icon: makePinIcon(m.kind) }).addTo(map);
      if (m.label) marker.bindPopup(m.label);
      marker.on("click", function () { sendMessage({ type: "markerPress", id: m.id }); });
    });

    if (POLYLINE && POLYLINE.length > 1) {
      var line = L.polyline(POLYLINE, { color: "#FF6B35", weight: 5, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(map);
      map.fitBounds(line.getBounds().pad(0.2));
    } else if (MARKERS.length > 1) {
      var bounds = L.latLngBounds(MARKERS.map(function (m) { return [m.lat, m.lng]; }));
      map.fitBounds(bounds.pad(0.25));
    }

    sendMessage({ type: "ready" });
  })();
</script>
</body>
</html>`;
}
