import type {
  TourRouteCategory,
  TourRoutePlaceToPass,
  TourRouteStopState,
  UserTourPlace,
} from "../../services/tourRoutes";

export const CATEGORY_LABELS: Record<TourRouteCategory, string> = {
  culture: "Cultura",
  park: "Parques",
  food: "Comida",
};

export const CATEGORY_SHORT_LABELS: Record<TourRouteCategory, string> = {
  culture: "C",
  park: "P",
  food: "F",
};

export const CATEGORY_COLORS: Record<TourRouteCategory, string> = {
  culture: "#A63A50",
  park: "#2E7D32",
  food: "#C96A00",
};

export type DetailPlace = {
  stop_id: string;
  name: string;
  category: TourRouteCategory;
  visited: boolean;
  isInCurrentRoute: boolean;
  isExcludedFromCurrentRoute: boolean;
};

export function toDetailPlace(
  place: TourRoutePlaceToPass | UserTourPlace,
): DetailPlace {
  if ("state" in place) {
    return {
      stop_id: place.stop_id,
      name: place.name,
      category: place.category,
      visited: place.state === "visited",
      isInCurrentRoute: place.included_in_route,
      isExcludedFromCurrentRoute: false,
    };
  }

  return {
    stop_id: place.stop_id,
    name: place.name,
    category: place.category,
    visited: place.is_visited,
    isInCurrentRoute: place.is_in_current_route,
    isExcludedFromCurrentRoute: place.is_excluded_from_current_route,
  };
}

export function formatDistance(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${distanceM} m`;
}

export function formatDuration(durationS: number): string {
  const minutes = Math.max(1, Math.round(durationS / 60));
  return `${minutes} min`;
}

export function formatDistanceFromRoute(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km da rota`;
  }

  return `${distanceM} m da rota`;
}

export function buildPlaceMeta(place: TourRoutePlaceToPass): string {
  return `${CATEGORY_LABELS[place.category]} - ${formatDistanceFromRoute(
    place.distance_from_route_m,
  )}`;
}

export function buildMapLabel(
  name: string | undefined,
  category: TourRouteCategory | undefined,
  waypointOrder: number | null | undefined,
  state: TourRouteStopState,
): string {
  if (!name) {
    return "";
  }

  const prefix = typeof waypointOrder === "number" ? `${waypointOrder}. ` : "";
  const categoryLabel = category ? ` - ${CATEGORY_LABELS[category]}` : "";
  const stateLabel = state === "visited" ? " - Ja visitado" : "";
  return `${prefix}${name}${categoryLabel}${stateLabel}`;
}
