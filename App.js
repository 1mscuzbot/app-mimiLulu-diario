import { useState, createContext, useContext, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createMaterialTopTabNavigator, MaterialTopTabBar } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import WeekScreen from "./src/screens/WeekScreen";
import ShoppingScreen from "./src/screens/ShoppingScreen";
import {
  subscribeTodayExpenses,
  subscribeWeekExpenses,
} from "./src/services/expenseService";
import {
  requestPermissions,
  scheduleNightlyReminder,
  sendLocalNotification,
} from "./src/services/notifications";

export const UserContext = createContext(null);

const Tab = createMaterialTopTabNavigator();

function HomeTabs({ user, onLogout }) {
  const isLucas = user === "Lucas";
  const tabColor = isLucas ? "#4A90D9" : "#E91E63";
  const tabBg = isLucas ? "#E3F2FD" : "#FFF0F5";

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <View>
          <MaterialTopTabBar {...props} />
        </View>
      )}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Hoje")
            iconName = focused ? "today" : "today-outline";
          else if (route.name === "Semana")
            iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Compras")
            iconName = focused ? "cart" : "cart-outline";
          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: tabColor,
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: tabBg,
          elevation: 2,
          shadowOpacity: 0.1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIndicatorStyle: {
          backgroundColor: tabColor,
          height: 3,
          borderRadius: 2,
        },
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        swipeEnabled: true,
        animationEnabled: true,
      })}
    >
      <Tab.Screen name="Hoje">
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Semana" component={WeekScreen} />
      <Tab.Screen name="Compras" component={ShoppingScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    requestPermissions();
    scheduleNightlyReminder();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubToday = subscribeTodayExpenses((expenses) => {
      const lastExpense = expenses[expenses.length - 1];
      const total = expenses.reduce((s, e) => s + e.value, 0);

      if (lastExpense && lastExpense.addedBy !== user) {
        sendLocalNotification(
          `${lastExpense.addedBy} adicionou um gasto!`,
          `${lastExpense.item}: R$ ${lastExpense.value.toFixed(2)} | Hoje: R$ ${total.toFixed(2)}`
        );
      }
    });

    return () => unsubToday();
  }, [user]);

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen onLogin={setUser} />
      </>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserContext.Provider value={user}>
        <NavigationContainer>
          <StatusBar style="dark" />
          <HomeTabs user={user} onLogout={() => setUser(null)} />
        </NavigationContainer>
      </UserContext.Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
