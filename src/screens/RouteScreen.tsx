import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { getPlaceById } from "../data/places";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Route">;

type TransportKey = "transit" | "rideshare" | "walking";

type TransportOption = {
  key: TransportKey;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  durationMin: number;
  price: string;
  eco: boolean;
};

const TRANSPORT: TransportOption[] = [
  {
    key: "transit",
    icon: "bus",
    title: "Ônibus / Metrô",
    subtitle: "Linha 34 → Baldeação → Linha 12",
    durationMin: 18,
    price: "€ 1,50",
    eco: true,
  },
  {
    key: "rideshare",
    icon: "car",
    title: "Carro de App",
    subtitle: "Uber, 99 ou similares",
    durationMin: 12,
    price: "€ 8,50",
    eco: false,
  },
  {
    key: "walking",
    icon: "walk",
    title: "A pé",
    subtitle: "1,8 km pelo centro histórico",
    durationMin: 25,
    price: "Grátis",
    eco: true,
  },
];

export function RouteScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute();
  const params = route.params as { placeId?: string } | undefined;
  const place = params?.placeId ? getPlaceById(params.placeId) : undefined;
  const [selected, setSelected] = useState<TransportKey>("transit");

  const destinationName = place?.name ?? "Destino";

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressedSoft,
            ]}
            accessibilityLabel="Voltar"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Rota Inteligente</Text>
            <Text style={styles.headerSubtitle}>
              Sua localização → {destinationName}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <MapArea destinationName={destinationName} />

      <Animated.View
        entering={FadeInDown.duration(440).springify().damping(18)}
        style={styles.sheet}
      >
        <View style={styles.dragHandle} />
        <Text style={styles.sheetTitle}>Escolha o Transporte</Text>

        <View style={styles.options}>
          {TRANSPORT.map((opt, i) => (
            <Animated.View
              key={opt.key}
              entering={FadeInDown.delay(120 + i * 80)
                .duration(360)
                .springify()}
            >
              <TransportCard
                option={opt}
                active={selected === opt.key}
                onPress={() => setSelected(opt.key)}
              />
            </Animated.View>
          ))}
        </View>

        <StartButton onPress={() => {}} />
      </Animated.View>
    </View>
  );
}

function MapArea({ destinationName }: { destinationName: string }) {
  const { width } = useWindowDimensions();
  const [size, setSize] = useState({ w: width, h: 320 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize({ w, h });
  };

  const start = { x: size.w * 0.22, y: size.h * 0.26 };
  const end = { x: size.w * 0.78, y: size.h * 0.62 };
  const ctrl = { x: size.w * 0.42, y: size.h * 0.78 };

  const path = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;

  return (
    <View style={styles.mapWrap} onLayout={onLayout}>
      <MapGrid />

      <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.7} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path
          d={path}
          stroke="url(#route)"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <Animated.View
        entering={FadeIn.delay(120)}
        style={[styles.distanceBadge, { top: 16, right: 16 }]}
      >
        <Text style={styles.distanceBadgeText}>1,8 km</Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(220)}
        style={[
          styles.markerWrap,
          { left: start.x, top: start.y },
        ]}
      >
        <View style={styles.userPulse} />
        <View style={styles.userMarker}>
          <Ionicons
            name="navigate"
            size={16}
            color={colors.textOnPrimary}
          />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText}>Sua Localização</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(320)}
        style={[styles.markerWrap, { left: end.x, top: end.y }]}
      >
        <View style={styles.destMarker}>
          <View style={styles.destMarkerInner} />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText}>{destinationName}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function MapGrid() {
  const cols = 6;
  const rows = 8;
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

function TransportCard({
  option,
  active,
  onPress,
}: {
  option: TransportOption;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    elevation.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, elevation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 18 }) }],
  }));

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = 0.985)}
        onPressOut={() => (scale.value = 1)}
        style={[
          styles.card,
          active ? styles.cardActive : styles.cardInactive,
        ]}
      >
        <View
          style={[
            styles.cardIcon,
            active ? styles.cardIconActive : styles.cardIconInactive,
          ]}
        >
          <Ionicons
            name={option.icon}
            size={22}
            color={active ? colors.textOnPrimary : colors.textPrimary}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[
                styles.cardTitle,
                active && styles.cardTitleActive,
              ]}
            >
              {option.title}
            </Text>
            {option.eco && (
              <View
                style={[
                  styles.ecoBadge,
                  active && styles.ecoBadgeOnActive,
                ]}
              >
                <Text style={styles.ecoBadgeText}>Eco</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.cardSubtitle,
              active && styles.cardSubtitleActive,
            ]}
          >
            {option.subtitle}
          </Text>
          <View style={styles.cardMeta}>
            <MetaItem
              icon="time-outline"
              label={`${option.durationMin} min`}
              active={active}
            />
            <MetaItem
              icon="pricetag-outline"
              label={option.price}
              active={active}
            />
          </View>
        </View>

        <View
          style={[styles.radio, active ? styles.radioActive : styles.radioInactive]}
        >
          {active && <View style={styles.radioDot} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MetaItem({
  icon,
  label,
  active,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons
        name={icon}
        size={13}
        color={active ? colors.textOnPrimary : colors.primary}
      />
      <Text style={[styles.metaText, active && styles.metaTextActive]}>
        {label}
      </Text>
    </View>
  );
}

function StartButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 120 }) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = 0.97)}
        onPressOut={() => (scale.value = 1)}
        style={styles.startBtn}
      >
        <Ionicons name="navigate" size={18} color={colors.textOnPrimary} />
        <Text style={styles.startBtnText}>Iniciar Navegação</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedSoft: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mapWrap: {
    height: 320,
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
  distanceBadge: {
    position: "absolute",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  distanceBadgeText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  markerWrap: {
    position: "absolute",
    alignItems: "center",
    marginLeft: -16,
    marginTop: -16,
  },
  userPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.userLocation,
    opacity: 0.18,
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.userLocation,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  destMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  destMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
  markerLabel: {
    marginTop: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  options: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  cardInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconInactive: {
    backgroundColor: colors.surfaceMuted,
  },
  cardIconActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardTitleActive: {
    color: colors.textOnPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  cardSubtitleActive: {
    color: "rgba(255,255,255,0.92)",
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  metaTextActive: {
    color: colors.textOnPrimary,
  },
  ecoBadge: {
    backgroundColor: "#D6F5DD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ecoBadgeOnActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  ecoBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1B7F3A",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  radioInactive: {
    borderColor: colors.border,
  },
  radioActive: {
    borderColor: colors.surface,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  startBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
