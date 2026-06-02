import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TourPoiDetailModal } from "../components/TourPoiDetailModal";
import type { DetailPlace } from "../features/tourRoutes/ui";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  toDetailPlace,
} from "../features/tourRoutes/ui";
import { ApiError } from "../services/api";
import {
  fetchCurrentTourRoute,
  fetchTourRoutePoiDetail,
  fetchUserTourPlaces,
  removeTourRouteStop,
  updateUserTourPlaceVisited,
  type TourRoutePoiDetail,
  type UserTourPlace,
} from "../services/tourRoutes";
import { colors, radius, spacing, typography } from "../theme";

type PlacesFilterKey =
  | "all"
  | "visited"
  | "not_visited"
  | "current_route"
  | "excluded";

const FILTERS: { key: PlacesFilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "visited", label: "Visitados" },
  { key: "not_visited", label: "Nao visitados" },
  { key: "current_route", label: "Rota atual" },
  { key: "excluded", label: "Excluidos" },
];

export function PlacesScreen() {
  const [places, setPlaces] = useState<UserTourPlace[]>([]);
  const [activeFilter, setActiveFilter] = useState<PlacesFilterKey>("all");
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
  const [currentRouteId, setCurrentRouteId] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const refreshPlaces = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const [library, currentRoute] = await Promise.all([
        fetchUserTourPlaces(),
        fetchCurrentTourRoute().catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) {
            return null;
          }
          throw caughtError;
        }),
      ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setPlaces(library);
      setCurrentRouteId(currentRoute?.route.saved_route_id ?? null);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel carregar seus lugares agora.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPlaces();
    }, [refreshPlaces]),
  );

  useEffect(() => {
    if (!selectedStopId) {
      return;
    }
    const stillVisible = places.some((place) => place.stop_id === selectedStopId);
    if (!stillVisible) {
      setSelectedStopId(null);
      setDetailError(null);
      setDetailLoadingStopId(null);
    }
  }, [places, selectedStopId]);

  const filteredPlaces = places.filter((place) => matchesFilter(place, activeFilter));
  const selectedPlace =
    selectedStopId == null
      ? null
      : places.find((place) => place.stop_id === selectedStopId) ?? null;
  const selectedDetail =
    selectedStopId == null ? null : detailCache[selectedStopId] ?? null;

  async function openPlaceDetail(stopId: string) {
    const place = places.find((entry) => entry.stop_id === stopId);
    if (!place) {
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

  async function toggleVisited(place: UserTourPlace) {
    setDetailActionLoading(true);
    setError(null);
    try {
      await updateUserTourPlaceVisited(place.stop_id, !place.is_visited);
      await refreshPlaces();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel atualizar esse lugar agora.");
      }
    } finally {
      setDetailActionLoading(false);
    }
  }

  async function excludeFromCurrentRoute(place: UserTourPlace) {
    if (!currentRouteId) {
      return;
    }

    setDetailActionLoading(true);
    setError(null);
    try {
      await removeTourRouteStop(currentRouteId, place.stop_id);
      await refreshPlaces();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel excluir esse lugar da rota agora.");
      }
    } finally {
      setDetailActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>Lugares</Text>
        <Text style={styles.subtitle}>
          Biblioteca dos pontos que ja apareceram nas suas rotas turisticas.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
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
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Carregando seus lugares...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && filteredPlaces.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="layers-outline" size={24} color={colors.textMuted} />
            <Text style={styles.stateText}>
              Nenhum lugar encontrado para o filtro atual.
            </Text>
          </View>
        ) : null}

        {filteredPlaces.map((place) => (
          <Pressable
            key={place.stop_id}
            onPress={() => {
              void openPlaceDetail(place.stop_id);
            }}
            style={({ pressed }) => [
              styles.placeCard,
              place.is_visited && styles.placeCardVisited,
              place.is_excluded_from_current_route && styles.placeCardExcluded,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.imageWrap}>
              {place.image_url ? (
                <Image
                  source={{ uri: place.image_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: CATEGORY_COLORS[place.category] },
                  ]}
                >
                  <Text style={styles.imagePlaceholderText}>
                    {CATEGORY_SHORT_LABELS[place.category]}
                  </Text>
                </View>
              )}
              {place.is_excluded_from_current_route ? (
                <View style={styles.cardImageOverlay} />
              ) : null}

              {typeof place.current_route_order === "number" ? (
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>{place.current_route_order}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{place.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>

              <View style={styles.pillsRow}>
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: CATEGORY_COLORS[place.category] },
                  ]}
                >
                  <Text style={styles.categoryPillText}>
                    {CATEGORY_LABELS[place.category]}
                  </Text>
                </View>

                {place.is_visited ? (
                  <View style={styles.visitedPill}>
                    <Text style={styles.visitedPillText}>Visitado</Text>
                  </View>
                ) : null}

                {place.is_in_current_route ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentPillText}>Rota atual</Text>
                  </View>
                ) : null}

                {place.is_excluded_from_current_route ? (
                  <View style={styles.excludedPill}>
                    <Text style={styles.excludedPillText}>Excluido</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={styles.cardSummary}
                numberOfLines={place.is_excluded_from_current_route ? 2 : 3}
              >
                {place.summary || place.address || "Sem resumo salvo para este lugar ainda."}
              </Text>

              <Text style={styles.cardMeta} numberOfLines={1}>
                {place.address || "Endereco ainda nao salvo"}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

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
                void toggleVisited(selectedPlace);
              }
            : undefined
        }
        onExcludeFromRoute={
          selectedPlace && selectedPlace.is_in_current_route
            ? () => {
                void excludeFromCurrentRoute(selectedPlace);
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function matchesFilter(place: UserTourPlace, filter: PlacesFilterKey): boolean {
  switch (filter) {
    case "visited":
      return place.is_visited;
    case "not_visited":
      return !place.is_visited;
    case "current_route":
      return place.is_in_current_route;
    case "excluded":
      return place.is_excluded_from_current_route;
    default:
      return true;
  }
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
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
    gap: spacing.sm,
  },
  brand: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  filtersRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  stateCard: {
    minHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 18,
  },
  placeCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  placeCardVisited: {
    opacity: 0.72,
  },
  placeCardExcluded: {
    backgroundColor: colors.surfaceAlt,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: 112,
    minHeight: 136,
    backgroundColor: colors.surfaceAlt,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textOnPrimary,
    letterSpacing: 1,
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(120, 120, 120, 0.52)",
  },
  routeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  visitedPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  visitedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  currentPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  currentPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  excludedPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
  },
  excludedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  cardSummary: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
