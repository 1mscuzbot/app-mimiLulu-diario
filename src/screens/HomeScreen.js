import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  subscribeTodayExpenses,
  subscribeYesterdayExpenses,
  subscribeWeekExpenses,
  subscribeLimits,
  updateExpenseDate,
  deleteExpense,
  getWeekLabel,
  todayString,
  yesterdayString,
} from "../services/expenseService";

export default function HomeScreen({ user, onLogout, navigation }) {
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [yesterdayExpenses, setYesterdayExpenses] = useState([]);
  const [weekExpenses, setWeekExpenses] = useState([]);
  const [limits, setLimits] = useState({ diario: 100, semanal: 500 });
  const [showYesterday, setShowYesterday] = useState(false);

  const [editModal, setEditModal] = useState({ visible: false, expense: null });

  useEffect(() => {
    const unsubToday = subscribeTodayExpenses(setTodayExpenses);
    const unsubYesterday = subscribeYesterdayExpenses(setYesterdayExpenses);
    const unsubWeek = subscribeWeekExpenses(setWeekExpenses);
    const unsubLimits = subscribeLimits(setLimits);

    return () => {
      unsubToday();
      unsubYesterday();
      unsubWeek();
      unsubLimits();
    };
  }, []);

  const todayTotal = todayExpenses.reduce((s, e) => s + e.value, 0);
  const yesterdayTotal = yesterdayExpenses.reduce((s, e) => s + e.value, 0);
  const weekTotal = weekExpenses.reduce((s, e) => s + e.value, 0);
  const todayPercent = Math.min((todayTotal / limits.diario) * 100, 100);
  const weekPercent = Math.min((weekTotal / limits.semanal) * 100, 100);

  const getBarColor = (percent) => {
    if (percent < 50) return "#4CAF50";
    if (percent < 80) return "#FFC107";
    return "#F44336";
  };

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

  function renderExpenseItem(item, isYesterday) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.expenseItem}
        onLongPress={() => setEditModal({ visible: true, expense: item })}
        delayLongPress={400}
      >
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseName}>{item.item}</Text>
          <Text style={styles.expenseBy}>
            {item.addedBy}
            {item.createdAt?.toDate
              ? ` • ${item.createdAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </Text>
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
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user}!</Text>
        <TouchableOpacity onPress={onLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddExpense")}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Hoje</Text>
        <Text style={styles.summaryValue}>
          R$ {todayTotal.toFixed(2)}
          <Text style={styles.limitText}> / R$ {limits.diario.toFixed(2)}</Text>
        </Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${todayPercent}%`, backgroundColor: getBarColor(todayPercent) },
            ]}
          />
        </View>
        {todayExpenses.length > 0 && (
          <View style={styles.byPerson}>
            <Text style={styles.byPersonText}>
              {todayExpenses
                .filter((e) => e.addedBy === "Lucas")
                .reduce((s, e) => s + e.value, 0)
                .toFixed(2)}{" "}
              (L) +{" "}
              {todayExpenses
                .filter((e) => e.addedBy === "Milena")
                .reduce((s, e) => s + e.value, 0)
                .toFixed(2)}{" "}
              (M)
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.summaryCard, styles.weekCard]}>
        <Text style={styles.summaryTitle}>Semana ({getWeekLabel()})</Text>
        <Text style={styles.summaryValue}>
          R$ {weekTotal.toFixed(2)}
          <Text style={styles.limitText}> / R$ {limits.semanal.toFixed(2)}</Text>
        </Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${weekPercent}%`, backgroundColor: getBarColor(weekPercent) },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.yesterdayToggle}
        onPress={() => setShowYesterday(!showYesterday)}
      >
        <Ionicons
          name={showYesterday ? "chevron-down" : "chevron-forward"}
          size={18}
          color="#888"
        />
        <Text style={styles.yesterdayToggleText}>
          Ontem (R$ {yesterdayTotal.toFixed(2)})
        </Text>
      </TouchableOpacity>

      {showYesterday && (
        <View style={styles.yesterdayList}>
          {yesterdayExpenses.length === 0 ? (
            <Text style={styles.emptyDayText}>Nenhum gasto ontem</Text>
          ) : (
            yesterdayExpenses.map((item) => renderExpenseItem(item, true))
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Gastos de Hoje</Text>

      {todayExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="happy-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum gasto hoje</Text>
          <Text style={styles.emptySubtext}>Bora manter assim!</Text>
        </View>
      ) : (
        <FlatList
          data={todayExpenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderExpenseItem(item)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

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
            <Text style={styles.modalTitle}>
              {editModal.expense?.item}
            </Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#333" },
  summaryCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  weekCard: { marginBottom: 8 },
  summaryTitle: { fontSize: 14, color: "#888", fontWeight: "600", marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: "bold", color: "#333" },
  limitText: { fontSize: 16, color: "#999", fontWeight: "normal" },
  barBg: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  byPerson: { marginTop: 8 },
  byPersonText: { fontSize: 13, color: "#888" },
  yesterdayToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  yesterdayToggleText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    marginLeft: 6,
  },
  yesterdayList: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyDayText: {
    fontSize: 13,
    color: "#ccc",
    fontStyle: "italic",
    paddingLeft: 4,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 20 },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expenseLeft: { flex: 1 },
  expenseName: { fontSize: 16, fontWeight: "600", color: "#333" },
  expenseBy: { fontSize: 12, color: "#999", marginTop: 2 },
  expenseValue: { fontSize: 18, fontWeight: "bold" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999", marginTop: 8 },
  emptySubtext: { fontSize: 14, color: "#ccc" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#E91E63",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 10,
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
