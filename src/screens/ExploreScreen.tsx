import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
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
import { MapView, type MapMarker } from "../components/MapView";
import type { RootStackParamList } from "../navigation/types";
import {
  fetchPlaces,
  SANTOS_CENTER,
  SANTOS_ZOOM,
  type Place,
} from "../services/places";
import { colors, radius, spacing, typography } from "../theme";

type FilterKey = "todos" | "monumentos" | "eventos" | "transporte";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "monumentos", label: "Monumentos" },
  { key: "eventos", label: "Eventos" },
  { key: "transporte", label: "Transporte" },
];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ExploreScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    let active = true;
    fetchPlaces()
      .then((data) => {
        if (active) setPlaces(data);
      })
      .catch(() => {
        if (active) setPlaces([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visiblePlaces = places.filter((p) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "monumentos") return p.kind === "monumento";
    if (activeFilter === "eventos") return p.kind === "evento";
    if (activeFilter === "transporte") return p.kind === "transporte";
    return true;
  });

  const markers: MapMarker[] = visiblePlaces
    .filter((p) => p.location)
    .map((p) => ({
      id: p.slug,
      lat: p.location.lat,
      lng: p.location.lng,
      kind: p.kind,
      label: p.name,
    }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={styles.header}
      >
        <Text style={styles.brand}>Explora+</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar monumentos, eventos, lugares..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.micButton} accessibilityLabel="Busca por voz">
            <Ionicons name="mic" size={18} color={colors.textOnPrimary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={f.key === activeFilter}
              onPress={() => setActiveFilter(f.key)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.mapContainer}>
        <MapView
          center={SANTOS_CENTER}
          zoom={SANTOS_ZOOM}
          markers={markers}
          onMarkerPress={(slug) =>
            navigation.navigate("PlaceDetail", { placeId: slug })
          }
          style={styles.map}
        />

        <Animated.View
          entering={FadeInUp.delay(200).duration(420).springify()}
          style={styles.nearbyCard}
          pointerEvents="box-none"
        >
          <View style={styles.nearbyThumb}>
            <Ionicons name="business" size={24} color={colors.textOnPrimary} />
          </View>
          <View style={styles.nearbyText}>
            <Text style={styles.nearbyTitle}>
              {visiblePlaces.length}{" "}
              {visiblePlaces.length === 1 ? "lugar" : "lugares"} por perto
            </Text>
            <Text style={styles.nearbySubtitle}>
              {visiblePlaces.length === 0
                ? "Carregando lugares ou nenhum cadastrado ainda"
                : "Descubra locais históricos a poucos passos"}
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
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
    transform: [{ scale: withSpring(active ? 1 : 0.97, { damping: 16 }) }],
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
  },
  brand: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
  nearbyCard: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  nearbyThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyText: {
    flex: 1,
  },
  nearbyTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  nearbySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
