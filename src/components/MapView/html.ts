import type {
  LatLng,
  MapMarker,
  MapMarkerKind,
  MapPoiCategory,
  MapPolyline,
} from "./types";

const CATEGORY_STYLES: Record<
  MapPoiCategory,
  { bg: string; icon: string }
> = {
  culture: { bg: "#A63A50", icon: "C" },
  park: { bg: "#2E7D32", icon: "P" },
  food: { bg: "#C96A00", icon: "F" },
};

const PIN_STYLES: Record<
  MapMarkerKind,
  { bg: string; ring: string; icon: string }
> = {
  poi: { bg: "#A63A50", ring: "#FFFFFF", icon: "P" },
  stop: { bg: "#A63A50", ring: "#FFFFFF", icon: "*" },
  culture: { bg: "#A63A50", ring: "#FFFFFF", icon: "C" },
  park: { bg: "#2E7D32", ring: "#FFFFFF", icon: "P" },
  food: { bg: "#C96A00", ring: "#FFFFFF", icon: "F" },
  origin: { bg: "#2563EB", ring: "#FFFFFF", icon: "O" },
  destination: { bg: "#1A1A1A", ring: "#FFFFFF", icon: "D" },
  monumento: { bg: "#FF6B35", ring: "#FFFFFF", icon: "M" },
  evento: { bg: "#E5447A", ring: "#FFFFFF", icon: "E" },
  transporte: { bg: "#3B82F6", ring: "#FFFFFF", icon: "T" },
  user: { bg: "#3B82F6", ring: "#FFFFFF", icon: "U" },
};

const POLYLINE_STYLES = {
  route_tour: {
    color: "#FF6B35",
    weight: 5,
    opacity: 0.95,
    dashArray: null,
  },
  route_direct: {
    color: "#334155",
    weight: 4,
    opacity: 0.4,
    dashArray: "10 10",
  },
  legacy: {
    color: "#FF6B35",
    weight: 5,
    opacity: 0.95,
    dashArray: null,
  },
} as const;

export function buildMapHtml(opts: {
  center: LatLng;
  zoom: number;
  markers: MapMarker[];
  polylines: MapPolyline[];
}): string {
  const { center, zoom, markers, polylines } = opts;

  const markersJson = JSON.stringify(
    markers.map((marker) => ({
      id: marker.id,
      lat: marker.lat,
      lng: marker.lng,
      kind: marker.kind ?? "poi",
      category: marker.category ?? null,
      badge: marker.badge ?? "",
      label: marker.label ?? "",
    })),
  );
  const polylinesJson = JSON.stringify(
    polylines.map((polyline) => ({
      id: polyline.id,
      kind: polyline.kind ?? "legacy",
      points: polyline.points,
    })),
  );
  const pinStylesJson = JSON.stringify(PIN_STYLES);
  const categoryStylesJson = JSON.stringify(CATEGORY_STYLES);
  const lineStylesJson = JSON.stringify(POLYLINE_STYLES);

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<style>
  html, body, #map {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    background: #EEEEF1;
    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .pin {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.02em;
    line-height: 1;
    box-shadow: 0 4px 10px rgba(0,0,0,0.22);
    transform: translate(-50%, -50%);
  }
  .pin.stop {
    width: 38px;
    height: 38px;
    font-size: 14px;
  }
  .pin.origin,
  .pin.destination {
    width: 36px;
    height: 36px;
  }
  .pin.user {
    width: 18px;
    height: 18px;
    font-size: 0;
  }
  .pin.user::after {
    content: "";
    position: absolute;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(59,130,246,0.25);
    animation: pulse 1.8s ease-out infinite;
    z-index: -1;
  }
  @keyframes pulse {
    0% { transform: scale(0.5); opacity: 0.9; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  .leaflet-popup-content {
    font-size: 13px;
    line-height: 1.45;
  }
  .leaflet-control-attribution {
    font-size: 10px;
  }
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
    var POLYLINES = ${polylinesJson};
    var PIN_STYLES = ${pinStylesJson};
    var CATEGORY_STYLES = ${categoryStylesJson};
    var POLYLINE_STYLES = ${lineStylesJson};

    function sendMessage(payload) {
      var msg = JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    }

    function getCategoryStyle(category) {
      return CATEGORY_STYLES[category] || CATEGORY_STYLES.culture;
    }

    function makePinIcon(markerData) {
      var kind = markerData.kind || "poi";
      var kindStyle = PIN_STYLES[kind] || PIN_STYLES.poi;
      var categoryStyle = markerData.category ? getCategoryStyle(markerData.category) : null;
      var background = categoryStyle ? categoryStyle.bg : kindStyle.bg;

      if (kind === "origin" || kind === "destination" || kind === "user") {
        background = kindStyle.bg;
      }

      var content = kindStyle.icon;
      if (kind === "stop" && markerData.badge) {
        content = markerData.badge;
      } else if ((kind === "poi" || kind === "culture" || kind === "park" || kind === "food") && categoryStyle) {
        content = categoryStyle.icon;
      }

      var html = '<div class="pin ' + kind + '" style="background:' + background + '; border: 2px solid ' + kindStyle.ring + ';">' + (kind === "user" ? "" : content) + '</div>';
      var size = kind === "user" ? [18, 18] : kind === "stop" ? [38, 38] : kind === "origin" || kind === "destination" ? [36, 36] : [34, 34];

      return L.divIcon({
        html: html,
        className: "pin-wrapper",
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1] / 2]
      });
    }

    var map = L.map("map", {
      zoomControl: true,
      attributionControl: true
    }).setView(CENTER, ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var routeLayers = [];

    POLYLINES.forEach(function (polylineData) {
      if (!polylineData.points || polylineData.points.length < 2) return;
      var style = POLYLINE_STYLES[polylineData.kind] || POLYLINE_STYLES.legacy;
      var routeLine = L.polyline(
        polylineData.points.map(function (point) { return [point.lat, point.lng]; }),
        {
          color: style.color,
          weight: style.weight,
          opacity: style.opacity,
          dashArray: style.dashArray,
          lineJoin: "round",
          lineCap: "round"
        }
      ).addTo(map);
      routeLayers.push(routeLine);
    });

    MARKERS.forEach(function (markerData) {
      var marker = L.marker([markerData.lat, markerData.lng], {
        icon: makePinIcon(markerData)
      }).addTo(map);
      if (markerData.label) marker.bindPopup(markerData.label);
      marker.on("click", function () {
        sendMessage({ type: "markerPress", id: markerData.id });
      });
    });

    var bounds = null;
    routeLayers.forEach(function (routeLine) {
      bounds = bounds ? bounds.extend(routeLine.getBounds()) : routeLine.getBounds();
    });

    if (!bounds && MARKERS.length > 1) {
      bounds = L.latLngBounds(MARKERS.map(function (markerData) {
        return [markerData.lat, markerData.lng];
      }));
    }

    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }

    sendMessage({ type: "ready" });
  })();
</script>
</body>
</html>`;
}
