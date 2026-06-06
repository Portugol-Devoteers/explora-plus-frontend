import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { fetchMe, type Me } from "../services/me";
import { colors, radius, spacing, typography } from "../theme";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export function ProfileScreen() {
  const { signOut, user } = useAuth();
  const navigation = useNavigation<Navigation>();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchMe()
      .then((data) => {
        if (active) {
          setMe(data);
        }
      })
      .catch(() => {
        if (active) {
          setMe(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName = me?.name ?? user?.username ?? "Usuario";
  const displayEmail = me?.email ?? user?.email ?? "";
  const memberSince = me?.memberSince ?? "";
  const avatarUrl =
    me?.avatarUrl ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      displayName,
    )}&backgroundColor=ff6b35`;

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
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardEyebrow}>Conta</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("SearchSettings")}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.settingsPressed,
              ]}
              accessibilityLabel="Abrir configuracoes de busca"
            >
              <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Image source={{ uri: avatarUrl }} style={styles.avatar} />

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          {memberSince ? (
            <Text style={styles.profileSince}>{memberSince}</Text>
          ) : null}

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Perfil enxuto para o MVP</Text>
            <Text style={styles.noteText}>
              Hoje o foco da entrega esta em autenticacao, rota turistica e mapa com
              pontos de interesse.
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate("SearchSettings")}
            style={({ pressed }) => [
              styles.settingsCard,
              pressed && styles.settingsPressed,
            ]}
          >
            <View style={styles.settingsCopy}>
              <Text style={styles.settingsTitle}>Configuracoes de busca</Text>
              <Text style={styles.settingsText}>
                Ajuste categorias, distancia entre POIs e raio maximo para a sua
                proxima rota.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando dados da conta...</Text>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(380).springify()}>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && styles.logoutPressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.sm,
  },
  cardHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  profileSince: {
    ...typography.caption,
    color: colors.textMuted,
  },
  noteCard: {
    width: "100%",
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  noteText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  settingsCard: {
    width: "100%",
    marginTop: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsCopy: {
    flex: 1,
    gap: 4,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  settingsText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  },
  logoutPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  settingsPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.error,
  },
});
