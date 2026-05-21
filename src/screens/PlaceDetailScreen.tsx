import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPlaceById } from "../data/places";
import type { PlaceDetailProps } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

const HERO_HEIGHT = 380;

export function PlaceDetailScreen({ route, navigation }: PlaceDetailProps) {
  const { placeId } = route.params;
  const place = getPlaceById(placeId);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { width } = useWindowDimensions();

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Local não encontrado</Text>
      </SafeAreaView>
    );
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== carouselIndex) setCarouselIndex(idx);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <FlatList
            data={place.images}
            keyExtractor={(_, i) => `img-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={[styles.heroImage, { width }]}
                resizeMode="cover"
              />
            )}
          />

          <SafeAreaView
            style={styles.heroOverlay}
            edges={["top"]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.iconCircle,
                styles.backBtn,
                pressed && styles.pressedSoft,
              ]}
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
          </SafeAreaView>

          {place.images.length > 1 && (
            <>
              <View style={[styles.heroArrows, styles.heroArrowLeft]}>
                <CarouselArrow
                  direction="left"
                  disabled={carouselIndex === 0}
                />
              </View>
              <View style={[styles.heroArrows, styles.heroArrowRight]}>
                <CarouselArrow
                  direction="right"
                  disabled={carouselIndex === place.images.length - 1}
                />
              </View>
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>
                  {carouselIndex + 1} / {place.images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        <Animated.View
          entering={FadeInUp.duration(400).springify().damping(18)}
          style={styles.contentCard}
        >
          <Animated.Text
            layout={LinearTransition.springify()}
            style={styles.title}
          >
            {place.name}
          </Animated.Text>

          <View style={styles.chipsRow}>
            <InfoChip
              icon="location"
              label={`${place.distanceKm.toString().replace(".", ",")} km daqui`}
            />
            <InfoChip icon="time-outline" label={place.hours} />
            <InfoChip icon="ticket-outline" label={place.priceLabel} />
          </View>

          <Animated.Text
            entering={FadeInDown.delay(120).duration(380)}
            style={styles.sectionTitle}
          >
            Sobre
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(180).duration(380)}
            style={styles.description}
          >
            {place.about}
          </Animated.Text>

          <View style={styles.actions}>
            <PrimaryButton
              label="Gerar Rota"
              onPress={() =>
                navigation.navigate("Route", { placeId: place.id })
              }
            />
            <SecondaryButton label="Comprar Ingressos" onPress={() => {}} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function InfoChip({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

function CarouselArrow({
  direction,
  disabled,
}: {
  direction: "left" | "right";
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.iconCircle,
        styles.carouselArrow,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={direction === "left" ? "chevron-back" : "chevron-forward"}
        size={20}
        color={colors.textPrimary}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
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
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
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
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  notFound: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    height: HERO_HEIGHT,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtn: {
    marginTop: spacing.sm,
  },
  pressedSoft: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  heroArrows: {
    position: "absolute",
    top: HERO_HEIGHT / 2 - 20,
  },
  heroArrowLeft: {
    left: spacing.md,
  },
  heroArrowRight: {
    right: spacing.md,
  },
  carouselArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  disabled: {
    opacity: 0.35,
  },
  pageBadge: {
    position: "absolute",
    bottom: spacing.md,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  pageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  contentCard: {
    backgroundColor: colors.surface,
    marginTop: -spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  infoChipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
