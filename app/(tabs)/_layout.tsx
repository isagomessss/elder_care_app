import { Tabs } from "expo-router";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { useUser } from "@/context/UserContext";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const { user } = useUser(); // 👈 pega o usuário logado

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondaryDark,
        tabBarInactiveTintColor: Colors.primaryDark,
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: Colors.secondary,
          borderTopWidth: 1,
          height: 60,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitas"
        options={{
          title: "Visitas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
