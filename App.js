import { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import WeekScreen from "./src/screens/WeekScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import {
  subscribeTodayExpenses,
  subscribeWeekExpenses,
  getWeekLabel,
} from "./src/services/expenseService";
import {
  requestPermissions,
  scheduleNightlyReminder,
  sendLocalNotification,
} from "./src/services/notifications";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Hoje") iconName = focused ? "today" : "today-outline";
          else if (route.name === "Semana")
            iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Ajustes")
            iconName = focused ? "settings" : "settings-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Hoje">
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Semana" component={WeekScreen} />
      <Tab.Screen name="Ajustes">
        {() => <SettingsScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    requestPermissions();
    scheduleNightlyReminder();
  }, []);

  useEffect(() => {
    if (!user) return;

    let lastTodayTotal = 0;
    let lastWeekTotal = 0;

    const unsubToday = subscribeTodayExpenses((expenses) => {
      const total = expenses.reduce((s, e) => s + e.value, 0);
      const lastExpense = expenses[expenses.length - 1];

      if (lastExpense && lastExpense.addedBy !== user) {
        sendLocalNotification(
          `${lastExpense.addedBy} adicionou um gasto!`,
          `${lastExpense.item}: R$ ${lastExpense.value.toFixed(2)} | Hoje: R$ ${total.toFixed(2)}`
        );
      }

      if (lastExpense && total !== lastTodayTotal) {
        lastTodayTotal = total;
      }
    });

    const unsubWeek = subscribeWeekExpenses((expenses) => {
      const total = expenses.reduce((s, e) => s + e.value, 0);
      if (total !== lastWeekTotal) {
        lastWeekTotal = total;
      }
    });

    return () => {
      unsubToday();
      unsubWeek();
    };
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
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {() => <HomeTabs user={user} onLogout={() => setUser(null)} />}
        </Stack.Screen>
        <Stack.Screen name="AddExpense">
          {(props) => <AddExpenseScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {(props) => <SettingsScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
