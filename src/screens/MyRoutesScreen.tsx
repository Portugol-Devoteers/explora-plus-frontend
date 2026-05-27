import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { fetchRoutes, type Route, TRANSPORT_META } from "../services/routes";
import { colors, radius, spacing, typography } from "../theme";

type FilterKey = "todas" | "salvas" | "semana";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "salvas", label: "Salvas" },
  { key: "semana", label: "Esta semana" },
];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function MyRoutesScreen() {
  const navigation = useNavigation<NavProp>();
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    let active = true;
    fetchRoutes()
      .then((data) => {
        if (active) setRoutes(data);
      })
      .catch(() => {
        if (active) setRoutes([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = routes.filter((r) => {
    if (filter === "salvas") return r.saved;
    if (filter === "semana") return /Hoje|Ontem|Sex|Qui/.test(r.generatedAt);
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
        <Text style={styles.title}>Minhas Rotas</Text>
        <Text style={styles.subtitle}>
          Histórico das rotas que você gerou no app
        </Text>
      </Animated.View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={f.key === filter}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="git-branch" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>
            {visible.length} {visible.length === 1 ? "rota" : "rotas"}
          </Text>
          <Text style={styles.summarySubtitle}>
            Toque em qualquer uma para refazer
          </Text>
        </View>
      </View>

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(80 * index).duration(360).springify()}
            >
              <RouteCard
                route={item}
                onPress={() =>
                  navigation.navigate("Route", {
                    placeId: item.destinationPlaceId,
                  })
                }
              />
            </Animated.View>
          )}
        />
      )}
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

function RouteCard({
  route,
  onPress,
}: {
  route: Route;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 18 }) }],
  }));
  const mode = TRANSPORT_META[route.mode];

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = 0.985)}
        onPressOut={() => (scale.value = 1)}
        style={styles.card}
      >
        <Image source={{ uri: route.thumb }} style={styles.cardThumb} />

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {route.destinationName}
            </Text>
            {route.saved && (
              <Ionicons name="bookmark" size={14} color={colors.primary} />
            )}
          </View>
          <Text style={styles.cardOrigin} numberOfLines={1}>
            {route.origin} → {route.destinationName}
          </Text>
          <Text style={styles.cardDate}>{route.generatedAt}</Text>

          <View style={styles.cardMeta}>
            <MetaItem icon={mode.icon} label={mode.label} />
            <MetaItem icon="time-outline" label={`${route.durationMin} min`} />
            <MetaItem
              icon="map-outline"
              label={`${route.distanceKm.toString().replace(".", ",")} km`}
            />
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
          style={styles.cardChevron}
        />
      </Pressable>
    </Animated.View>
  );
}

function MetaItem({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={12} color={colors.primary} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <Animated.View entering={FadeIn.duration(360)} style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="map-outline" size={36} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma rota por aqui</Text>
      <Text style={styles.emptySubtitle}>
        Gere uma rota a partir da aba Explorar e ela aparece aqui.
      </Text>
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
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    fontSize: 14,
    fontWeight: "600",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardOrigin: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cardChevron: {
    marginLeft: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
