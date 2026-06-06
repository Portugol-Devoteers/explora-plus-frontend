import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../services/api";
import {
  fetchTourRoutePreferences,
  updateTourRoutePreferences,
  type TourRoutePreferences,
} from "../services/tourRoutes";
import { colors, radius, spacing, typography } from "../theme";
import type { RootStackParamList } from "../navigation/types";

const DEFAULT_PREFERENCES: TourRoutePreferences = {
  include_culture: true,
  include_park: true,
  include_food: true,
  poi_spacing_m: 100,
  max_search_radius_m: 250,
};

const POI_SPACING_OPTIONS: TourRoutePreferences["poi_spacing_m"][] = [75, 100, 150];
const SEARCH_RADIUS_OPTIONS: TourRoutePreferences["max_search_radius_m"][] = [
  150, 250, 400,
];

type Navigation = NativeStackNavigationProp<RootStackParamList, "SearchSettings">;

export function SearchSettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const [form, setForm] = useState<TourRoutePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchTourRoutePreferences()
      .then((data) => {
        if (!active) {
          return;
        }
        setForm(data);
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError("Nao foi possivel carregar suas configuracoes agora.");
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

  const canSave = useMemo(
    () => form.include_culture || form.include_park || form.include_food,
    [form.include_culture, form.include_food, form.include_park],
  );

  function updateForm(
    patch: Partial<TourRoutePreferences>,
    nextSuccess: string | null = null,
  ) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
    setSuccess(nextSuccess);
  }

  async function savePreferences() {
    if (!canSave) {
      setSuccess(null);
      setError("Ative pelo menos uma categoria para a busca.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateTourRoutePreferences(form);
      setForm(updated);
      setSuccess("Configuracoes salvas. Elas vao valer na sua proxima busca.");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Nao foi possivel salvar suas configuracoes agora.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>Configuracoes de busca</Text>
          <Text style={styles.subtitle}>
            Essas configuracoes serao usadas na proxima vez que voce tocar em
            Gerar rota.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Categorias de POIs</Text>
          <Text style={styles.sectionText}>
            Escolha quais tipos de parada entram na busca automatica do planner.
          </Text>

          <PreferenceSwitchRow
            label="Cultura"
            description="Museus, centros culturais, galerias e pontos historicos."
            value={form.include_culture}
            onValueChange={(value) => updateForm({ include_culture: value })}
          />
          <PreferenceSwitchRow
            label="Parques"
            description="Parques, jardins e mirantes ao longo do trajeto."
            value={form.include_park}
            onValueChange={(value) => updateForm({ include_park: value })}
          />
          <PreferenceSwitchRow
            label="Comida"
            description="Restaurantes e cafes proximos da rota."
            value={form.include_food}
            onValueChange={(value) => updateForm({ include_food: value })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Distancia entre POIs</Text>
          <Text style={styles.sectionText}>
            Controla o ritmo das paradas sugeridas ao longo da rota.
          </Text>

          <PresetSelector
            options={POI_SPACING_OPTIONS}
            selected={form.poi_spacing_m}
            onSelect={(value) => updateForm({ poi_spacing_m: value })}
            formatLabel={(value) => `${value} m`}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Raio maximo de busca</Text>
          <Text style={styles.sectionText}>
            Define ate que distancia da linha base um POI ainda pode ser
            considerado elegivel.
          </Text>

          <PresetSelector
            options={SEARCH_RADIUS_OPTIONS}
            selected={form.max_search_radius_m}
            onSelect={(value) => updateForm({ max_search_radius_m: value })}
            formatLabel={(value) => `${value} m`}
          />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            A rota que ja esta salva continua igual. As novas preferencias entram
            apenas na proxima busca.
          </Text>
        </View>

        {loading ? (
          <View style={styles.feedbackRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.feedbackText}>Carregando configuracoes...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable
          onPress={() => {
            void savePreferences();
          }}
          disabled={saving || loading}
          style={({ pressed }) => [
            styles.saveButton,
            (saving || loading) && styles.disabledButton,
            pressed && !(saving || loading) && styles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Ionicons name="save-outline" size={18} color={colors.textOnPrimary} />
          )}
          <Text style={styles.saveButtonText}>Salvar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceSwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

function PresetSelector<T extends number>({
  options,
  selected,
  onSelect,
  formatLabel,
}: {
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel: (value: T) => string;
}) {
  return (
    <View style={styles.presetRow}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.presetChip,
              active && styles.presetChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.presetLabel, active && styles.presetLabelActive]}
            >
              {formatLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  switchDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  presetChip: {
    minWidth: 84,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  presetLabelActive: {
    color: colors.primaryDark,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  infoText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18,
    flex: 1,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  feedbackText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 18,
  },
  successText: {
    ...typography.caption,
    color: colors.success ?? "#2a7f62",
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
