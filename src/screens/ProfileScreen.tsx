import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_USER } from "../data/mockUser";
import { colors, radius, spacing, typography } from "../theme";

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  trailing?: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU: MenuGroup[] = [
  {
    title: "Conta",
    items: [
      { icon: "person-circle-outline", label: "Editar perfil" },
      { icon: "language-outline", label: "Idioma", trailing: "Português" },
      { icon: "notifications-outline", label: "Notificações" },
    ],
  },
  {
    title: "Atividade",
    items: [
      { icon: "bookmark-outline", label: "Favoritos" },
      { icon: "time-outline", label: "Histórico de buscas" },
    ],
  },
  {
    title: "Sobre",
    items: [
      { icon: "information-circle-outline", label: "Sobre o Explora+" },
      { icon: "document-text-outline", label: "Termos de uso" },
      { icon: "shield-checkmark-outline", label: "Política de privacidade" },
    ],
  },
];

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(420).springify().damping(18)}
          style={styles.profileCard}
        >
          <View style={styles.profileTop}>
            <Image
              source={{ uri: MOCK_USER.avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{MOCK_USER.name}</Text>
              <Text style={styles.profileEmail}>{MOCK_USER.email}</Text>
              <Text style={styles.profileSince}>{MOCK_USER.memberSince}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.editBtn,
                pressed && styles.pressedSoft,
              ]}
              accessibilityLabel="Editar perfil"
              hitSlop={8}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCell label="Rotas" value={MOCK_USER.stats.routes} />
            <View style={styles.statDivider} />
            <StatCell
              label="Lugares"
              value={MOCK_USER.stats.placesVisited}
            />
            <View style={styles.statDivider} />
            <StatCell label="Ingressos" value={MOCK_USER.stats.tickets} />
          </View>
        </Animated.View>

        {MENU.map((group, gi) => (
          <Animated.View
            key={group.title}
            entering={FadeInDown.delay(120 + gi * 60)
              .duration(360)
              .springify()}
            style={styles.group}
          >
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, i) => (
                <View key={item.label}>
                  <MenuRow item={item} />
                  {i < group.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View
          entering={FadeInDown.delay(380).duration(380).springify()}
        >
          <LogoutButton />
        </Animated.View>

        <Text style={styles.version}>Explora+ · versão 0.1.0 (mock)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 18 }) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => (scale.value = 0.985)}
        onPressOut={() => (scale.value = 1)}
        style={styles.menuRow}
      >
        <View style={styles.menuIconWrap}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.trailing && (
          <Text style={styles.menuTrailing}>{item.trailing}</Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

function LogoutButton() {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 18 }) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => (scale.value = 0.985)}
        onPressOut={() => (scale.value = 1)}
        style={styles.logoutBtn}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileSince: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedSoft: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.title,
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  menuTrailing: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
  },
});
