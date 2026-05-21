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
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLACES } from "../data/places";
import type { RootStackParamList } from "../navigation/types";
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

  const visiblePlaces = PLACES.filter((p) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "monumentos") return p.kind === "monumento";
    if (activeFilter === "eventos") return p.kind === "evento";
    return false;
  });

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
        <MapPlaceholder />

        {visiblePlaces.map((p, i) => (
          <Animated.View
            key={p.id}
            entering={FadeIn.delay(80 * i).duration(360).springify()}
            layout={LinearTransition.springify()}
            style={[
              styles.markerWrap,
              { top: p.mapPosition.top, left: p.mapPosition.left } as any,
            ]}
          >
            <MarkerPin
              kind={p.kind}
              onPress={() =>
                navigation.navigate("PlaceDetail", { placeId: p.id })
              }
            />
          </Animated.View>
        ))}

        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.userDotWrap, { top: "78%", left: "50%" } as any]}
        >
          <View style={styles.userDotPulse} />
          <View style={styles.userDot} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(420).springify()}
          style={styles.nearbyCard}
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
              Descubra locais históricos a poucos passos
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

function MarkerPin({
  kind,
  onPress,
}: {
  kind: "monumento" | "evento";
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 14 }) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = 0.88)}
        onPressOut={() => (scale.value = 1)}
        style={styles.marker}
        hitSlop={8}
      >
        <Ionicons
          name={kind === "monumento" ? "location" : "calendar"}
          size={16}
          color={colors.textOnPrimary}
        />
      </Pressable>
    </Animated.View>
  );
}

function MapPlaceholder() {
  const cols = 6;
  const rows = 12;
  return (
    <View style={styles.mapBg}>
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={[
            styles.gridLineV,
            { left: `${((i + 1) * 100) / cols}%` } as any,
          ]}
        />
      ))}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <View
          key={`h${i}`}
          style={[
            styles.gridLineH,
            { top: `${((i + 1) * 100) / rows}%` } as any,
          ]}
        />
      ))}
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
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.mapBackground,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.mapGrid,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.mapGrid,
  },
  markerWrap: {
    position: "absolute",
    marginLeft: -16,
    marginTop: -16,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  userDotWrap: {
    position: "absolute",
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.userLocation,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userDotPulse: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.userLocation,
    opacity: 0.18,
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
