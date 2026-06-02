import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TourRoutePoiDetail } from "../services/tourRoutes";
import { colors, radius, spacing, typography } from "../theme";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  type DetailPlace,
} from "../features/tourRoutes/ui";

type TourPoiDetailModalProps = {
  visible: boolean;
  place: DetailPlace | null;
  detail: TourRoutePoiDetail | null;
  loading: boolean;
  error: string | null;
  actionLoading?: boolean;
  onClose: () => void;
  onToggleVisited?: () => void;
  onExcludeFromRoute?: () => void;
};

export function TourPoiDetailModal({
  visible,
  place,
  detail,
  loading,
  error,
  actionLoading = false,
  onClose,
  onToggleVisited,
  onExcludeFromRoute,
}: TourPoiDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Ponto de interesse</Text>
                <Text style={styles.title}>
                  {detail?.name ?? place?.name ?? "Detalhe do ponto"}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
                onPress={onClose}
                accessibilityLabel="Fechar detalhes"
              >
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.imageShell}>
              {detail?.image_url ? (
                <Image
                  source={{ uri: detail.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.placeholder,
                    {
                      backgroundColor: place
                        ? CATEGORY_COLORS[place.category]
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text style={styles.placeholderText}>
                    {place ? CATEGORY_SHORT_LABELS[place.category] : "POI"}
                  </Text>
                </View>
              )}
              {place?.isExcludedFromCurrentRoute ? <View style={styles.imageOverlay} /> : null}
            </View>

            {place ? (
              <View style={styles.metaRow}>
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

                {place.visited ? (
                  <View style={styles.visitedPill}>
                    <Text style={styles.visitedPillText}>Ja visitado</Text>
                  </View>
                ) : null}

                {place.isExcludedFromCurrentRoute ? (
                  <View style={styles.excludedPill}>
                    <Text style={styles.excludedPillText}>Excluido da rota atual</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Carregando detalhes do local...
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <DetailLine
              label="Endereco"
              value={detail?.address || place?.name || "Endereco nao informado."}
            />
            <DetailLine
              label="Resumo"
              value={detail?.summary || "Sem resumo salvo para este ponto ainda."}
            />
            {detail?.opening_hours ? (
              <DetailLine label="Horario" value={detail.opening_hours} />
            ) : null}
            {detail?.website ? (
              <DetailLine label="Website" value={detail.website} />
            ) : null}
            {detail?.source_url ? (
              <DetailLine label="Fonte" value={detail.source_url} />
            ) : null}

            {place ? (
              <View style={styles.actionGroup}>
                {onToggleVisited ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                      actionLoading && styles.disabledButton,
                    ]}
                    onPress={onToggleVisited}
                    disabled={actionLoading}
                  >
                    <Ionicons
                      name={place.visited ? "reload-outline" : "checkmark-done-outline"}
                      size={18}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.secondaryButtonText}>
                      {place.visited ? "Desmarcar visitado" : "Marcar como visitado"}
                    </Text>
                  </Pressable>
                ) : null}

                {onExcludeFromRoute && place.isInCurrentRoute ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.dangerButton,
                      pressed && styles.pressed,
                      actionLoading && styles.disabledButton,
                    ]}
                    onPress={onExcludeFromRoute}
                    disabled={actionLoading}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.textOnPrimary}
                    />
                    <Text style={styles.dangerButtonText}>Excluir da rota</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(26, 26, 26, 0.28)",
  },
  backdrop: {
    flex: 1,
  },
  card: {
    maxHeight: "78%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  imageShell: {
    width: "100%",
    height: 188,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(140, 140, 140, 0.48)",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textOnPrimary,
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  visitedPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  visitedPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  excludedPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
  },
  excludedPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 18,
  },
  detailLine: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  disabledButton: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.88,
  },
});
