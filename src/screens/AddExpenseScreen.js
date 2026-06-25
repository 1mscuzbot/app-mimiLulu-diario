import { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";
import { addExpense, todayString, yesterdayString } from "../services/expenseService";
import { getTheme } from "../utils/theme";
import { formatDate, getRecentDates } from "../utils/format";

export default function AddExpenseScreen({ onClose }) {
  const user = useContext(UserContext);
  const theme = getTheme(user);
  const [item, setItem] = useState("");
  const [value, setValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmedItem = item.trim();
    const numericValue = parseFloat(value.replace(",", "."));

    if (!trimmedItem) {
      Alert.alert("Ops", "Digita o nome do item");
      return;
    }
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert("Ops", "Digita um valor válido");
      return;
    }

    setLoading(true);
    try {
      await addExpense(trimmedItem, numericValue, user, selectedDate);
      setItem("");
      setValue("");
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Gasto</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Item</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Pizza, Uber, Mercado..."
            value={item}
            onChangeText={setItem}
            autoFocus
          />

          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
          />

          <Text style={styles.dateLabel}>Data do gasto</Text>
          {!showDatePicker ? (
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[
                  styles.dateOption,
                  selectedDate === todayString() && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedDate(todayString())}
              >
                <Text
                  style={[
                    styles.dateOptionText,
                    selectedDate === todayString() && { color: theme.primary, fontWeight: "bold" },
                  ]}
                >
                  Hoje ({formatDate(todayString())})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateOption,
                  selectedDate === yesterdayString() && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedDate(yesterdayString())}
              >
                <Text
                  style={[
                    styles.dateOptionText,
                    selectedDate === yesterdayString() && { color: theme.primary, fontWeight: "bold" },
                  ]}
                >
                  Ontem ({formatDate(yesterdayString())})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateOption,
                  { borderStyle: "dashed" },
                  selectedDate !== todayString() && selectedDate !== yesterdayString() && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateOptionText,
                    selectedDate !== todayString() && selectedDate !== yesterdayString() && { color: theme.primary, fontWeight: "bold" },
                  ]}
                >
                  Outro dia...
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.datePickerList}>
                {getRecentDates(13).map((d) => (
                  <TouchableOpacity
                    key={d.str}
                    style={[
                      styles.datePickerItem,
                      selectedDate === d.str && { backgroundColor: theme.primaryLight },
                    ]}
                    onPress={() => {
                      setSelectedDate(d.str);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.datePickerText,
                      selectedDate === d.str && { color: theme.primary, fontWeight: "bold" },
                    ]}>
                      {d.label}
                    </Text>
                    {selectedDate === d.str && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.datePickerCancel}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Voltar</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.userLabel}>
            Adicionado por: <Text style={styles.userName}>{user}</Text>
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.buttonText}>
              {loading ? "Salvando..." : "Adicionar Gasto"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F5" },
  inner: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  form: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
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
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    marginTop: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    alignItems: "center",
  },
  dateOptionActive: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF0F5",
  },
  dateOptionText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  dateOptionTextActive: {
    color: "#E91E63",
  },
  datePickerList: { maxHeight: 200, marginBottom: 8 },
  datePickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  datePickerText: { fontSize: 15, color: "#333" },
  datePickerCancel: { alignItems: "center", padding: 8 },
  datePickerCancelText: { fontSize: 14, color: "#999" },
  userLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
  userName: { fontWeight: "bold", color: "#E91E63" },
  button: {
    flexDirection: "row",
    backgroundColor: "#E91E63",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    elevation: 3,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
