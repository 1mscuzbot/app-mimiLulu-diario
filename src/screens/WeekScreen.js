import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SectionList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";
import LongPressItem from "../components/LongPressItem";
import {
  subscribeWeekExpenses,
  updateExpense,
  updateExpenseDate,
  deleteExpense,
  subscribeLimits,
} from "../services/expenseService";
import { getTheme } from "../utils/theme";
import { DAY_NAMES } from "../utils/constants";
import { toDateStr, formatDateObj, getWeekLabel } from "../utils/format";

export default function WeekScreen() {
  const user = useContext(UserContext);
  const theme = getTheme(user);
  const [limits, setLimits] = useState({ diario: 100, semanal: 500 });
  const [weekExpenses, setWeekExpenses] = useState([]);
  const [editModal, setEditModal] = useState({ visible: false, expense: null });
  const [editExpenseText, setEditExpenseText] = useState("");
  const [editExpenseValue, setEditExpenseValue] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubExpenses = subscribeWeekExpenses(setWeekExpenses);
    const unsubLimits = subscribeLimits(setLimits);
    return () => {
      unsubExpenses();
      unsubLimits();
    };
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 0 : -dayOfWeek;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }

  const todayKey = toDateStr(new Date());

  const sections = days.map((day) => {
    const key = toDateStr(day);
    const dayExpenses = weekExpenses.filter((e) => e.date === key);
    const total = dayExpenses.reduce((s, e) => s + e.value, 0);
    const isToday = key === todayKey;
    const isExpanded = expandedDays[key] ?? isToday;

    return {
      title: `${DAY_NAMES[day.getDay()]} ${formatDateObj(day)}${isToday ? " (Hoje)" : ""}`,
      key,
      total,
      count: dayExpenses.length,
      data: isExpanded ? dayExpenses : [],
      isToday,
      isExpanded,
    };
  });

  const weekTotal = weekExpenses.reduce((s, e) => s + e.value, 0);
  const weekRaw = (weekTotal / (limits.semanal || 500)) * 100;

  const getBarColor = (percent) => {
    if (percent >= 100) return "#F44336";
    if (percent >= 70) return "#FF9800";
    return "#4CAF50";
  };

  function toggleDay(key) {
    setExpandedDays((prev) => ({ ...prev, [key]: prev[key] === false }));
  }

  function openExpenseEdit(item) {
    setEditExpenseText(item.item);
    setEditExpenseValue(String(item.value));
    setEditModal({ visible: true, expense: item });
    setShowDatePicker(false);
  }

  async function handleSaveExpense() {
    const exp = editModal.expense;
    if (!exp) return;
    const name = editExpenseText.trim();
    const val = parseFloat(editExpenseValue);
    if (!name || isNaN(val)) return;
    try {
      await updateExpense(exp.id, { item: name, value: val });
      setEditModal({ visible: false, expense: null });
    } catch (e) {
      Alert.alert("Erro", "Não foi possível editar");
    }
  }

  async function handleMoveDate(expenseId, dateStr) {
    try {
      await updateExpenseDate(expenseId, dateStr);
      setEditModal({ visible: false, expense: null });
      setShowDatePicker(false);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível mover o gasto");
    }
  }

  function handleDelete(expense) {
    Alert.alert("Excluir", `Excluir "${expense.item}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(expense.id);
            setEditModal({ visible: false, expense: null });
          } catch (e) {
            Alert.alert("Erro", "Não foi possível excluir");
          }
        },
      },
    ]);
  }

  const DAY_NAMES_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  function formatDateStr(str) {
    const [y, m, d] = str.split("-");
    return `${d}/${m}`;
  }

  function getRecentDates(daysBack) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= daysBack; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const str = `${year}-${month}-${day}`;
      const dayName = i === 0 ? "Hoje" : i === 1 ? "Ontem" : DAY_NAMES_SHORT[d.getDay()];
      dates.push({ str, label: `${dayName}, ${formatDateStr(str)}` });
    }
    return dates;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={styles.pageTitle}>Semana</Text>
      <Text style={styles.weekLabel}>{getWeekLabel()}</Text>

      <View style={[styles.totalCard, weekRaw >= 100 && styles.totalCardOver]}>
        <Text style={styles.totalLabel}>Total da Semana</Text>
        <Text style={[styles.totalValue, weekRaw >= 100 && { color: "#D32F2F" }]}>
          R$ {weekTotal.toFixed(2)}
        </Text>
        <Text style={styles.weekLimit}>meta: R$ {limits.semanal.toFixed(2)}</Text>
        <View style={styles.weekBarBg}>
          <View
            style={[
              styles.weekBarFill,
              {
                width: `${Math.min(weekRaw, 100)}%`,
                backgroundColor: getBarColor(weekRaw),
              },
            ]}
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <TouchableOpacity
            style={[styles.dayHeader, section.isToday && styles.dayHeaderToday]}
            onPress={() => toggleDay(section.key)}
          >
            <View style={styles.dayHeaderLeft}>
              <Ionicons
                name={section.isExpanded ? "chevron-down" : "chevron-forward"}
                size={16}
                color={section.isToday ? "#E91E63" : "#888"}
              />
              <Text
                style={[styles.dayTitle, section.isToday && styles.dayTitleToday]}
              >
                {section.title}
              </Text>
            </View>
            <View style={styles.dayHeaderRight}>
              <Text
                style={[styles.dayTotal, section.isToday && styles.dayTitleToday]}
              >
                R$ {section.total.toFixed(2)}
              </Text>
              <Text style={styles.dayCount}>({section.count})</Text>
            </View>
          </TouchableOpacity>
        )}
        renderItem={({ item }) => {
          const isLucas = item.addedBy === "Lucas";
          const color = isLucas ? "#4A90D9" : "#E91E63";
          return (
            <LongPressItem
              style={[
                styles.expenseItem,
                { backgroundColor: isLucas ? "#D6EAF8" : "#FCE4EC" },
              ]}
              onLongPress={() => openExpenseEdit(item)}
              color={color}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseName}>{item.item}</Text>
                <Text style={styles.expenseBy}>{item.addedBy}</Text>
              </View>
              <Text
                style={[
                  styles.expenseValue,
                  { color },
                ]}
              >
                -R$ {item.value.toFixed(2)}
              </Text>
            </LongPressItem>
          );
        }}
        renderSectionFooter={({ section }) =>
          section.isExpanded && section.data.length === 0 ? (
            <Text style={styles.emptyDay}>Nenhum gasto</Text>
          ) : null
        }
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={editModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditModal({ visible: false, expense: null });
          setShowDatePicker(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setEditModal({ visible: false, expense: null });
            setShowDatePicker(false);
          }}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Editar Gasto</Text>

            <TextInput
              style={styles.expenseEditInput}
              placeholder="Descrição"
              value={editExpenseText}
              onChangeText={setEditExpenseText}
            />
            <TextInput
              style={styles.expenseEditInput}
              placeholder="Valor"
              value={editExpenseValue}
              onChangeText={setEditExpenseValue}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleSaveExpense}>
              <Ionicons name="save" size={20} color="#FFF" />
              <Text style={styles.modalButtonText}>Salvar alterações</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {!showDatePicker ? (
              <>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() =>
                    handleMoveDate(editModal.expense.id, todayString())
                  }
                >
                  <Ionicons name="today" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Mover pra hoje</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() =>
                    handleMoveDate(editModal.expense.id, yesterdayString())
                  }
                >
                  <Ionicons name="calendar" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Mover pra ontem</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Outro dia...</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalDeleteButton]}
                  onPress={() => handleDelete(editModal.expense)}
                >
                  <Ionicons name="trash" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Excluir</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.datePickerTitle}>Selecionar data</Text>
                <View style={styles.datePickerList}>
                  {getRecentDates(13).map((d) => (
                    <TouchableOpacity
                      key={d.str}
                      style={styles.datePickerItem}
                      onPress={() => handleMoveDate(editModal.expense.id, d.str)}
                    >
                      <Text style={styles.datePickerText}>{d.label}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalCancelText}>Voltar</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setEditModal({ visible: false, expense: null });
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  weekLabel: { fontSize: 14, color: "#888", paddingHorizontal: 20, marginBottom: 12 },
  totalCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#888" },
  totalValue: { fontSize: 28, fontWeight: "bold", color: "#333" },
  totalCardOver: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
  weekLimit: { fontSize: 12, color: "#999", marginTop: 4 },
  weekBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  weekBarFill: { height: "100%", borderRadius: 4 },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 20 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  dayHeaderToday: { borderBottomColor: "#E91E63" },
  dayHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  dayHeaderRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  dayTitle: { fontSize: 15, fontWeight: "700", color: "#555", marginLeft: 8 },
  dayTitleToday: { color: "#E91E63" },
  dayTotal: { fontSize: 15, fontWeight: "700", color: "#555" },
  dayCount: { fontSize: 12, color: "#bbb" },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  expenseLeft: { flex: 1 },
  expenseName: { fontSize: 15, fontWeight: "600", color: "#333" },
  expenseBy: { fontSize: 12, color: "#999", marginTop: 2 },
  expenseValue: { fontSize: 16, fontWeight: "bold" },
  emptyDay: {
    fontSize: 13,
    color: "#ccc",
    fontStyle: "italic",
    paddingVertical: 8,
    paddingLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxHeight: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalSubtitle: { fontSize: 14, color: "#888", marginTop: 4, marginBottom: 16 },
  modalButton: {
    flexDirection: "row",
    backgroundColor: "#4A90D9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 8,
  },
  modalDeleteButton: { backgroundColor: "#F44336" },
  modalButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600", marginLeft: 8 },
  modalCancel: { marginTop: 8 },
  modalCancelText: { fontSize: 14, color: "#999" },
  divider: { height: 1, backgroundColor: "#E8E8E8", width: "100%", marginVertical: 12 },
  expenseEditInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  datePickerList: { width: "100%", maxHeight: 250, marginBottom: 8 },
  datePickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  datePickerText: { fontSize: 15, color: "#333" },
});
