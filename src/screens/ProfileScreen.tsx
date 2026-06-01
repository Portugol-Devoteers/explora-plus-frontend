import { Ionicons } from "@expo/vector-icons";
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
import { fetchMe, type Me } from "../services/me";
import { colors, radius, spacing, typography } from "../theme";

export function ProfileScreen() {
  const { signOut, user } = useAuth();
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
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.error,
  },
});
