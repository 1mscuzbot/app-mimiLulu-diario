import { useState, createContext, useContext, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import WeekScreen from "./src/screens/WeekScreen";
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

const Tab = createBottomTabNavigator();

function HomeTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Hoje")
            iconName = focused ? "today" : "today-outline";
          else if (route.name === "Semana")
            iconName = focused ? "calendar" : "calendar-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Hoje">
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Semana" component={WeekScreen} />
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
    <UserContext.Provider value={user}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <HomeTabs user={user} onLogout={() => setUser(null)} />
      </NavigationContainer>
    </UserContext.Provider>
  );
}
