import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MapView,
  type LatLng,
  type MapMarker,
  type MapPolyline,
} from "../components/MapView";
import { ApiError } from "../services/api";
import {
  planTourRoute,
  type TourRouteCategory,
  type TourRouteMapFeature,
  type TourRoutePlaceToPass,
  type TourRouteResponse,
} from "../services/tourRoutes";
import { colors, radius, spacing, typography } from "../theme";

type FilterKey = "all" | TourRouteCategory;
type MapState = {
  markers: MapMarker[];
  polylines: MapPolyline[];
};

const DEFAULT_ORIGIN = "Praça Oswaldo Cruz, São Paulo";
const DEFAULT_DESTINATION = "Edificio Gilbraltar, 2518, Avenida Paulista, Sao Paulo";
const DEFAULT_CENTER: LatLng = { lat: -23.562856, lng: -46.654011 };
const DEFAULT_ZOOM = 14;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "culture", label: "Cultura" },
  { key: "park", label: "Parques" },
  { key: "food", label: "Comida" },
];

const CATEGORY_LABELS: Record<TourRouteCategory, string> = {
  culture: "Cultura",
  park: "Parques",
  food: "Comida",
};

const CATEGORY_SHORT_LABELS: Record<TourRouteCategory, string> = {
  culture: "C",
  park: "P",
  food: "F",
};

const CATEGORY_COLORS: Record<TourRouteCategory, string> = {
  culture: "#A63A50",
  park: "#2E7D32",
  food: "#C96A00",
};

