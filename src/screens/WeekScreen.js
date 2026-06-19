import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  subscribeWeekExpenses,
  getWeekLabel,
  updateExpenseDate,
  deleteExpense,
  todayString,
  yesterdayString,
} from "../services/expenseService";

const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function getDaysInWeek() {
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
  return days;
}

function dateKey(d) {
  return d.toISOString().split("T")[0];
}

function formatDate(d) {
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

export default function WeekScreen() {
  const [weekExpenses, setWeekExpenses] = useState([]);
  const [editModal, setEditModal] = useState({ visible: false, expense: null });

  useEffect(() => {
    return subscribeWeekExpenses(setWeekExpenses);
  }, []);

  const days = getDaysInWeek();
  const todayStr = dateKey(new Date());

  const sections = days.map((day) => {
    const key = dateKey(day);
    const dayExpenses = weekExpenses.filter((e) => e.date === key);
    const total = dayExpenses.reduce((s, e) => s + e.value, 0);
    const isToday = key === todayStr;

    return {
      title: `${DAY_NAMES[day.getDay()]} ${formatDate(day)}${isToday ? " (Hoje)" : ""}`,
      total,
      data: dayExpenses,
      isToday,
    };
  });

  const weekTotal = weekExpenses.reduce((s, e) => s + e.value, 0);

  async function handleMoveToToday(expense) {
    try {
      await updateExpenseDate(expense.id, todayString());
      setEditModal({ visible: false, expense: null });
    } catch (e) {
      Alert.alert("Erro", "Não foi possível mover o gasto");
    }
  }

  async function handleMoveToYesterday(expense) {
    try {
      await updateExpenseDate(expense.id, yesterdayString());
      setEditModal({ visible: false, expense: null });
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Semana</Text>
      <Text style={styles.weekLabel}>{getWeekLabel()}</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total da Semana</Text>
        <Text style={styles.totalValue}>R$ {weekTotal.toFixed(2)}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={[styles.dayHeader, section.isToday && styles.dayHeaderToday]}>
            <Text
              style={[styles.dayTitle, section.isToday && styles.dayTitleToday]}
            >
              {section.title}
            </Text>
            <Text
              style={[styles.dayTotal, section.isToday && styles.dayTitleToday]}
            >
              R$ {section.total.toFixed(2)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseItem}
            onLongPress={() => setEditModal({ visible: true, expense: item })}
            delayLongPress={400}
          >
            <View style={styles.expenseLeft}>
              <Text style={styles.expenseName}>{item.item}</Text>
              <Text style={styles.expenseBy}>{item.addedBy}</Text>
            </View>
            <Text
              style={[
                styles.expenseValue,
                { color: item.addedBy === "Lucas" ? "#4A90D9" : "#E91E63" },
              ]}
            >
              -R$ {item.value.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={styles.emptyDay}>Nenhum gasto</Text>
          ) : null
        }
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={editModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal({ visible: false, expense: null })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModal({ visible: false, expense: null })}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editModal.expense?.item}</Text>
            <Text style={styles.modalSubtitle}>
              R$ {editModal.expense?.value?.toFixed(2)} —{" "}
              {editModal.expense?.addedBy}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleMoveToToday(editModal.expense)}
            >
              <Ionicons name="today" size={20} color="#FFF" />
              <Text style={styles.modalButtonText}>Mover pra hoje</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleMoveToYesterday(editModal.expense)}
            >
              <Ionicons name="calendar" size={20} color="#FFF" />
              <Text style={styles.modalButtonText}>Mover pra ontem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalDeleteButton]}
              onPress={() => handleDelete(editModal.expense)}
            >
              <Ionicons name="trash" size={20} color="#FFF" />
              <Text style={styles.modalButtonText}>Excluir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setEditModal({ visible: false, expense: null })}
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
  container: { flex: 1, backgroundColor: "#FFF0F5" },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  weekLabel: {
    fontSize: 14,
    color: "#888",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
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
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 20 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  dayHeaderToday: { borderBottomColor: "#E91E63" },
  dayTitle: { fontSize: 15, fontWeight: "700", color: "#555" },
  dayTitleToday: { color: "#E91E63" },
  dayTotal: { fontSize: 15, fontWeight: "700", color: "#555" },
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
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalSubtitle: { fontSize: 14, color: "#888", marginTop: 4, marginBottom: 20 },
  modalButton: {
    flexDirection: "row",
    backgroundColor: "#4A90D9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
  },
  modalDeleteButton: { backgroundColor: "#F44336" },
  modalButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  modalCancel: { marginTop: 6 },
  modalCancelText: { fontSize: 14, color: "#999" },
});
