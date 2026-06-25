import { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";
import LongPressItem from "../components/LongPressItem";
import {
  subscribeTodayExpenses,
  subscribeYesterdayExpenses,
  subscribeWeekExpenses,
  subscribeLimits,
  subscribeDateRangeExpressions,
  updateExpense,
  updateExpenseDate,
  deleteExpense,
  todayString,
  yesterdayString,
} from "../services/expenseService";
import {
  addItem,
  toggleItemCompleted,
  updateItem,
  deleteItem,
  subscribeActiveItems,
} from "../services/shoppingService";
import AddExpenseScreen from "./AddExpenseScreen";
import SettingsScreen from "./SettingsScreen";
import { getTheme } from "../utils/theme";
import {
  formatDate,
  daysAgoStr,
  formatShortDate,
  groupByDate,
  getRecentDates,
  getWeekLabel,
  getBarColor,
  getLastWeekRange,
} from "../utils/format";

export default function HomeScreen({ onLogout }) {
  const navigation = useNavigation();
  const user = useContext(UserContext);
  const theme = getTheme(user);

  const [todayExpenses, setTodayExpenses] = useState([]);
  const [yesterdayExpenses, setYesterdayExpenses] = useState([]);
  const [weekExpenses, setWeekExpenses] = useState([]);
  const [limits, setLimits] = useState({ diario: 100, semanal: 500 });
  const [shoppingItems, setShoppingItems] = useState([]);
  const [lastWeekExpenses, setLastWeekExpenses] = useState([]);
  const [prevWeekExpenses, setPrevWeekExpenses] = useState([]);
  const [lastMonthExpenses, setLastMonthExpenses] = useState([]);

  const [showYesterday, setShowYesterday] = useState(false);
  const [showLastWeek, setShowLastWeek] = useState(false);
  const [showPrevWeek, setShowPrevWeek] = useState(false);
  const [showLastMonth, setShowLastMonth] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  const [editModal, setEditModal] = useState({ visible: false, expense: null });
  const [editExpenseText, setEditExpenseText] = useState("");
  const [editExpenseValue, setEditExpenseValue] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [newItemText, setNewItemText] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [shopEditModal, setShopEditModal] = useState({ visible: false, item: null });
  const [shopEditText, setShopEditText] = useState("");
  const [shopEditQty, setShopEditQty] = useState("");
  const shopInputRef = useRef(null);

  function toggleShopping(open) {
    setShowShopping(open);
    if (open) setTimeout(() => shopInputRef.current?.focus(), 300);
  }

  const todayTotal = todayExpenses.reduce((s, e) => s + e.value, 0);
  const weekTotal = weekExpenses.reduce((s, e) => s + e.value, 0);

  const todayRaw = (todayTotal / limits.diario) * 100;
  const weekRaw = (weekTotal / limits.semanal) * 100;
  const todayPercent = Math.min(todayRaw, 100);
  const weekPercent = Math.min(weekRaw, 100);
  const isOverLimit = todayRaw >= 100;
  const isWeekOverLimit = weekRaw >= 100;

  useEffect(() => {
    const unsubToday = subscribeTodayExpenses(setTodayExpenses);
    const unsubYesterday = subscribeYesterdayExpenses(setYesterdayExpenses);
    const unsubWeek = subscribeWeekExpenses(setWeekExpenses);
    const unsubLimits = subscribeLimits(setLimits);
    const unsubShop = subscribeActiveItems(setShoppingItems);
    const unsubLastWeek = subscribeDateRangeExpressions(daysAgoStr(7), daysAgoStr(2), setLastWeekExpenses);
    const lwr = getLastWeekRange();
    const unsubPrevWeek = subscribeDateRangeExpressions(lwr.start, lwr.end, setPrevWeekExpenses);
    const unsubLastMonth = subscribeDateRangeExpressions(daysAgoStr(30), daysAgoStr(8), setLastMonthExpenses);
    return () => {
      unsubToday();
      unsubYesterday();
      unsubWeek();
      unsubLimits();
      unsubShop();
      unsubLastWeek();
      unsubPrevWeek();
      unsubLastMonth();
    };
  }, []);

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

  async function handleAddShopping() {
    const text = newItemText.trim();
    if (!text) return;
    try {
      await addItem(text, newItemQty.trim() || "1", user);
      setNewItemText("");
      setNewItemQty("");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível adicionar");
    }
  }

  async function handleToggleShop(item) {
    try {
      await toggleItemCompleted(item.id, !item.completed, user);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar");
    }
  }

  async function handleDeleteShop(item) {
    Alert.alert("Excluir", `Excluir "${item.item}" da lista?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteItem(item.id),
      },
    ]);
  }

  function openShopEdit(item) {
    setShopEditText(item.item);
    setShopEditQty(item.quantidade || "");
    setShopEditModal({ visible: true, item });
  }

  async function handleSaveShopEdit() {
    const name = shopEditText.trim();
    if (!name) return;
    try {
      await updateItem(shopEditModal.item.id, { item: name, quantidade: shopEditQty.trim() || "1" });
      setShopEditModal({ visible: false, item: null });
    } catch (e) {
      Alert.alert("Erro", "Não foi possível editar");
    }
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

  function renderExpenseItem(item) {
    const isLucas = item.addedBy === "Lucas";
    const color = isLucas ? "#4A90D9" : "#E91E63";
    return (
      <LongPressItem
        key={item.id}
        style={styles.expenseItem}
        onLongPress={() => openExpenseEdit(item)}
        color={color}
      >
        <View style={[styles.dot, { backgroundColor: color }]} />
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
            { color },
          ]}
        >
          -R$ {item.value.toFixed(2)}
        </Text>
      </LongPressItem>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user}!</Text>
          <View style={styles.headerRight}>
            {shoppingItems.length > 0 && (
              <TouchableOpacity
                style={styles.headerBadgeWrap}
                onPress={() => navigation.navigate("Lista")}
              >
                <Ionicons name="cart-outline" size={22} color="#E91E63" />
                <Text style={[styles.headerBadge, { color: theme.primary, backgroundColor: theme.primaryLight }]}>{shoppingItems.length}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.summaryCard, isOverLimit && styles.cardOverLimit]}
          onPress={() => navigation.navigate("Histórico")}
          activeOpacity={0.8}
        >
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>Hoje</Text>
              <Text style={[styles.summaryValue, isOverLimit && styles.textOverLimit]}>
                R$ {todayTotal.toFixed(2)}
                <Text style={styles.limitText}> / R$ {limits.diario.toFixed(2)}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtnCard}
              onPress={() => setShowAddExpense(true)}
            >
              <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${todayPercent}%`, backgroundColor: getBarColor(todayRaw) },
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
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Gastos de Hoje</Text>
        {todayExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="happy-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum gasto hoje</Text>
            <Text style={styles.emptySubtext}>Bora manter assim!</Text>
          </View>
        ) : (
          todayExpenses.map((item) => renderExpenseItem(item))
        )}

        <View style={styles.historicalRow}>
          <TouchableOpacity
            style={[styles.historicalCard, showYesterday && { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
            onPress={() => setShowYesterday(!showYesterday)}
          >
            <Text style={styles.historicalCardTitle}>Ontem</Text>
            <Text style={[styles.historicalCardValue, showYesterday && { color: theme.primary }]}>
              R$ {yesterdayExpenses.reduce((s, e) => s + e.value, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historicalCard, showLastWeek && { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
            onPress={() => setShowLastWeek(!showLastWeek)}
          >
            <Text style={styles.historicalCardTitle}>7 dias</Text>
            <Text style={[styles.historicalCardValue, showLastWeek && { color: theme.primary }]}>
              R$ {lastWeekExpenses.reduce((s, e) => s + e.value, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historicalCard, showPrevWeek && { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
            onPress={() => setShowPrevWeek(!showPrevWeek)}
          >
            <Text style={styles.historicalCardTitle}>Semana</Text>
            <Text style={[styles.historicalCardValue, showPrevWeek && { color: theme.primary }]}>
              R$ {prevWeekExpenses.reduce((s, e) => s + e.value, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historicalCard, showLastMonth && { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
            onPress={() => setShowLastMonth(!showLastMonth)}
          >
            <Text style={styles.historicalCardTitle}>Mês</Text>
            <Text style={[styles.historicalCardValue, showLastMonth && { color: theme.primary }]}>
              R$ {lastMonthExpenses.reduce((s, e) => s + e.value, 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>

        {showYesterday && (
          <View style={styles.historicalWrap}>
            {yesterdayExpenses.length === 0 ? (
              <Text style={styles.emptyDayText}>Nenhum gasto ontem</Text>
            ) : (
              yesterdayExpenses.map((item) => renderExpenseItem(item))
            )}
          </View>
        )}

        {showLastWeek && (
          <View style={styles.historicalWrap}>
            {lastWeekExpenses.length === 0 ? (
              <Text style={styles.emptyDayText}>Nenhum gasto</Text>
            ) : (
              groupByDate(lastWeekExpenses).map(({ date, items }) => (
                <View key={date}>
                  <Text style={styles.dateGroupLabel}>{date}</Text>
                  {items.map((item) => renderExpenseItem(item))}
                </View>
              ))
            )}
          </View>
        )}

        {showPrevWeek && (
          <View style={styles.historicalWrap}>
            {prevWeekExpenses.length === 0 ? (
              <Text style={styles.emptyDayText}>Nenhum gasto</Text>
            ) : (
              groupByDate(prevWeekExpenses).map(({ date, items }) => (
                <View key={date}>
                  <Text style={styles.dateGroupLabel}>{date}</Text>
                  {items.map((item) => renderExpenseItem(item))}
                </View>
              ))
            )}
          </View>
        )}

        {showLastMonth && (
          <View style={styles.historicalWrap}>
            {lastMonthExpenses.length === 0 ? (
              <Text style={styles.emptyDayText}>Nenhum gasto</Text>
            ) : (
              groupByDate(lastMonthExpenses).map(({ date, items }) => (
                <View key={date}>
                  <Text style={styles.dateGroupLabel}>{date}</Text>
                  {items.map((item) => renderExpenseItem(item))}
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.summaryCard, styles.weekCard, isWeekOverLimit && styles.cardOverLimit]}
          onPress={() => navigation.navigate("Histórico")}
          activeOpacity={0.8}
        >
          <Text style={[styles.summaryTitle, isWeekOverLimit && styles.textOverLimit]}>Semana ({getWeekLabel()})</Text>
          <Text style={[styles.summaryValue, isWeekOverLimit && styles.textOverLimit]}>
            R$ {weekTotal.toFixed(2)}
            <Text style={styles.limitText}> / R$ {limits.semanal.toFixed(2)}</Text>
          </Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${weekPercent}%`, backgroundColor: getBarColor(weekRaw) },
              ]}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.shoppingHeader}>
          <Text style={styles.shoppingHeaderTitle}>Lista de Compras</Text>
          <View style={styles.shoppingHeaderRight}>
            {shoppingItems.length > 0 && (
              <Text style={[styles.shoppingCountBig, { color: theme.primary, backgroundColor: theme.primaryLight }]}>{shoppingItems.length}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.shoppingToggle}
          onPress={() => toggleShopping(!showShopping)}
        >
          <View style={styles.shoppingToggleLeft}>
            <Ionicons
              name={showShopping ? "chevron-down" : "chevron-forward"}
              size={20}
              color="#888"
            />
            <Text style={styles.shoppingToggleText}>
              Adicionar Item
            </Text>
          </View>
          <View style={styles.shoppingToggleRight}>
            <TouchableOpacity
              style={styles.shopAddBtnBig}
              onPress={() => toggleShopping(true)}
            >
              <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
          {showShopping && (
          <View style={styles.collapsibleContent}>
            <View style={styles.addShopRow}>
              <TextInput
                ref={shopInputRef}
                style={styles.shopInput}
                placeholder="Item..."
                value={newItemText}
                onChangeText={setNewItemText}
              />
              <TextInput
                style={styles.shopQtyInput}
                placeholder="Qtd"
                value={newItemQty}
                onChangeText={setNewItemQty}
              />
              <TouchableOpacity style={styles.shopAddBtn} onPress={handleAddShopping}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {shoppingItems.length === 0 ? (
              <Text style={styles.emptyDayText}>Nada pra comprar</Text>
            ) : (
              [...shoppingItems].reverse().map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.shopItem,
                    !item.completed && styles.shopItemPending,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.shopCheckbox,
                      { borderColor: item.addedBy === "Lucas" ? "#4A90D9" : "#E91E63" },
                      item.completed && styles.shopCheckboxDone,
                    ]}
                    onPress={() => handleToggleShop(item)}
                  >
                    {item.completed && (
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shopItemTextWrap}
                    onPress={() => openShopEdit(item)}
                    onLongPress={() => handleDeleteShop(item)}
                    delayLongPress={800}
                  >
                    <Text
                      style={[
                        styles.shopItemName,
                        item.completed && styles.shopItemDone,
                      ]}
                    >
                      {item.item}
                    </Text>
                    <Text style={styles.shopItemBy}>
                      {item.addedBy}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openShopQtyEdit(item)}>
                    <View
                      style={[
                        styles.shopQtyBadge,
                        { backgroundColor: item.addedBy === "Lucas" ? "#4A90D9" : "#F48FB1" },
                      ]}
                    >
                      <Text style={styles.shopQtyBadgeText}>{item.quantidade || "1"}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.addExpenseWrap}>
        <TouchableOpacity
          style={styles.addExpenseBar}
          onPress={() => setShowAddExpense(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          <Text style={styles.addExpenseBarText}>Nova Despesa</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

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
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
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
                <ScrollView style={styles.datePickerList}>
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
                </ScrollView>
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

      <Modal
        visible={shopEditModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setShopEditModal({ visible: false, item: null })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShopEditModal({ visible: false, item: null })}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Editar Item</Text>
            <TextInput
              style={styles.shopEditInput}
              placeholder="Nome do item"
              value={shopEditText}
              onChangeText={setShopEditText}
            />
            <TextInput
              style={styles.shopEditInput}
              placeholder="Quantidade"
              value={shopEditQty}
              onChangeText={setShopEditQty}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.shopEditSaveBtn} onPress={handleSaveShopEdit}>
              <Text style={styles.shopEditSaveText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShopEditModal({ visible: false, item: null })}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddExpense}
        animationType="slide"
        onRequestClose={() => setShowAddExpense(false)}
      >
        <AddExpenseScreen onClose={() => setShowAddExpense(false)} />
      </Modal>

      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#333" },
  headerRight: { flexDirection: "row", gap: 12, alignItems: "center" },
  headerBtn: { padding: 4 },
  headerBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBadge: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
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
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLeft: { flex: 1 },
  addBtnCard: {
    backgroundColor: "#4CAF50",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  weekCard: { marginBottom: 8 },
  cardOverLimit: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
  textOverLimit: { color: "#D32F2F" },
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
  collapsibleContent: { paddingHorizontal: 20, marginBottom: 8 },
  shoppingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginTop: 12,
    marginBottom: 4,
  },
  shoppingHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  shoppingHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  shoppingCountBig: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shoppingToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 8,
  },
  shoppingToggleLeft: { flexDirection: "row", alignItems: "center" },
  shoppingToggleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  shoppingToggleText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
    marginLeft: 8,
  },
  shopAddBtnBig: {
    backgroundColor: "#4CAF50",
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyDayText: {
    fontSize: 13,
    color: "#ccc",
    fontStyle: "italic",
    paddingLeft: 4,
    paddingVertical: 4,
  },
  addShopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  shopInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  shopQtyInput: {
    width: 55,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    textAlign: "center",
  },
  shopAddBtn: {
    backgroundColor: "#4CAF50",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  shopItemPending: {
    backgroundColor: "#FFF9C4",
    borderWidth: 1,
    borderColor: "#FFF176",
  },
  shopCheckbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shopCheckboxDone: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  shopItemTextWrap: { flex: 1 },
  shopItemName: { fontSize: 17, fontWeight: "600", color: "#333" },
  shopItemDone: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  shopItemBy: { fontSize: 11, color: "#bbb", marginTop: 2 },
  shopQtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F48FB1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  shopQtyBadgeText: { fontSize: 13, fontWeight: "bold", color: "#FFF" },
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
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  expenseLeft: { flex: 1 },
  expenseName: { fontSize: 16, fontWeight: "600", color: "#333" },
  expenseBy: { fontSize: 12, color: "#999", marginTop: 2 },
  expenseValue: { fontSize: 18, fontWeight: "bold" },
  emptyState: { justifyContent: "center", alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 8 },
  emptySubtext: { fontSize: 14, color: "#ccc" },
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
  shopEditInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  shopEditSaveBtn: {
    backgroundColor: "#4A90D9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  shopEditSaveText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
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
  addExpenseWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  addExpenseBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    width: "50%",
    padding: 18,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addExpenseBarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  historicalWrap: { paddingHorizontal: 20, marginBottom: 8 },
  historicalRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  historicalCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  historicalCardTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    marginBottom: 2,
  },
  historicalCardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  dateGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginTop: 8,
    marginBottom: 4,
  },
});
