import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { getUsers, changeUserRole } from "../../services/userService";
import { createPrinter, deletePrinter, getPrinters, updatePrinter } from "../../services/printerService";
import { broadcastNotification } from "../../services/notificationService";
import { trackEvent } from "../../utils/posthog";

type UserRole = "student" | "faculty" | "operator" | "admin";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
};

type PrinterItem = {
  _id: string;
  name: string;
  location: string;
  printerType: "bw" | "color";
  status: "online" | "offline" | "maintenance";
  pagesPerMinute: number;
  operatorId?: string | UserItem;
};

export default function AdminPrinters() {
  const { dbUser } = useAppAuth();
  const { tw, colors } = useTheme();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [printers, setPrinters] = useState<PrinterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [printerLocation, setPrinterLocation] = useState("");
  const [ppm, setPpm] = useState("15");
  const [printerType, setPrinterType] = useState<"bw" | "color">("bw");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const operators = useMemo(() => users.filter((user) => user.role === "operator"), [users]);
  const candidates = useMemo(
    () => users.filter((user) => user.role !== "admin"),
    [users]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, printersResponse] = await Promise.all([getUsers(), getPrinters()]);
      setUsers(usersResponse?.data || []);
      setPrinters(printersResponse?.data || []);
    } catch (e: any) {
      Alert.alert("Admin tools unavailable", e.response?.data?.message || "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    trackEvent("screen_viewed", { screenName: "admin_printers", role: dbUser?.role });
  }, []);

  const promoteOperator = async (user: UserItem) => {
    await changeUserRole(user._id, "operator");
    trackEvent("operator_added", { targetUserId: user._id });
    await loadData();
  };

  const removeOperator = async (user: UserItem) => {
    await changeUserRole(user._id, "student");
    trackEvent("operator_removed", { targetUserId: user._id });
    await loadData();
  };

  const submitPrinter = async () => {
    if (!printerName.trim() || !printerLocation.trim()) {
      Alert.alert("Missing printer details", "Printer name and location are required.");
      return;
    }

    const pagesPerMinute = Number(ppm);
    if (!pagesPerMinute || pagesPerMinute <= 0) {
      Alert.alert("Invalid speed", "Pages per minute must be greater than zero.");
      return;
    }

    await createPrinter({
      name: printerName.trim(),
      location: printerLocation.trim(),
      printerType,
      pagesPerMinute,
      operatorId: selectedOperatorId || undefined,
    });

    setPrinterName("");
    setPrinterLocation("");
    setPpm("15");
    setSelectedOperatorId("");
    trackEvent("printer_added", { printerType, assignedOperator: !!selectedOperatorId });
    await loadData();
  };

  const assignOperator = async (printer: PrinterItem, operatorId: string) => {
    await updatePrinter(printer._id, { operatorId });
    trackEvent("printer_operator_assigned", { printerId: printer._id, operatorId: operatorId || null });
    await loadData();
  };

  const removePrinter = async (printer: PrinterItem) => {
    await deletePrinter(printer._id);
    trackEvent("printer_removed", { printerId: printer._id });
    await loadData();
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      Alert.alert("Missing notification", "Add both title and message before broadcasting.");
      return;
    }

    await broadcastNotification(broadcastTitle.trim(), broadcastMessage.trim(), {
      category: "printer_issue",
    });
    trackEvent("admin_global_notification_sent");
    setBroadcastTitle("");
    setBroadcastMessage("");
    Alert.alert("Notification sent", "All users will receive this printer issue update.");
  };

  if (dbUser?.role !== "admin") {
    return (
      <View style={tw("flex-1 bg-background")}>
        <AppHeader title="Admin Console" showBack />
        <View style={tw("flex-1 items-center justify-center px-8")}>
          <Feather name="lock" size={28} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary text-center mt-3")}>
            Admin access is required for printer and operator management.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="Admin Console" showBack />

      <ScrollView contentContainerStyle={tw("p-5 pb-14")} showsVerticalScrollIndicator={false}>
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Operators
        </Text>
        <View style={tw("gap-3 mb-6")}>
          {candidates.map((user) => (
            <AppCard key={user._id} style={tw("p-4")}>
              <View style={tw("gap-3")}>
                <View>
                  <Text style={tw("text-sm font-inter-bold text-primary font-bold")}>{user.name}</Text>
                  <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>{user.email}</Text>
                  <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider mt-2")}>
                    {user.role}
                  </Text>
                </View>
                {user.role === "operator" ? (
                  <AppButton title="Remove Operator Access" variant="danger" onPress={() => removeOperator(user)} style={tw("w-full h-12")} />
                ) : (
                  <AppButton title="Make Operator" onPress={() => promoteOperator(user)} style={tw("w-full h-12")} />
                )}
              </View>
            </AppCard>
          ))}
        </View>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Add Printer
        </Text>
        <AppCard style={tw("p-5 mb-6")}>
          <AppInput label="Printer Name" value={printerName} onChangeText={setPrinterName} placeholder="Library Printer A" />
          <AppInput label="Location" value={printerLocation} onChangeText={setPrinterLocation} placeholder="Library Floor 1" />
          <AppInput label="Pages Per Minute" value={ppm} onChangeText={setPpm} keyboardType="numeric" placeholder="15" />

          <View style={tw("flex-row gap-2 mb-4")}>
            {(["bw", "color"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setPrinterType(type)}
                style={tw(`flex-1 h-12 rounded-xl border items-center justify-center ${printerType === type ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`)}
              >
                <Text style={tw(`text-xs font-inter-semibold font-bold ${printerType === type ? "text-white" : "text-secondary"}`)}>
                  {type === "bw" ? "B&W" : "Color"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={tw("text-xs font-inter-semibold text-secondary mb-2")}>Assign Operator</Text>
          <View style={tw("flex-row flex-wrap gap-2 mb-4")}>
            {operators.map((operator) => (
              <Pressable
                key={operator._id}
                onPress={() => setSelectedOperatorId(operator._id)}
                style={tw(`min-h-[44px] px-4 py-3 rounded-xl border ${selectedOperatorId === operator._id ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`)}
              >
                <Text style={tw(`text-xs font-inter-semibold ${selectedOperatorId === operator._id ? "text-white" : "text-secondary"}`)}>
                  {operator.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <AppButton title="Add Printer" onPress={submitPrinter} loading={loading} style={tw("h-12")} />
        </AppCard>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Printers
        </Text>
        <View style={tw("gap-3 mb-6")}>
          {printers.map((printer) => {
            const currentOperatorId =
              typeof printer.operatorId === "object" ? printer.operatorId?._id : printer.operatorId;

            return (
              <AppCard key={printer._id} style={tw("p-4")}>
                <View style={tw("gap-3 mb-3")}>
                  <View style={tw("flex-1")}>
                    <Text style={tw("text-sm font-inter-bold text-primary font-bold")}>{printer.name}</Text>
                    <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
                      {printer.location} - {printer.printerType === "color" ? "Color" : "B&W"} - {printer.status}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removePrinter(printer)}
                    style={tw("min-h-[44px] rounded-xl bg-red-500 items-center justify-center flex-row gap-2 px-4")}
                    accessibilityRole="button"
                  >
                    <Feather name="trash-2" size={16} color="#FFFFFF" />
                    <Text style={tw("text-xs font-inter-semibold text-white font-bold")}>
                      Remove Printer
                    </Text>
                  </Pressable>
                </View>

                <Text style={tw("text-xs font-inter-semibold text-secondary mb-2")}>Responsible Operator</Text>
                <Text style={tw("text-xs font-inter text-secondary mb-3")}>
                  {currentOperatorId
                    ? `Assigned to ${operators.find((operator) => operator._id === currentOperatorId)?.name || "operator"}`
                    : "No operator assigned"}
                </Text>
                <View style={tw("flex-row flex-wrap gap-2")}>
                  <Pressable
                    onPress={() => assignOperator(printer, "")}
                    style={tw(`min-h-[44px] px-4 py-3 rounded-xl border ${!currentOperatorId ? "bg-slate-700 border-slate-700" : "bg-card border-border"}`)}
                    accessibilityRole="button"
                  >
                    <Text style={tw(`text-xs font-inter-semibold ${!currentOperatorId ? "text-white" : "text-secondary"}`)}>
                      Unassigned
                    </Text>
                  </Pressable>
                  {operators.map((operator) => (
                    <Pressable
                      key={operator._id}
                      onPress={() => assignOperator(printer, operator._id)}
                      style={tw(`min-h-[44px] px-4 py-3 rounded-xl border ${currentOperatorId === operator._id ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`)}
                      accessibilityRole="button"
                    >
                      <Text style={tw(`text-xs font-inter-semibold ${currentOperatorId === operator._id ? "text-white" : "text-secondary"}`)}>
                        {operator.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </AppCard>
            );
          })}
        </View>

        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Global Printer Issue Notification
        </Text>
        <AppCard style={tw("p-5")}>
          <AppInput label="Title" value={broadcastTitle} onChangeText={setBroadcastTitle} placeholder="Printer maintenance notice" />
          <AppInput
            label="Message"
            value={broadcastMessage}
            onChangeText={setBroadcastMessage}
            placeholder="All campus printers may be delayed for the next 30 minutes."
            autoCapitalize="sentences"
          />
          <AppButton title="Send To All Users" onPress={sendBroadcast} />
        </AppCard>
      </ScrollView>
    </View>
  );
}
