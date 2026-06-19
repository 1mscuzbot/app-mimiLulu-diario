import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  subscribeTodayExpenses,
  subscribeWeekExpenses,
  subscribeLimits,
  getWeekLabel,
} from "../services/expenseService";
import { sendLocalNotification } from "../services/notifications";

export default function HomeScreen({ user, onLogout, navigation }) {
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [weekExpenses, setWeekExpenses] = useState([]);
  const [limits, setLimits] = useState({ diario: 100, semanal: 500 });

  useEffect(() => {
    const unsubToday = subscribeTodayExpenses(setTodayExpenses);
    const unsubWeek = subscribeWeekExpenses(setWeekExpenses);
    const unsubLimits = subscribeLimits(setLimits);

    return () => {
      unsubToday();
      unsubWeek();
      unsubLimits();
    };
  }, []);

  const todayTotal = todayExpenses.reduce((s, e) => s + e.value, 0);
  const weekTotal = weekExpenses.reduce((s, e) => s + e.value, 0);
  const todayPercent = Math.min((todayTotal / limits.diario) * 100, 100);
  const weekPercent = Math.min((weekTotal / limits.semanal) * 100, 100);

  const getBarColor = (percent) => {
    if (percent < 50) return "#4CAF50";
    if (percent < 80) return "#FFC107";
    return "#F44336";
  };

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
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseName}>{item.item}</Text>
                <Text style={styles.expenseBy}>
                  {item.addedBy} •{" "}
                  {item.createdAt?.toDate().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
            </View>
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  weekCard: { marginBottom: 16 },
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
});
