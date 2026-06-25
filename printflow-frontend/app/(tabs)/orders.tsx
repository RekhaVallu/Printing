import React, { useEffect, useState } from "react";
import { Alert, View, Text, FlatList, TextInput, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { OrderCard } from "../../components/OrderCard";
import { AppEmptyState } from "../../components/AppEmptyState";
import { SkeletonCard } from "../../components/AppLoader";
import { approvePriority, getOrders, rejectPriority, updateOrderStatus } from "../../services/orderService";
import { trackEvent } from "../../utils/posthog";
import { OrderStatus } from "../../components/StatusBadge";
import { downloadPdfFile, openPdfFile } from "../../utils/pdfFile";

type FilterType = "all" | "active" | "completed" | "cancelled";

export default function Orders() {
  const { dbUser } = useAppAuth();
  const { tw, colors } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrdersList = async () => {
    setLoading(true);
    try {
      const response = await getOrders();
      if (response && response.success && response.data) {
        setOrders(response.data);
      } else {
        // Mock fallback
        loadMockOrders();
      }
    } catch (e) {
      console.warn("Failed to fetch orders, loading mock data (Demo Mode)", e);
      loadMockOrders();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMockOrders = () => {
    setOrders([
      {
        _id: "order_1",
        fileName: "CS_301_MachineLearning_Assignment.pdf",
        status: "pending",
        queuePosition: 2,
        eta: 8,
        estimatedCost: 15.0,
        printerId: { name: "Library Printer A", location: "Library Floor 1" },
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        _id: "order_2",
        fileName: "FinalYearProject_Draft.pdf",
        status: "printing",
        queuePosition: 1,
        eta: 3,
        estimatedCost: 85.5,
        printerId: { name: "CSE Lab Printer B", location: "CSE Block B" },
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        _id: "order_3",
        fileName: "Hostel_AdmissionForm.pdf",
        status: "ready",
        queuePosition: 0,
        eta: 0,
        estimatedCost: 10.0,
        printerId: { name: "Admin Block C", location: "Ground Floor" },
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      },
      {
        _id: "order_4",
        fileName: "Resume_Chinmayee.pdf",
        status: "cancelled",
        queuePosition: 0,
        eta: 0,
        estimatedCost: 5.0,
        printerId: { name: "Library Printer A", location: "Library Floor 1" },
        createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
      },
    ]);
  };

  useEffect(() => {
    fetchOrdersList();
    trackEvent("screen_viewed", { screenName: "orders" });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrdersList();
  };

  const isAdmin = dbUser?.role === "admin";
  const isOperator = dbUser?.role === "operator";
  const canManageOrders = isAdmin || isOperator;

  const getOperatorName = (order: any) => {
    const operator = order.printerId?.operatorId;
    if (!operator) return "";
    return typeof operator === "object" ? operator.name || operator.email || "Assigned operator" : "Assigned operator";
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await updateOrderStatus(orderId, status);
      if (response?.success && response.data) {
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? { ...order, ...response.data } : order))
        );
        if (status === "collected") {
          Alert.alert("OTP sent", response.message || "The user can now confirm collection with the OTP.");
        }
        trackEvent("order_status_updated", {
          orderId,
          status,
          role: dbUser?.role,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const nextStatuses = (status: OrderStatus): OrderStatus[] => {
    if (status === "pending") return ["accepted"];
    if (status === "accepted") return ["printing", "ready"];
    if (status === "printing") return ["ready"];
    if (status === "ready") return ["collected"];
    return [];
  };

  const handlePriorityDecision = async (orderId: string, decision: "approve" | "reject") => {
    setUpdatingOrderId(orderId);
    try {
      const response =
        decision === "approve"
          ? await approvePriority(orderId)
          : await rejectPriority(orderId, "Rejected by staff");
      if (response?.success && response.data) {
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? { ...order, ...response.data } : order))
        );
      }
    } catch (e: any) {
      Alert.alert("Priority not updated", e.response?.data?.message || "Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderStaffActions = (order: any) => {
    if (!isOperator) return undefined;
    const actions = nextStatuses(order.status);

    return (
      <View style={tw("gap-3")}>
        {order.priorityReason ? (
          <View style={tw("rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 p-3")}>
            <Text style={tw("text-[10px] font-inter-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1")}>
              Emergency reason
            </Text>
            <Text style={tw("text-xs font-inter text-primary")}>{order.priorityReason}</Text>
            {order.priorityRequested && !order.priorityApproved ? (
              <View style={tw("flex-row gap-2 mt-3")}>
                <Pressable
                  onPress={() => handlePriorityDecision(order._id, "approve")}
                  disabled={updatingOrderId === order._id}
                  style={tw("flex-1 px-3 py-2 rounded-xl bg-emerald-500 items-center")}
                  accessibilityRole="button"
                >
                  <Text style={tw("text-xs font-inter-semibold text-white font-bold")}>Approve Priority</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePriorityDecision(order._id, "reject")}
                  disabled={updatingOrderId === order._id}
                  style={tw("flex-1 px-3 py-2 rounded-xl bg-red-500 items-center")}
                  accessibilityRole="button"
                >
                  <Text style={tw("text-xs font-inter-semibold text-white font-bold")}>Reject</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={tw("flex-row flex-wrap gap-2")}>
          <Pressable
            onPress={() => openPdfFile(order.fileUrl, order.fileName)}
            disabled={!order.fileUrl}
            style={tw(
              `px-3 py-2 rounded-xl border flex-row items-center gap-2 ${
                order.fileUrl
                  ? "bg-card border-border"
                  : "bg-slate-100 dark:bg-slate-800 border-border opacity-50"
              }`
            )}
            accessibilityRole="button"
          >
            <Feather name="file-text" size={14} color={colors.textSecondary} />
            <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
              Open PDF
            </Text>
          </Pressable>
          <Pressable
            onPress={() => downloadPdfFile(order.fileUrl, order.fileName)}
            disabled={!order.fileUrl}
            style={tw(
              `px-3 py-2 rounded-xl border flex-row items-center gap-2 ${
                order.fileUrl
                  ? "bg-card border-border"
                  : "bg-slate-100 dark:bg-slate-800 border-border opacity-50"
              }`
            )}
            accessibilityRole="button"
          >
            <Feather name="download" size={14} color={colors.textSecondary} />
            <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
              Download
            </Text>
          </Pressable>
          {actions.map((status) => (
            <Pressable
              key={status}
              onPress={() => handleStatusUpdate(order._id, status)}
              disabled={updatingOrderId === order._id}
              style={tw(
                `px-3 py-2 rounded-xl border ${
                  updatingOrderId === order._id
                    ? "bg-slate-100 dark:bg-slate-800 border-border"
                    : "bg-emerald-500 border-emerald-500"
                }`
              )}
              accessibilityRole="button"
            >
              <Text
                style={tw(
                  `text-xs font-inter-semibold font-bold ${
                    updatingOrderId === order._id ? "text-secondary" : "text-white"
                  }`
                )}
              >
                {status === "accepted"
                  ? "Approve PDF"
                  : status === "collected"
                    ? "Send Collection OTP"
                    : `Mark ${status}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderAdminActions = (order: any) => {
    if (!isAdmin) return undefined;

    return (
      <View style={tw("flex-row flex-wrap gap-2")}>
        <Pressable
          onPress={() => openPdfFile(order.fileUrl, order.fileName)}
          disabled={!order.fileUrl}
          style={tw(`px-3 py-2 rounded-xl border flex-row items-center gap-2 ${order.fileUrl ? "bg-card border-border" : "bg-slate-100 dark:bg-slate-800 border-border opacity-50"}`)}
          accessibilityRole="button"
        >
          <Feather name="eye" size={14} color={colors.textSecondary} />
          <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
            Review PDF
          </Text>
        </Pressable>
        <Pressable
          onPress={() => downloadPdfFile(order.fileUrl, order.fileName)}
          disabled={!order.fileUrl}
          style={tw(`px-3 py-2 rounded-xl border flex-row items-center gap-2 ${order.fileUrl ? "bg-card border-border" : "bg-slate-100 dark:bg-slate-800 border-border opacity-50"}`)}
          accessibilityRole="button"
        >
          <Feather name="download" size={14} color={colors.textSecondary} />
          <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
            Download
          </Text>
        </Pressable>
        {order.status === "ready" ? (
          <Pressable
            onPress={() => handleStatusUpdate(order._id, "collected")}
            disabled={updatingOrderId === order._id}
            style={tw(
              `px-3 py-2 rounded-xl border ${
                updatingOrderId === order._id
                  ? "bg-slate-100 dark:bg-slate-800 border-border"
                  : "bg-emerald-500 border-emerald-500"
              }`
            )}
            accessibilityRole="button"
          >
            <Text
              style={tw(
                `text-xs font-inter-semibold font-bold text-center ${
                  updatingOrderId === order._id ? "text-secondary" : "text-white"
                }`
              )}
            >
              Send Collection OTP
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderStaffDetails = (order: any) => {
    if (!canManageOrders) return undefined;
    const user = order.userId;

    return (
      <View style={tw("gap-3")}>
        <View style={tw("rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border p-3")}>
          <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider mb-2")}>
            User Details
          </Text>
          <Text style={tw("text-sm font-inter-bold text-primary font-bold")}>
            {user?.name || "Unknown user"}
          </Text>
          <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
            {user?.email || "No email"}{user?.department ? ` - ${user.department}` : ""}
          </Text>
          {user?.rollNo ? (
            <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
              Roll No: {user.rollNo}
            </Text>
          ) : null}
        </View>

        <View style={tw("rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border p-3")}>
          <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider mb-2")}>
            Printer Assignment
          </Text>
          <Text style={tw("text-sm font-inter-bold text-primary font-bold")}>
            {order.printerId?.name || "Unknown printer"}
          </Text>
          <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
            Operator: {getOperatorName(order) || "No operator assigned"}
          </Text>
        </View>

        {order.priorityReason ? (
          <View style={tw("rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 p-3")}>
            <Text style={tw("text-[10px] font-inter-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1")}>
              Emergency reason
            </Text>
            <Text style={tw("text-xs font-inter text-primary")}>{order.priorityReason}</Text>
          </View>
        ) : null}

        <View style={tw("flex-row items-center gap-2")}>
          <Feather name="eye" size={14} color={colors.textSecondary} />
          <Text style={tw("text-xs font-inter-semibold text-secondary")}>
            Staff order details
          </Text>
        </View>
      </View>
    );
  };

  // Filter and Search logic
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const haystack = [
        order.fileName,
        order.userId?.name,
        order.userId?.email,
        order.userId?.rollNo,
        order.userId?.department,
        order.printerId?.name,
        order.printerId?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      
      let matchesFilter = true;
      if (filter === "active") {
        matchesFilter = ["pending", "accepted", "printing"].includes(order.status);
      } else if (filter === "completed") {
        matchesFilter = ["ready", "collected"].includes(order.status);
      } else if (filter === "cancelled") {
        matchesFilter = order.status === "cancelled";
      }

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const renderFilterButton = (type: FilterType, label: string) => {
    const isActive = filter === type;
    const btnStyle = isActive
      ? "bg-emerald-500 border-emerald-500"
      : "bg-card border-border";
    const textStyle = isActive ? "text-white" : "text-secondary";

    return (
      <Pressable
        onPress={() => setFilter(type)}
        style={tw(`px-4 py-2 rounded-xl border items-center justify-center mr-2 shadow-sm ${btnStyle}`)}
        accessibilityRole="button"
      >
        <Text style={tw(`text-xs font-inter-semibold ${textStyle}`)}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const isDark = colors.background === "#020617";
  const headerTitle = isAdmin ? "Admin Oversight" : isOperator ? "Operator Queue" : "My Orders";
  const searchPlaceholder = isAdmin
    ? "Search user, document, or printer..."
    : isOperator
      ? "Search assigned queue..."
      : "Search documents by name...";
  const roleIntro = isAdmin
    ? {
        title: "Audit and supervise every campus print order.",
        body: "Review user details, printer assignment, and document copies without entering the operator print workflow.",
      }
    : isOperator
      ? {
          title: "Print-ready queue for your assigned printers.",
          body: "Open or download PDFs, verify user details, and move each job through the printing workflow.",
        }
      : {
          title: "Track your print requests.",
          body: "Follow queue status, pickup readiness, cost, and priority requests for your own documents.",
        };

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title={headerTitle} />
      
      {/* Search and Filters Section */}
      <View style={tw("px-5 pt-4 pb-2")}>
        <View style={tw("bg-card border border-border rounded-xl p-4 mb-4")}>
          <Text style={tw("text-sm font-space-bold text-primary font-bold")}>
            {roleIntro.title}
          </Text>
          <Text style={tw("text-xs font-inter text-secondary mt-1")}>
            {roleIntro.body}
          </Text>
        </View>
        {/* Search Input */}
        <View style={tw("flex flex-row items-center border border-border rounded-xl px-4 h-12 bg-card mb-4")}>
          <Feather name="search" size={18} color={colors.textSecondary} style={tw("mr-2")} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={isDark ? colors.textSecondary : "#94A3B8"}
            value={search}
            onChangeText={setSearch}
            style={tw("flex-1 text-sm font-inter text-primary h-full")}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={tw("flex-row w-full justify-start py-1")}>
          {renderFilterButton("all", "All")}
          {renderFilterButton("active", "Active")}
          {renderFilterButton("completed", "Completed")}
          {renderFilterButton("cancelled", "Cancelled")}
        </View>
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <View style={tw("px-5")}><SkeletonCard /></View>}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={tw("pt-4")}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={tw("px-5 pt-4 pb-12 flex-grow")}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <OrderCard
              id={item._id}
              fileName={item.fileName}
              status={item.status}
              queuePosition={item.queuePosition}
              eta={item.eta}
              estimatedCost={item.estimatedCost}
              printerName={item.printerId?.name}
              printerLocation={item.printerId?.location}
              operatorName={getOperatorName(item)}
              onPress={() => router.push(`/order-details/${item._id}`)}
              footer={
                canManageOrders ? (
                  <View style={tw("gap-3")}>
                    {renderStaffDetails(item)}
                    {isAdmin ? renderAdminActions(item) : renderStaffActions(item)}
                  </View>
                ) : (
                  undefined
                )
              }
            />
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="file-text"
              title="No Orders Found"
              description={
                search || filter !== "all"
                  ? "Try checking your search query or filters."
                  : "You haven't submitted any print jobs yet."
              }
              actionTitle={search || filter !== "all" || canManageOrders ? undefined : "New Print Job"}
              onActionPress={canManageOrders ? undefined : () => router.push("/create-order")}
            />
          }
        />
      )}
    </View>
  );
}
