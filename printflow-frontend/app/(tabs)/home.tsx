import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { useAppAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { SkeletonLoader } from "../../components/AppLoader";
import { getRecommendations } from "../../services/printerService";
import { getOrders } from "../../services/orderService";
import { trackEvent } from "../../utils/posthog";

interface RecommendedPrinter {
  _id?: string;
  printerName: string;
  eta: number;
  queueLength: number;
  location?: string;
  printerType?: "bw" | "color";
}

export default function Home() {
  const { dbUser } = useAppAuth();
  const { tw, colors } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedPrinter[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    ready: 0,
    pagesPrinted: 0,
  });
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch recommended printers
      // pages = 10, copies = 1, priorityLevel = "normal" as defaults
      const recData = await getRecommendations(10, 1, "normal");
      if (recData && recData.data) {
        setRecommendations(recData.data);
      } else {
        // Mock fallback
        setRecommendations([
          { printerName: "Library Printer A", eta: 3, queueLength: 1, location: "Library Floor 1", printerType: "bw" },
          { printerName: "CSE Lab Printer B", eta: 7, queueLength: 3, location: "CSE Block B", printerType: "color" },
          { printerName: "Admin Block C", eta: 12, queueLength: 5, location: "Ground Floor", printerType: "bw" },
        ]);
      }

      // 2. Fetch stats from orders
      const ordersData = await getOrders();
      if (ordersData && ordersData.data) {
        const list = ordersData.data;
        const active = list.filter((o: any) => ["pending", "accepted", "printing"].includes(o.status)).length;
        const pending = list.filter((o: any) => o.status === "pending").length;
        const ready = list.filter((o: any) => o.status === "ready").length;
        const collected = list.filter((o: any) => o.status === "collected");
        const pages = collected.reduce((acc: number, cur: any) => acc + (cur.totalPages * cur.copies || 0), 0);

        setStats({
          active,
          pending,
          ready,
          pagesPrinted: pages || 12, // fallback default if 0
        });
      } else {
        // Mock fallback
        setStats({
          active: 2,
          pending: 1,
          ready: 1,
          pagesPrinted: 48,
        });
      }
    } catch (e) {
      console.warn("Failed to fetch dashboard, loading mock data (Demo Mode)", e);
      // Demo Mode Fallback
      setRecommendations([
        { printerName: "Library Printer A", eta: 3, queueLength: 1, location: "Library Floor 1", printerType: "bw" },
        { printerName: "CSE Lab Printer B", eta: 7, queueLength: 3, location: "CSE Block B", printerType: "color" },
        { printerName: "Admin Block C", eta: 12, queueLength: 5, location: "Ground Floor", printerType: "bw" },
      ]);
      setStats({
        active: 2,
        pending: 1,
        ready: 1,
        pagesPrinted: 84,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    trackEvent("screen_viewed", { screenName: "home" });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const isDark = colors.background === "#020617";

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="PrintFlow" />
      
      <ScrollView
        contentContainerStyle={tw("p-5 pb-10")}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Welcome Section */}
        <View style={tw("mb-6")}>
          <Text style={tw("text-sm font-inter text-secondary")}>
            {getGreeting()}
          </Text>
          <Text style={tw("text-2xl font-space-bold text-primary mt-1")}>
            {dbUser?.name || "Chinmayee"}
          </Text>
          {dbUser?.role === "student" && dbUser.rollNo && (
            <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>
              {dbUser.department} • {dbUser.rollNo}
            </Text>
          )}
        </View>

        {/* -------------------- ROLE BASED STATS & WIDGETS -------------------- */}
        
        {/* Student View */}
        <>
          {/* Quick Stats Grid */}
            <View style={tw("flex-row gap-4 mb-6 w-full justify-between")}>
              <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
                <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
                  Active Jobs
                </Text>
                {loading ? (
                  <SkeletonLoader height={28} width="50%" style={tw("mt-2")} />
                ) : (
                  <Text style={tw("text-2xl font-space-bold text-primary mt-1")}>{stats.active}</Text>
                )}
              </View>

              <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
                <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
                  Ready for Pick
                </Text>
                {loading ? (
                  <SkeletonLoader height={28} width="50%" style={tw("mt-2")} />
                ) : (
                  <Text style={tw("text-2xl font-space-bold text-emerald-500 mt-1")}>{stats.ready}</Text>
                )}
              </View>

              <View style={tw("flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm")}>
                <Text style={tw("text-[10px] font-inter-semibold text-secondary uppercase tracking-wider")}>
                  Pages Printed
                </Text>
                {loading ? (
                  <SkeletonLoader height={28} width="50%" style={tw("mt-2")} />
                ) : (
                  <Text style={tw("text-2xl font-space-bold text-primary mt-1")}>{stats.pagesPrinted}</Text>
                )}
              </View>
            </View>

            {/* Quick Actions Card */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Quick Actions
            </Text>
            <View style={tw("bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm flex flex-row flex-wrap justify-between gap-y-4")}>
              <Pressable
                onPress={() => router.push("/create-order")}
                style={tw("w-[46%] items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800")}
              >
                <View style={tw("h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center mb-2")}>
                  <Feather name="upload-cloud" size={20} color={colors.accent} />
                </View>
                <Text style={tw("text-xs font-inter-bold text-primary font-bold text-center")}>
                  New Print Job
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/orders")}
                style={tw("w-[46%] items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800")}
              >
                <View style={tw("h-11 w-11 rounded-full bg-blue-50 dark:bg-blue-950/20 items-center justify-center mb-2")}>
                  <Feather name="file-text" size={20} color={colors.info} />
                </View>
                <Text style={tw("text-xs font-inter-bold text-primary font-bold text-center")}>
                  My Orders
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/analytics")}
                style={tw("w-[46%] items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800")}
              >
                <View style={tw("h-11 w-11 rounded-full bg-purple-50 dark:bg-purple-950/20 items-center justify-center mb-2")}>
                  <Feather name="bar-chart-2" size={20} color="#8B5CF6" />
                </View>
                <Text style={tw("text-xs font-inter-bold text-primary font-bold text-center")}>
                  View Analytics
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/notifications")}
                style={tw("w-[46%] items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800")}
              >
                <View style={tw("h-11 w-11 rounded-full bg-amber-50 dark:bg-amber-950/20 items-center justify-center mb-2")}>
                  <Feather name="bell" size={20} color={colors.warning} />
                </View>
                <Text style={tw("text-xs font-inter-bold text-primary font-bold text-center")}>
                  Notifications
                </Text>
              </Pressable>
            </View>

            {/* Recommendations Section */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Recommended Printers
            </Text>
            {loading ? (
              <View style={tw("gap-3")}>
                <SkeletonLoader height={100} />
                <SkeletonLoader height={100} />
              </View>
            ) : (
              <View style={tw("gap-4")}>
                {recommendations.map((printer, index) => (
                  <AppCard key={index} style={tw("flex flex-row items-center justify-between p-4")}>
                    <View style={tw("flex-1 mr-3")}>
                      <View style={tw("flex-row items-center gap-2 mb-1")}>
                        <Feather name="printer" size={16} color={colors.accent} />
                        <Text style={tw("text-sm font-inter-semibold text-primary font-bold")}>
                          {printer.printerName}
                        </Text>
                      </View>
                      <Text style={tw("text-xs font-inter text-secondary")}>
                        {printer.location || "Campus"} • {printer.printerType === "color" ? "Color" : "B&W"}
                      </Text>
                    </View>

                    <View style={tw("flex-row gap-3 items-center")}>
                      <View style={tw("items-end")}>
                        <Text style={tw("text-[10px] font-inter text-secondary uppercase tracking-wider")}>
                          ETA
                        </Text>
                        <Text style={tw("text-xs font-space-bold text-primary font-bold mt-0.5")}>
                          {printer.eta} mins
                        </Text>
                      </View>
                      <View style={tw("h-7 w-px bg-border")} />
                      <View style={tw("items-end")}>
                        <Text style={tw("text-[10px] font-inter text-secondary uppercase tracking-wider")}>
                          Queue
                        </Text>
                        <Text style={tw("text-xs font-space-bold text-emerald-500 font-bold mt-0.5")}>
                          {printer.queueLength} jobs
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}
        </>
      </ScrollView>
    </View>
  );
}
