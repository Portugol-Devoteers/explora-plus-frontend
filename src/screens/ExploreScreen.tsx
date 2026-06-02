import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { TourPoiDetailModal } from "../components/TourPoiDetailModal";
import {
  MapView,
  type LatLng,
  type MapMarker,
  type MapPolyline,
} from "../components/MapView";
import {
  buildMapLabel,
  buildPlaceMeta,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  formatDistance,
  formatDuration,
  toDetailPlace,
} from "../features/tourRoutes/ui";
import { ApiError } from "../services/api";
import {
  fetchCurrentTourRoute,
  fetchTourRoutePoiDetail,
  planTourRoute,
  removeTourRouteStop,
  updateTourRouteStopState,
  type TourRouteCategory,
  type TourRouteMapFeature,
  type TourRoutePlaceToPass,
  type TourRoutePoiDetail,
  type TourRouteResponse,
  type TourRouteStopState,
} from "../services/tourRoutes";
import { colors, radius, spacing, typography } from "../theme";

type FilterKey = "all" | TourRouteCategory;
type MapState = {
  markers: MapMarker[];
  polylines: MapPolyline[];
};

const DEFAULT_ORIGIN = "Praca Oswaldo Cruz, Sao Paulo";
const DEFAULT_DESTINATION = "Edificio Gilbraltar, 2518, Avenida Paulista, Sao Paulo";
const DEFAULT_CENTER: LatLng = { lat: -23.562856, lng: -46.654011 };
const DEFAULT_ZOOM = 14;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "culture", label: "Cultura" },
  { key: "park", label: "Parques" },
  { key: "food", label: "Comida" },
];

