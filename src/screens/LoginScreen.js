import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  function handleSelect(name) {
    setLoading(true);
    onLogin(name);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heart}>
        <Text style={styles.heartText}>💕</Text>
      </View>
      <Text style={styles.title}>Mimi & Lulu</Text>
      <Text style={styles.subtitle}>Diário de Gastos</Text>
      <Text style={styles.prompt}>Quem está usando?</Text>

      <TouchableOpacity
        style={[styles.button, styles.buttonLucas]}
        onPress={() => handleSelect("Lucas")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Lucas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonMilena]}
        onPress={() => handleSelect("Milena")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Milena</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F5",
    padding: 20,
  },
  heart: { marginBottom: 10 },
  heartText: { fontSize: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#E91E63" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 40 },
  prompt: { fontSize: 18, color: "#333", marginBottom: 20 },
  button: {
    width: "80%",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonLucas: { backgroundColor: "#4A90D9" },
  buttonMilena: { backgroundColor: "#E91E63" },
  buttonText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
});
