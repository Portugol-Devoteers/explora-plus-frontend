import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

type HealthStatus = "loading" | "ok" | "error";

export default function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    fetch(`${API_URL}/api/health/`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setStatus(data.status === "ok" ? "ok" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explora+</Text>
      <Text style={styles.subtitle}>Turismo inteligente</Text>

      <View style={styles.statusBox}>
        {status === "loading" && (
          <>
            <ActivityIndicator size="small" color="#4A90D9" />
            <Text style={styles.statusText}>Conectando ao backend...</Text>
          </>
        )}
        {status === "ok" && (
          <Text style={[styles.statusText, styles.statusOk]}>
            Backend conectado ✅
          </Text>
        )}
        {status === "error" && (
          <Text style={[styles.statusText, styles.statusError]}>
            Falha na conexão ❌
          </Text>
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
  },
  statusOk: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  statusError: {
    color: "#c62828",
    fontWeight: "600",
  },
});