export function ExploreScreen() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [routeResult, setRouteResult] = useState<TourRouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const destinationInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    void submitRoute(DEFAULT_ORIGIN, DEFAULT_DESTINATION);
  }, []);

  async function submitRoute(originValue = origin, destinationValue = destination) {
    const nextOrigin = originValue.trim();
    const nextDestination = destinationValue.trim();

    if (!nextOrigin || !nextDestination) {
      setError("Preencha a origem e o destino para calcular a rota.");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const data = await planTourRoute({
        origin: { address: nextOrigin },
        destination: { address: nextDestination },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setRouteResult(data);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel calcular a rota agora.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  const routeOriginLabel = routeResult?.route.origin.label ?? origin;
  const routeDestinationLabel = routeResult?.route.destination.label ?? destination;
  const routePlaces = routeResult?.route.places_to_pass ?? [];
  const itineraryStops = [...routePlaces]
    .filter((place) => place.included_in_route)
    .sort((left, right) => {
      const leftOrder = left.waypoint_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.waypoint_order ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
  const visiblePlaces = routePlaces.filter((place) => matchesFilter(place, activeFilter));
  const extraSuggestions = visiblePlaces.filter((place) => !place.included_in_route);
  const mapState = buildMapState(routeResult, activeFilter);
  const mapCenter = getMapCenter(routeResult);
  const routeDistance = routeResult ? formatDistance(routeResult.route.distance_m) : "--";
  const routeDuration = routeResult ? formatDuration(routeResult.route.duration_s) : "--";
  const directDistance = routeResult
    ? formatDistance(routeResult.route.direct_route.distance_m)
    : "--";
  const directDuration = routeResult
    ? formatDuration(routeResult.route.direct_route.duration_s)
    : "--";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.brand}>Explora+</Text>
            {searchCollapsed ? (
              <Text style={styles.collapsedRoutePreview} numberOfLines={1}>
                {routeOriginLabel} ate {routeDestinationLabel}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.collapseButton,
              pressed && styles.collapseButtonPressed,
            ]}
            onPress={() => setSearchCollapsed((current) => !current)}
            accessibilityLabel={
              searchCollapsed ? "Expandir busca" : "Minimizar busca"
            }
          >
            <Ionicons
              name={searchCollapsed ? "chevron-down" : "chevron-up"}
              size={18}
              color={colors.textPrimary}
            />
            <Text style={styles.collapseButtonText}>
              {searchCollapsed ? "Abrir busca" : "Minimizar"}
            </Text>
          </Pressable>
        </View>

        {!searchCollapsed ? (
          <>
            <Text style={styles.subtitle}>
              Planeje uma caminhada turistica com paradas reais e sugestoes extras
              ao longo do percurso.
            </Text>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Origem</Text>
                <View style={styles.inputShell}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Endereco de origem"
                    placeholderTextColor={colors.textMuted}
                    value={origin}
                    onChangeText={setOrigin}
                    returnKeyType="next"
                    onSubmitEditing={() => destinationInputRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destino</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    ref={destinationInputRef}
                    style={styles.input}
                    placeholder="Destino"
                    placeholderTextColor={colors.textMuted}
                    value={destination}
                    onChangeText={setDestination}
                    returnKeyType="go"
                    onSubmitEditing={() => {
                      void submitRoute();
                    }}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                ]}
                onPress={() => {
                  void submitRoute();
                }}
                accessibilityLabel="Gerar rota"
              >
                <Ionicons name="play" size={18} color={colors.textOnPrimary} />
                <Text style={styles.submitLabel}>Gerar rota</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              active={filter.key === activeFilter}
              onPress={() => setActiveFilter(filter.key)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.mapContainer}>
        <MapView
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          markers={mapState.markers}
          polylines={mapState.polylines}
          style={styles.map}
        />

        <Animated.View
          entering={FadeInUp.delay(220).duration(420).springify()}
          style={styles.panel}
        >
          <ScrollView
            contentContainerStyle={styles.panelContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryEyebrow}>Resumo da rota</Text>
                <Text style={styles.summaryTitle}>
                  {routeResult?.route.mode === "tour"
                    ? "Rota turistica ativa"
                    : "Rota direta em uso"}
                </Text>
              </View>
              {loading ? (
                <View style={styles.loadingPill}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingPillText}>Calculando...</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.summaryRouteText} numberOfLines={2}>
              {routeOriginLabel} ate {routeDestinationLabel}
            </Text>

            <View style={styles.metricsRow}>
              <MetricCell label="Distancia" value={routeDistance} />
              <MetricCell label="Duracao" value={routeDuration} />
              <MetricCell label="POIs visiveis" value={String(visiblePlaces.length)} />
            </View>

            {routeResult ? (
              <Text style={styles.compareText}>
                Linha direta guardada no payload: {directDistance} em {directDuration}.
              </Text>
            ) : null}

            <Text style={styles.summaryHint}>
              {buildRouteHint(routeResult, activeFilter)}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <SectionTitle title="Paradas da rota" />
            {itineraryStops.length > 0 ? (
              itineraryStops.map((place) => (
                <PlaceRow
                  key={`stop-${place.order}`}
                  leading={String(place.waypoint_order ?? place.order)}
                  tone={place.category}
                  title={place.name}
                  meta={`${CATEGORY_LABELS[place.category]} · ${formatDistanceFromRoute(
                    place.distance_from_route_m,
                  )}`}
                />
              ))
            ) : (
              <Text style={styles.emptySectionText}>
                {routeResult?.route.mode === "direct_fallback"
                  ? "Nenhuma parada entrou na rota ativa. Os pontos abaixo seguem como sugestoes."
                  : "Nenhuma parada confirmada nesta rota."}
              </Text>
            )}

            <SectionTitle title="Sugestoes extras" />
            {extraSuggestions.length > 0 ? (
              extraSuggestions.map((place) => (
                <PlaceRow
                  key={`extra-${place.order}`}
                  leading={CATEGORY_SHORT_LABELS[place.category]}
                  tone={place.category}
                  title={place.name}
                  meta={`${CATEGORY_LABELS[place.category]} · ${formatDistanceFromRoute(
                    place.distance_from_route_m,
                  )}`}
                />
              ))
            ) : (
              <Text style={styles.emptySectionText}>
                Nao ha sugestoes extras para o filtro atual.
              </Text>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function matchesFilter(place: TourRoutePlaceToPass, activeFilter: FilterKey): boolean {
  return activeFilter === "all" || place.category === activeFilter;
}

function buildMapState(
  routeResult: TourRouteResponse | null,
  activeFilter: FilterKey,
): MapState {
  if (!routeResult) {
    return { markers: [], polylines: [] };
  }

  const visibleOrders = new Set(
    routeResult.route.places_to_pass
      .filter((place) => matchesFilter(place, activeFilter))
      .map((place) => place.order),
  );

  const markers: MapMarker[] = [];
  const tourPolylines: MapPolyline[] = [];
  const directPolylines: MapPolyline[] = [];

  routeResult.map.features.forEach((feature) => {
    if (feature.geometry.type === "LineString") {
      const polyline = mapFeatureToPolyline(feature);
      if (!polyline) {
        return;
      }

      if (polyline.kind === "route_tour") {
        tourPolylines.push(polyline);
      } else {
        directPolylines.push(polyline);
      }
      return;
    }

    const marker = mapFeatureToMarker(feature, visibleOrders);
    if (marker) {
      markers.push(marker);
    }
  });

  const polylines: MapPolyline[] =
    tourPolylines.length > 0
      ? tourPolylines
      : directPolylines.length > 0
        ? directPolylines
        : routeResult.route.polyline_points.length > 1
          ? [
              {
                id: "route-fallback",
                kind:
                  routeResult.route.mode === "tour" ? "route_tour" : "route_direct",
                points: routeResult.route.polyline_points,
              },
            ]
          : [];

  return { markers, polylines };
}

function mapFeatureToPolyline(feature: TourRouteMapFeature): MapPolyline | null {
  if (feature.geometry.type !== "LineString") {
    return null;
  }

  if (
    feature.properties.kind !== "route_tour" &&
    feature.properties.kind !== "route_direct"
  ) {
    return null;
  }

  return {
    id: `${feature.properties.kind}-${feature.properties.distance_m ?? "line"}`,
    kind: feature.properties.kind,
    points: feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
  };
}

function mapFeatureToMarker(
  feature: TourRouteMapFeature,
  visibleOrders: Set<number>,
): MapMarker | null {
  if (feature.geometry.type !== "Point") {
    return null;
  }

  const [lng, lat] = feature.geometry.coordinates;
  const { kind } = feature.properties;

  if (kind === "origin" || kind === "destination") {
    return {
      id: kind,
      lat,
      lng,
      kind,
      label:
        typeof feature.properties.label === "string" ? feature.properties.label : "",
    };
  }

  if (kind !== "stop" && kind !== "poi") {
    return null;
  }

  if (
    typeof feature.properties.order !== "number" ||
    !visibleOrders.has(feature.properties.order)
  ) {
    return null;
  }

  const category =
    feature.properties.category === "culture" ||
    feature.properties.category === "park" ||
    feature.properties.category === "food"
      ? feature.properties.category
      : undefined;

  return {
    id: `${kind}-${feature.properties.order}`,
    lat,
    lng,
    kind,
    category,
    badge:
      kind === "stop" && typeof feature.properties.waypoint_order === "number"
        ? String(feature.properties.waypoint_order)
        : undefined,
    label: buildMapLabel(feature.properties.name, category, feature.properties.waypoint_order),
  };
}

function buildMapLabel(
  name: string | undefined,
  category: TourRouteCategory | undefined,
  waypointOrder: number | null | undefined,
): string {
  if (!name) {
    return "";
  }

  const prefix =
    typeof waypointOrder === "number" ? `${waypointOrder}. ` : "";
  const categoryLabel = category ? ` · ${CATEGORY_LABELS[category]}` : "";
  return `${prefix}${name}${categoryLabel}`;
}

function buildRouteHint(
  routeResult: TourRouteResponse | null,
  activeFilter: FilterKey,
): string {
  if (!routeResult) {
    return "O mapa carrega automaticamente a rota da Paulista para a demonstracao.";
  }

  if (routeResult.route.mode === "tour") {
    return `Filtro atual: ${
      activeFilter === "all" ? "Todos" : CATEGORY_LABELS[activeFilter]
    }. A rota turistica usa uma caminhada livre entre os pontos, e a linha direta do mapa de ruas segue guardada no payload para comparacao.`;
  }

  if (routeResult.route.places_to_pass.length > 0) {
    return "Usando a rota direta como fallback. Os pontos seguem como sugestoes proximas do trajeto.";
  }

  return "Sem paradas disponiveis nesta rota agora.";
}

function getMapCenter(routeResult: TourRouteResponse | null): LatLng {
  if (!routeResult) {
    return DEFAULT_CENTER;
  }

  return {
    lat:
      (routeResult.route.origin.location.lat +
        routeResult.route.destination.location.lat) /
      2,
    lng:
      (routeResult.route.origin.location.lng +
        routeResult.route.destination.location.lng) /
      2,
  };
}

function formatDistance(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${distanceM} m`;
}

function formatDuration(durationS: number): string {
  const minutes = Math.max(1, Math.round(durationS / 60));
  return `${minutes} min`;
}

function formatDistanceFromRoute(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km da rota`;
  }

  return `${distanceM} m da rota`;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, progress]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor:
      progress.value > 0.5 ? colors.primary : colors.surfaceMuted,
    transform: [{ scale: withSpring(active ? 1 : 0.98, { damping: 16 }) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: progress.value > 0.5 ? colors.textOnPrimary : colors.textPrimary,
  }));

  return (
    <Animated.View style={[styles.chip, bgStyle]}>
      <Pressable onPress={onPress} style={styles.chipPress}>
        <Animated.Text style={[styles.chipText, textStyle]}>
          {label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function PlaceRow({
  leading,
  tone,
  title,
  meta,
}: {
  leading: string;
  tone: TourRouteCategory;
  title: string;
  meta: string;
}) {
  return (
    <View style={styles.placeRow}>
      <View
        style={[
          styles.placeLeading,
          { backgroundColor: CATEGORY_COLORS[tone] },
        ]}
      >
        <Text style={styles.placeLeadingText}>{leading}</Text>
      </View>

      <View style={styles.placeTextWrap}>
        <Text style={styles.placeTitle}>{title}</Text>
        <Text style={styles.placeMeta}>{meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  brand: {
    ...typography.title,
    color: colors.textPrimary,
  },
  collapsedRoutePreview: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  collapseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  collapseButtonPressed: {
    opacity: 0.88,
  },
  collapseButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  submitButton: {
    marginTop: spacing.xs,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  submitButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    height: 36,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  chipPress: {
    height: 36,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    maxHeight: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  panelContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryTitle: {
    ...typography.subtitle,
    fontSize: 17,
    color: colors.textPrimary,
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  loadingPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  summaryRouteText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCell: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  compareText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  placeLeading: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  placeLeadingText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  placeTextWrap: {
    flex: 1,
    gap: 2,
  },
  placeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  placeMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptySectionText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
