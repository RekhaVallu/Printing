import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { changeUserRole, getUsers } from "../../services/userService";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "operator" | "admin";
  assignedPrinters?: Array<{
    _id: string;
    name: string;
    location?: string;
  }>;
};

export default function OperatorManagement() {
  const { tw, colors } = useTheme();
  const { dbUser } = useAppAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const operators = useMemo(() => users.filter((user) => user.role === "operator"), [users]);
  const candidates = useMemo(() => users.filter((user) => user.role !== "admin"), [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response?.data || []);
    } catch (e: any) {
      Alert.alert("Users unavailable", e.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser?.role === "admin") loadUsers();
  }, [dbUser?.role]);

  const setRole = async (user: UserItem, role: UserItem["role"]) => {
    setLoading(true);
    try {
      await changeUserRole(user._id, role);
      await loadUsers();
    } catch (e: any) {
      Alert.alert("Role not updated", e.response?.data?.message || "Please try again.");
      setLoading(false);
    }
  };

  if (dbUser?.role !== "admin") {
    return (
      <View style={tw("flex-1 bg-background")}>
        <AppHeader title="Operators" />
        <View style={tw("flex-1 items-center justify-center px-8")}>
          <Feather name="lock" size={28} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary text-center mt-3")}>
            Admin access is required to manage operators.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[tw("flex-1"), { backgroundColor: colors.background }]}>
      <AppHeader title="Operators" />
      <ScrollView contentContainerStyle={tw("p-5 pb-14")} showsVerticalScrollIndicator={false}>
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Active Operators
        </Text>
        <View style={tw("gap-3 mb-6")}>
          {operators.length === 0 ? (
            <AppCard>
              <Text style={tw("text-sm font-inter text-secondary")}>No operators assigned yet.</Text>
            </AppCard>
          ) : (
            operators.map((user) => (
              <UserRoleCard
                key={user._id}
                user={user}
                actionTitle="Remove Operator Access"
                actionVariant="danger"
                loading={loading}
                showAssignedPrinters
                onPress={() => setRole(user, "student")}
              />
            ))
          )}
        </View>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Eligible Users
        </Text>
        <View style={tw("gap-3")}>
          {candidates.map((user) => (
            <UserRoleCard
              key={user._id}
              user={user}
              actionTitle={user.role === "operator" ? "Operator" : "Make Operator"}
              actionVariant={user.role === "operator" ? "outline" : "primary"}
              loading={loading}
              disabled={user.role === "operator"}
              onPress={() => setRole(user, "operator")}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function UserRoleCard({
  user,
  actionTitle,
  actionVariant,
  disabled,
  loading,
  showAssignedPrinters,
  onPress,
}: {
  user: UserItem;
  actionTitle: string;
  actionVariant: "primary" | "danger" | "outline";
  disabled?: boolean;
  loading: boolean;
  showAssignedPrinters?: boolean;
  onPress: () => void;
}) {
  const { tw } = useTheme();
  const assignedPrinters = user.assignedPrinters || [];

  return (
    <AppCard style={tw("p-4")}>
      <View style={tw("gap-3")}>
        <View>
          <Text style={tw("text-sm font-inter-bold text-primary font-bold")}>{user.name}</Text>
          <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>{user.email}</Text>
          <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider mt-2")}>
            {user.role}
          </Text>
        </View>
        {showAssignedPrinters ? (
          <View style={tw("rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border p-3")}>
            <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider mb-2")}>
              Assigned Printers
            </Text>
            {assignedPrinters.length > 0 ? (
              assignedPrinters.map((printer) => (
                <Text key={printer._id} style={tw("text-xs font-inter text-primary mb-1")}>
                  {printer.name}{printer.location ? ` - ${printer.location}` : ""}
                </Text>
              ))
            ) : (
              <Text style={tw("text-xs font-inter text-secondary")}>No printers assigned.</Text>
            )}
          </View>
        ) : null}
        <AppButton
          title={actionTitle}
          onPress={onPress}
          variant={actionVariant}
          disabled={disabled}
          loading={loading && !disabled}
          style={tw("h-12")}
        />
      </View>
    </AppCard>
  );
}
