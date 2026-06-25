import { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../App";
import {
  addItem,
  toggleItemCompleted,
  updateItem,
  deleteItem,
  subscribeActiveItems,
  subscribeCompletedItems,
} from "../services/shoppingService";
import { getTheme } from "../utils/theme";

export default function ShoppingScreen() {
  const user = useContext(UserContext);
  const theme = getTheme(user);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [newItemText, setNewItemText] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, item: null });
  const [editText, setEditText] = useState("");
  const [editQty, setEditQty] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubActive = subscribeActiveItems(setShoppingItems);
    const unsubCompleted = subscribeCompletedItems(setCompletedItems);
    return () => {
      unsubActive();
      unsubCompleted();
    };
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  async function handleAdd() {
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

  async function handleToggle(item) {
    try {
      await toggleItemCompleted(item.id, !item.completed, user);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar");
    }
  }

  function openEdit(item) {
    setEditText(item.item);
    setEditQty(item.quantidade || "");
    setEditModal({ visible: true, item });
  }

  async function handleSaveEdit() {
    const name = editText.trim();
    if (!name) return;
    try {
      await updateItem(editModal.item.id, { item: name, quantidade: editQty.trim() || "1" });
      setEditModal({ visible: false, item: null });
    } catch (e) {
      Alert.alert("Erro", "Não foi possível editar");
    }
  }

  async function handleDelete(item) {
    Alert.alert("Excluir", `Excluir "${item.item}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteItem(item.id) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lista de Compras</Text>
        <Text style={styles.headerSub}>
          {shoppingItems.length} item(ns) pendente(s)
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {[...shoppingItems].reverse().map((item) => (
          <View key={item.id} style={styles.item}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: item.addedBy === "Lucas" ? "#4A90D9" : "#E91E63" },
                      item.completed && styles.checkboxDone,
                    ]}
                    onPress={() => handleToggle(item)}
                  >
                    {item.completed && <Ionicons name="checkmark" size={18} color="#FFF" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.itemTextWrap}
                    onPress={() => openEdit(item)}
                    onLongPress={() => handleDelete(item)}
                    delayLongPress={800}
                  >
                    <Text style={[styles.itemName, item.completed && styles.itemDone]}>
                      {item.item}
                    </Text>
                    <Text style={styles.itemBy}>
                      {item.addedBy}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setEditText(item.item);
                    setEditQty(item.quantidade || "");
                    setEditModal({ visible: true, item });
                  }}>
                    <View
                      style={[
                        styles.qtyBadge,
                        { backgroundColor: item.addedBy === "Lucas" ? "#4A90D9" : "#F48FB1" },
                      ]}
                    >
                      <Text style={styles.qtyBadgeText}>{item.quantidade || "1"}</Text>
                    </View>
                  </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.toggleHistory}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Ionicons
            name={showHistory ? "chevron-down" : "chevron-forward"}
            size={18}
            color="#999"
          />
          <Text style={styles.toggleHistoryText}>
            Concluídos ({completedItems.length})
          </Text>
        </TouchableOpacity>

        {showHistory && (
          completedItems.length === 0 ? (
            <Text style={styles.emptyHistory}>Nenhum item concluído</Text>
          ) : (
            [...completedItems].reverse().map((item) => (
              <View key={item.id} style={styles.item}>
                  <TouchableOpacity
                   style={[styles.checkbox, styles.checkboxDone]}
                   onPress={() => handleToggle(item)}
                 >
                   <Ionicons name="checkmark" size={18} color="#FFF" />
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.itemTextWrap}
                   onLongPress={() => handleDelete(item)}
                   delayLongPress={800}
                 >
                   <Text style={[styles.itemName, styles.itemDone]}>{item.item}</Text>
                   <Text style={styles.itemBy}>
                     {item.addedBy}
                   </Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => handleDelete(item)}>
                   <View style={[styles.qtyBadge, { backgroundColor: "#999" }]}>
                     <Ionicons name="trash-outline" size={14} color="#FFF" />
                   </View>
                 </TouchableOpacity>
              </View>
            ))
          )
        )}
      </ScrollView>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Item..."
          value={newItemText}
          onChangeText={setNewItemText}
        />
        <TextInput
          style={styles.qtyInput}
          placeholder="Qtd"
          value={newItemQty}
          onChangeText={setNewItemQty}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={editModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal({ visible: false, item: null })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModal({ visible: false, item: null })}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Editar Item</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nome do item"
              value={editText}
              onChangeText={setEditText}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Quantidade"
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setEditModal({ visible: false, item: null })}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  headerSub: { fontSize: 13, color: "#999", marginTop: 2 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  qtyInput: {
    width: 65,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#4CAF50",
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  item: {
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
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxDone: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  itemTextWrap: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: "600", color: "#333" },
  itemDone: { textDecorationLine: "line-through", color: "#999" },
  itemBy: { fontSize: 12, color: "#bbb", marginTop: 2 },
  qtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F48FB1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  qtyBadgeText: { fontSize: 13, fontWeight: "bold", color: "#FFF" },
  toggleHistory: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  toggleHistoryText: { fontSize: 14, color: "#999", fontWeight: "600", marginLeft: 6 },
  emptyHistory: {
    fontSize: 13,
    color: "#ccc",
    fontStyle: "italic",
    paddingLeft: 4,
    paddingVertical: 4,
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
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 16 },
  modalInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  modalSaveBtn: {
    backgroundColor: "#4A90D9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  modalSaveText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  modalCancel: { marginTop: 10 },
  modalCancelText: { fontSize: 14, color: "#999" },
});
