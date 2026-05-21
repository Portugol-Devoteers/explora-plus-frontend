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
import {
  MOCK_TICKETS,
  MockTicket,
  TICKET_STATUS_META,
} from "../data/mockTickets";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

type SectionKey = "proximos" | "historico";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "proximos", label: "Próximos" },
  { key: "historico", label: "Histórico" },
];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function TicketsScreen() {
  const navigation = useNavigation<NavProp>();
  const [section, setSection] = useState<SectionKey>("proximos");

  const visible = MOCK_TICKETS.filter((t) =>
    section === "proximos" ? t.status === "valid" : t.status !== "valid",
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
        <Text style={styles.title}>Ingressos</Text>
        <Text style={styles.subtitle}>
          Seus ingressos adquiridos pelo Explora+
        </Text>
      </Animated.View>

      <View style={styles.sectionRow}>
        {SECTIONS.map((s) => (
          <SectionTab
            key={s.key}
            label={s.label}
            active={section === s.key}
            onPress={() => setSection(s.key)}
          />
        ))}
      </View>

      {visible.length === 0 ? (
        <EmptyState section={section} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(80 * index).duration(360).springify()}
            >
              <TicketCard
                ticket={item}
                onPress={() =>
                  navigation.navigate("PlaceDetail", {
                    placeId: item.placeId,
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

function SectionTab({
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

  const underline = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: withSpring(active ? 1 : 0.4, { damping: 16 }) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color:
      progress.value > 0.5 ? colors.textPrimary : colors.textSecondary,
  }));

  return (
    <Pressable onPress={onPress} style={styles.sectionTab}>
      <Animated.Text style={[styles.sectionLabel, textStyle]}>
        {label}
      </Animated.Text>
      <Animated.View style={[styles.sectionUnderline, underline]} />
    </Pressable>
  );
}

function TicketCard({
  ticket,
  onPress,
}: {
  ticket: MockTicket;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 18 }) }],
  }));

  const status = TICKET_STATUS_META[ticket.status];

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = 0.985)}
        onPressOut={() => (scale.value = 1)}
        style={styles.ticket}
      >
        <View style={styles.ticketTop}>
          <Image source={{ uri: ticket.thumb }} style={styles.ticketImage} />
          <View style={styles.ticketTopBody}>
            <View style={styles.ticketTitleRow}>
              <Text style={styles.ticketPlace} numberOfLines={1}>
                {ticket.placeName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.background },
                ]}
              >
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.ticketMetaRow}>
              <View style={styles.ticketMeta}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text style={styles.ticketMetaText}>{ticket.date}</Text>
              </View>
              <View style={styles.ticketMeta}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text style={styles.ticketMetaText}>{ticket.time}</Text>
              </View>
            </View>

            <View style={styles.ticketMetaRow}>
              <View style={styles.ticketMeta}>
                <Ionicons
                  name="people-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text style={styles.ticketMetaText}>
                  {ticket.quantity}{" "}
                  {ticket.quantity === 1 ? "pessoa" : "pessoas"}
                </Text>
              </View>
              <View style={styles.ticketMeta}>
                <Ionicons
                  name="pricetag-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text style={styles.ticketMetaText}>{ticket.totalLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.perfHoleLeft]} />
          <View style={styles.dashedLine} />
          <View style={[styles.perfHoleRight]} />
        </View>

        <View style={styles.ticketBottom}>
          <View>
            <Text style={styles.codeLabel}>Código</Text>
            <Text style={styles.codeValue}>{ticket.code}</Text>
          </View>
          <View style={styles.qrWrap}>
            <Ionicons
              name="qr-code-outline"
              size={28}
              color={colors.textPrimary}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyState({ section }: { section: SectionKey }) {
  return (
    <Animated.View entering={FadeIn.duration(360)} style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="ticket-outline" size={36} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {section === "proximos"
          ? "Nenhum ingresso ativo"
          : "Sem histórico ainda"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {section === "proximos"
          ? "Quando você comprar um ingresso, ele aparece aqui."
          : "Seus ingressos usados ou expirados vão aparecer aqui."}
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
  sectionRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.md,
  },
  sectionTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  sectionUnderline: {
    marginTop: 6,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketTop: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  ticketImage: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  ticketTopBody: {
    flex: 1,
  },
  ticketTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ticketPlace: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ticketMetaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: 4,
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ticketMetaText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  perforation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    height: 16,
    position: "relative",
  },
  perfHoleLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginLeft: -8,
  },
  perfHoleRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: -8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  ticketBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  codeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
    letterSpacing: 1,
  },
  qrWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
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
