import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { tw, colors } = useTheme();
  const { dbUser } = useAppAuth();
  
  const isAdmin = dbUser?.role === "admin";
  const isOperator = dbUser?.role === "operator";
  const isStaff = isAdmin || isOperator;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      {/* User Tabs */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          href: isStaff ? null : "/(tabs)/home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          href: "/(tabs)/orders",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          href: isOperator ? null : "/(tabs)/analytics",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={20} color={color} />
          ),
        }}
      />

      {/* Admin Tabs */}
      <Tabs.Screen
        name="admin-console"
        options={{
          title: "Console",
          href: isAdmin ? "/(tabs)/admin-console" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="sliders" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="printer-management"
        options={{
          title: "Printers",
          href: isAdmin ? "/(tabs)/printer-management" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="printer" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="operator-management"
        options={{
          title: "Operators",
          href: isAdmin ? "/(tabs)/operator-management" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={20} color={color} />
          ),
        }}
      />

      {/* Shared Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
