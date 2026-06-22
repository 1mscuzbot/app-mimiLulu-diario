import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";
import { getLimits, setLimits } from "../services/expenseService";

export default function SettingsScreen({ onClose }) {
  const user = useContext(UserContext);
  const isLucas = user === "Lucas";
  const theme = {
    bg: "#FFFFFF",
    primary: isLucas ? "#4A90D9" : "#E91E63",
    primaryLight: isLucas ? "#BBDEFB" : "#FCE4EC",
  };
  const [diario, setDiario] = useState("");
  const [semanal, setSemanal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const limits = await getLimits();
      setDiario(limits.diario.toString());
      setSemanal(limits.semanal.toString());
    }
    load();
  }, []);

  async function handleSave() {
    const d = parseFloat(diario.replace(",", "."));
    const s = parseFloat(semanal.replace(",", "."));

    if (isNaN(d) || d <= 0 || isNaN(s) || s <= 0) {
      Alert.alert("Ops", "Digita valores válidos");
      return;
    }

    setLoading(true);
    try {
      await setLimits(d, s);
      Alert.alert("Salvo!", "Limites atualizados");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>Limites de Gastos</Text>

        <Text style={styles.label}>Limite Diário (R$)</Text>
        <TextInput
          style={styles.input}
          value={diario}
          onChangeText={setDiario}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Limite Semanal (R$)</Text>
        <TextInput
          style={styles.input}
          value={semanal}
          onChangeText={setSemanal}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Salvando..." : "Salvar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  form: { padding: 20, flex: 1, paddingTop: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  button: {
    backgroundColor: "#4A90D9",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 30,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
