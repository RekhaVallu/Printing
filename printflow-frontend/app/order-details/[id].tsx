import React, { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppLoader } from "../../components/AppLoader";
import { StatusBadge, OrderStatus } from "../../components/StatusBadge";
import {
  cancelOrder,
  approvePriority,
  confirmCollection,
  getOrderById,
  rejectPriority,
  requestPriority,
  updateOrderStatus,
} from "../../services/orderService";

const nextStatuses = (status: OrderStatus): OrderStatus[] => {
  if (status === "pending") return ["accepted"];
  if (status === "accepted") return ["printing", "ready"];
  if (status === "printing") return ["ready"];
  if (status === "ready") return ["collected"];
  return [];
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dbUser } = useAppAuth();
  const { tw, colors } = useTheme();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [collectionOtp, setCollectionOtp] = useState("");

  const isAdmin = dbUser?.role === "admin";
  const isOperator = dbUser?.role === "operator";
  const isUser = !isAdmin && !isOperator;
  const canManageOrder = isAdmin || isOperator;
  const operator = order?.printerId?.operatorId;
  const operatorName = typeof operator === "object" ? operator?.name || operator?.email : "";

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getOrderById(id);
      setOrder(response?.data || null);
    } catch (e: any) {
      Alert.alert("Order unavailable", e.response?.data?.message || "Could not load this order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!order?._id) return;
    setSaving(true);
    try {
      const response = await updateOrderStatus(order._id, status);
      if (response?.data) setOrder(response.data);
      if (status === "collected") {
        Alert.alert("OTP sent", response.message || "The user can now confirm collection with the OTP.");
      }
    } catch (e: any) {
      Alert.alert("Status not updated", e.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitPriority = async () => {
    if (!priorityReason.trim()) {
      Alert.alert("Reason required", "Add a short reason for the priority request.");
      return;
    }
    setSaving(true);
    try {
      const response = await requestPriority(order._id, priorityReason.trim());
      if (response?.data) setOrder(response.data);
      setPriorityReason("");
    } catch (e: any) {
      Alert.alert("Priority not requested", e.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelCurrentOrder = async () => {
    setSaving(true);
    try {
      await cancelOrder(order._id);
      await loadOrder();
    } catch (e: any) {
      Alert.alert("Order not cancelled", e.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmReceived = async () => {
    if (!collectionOtp.trim()) {
      Alert.alert("OTP required", "Enter the OTP sent to your notifications.");
      return;
    }

    setSaving(true);
    try {
      const response = await confirmCollection(order._id, collectionOtp.trim());
      if (response?.data) setOrder(response.data);
      setCollectionOtp("");
    } catch (e: any) {
      Alert.alert("Collection not confirmed", e.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const decidePriority = async (decision: "approve" | "reject") => {
    if (!order?._id) return;
    setSaving(true);
    try {
      const response =
        decision === "approve"
          ? await approvePriority(order._id)
          : await rejectPriority(order._id, "Rejected by staff");
      if (response?.data) setOrder(response.data);
    } catch (e: any) {
      Alert.alert("Priority not updated", e.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openPdf = async () => {
    if (!order?.fileUrl) {
      Alert.alert("PDF unavailable", "This order does not have a PDF link.");
      return;
    }

    const supported = await Linking.canOpenURL(order.fileUrl);
    if (!supported) {
      Alert.alert("PDF unavailable", "This PDF link cannot be opened on this device.");
      return;
    }

    await Linking.openURL(order.fileUrl);
  };

  if (loading) return <AppLoader />;

  if (!order) {
    return (
      <View style={tw("flex-1 bg-background")}>
        <AppHeader title="Order Details" showBack />
        <View style={tw("flex-1 items-center justify-center px-8")}>
          <Feather name="file-text" size={28} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary text-center mt-3")}>
            This order could not be found.
          </Text>
        </View>
      </View>
    );
  }

  const status = order.status as OrderStatus;
  const actions = canManageOrder ? nextStatuses(status) : [];

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="Order Details" showBack />
      <ScrollView contentContainerStyle={tw("p-5 pb-14")} showsVerticalScrollIndicator={false}>
        <AppCard style={tw("p-5 mb-5")}>
          <View style={tw("flex-row items-start justify-between gap-3 mb-4")}>
            <View style={tw("flex-1")}>
              <Text style={tw("text-lg font-space-bold text-primary font-bold")} selectable>
                {order.fileName}
              </Text>
              <Text style={tw("text-xs font-inter text-secondary mt-1")} selectable>
                {order.printerId?.name || "Printer"} - {order.printerId?.location || "Campus"}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>

          <View style={tw("gap-3")}>
            <InfoRow label="Queue" value={status === "ready" || status === "collected" ? "-" : `#${order.queuePosition || 0}`} />
            <InfoRow label="ETA" value={status === "ready" || status === "collected" ? "-" : `${order.eta || 0} mins`} />
            <InfoRow label="Pages" value={`${order.totalPages || 0} x ${order.copies || 1} copies`} />
            <InfoRow label="Print sides" value={order.printSides === "double" ? "Double-sided" : "One-sided"} />
            <InfoRow label="Cost" value={`Rs ${Number(order.estimatedCost || 0).toFixed(2)}`} />
            <InfoRow label="Priority" value={order.priorityRequested ? (order.priorityApproved ? "Approved" : "Requested") : "Normal"} />
            <InfoRow label="Confidential" value={order.confidential ? "Yes" : "No"} />
            <InfoRow label="Operator" value={operatorName || "No operator assigned"} />
          </View>
        </AppCard>

        {canManageOrder && order.userId ? (
          <AppCard style={tw("p-5 mb-5")}>
            <Text style={tw("text-sm font-space-bold text-primary uppercase tracking-wider font-bold mb-3")}>
              User
            </Text>
            <InfoRow label="Name" value={order.userId.name || "Unknown user"} />
            <InfoRow label="Email" value={order.userId.email || "No email"} />
            {order.userId.rollNo ? (
              <InfoRow label="Roll No" value={order.userId.rollNo} />
            ) : null}
            <InfoRow label="Department" value={order.userId.department || "Not set"} />
          </AppCard>
        ) : null}

        {canManageOrder ? (
          <AppCard style={tw("p-5 mb-5")}>
            <Text style={tw("text-sm font-space-bold text-primary uppercase tracking-wider font-bold mb-3")}>
              Print File
            </Text>
            <InfoRow label="PDF" value={order.fileName || "Uploaded document"} />
            <AppButton
              title="Open PDF"
              onPress={openPdf}
              variant="outline"
              disabled={!order.fileUrl}
              style={tw("mt-4")}
            />
          </AppCard>
        ) : null}

        {order.priorityReason ? (
          <AppCard style={tw("p-5 mb-5")}>
            <Text style={tw("text-sm font-space-bold text-primary uppercase tracking-wider font-bold mb-2")}>
              Priority Reason
            </Text>
            <Text style={tw("text-sm font-inter text-secondary")} selectable>
              {order.priorityReason}
            </Text>
            {canManageOrder && order.priorityRequested && !order.priorityApproved ? (
              <View style={tw("gap-3 mt-4")}>
                <AppButton title="Approve Priority" onPress={() => decidePriority("approve")} loading={saving} />
                <AppButton title="Reject Priority" onPress={() => decidePriority("reject")} loading={saving} variant="danger" />
              </View>
            ) : null}
          </AppCard>
        ) : null}

        {canManageOrder && actions.length > 0 ? (
          <View style={tw("gap-3 mb-5")}>
            {actions.map((action) => (
              <AppButton
                key={action}
                title={
                  action === "accepted"
                    ? "Approve PDF"
                    : action === "collected"
                      ? "Send Collection OTP"
                      : `Mark ${action}`
                }
                onPress={() => updateStatus(action)}
                loading={saving}
              />
            ))}
          </View>
        ) : null}

        {isUser && ["pending", "accepted"].includes(status) ? (
          <View style={tw("gap-4")}>
            {!order.priorityRequested ? (
              <AppCard style={tw("p-5")}>
                <AppInput
                  label="Priority Request Reason"
                  value={priorityReason}
                  onChangeText={setPriorityReason}
                  placeholder="Exam ticket, urgent submission, medical document..."
                  autoCapitalize="sentences"
                />
                <AppButton title="Request Priority" onPress={submitPriority} loading={saving} variant="outline" />
              </AppCard>
            ) : null}
            <AppButton title="Cancel Order" onPress={cancelCurrentOrder} loading={saving} variant="danger" />
          </View>
        ) : null}

        {isUser && status === "ready" ? (
          <AppCard style={tw("p-5")}>
            <Text style={tw("text-sm font-space-bold text-primary uppercase tracking-wider font-bold mb-2")}>
              Confirm Received
            </Text>
            <Text style={tw("text-xs font-inter text-secondary mb-4")}>
              Enter the OTP sent by staff when you collect the printed document.
            </Text>
            <AppInput
              label="Collection OTP"
              value={collectionOtp}
              onChangeText={setCollectionOtp}
              placeholder="6-digit OTP"
              keyboardType="numeric"
            />
            <AppButton title="Confirm Received" onPress={confirmReceived} loading={saving} />
          </AppCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { tw } = useTheme();
  return (
    <View style={tw("flex-row items-center justify-between gap-4")}>
      <Text style={tw("text-sm font-inter text-secondary")}>{label}</Text>
      <Text style={tw("text-sm font-inter-semibold text-primary font-bold text-right flex-1")} selectable>
        {value}
      </Text>
    </View>
  );
}