export function ExploreScreen() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [routeResult, setRouteResult] = useState<TourRouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, TourRoutePoiDetail>>(
    {},
  );
  const [detailLoadingStopId, setDetailLoadingStopId] = useState<string | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState(false);
  const requestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const destinationInputRef = useRef<TextInput | null>(null);

  const applyRouteResult = useCallback((data: TourRouteResponse) => {
    setRouteResult(data);
    setOrigin(data.route.origin.label);
    setDestination(data.route.destination.label);
  }, []);

  const requestPlannedRoute = useCallback(
    async (
      nextOrigin: string,
      nextDestination: string,
      options?: { fallbackFromCurrent?: boolean },
    ) => {
      const fallbackFromCurrent = options?.fallbackFromCurrent ?? false;
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
        applyRouteResult(data);
      } catch (caughtError) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(
            fallbackFromCurrent
              ? "Nao foi possivel carregar sua rota atual agora."
              : "Nao foi possivel calcular a rota agora.",
          );
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [applyRouteResult],
  );

  const loadCurrentRoute = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const currentRoute = await fetchCurrentTourRoute();
      if (requestId !== requestIdRef.current) {
        return;
      }
      applyRouteResult(currentRoute);
      setLoading(false);
      return;
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!(caughtError instanceof ApiError) || caughtError.status !== 404) {
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError("Nao foi possivel carregar sua rota atual agora.");
        }
        setLoading(false);
        return;
      }
    }

    await requestPlannedRoute(DEFAULT_ORIGIN, DEFAULT_DESTINATION, {
      fallbackFromCurrent: true,
    });
  }, [applyRouteResult, requestPlannedRoute]);

  useFocusEffect(
    useCallback(() => {
      void loadCurrentRoute();
    }, [loadCurrentRoute]),
  );

  useEffect(() => {
    if (!selectedStopId) {
      return;
    }
    const stillVisible = (routeResult?.route.places_to_pass ?? []).some(
      (place) => place.stop_id === selectedStopId,
    );
    if (!stillVisible) {
      setSelectedStopId(null);
      setDetailError(null);
      setDetailLoadingStopId(null);
    }
  }, [routeResult, selectedStopId]);

  async function submitRoute(originValue = origin, destinationValue = destination) {
    const nextOrigin = originValue.trim();
    const nextDestination = destinationValue.trim();

    if (!nextOrigin || !nextDestination) {
      setError("Preencha a origem e o destino para calcular a rota.");
      return;
    }

    await requestPlannedRoute(nextOrigin, nextDestination);
  }

  const routeOriginLabel = routeResult?.route.origin.label ?? origin;
  const routeDestinationLabel = routeResult?.route.destination.label ?? destination;
  const routePlaces = routeResult?.route.places_to_pass ?? [];
  const visiblePlaces = routePlaces.filter((place) => matchesFilter(place, activeFilter));
  const itineraryStops = [...visiblePlaces]
    .filter((place) => place.included_in_route && place.state === "active")
    .sort((left, right) => {
      const leftOrder = left.waypoint_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.waypoint_order ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
  const visitedStops = visiblePlaces.filter((place) => place.state === "visited");
  const extraSuggestions = visiblePlaces.filter(
    (place) => place.state === "active" && !place.included_in_route,
  );
  const mapState = buildMapState(routeResult, activeFilter);
  const mapCenter = getMapCenter(routeResult);
  const routeDistance = routeResult ? formatDistance(routeResult.route.distance_m) : "--";
  const routeDuration = routeResult ? formatDuration(routeResult.route.duration_s) : "--";
  const savedRouteId = routeResult?.route.saved_route_id ?? null;
  const selectedPlace =
    selectedStopId == null
      ? null
      : routePlaces.find((place) => place.stop_id === selectedStopId) ?? null;
  const selectedDetail =
    selectedStopId == null ? null : detailCache[selectedStopId] ?? null;

  async function openPlaceDetail(stopId: string) {
    const exists = routePlaces.some((place) => place.stop_id === stopId);
    if (!exists) {
      return;
    }

    setSelectedStopId(stopId);
    setDetailError(null);

    if (detailCache[stopId]) {
      return;
    }

    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setDetailLoadingStopId(stopId);

    try {
      const detail = await fetchTourRoutePoiDetail(stopId);
      if (requestId !== detailRequestIdRef.current) {
        return;
      }
      setDetailCache((current) => ({
        ...current,
        [stopId]: detail,
      }));
    } catch (caughtError) {
      if (requestId !== detailRequestIdRef.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setDetailError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setDetailError(caughtError.message);
      } else {
        setDetailError("Nao foi possivel carregar os detalhes agora.");
      }
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setDetailLoadingStopId(null);
      }
    }
  }

  async function removeStop(stopId: string) {
    if (!savedRouteId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setDetailActionLoading(true);

    try {
      const data = await removeTourRouteStop(savedRouteId, stopId);
      if (requestId !== requestIdRef.current) {
        return;
      }
      applyRouteResult(data);
      if (selectedStopId === stopId) {
        setSelectedStopId(null);
      }
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel atualizar a rota agora.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
      setDetailActionLoading(false);
    }
  }

  async function toggleVisitedState(place: TourRoutePlaceToPass) {
    if (!savedRouteId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const nextState: TourRouteStopState =
      place.state === "visited" ? "active" : "visited";

    setLoading(true);
    setError(null);
    setDetailActionLoading(true);

    try {
      const data = await updateTourRouteStopState(
        savedRouteId,
        place.stop_id,
        nextState,
      );
      if (requestId !== requestIdRef.current) {
        return;
      }
      applyRouteResult(data);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel atualizar a rota agora.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
      setDetailActionLoading(false);
    }
  }

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
          onMarkerPress={(stopId) => {
            void openPlaceDetail(stopId);
          }}
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
              <View style={styles.summaryActions}>
                {loading ? (
                  <View style={styles.loadingPill}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingPillText}>Calculando...</Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.summaryToggleButton,
                    pressed && styles.collapseButtonPressed,
                  ]}
                  onPress={() => setSummaryCollapsed((current) => !current)}
                  accessibilityLabel={
                    summaryCollapsed ? "Expandir resumo" : "Minimizar resumo"
                  }
                >
                  <Ionicons
                    name={summaryCollapsed ? "chevron-down" : "chevron-up"}
                    size={16}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.summaryToggleText}>
                    {summaryCollapsed ? "Abrir resumo" : "Minimizar"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricCell label="Distancia" value={routeDistance} />
              <MetricCell label="Duracao" value={routeDuration} />
              <MetricCell label="POIs visiveis" value={String(visiblePlaces.length)} />
            </View>

            {!summaryCollapsed ? (
              <>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <SectionTitle title="Paradas da rota" />
                {itineraryStops.length > 0 ? (
                  itineraryStops.map((place) => (
                    <PlaceRow
                      key={`stop-${place.stop_id}`}
                      leading={String(place.waypoint_order ?? place.order)}
                      tone={place.category}
                      title={place.name}
                      meta={buildPlaceMeta(place)}
                      state={place.state}
                      onPress={() => {
                        void openPlaceDetail(place.stop_id);
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.emptySectionText}>
                    {routeResult?.route.mode === "direct_fallback"
                      ? "Nenhuma parada entrou na rota ativa. Os pontos abaixo seguem como sugestoes."
                      : "Nenhuma parada confirmada nesta rota."}
                  </Text>
                )}

                {visitedStops.length > 0 ? (
                  <>
                    <SectionTitle title="Ja visitados" />
                    {visitedStops.map((place) => (
                      <PlaceRow
                        key={`visited-${place.stop_id}`}
                        leading={CATEGORY_SHORT_LABELS[place.category]}
                        tone={place.category}
                        title={place.name}
                        meta={`Ja visitado - ${buildPlaceMeta(place)}`}
                        state={place.state}
                        onPress={() => {
                          void openPlaceDetail(place.stop_id);
                        }}
                      />
                    ))}
                  </>
                ) : null}

                <SectionTitle title="Sugestoes extras" />
                {extraSuggestions.length > 0 ? (
                  extraSuggestions.map((place) => (
                    <PlaceRow
                      key={`extra-${place.stop_id}`}
                      leading={CATEGORY_SHORT_LABELS[place.category]}
                      tone={place.category}
                      title={place.name}
                      meta={buildPlaceMeta(place)}
                      state={place.state}
                      onPress={() => {
                        void openPlaceDetail(place.stop_id);
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.emptySectionText}>
                    Nao ha sugestoes extras para o filtro atual.
                  </Text>
                )}
              </>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>

      <TourPoiDetailModal
        visible={selectedStopId != null}
        place={selectedPlace ? toDetailPlace(selectedPlace) : null}
        detail={selectedDetail}
        loading={detailLoadingStopId === selectedStopId}
        error={detailError}
        actionLoading={detailActionLoading}
        onClose={() => setSelectedStopId(null)}
        onToggleVisited={
          selectedPlace
            ? () => {
                void toggleVisitedState(selectedPlace);
              }
            : undefined
        }
        onExcludeFromRoute={
          selectedPlace && selectedPlace.included_in_route
            ? () => {
                void removeStop(selectedPlace.stop_id);
              }
            : undefined
        }
      />
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

  const visibleStopIds = new Set(
    routeResult.route.places_to_pass
      .filter((place) => matchesFilter(place, activeFilter))
      .map((place) => place.stop_id),
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

    const marker = mapFeatureToMarker(feature, visibleStopIds);
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
  visibleStopIds: Set<string>,
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
    typeof feature.properties.stop_id !== "string" ||
    !visibleStopIds.has(feature.properties.stop_id)
  ) {
    return null;
  }

  const category =
    feature.properties.category === "culture" ||
    feature.properties.category === "park" ||
    feature.properties.category === "food"
      ? feature.properties.category
      : undefined;
  const state =
    feature.properties.state === "visited" ? "visited" : "active";

  return {
    id: feature.properties.stop_id,
    lat,
    lng,
    kind,
    category,
    state,
    badge:
      kind === "stop" && typeof feature.properties.waypoint_order === "number"
        ? String(feature.properties.waypoint_order)
        : undefined,
    label: buildMapLabel(
      feature.properties.name,
      category,
      feature.properties.waypoint_order,
      state,
    ),
  };
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
  state,
  onPress,
}: {
  leading: string;
  tone: TourRouteCategory;
  title: string;
  meta: string;
  state: TourRouteStopState;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.placeRow,
        state === "visited" && styles.placeRowVisited,
        pressed && styles.collapseButtonPressed,
      ]}
      accessibilityLabel={`Abrir detalhes de ${title}`}
    >
      <View
        style={[
          styles.placeLeading,
          { backgroundColor: CATEGORY_COLORS[tone] },
          state === "visited" && styles.placeLeadingVisited,
        ]}
      >
        <Text style={styles.placeLeadingText}>{leading}</Text>
      </View>

      <View style={styles.placeTextWrap}>
        <Text style={styles.placeTitle}>{title}</Text>
        <Text style={styles.placeMeta}>{meta}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
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
    maxHeight: 360,
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
  summaryActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
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
  summaryToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  summaryToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
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
  placeRowVisited: {
    opacity: 0.58,
  },
  placeLeading: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  placeLeadingVisited: {
    opacity: 0.72,
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
