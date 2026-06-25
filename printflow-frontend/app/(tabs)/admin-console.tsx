import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";

export default function AdminConsole() {
  const { tw, colors } = useTheme();
  const { dbUser } = useAppAuth();
  const router = useRouter();

  if (dbUser?.role !== "admin") {
    return (
      <View style={tw("flex-1 bg-background")}>
        <AppHeader title="Console" />
        <View style={tw("flex-1 items-center justify-center px-8")}>
          <Feather name="lock" size={28} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary text-center mt-3")}>
            Admin access is required for system management.
          </Text>
        </View>
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="Admin Console" />
      
      <ScrollView contentContainerStyle={tw("p-5 pb-10")}>
        {/* Welcome Section */}
        <View style={tw("mb-6")}>
          <Text style={tw("text-sm font-inter text-secondary")}>
            {getGreeting()}
          </Text>
          <Text style={tw("text-2xl font-space-bold text-primary mt-1")}>
            {dbUser?.name || "Administrator"}
          </Text>
          <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
            System Admin
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={tw("flex-row gap-4 mb-6 w-full justify-between")}>
          <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
            <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
              Total Printers
            </Text>
            <Text style={tw("text-2xl font-space-bold text-primary mt-1")}>8</Text>
          </View>

          <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
            <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
              Active Operators
            </Text>
            <Text style={tw("text-2xl font-space-bold text-emerald-500 mt-1")}>4</Text>
          </View>

          <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
            <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
              System Status
            </Text>
            <Text style={tw("text-lg font-space-bold text-emerald-500 mt-2")}>Online</Text>
          </View>
        </View>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Management Features
        </Text>
        
        <View style={tw("gap-4 mb-6")}>
          <Pressable onPress={() => router.push("/(tabs)/printer-management")}>
            <AppCard style={tw("flex-row items-center p-4")}>
              <View style={tw("h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/30 items-center justify-center mr-4")}>
                <Feather name="printer" size={24} color={colors.info} />
              </View>
              <View style={tw("flex-1")}>
                <Text style={tw("text-base font-space-bold text-primary font-bold")}>Printer Management</Text>
                <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>Add, update, or remove printers.</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </AppCard>
          </Pressable>

          <Pressable onPress={() => router.push("/(tabs)/operator-management")}>
            <AppCard style={tw("flex-row items-center p-4")}>
              <View style={tw("h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-950/30 items-center justify-center mr-4")}>
                <Feather name="users" size={24} color="#8B5CF6" />
              </View>
              <View style={tw("flex-1")}>
                <Text style={tw("text-base font-space-bold text-primary font-bold")}>Operator Management</Text>
                <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>Assign and manage operator roles.</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </AppCard>
          </Pressable>
        </View>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Recent System Activity
        </Text>
        
        <AppCard style={tw("p-4")}>
          <View style={tw("flex-row items-start mb-4")}>
            <View style={tw("h-2 w-2 rounded-full bg-emerald-500 mt-1.5 mr-3")} />
            <View>
              <Text style={tw("text-sm font-inter-semibold text-primary")}>Printer Added: CSE Lab</Text>
              <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>2 hours ago</Text>
            </View>
          </View>
          <View style={tw("flex-row items-start mb-4")}>
            <View style={tw("h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-3")} />
            <View>
              <Text style={tw("text-sm font-inter-semibold text-primary")}>Operator Assigned: John Doe</Text>
              <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>5 hours ago</Text>
            </View>
          </View>
          <View style={tw("flex-row items-start")}>
            <View style={tw("h-2 w-2 rounded-full bg-amber-500 mt-1.5 mr-3")} />
            <View>
              <Text style={tw("text-sm font-inter-semibold text-primary")}>System Maintenance</Text>
              <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>1 day ago</Text>
            </View>
          </View>
        </AppCard>

      </ScrollView>
    </View>
  );
}
