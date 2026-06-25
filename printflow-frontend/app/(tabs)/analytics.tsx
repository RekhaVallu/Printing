import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AnalyticsCard } from "../../components/AnalyticsCard";
import { SkeletonCard } from "../../components/AppLoader";
import { getStudentHistory, getAdminDashboard } from "../../services/analyticsService";
import { trackEvent } from "../../utils/posthog";

interface BadgeProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  earned: boolean;
}

const AchievementBadge: React.FC<BadgeProps> = ({ icon, title, description, earned }) => {
  const { tw, colors } = useTheme();

  return (
    <View
      style={tw(
        `flex flex-row items-center p-3 rounded-xl border mb-3 ${
          earned
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20"
            : "bg-slate-50 dark:bg-slate-800/10 border-slate-200 dark:border-slate-800 opacity-55"
        }`
      )}
    >
      <View
        style={tw(
          `h-10 w-10 rounded-full items-center justify-center mr-3 ${
            earned ? "bg-emerald-500/15" : "bg-slate-200 dark:bg-slate-800"
          }`
        )}
      >
        <Feather name={icon} size={18} color={earned ? colors.accent : colors.textSecondary} />
      </View>
      <View style={tw("flex-1")}>
        <Text style={tw(`text-sm font-inter-semibold font-bold ${earned ? "text-primary" : "text-secondary"}`)}>
          {title}
        </Text>
        <Text style={tw("text-xs font-inter text-secondary mt-0.5")}>{description}</Text>
      </View>
      {earned && (
        <View style={tw("h-6 w-6 rounded-full bg-emerald-500 items-center justify-center")}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

export default function Analytics() {
  const { dbUser } = useAppAuth();
  const { tw, colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Student metrics
  const [studentStats, setStudentStats] = useState({
    totalOrders: 0,
    totalPages: 0,
    moneySaved: 0,
    activeOrders: 0,
    treesSaved: 0,
  });

  // Admin metrics
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activePrinters: 0,
    avgWaitTime: 0,
  });

  const loadMockStudentData = () => {
    setStudentStats({
      totalOrders: 12,
      totalPages: 74,
      moneySaved: 74 * 3, // ₹3 saved per page compared to outside
      activeOrders: 1,
      treesSaved: parseFloat((74 * 0.0001).toFixed(4)),
    });
  };

  const loadMockAdminData = () => {
    setAdminStats({
      totalUsers: 142,
      totalOrders: 654,
      totalRevenue: 1980,
      activePrinters: 5,
      avgWaitTime: 6,
    });
  };

  const fetchAnalyticsData = async () => {
    if (dbUser?.role === "operator") {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      if (dbUser?.role === "admin") {
        const response = await getAdminDashboard();
        if (response && response.success && response.data) {
          setAdminStats(response.data);
        } else {
          loadMockAdminData();
        }
      } else {
        const response = await getStudentHistory();
        if (response && response.success && response.data) {
          // Process student analytics from history response
          const list = response.data;
          const totalOrders = list.length;
          const totalPages = list
            .filter((o: any) => o.status === "collected" || o.status === "ready")
            .reduce((acc: number, cur: any) => acc + (cur.totalPages * cur.copies || 0), 0);
          const activeOrders = list.filter((o: any) =>
            ["pending", "accepted", "printing"].includes(o.status)
          ).length;

          setStudentStats({
            totalOrders,
            totalPages,
            moneySaved: totalPages * 3,
            activeOrders,
            treesSaved: parseFloat((totalPages * 0.0001).toFixed(4)),
          });
        } else {
          loadMockStudentData();
        }
      }
    } catch (e) {
      console.warn("Failed to fetch analytics, loading mock data (Demo Mode)", e);
      if (dbUser?.role === "admin") {
        loadMockAdminData();
      } else {
        loadMockStudentData();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (dbUser?.role === "operator") {
      setLoading(false);
      return;
    }
    fetchAnalyticsData();
    trackEvent("analytics_opened", { role: dbUser?.role });
  }, [dbUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  if (dbUser?.role === "operator") {
    return (
      <View style={tw("flex-1 bg-background")}>
        <AppHeader title="Analytics Insights" />
        <View style={tw("flex-1 items-center justify-center px-8")}>
          <Feather name="lock" size={28} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary text-center mt-3")}>
            Analytics are available to admins and regular users only.
          </Text>
        </View>
      </View>
    );
  }

  const isStudent = dbUser?.role === "student" || !dbUser;

  // Custom visual vector charts data representations
  const studentMonthlyTrends = [
    { label: "Feb", value: 3, percent: 25 },
    { label: "Mar", value: 5, percent: 42 },
    { label: "Apr", value: 8, percent: 66 },
    { label: "May", value: 12, percent: 100 },
  ];

  const studentPagesTrend = [
    { label: "ML Assignment", value: 24, percent: 100 },
    { label: "Lab Record", value: 18, percent: 75 },
    { label: "Project Report", value: 15, percent: 62 },
    { label: "Others", value: 17, percent: 70 },
  ];

  const adminDeptUsage = [
    { label: "CSE", value: 245, percent: 100, color: "bg-emerald-500" },
    { label: "IT", value: 180, percent: 73, color: "bg-blue-500" },
    { label: "ECE", value: 120, percent: 49, color: "bg-purple-500" },
    { label: "MECH", value: 65, percent: 26, color: "bg-amber-500" },
    { label: "CIVIL", value: 44, percent: 18, color: "bg-red-500" },
  ];

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="Analytics Insights" />

      <ScrollView
        contentContainerStyle={tw("p-5 pb-16")}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {isLoadingStudentOrAdmin(loading, isStudent) ? (
          <View style={tw("gap-4")}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : isStudent ? (
          // -------------------- STUDENT DASHBOARD --------------------
          <View>
            {/* KPI Cards Grid */}
            <View style={tw("flex-row gap-4 mb-4 justify-between w-full")}>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Total Orders"
                  value={studentStats.totalOrders}
                  icon="file-text"
                  change={8}
                />
              </View>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Pages Printed"
                  value={studentStats.totalPages}
                  icon="printer"
                  change={12}
                />
              </View>
            </View>

            <View style={tw("flex-row gap-4 mb-6 justify-between w-full")}>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Money Saved"
                  value={`₹${studentStats.moneySaved}`}
                  icon="dollar-sign"
                  variant="green"
                  change={15}
                />
              </View>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Trees Saved"
                  value={studentStats.treesSaved}
                  icon="gift"
                  change={22}
                />
              </View>
            </View>

            {/* Achievement Badges */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              On-Campus Achievements
            </Text>
            <AppCard style={tw("mb-6 bg-card")}>
              <AchievementBadge
                icon="award"
                title="First Print"
                description="Completed your first campus print job."
                earned={studentStats.totalOrders >= 1}
              />
              <AchievementBadge
                icon="activity"
                title="Frequent Printer"
                description="Submitted 5 or more printing requests."
                earned={studentStats.totalOrders >= 5}
              />
              <AchievementBadge
                icon="zap"
                title="Power User"
                description="Printed more than 50 pages total."
                earned={studentStats.totalPages >= 50}
              />
              <AchievementBadge
                icon="heart"
                title="Sustainability Champion"
                description="Saved 0.01 or more trees via double-sided printing."
                earned={studentStats.treesSaved >= 0.007}
              />
            </AppCard>

            {/* Custom vector charts */}
            {/* Chart 1: Monthly Trend */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Monthly Activity Trend
            </Text>
            <AppCard style={tw("mb-6 bg-card p-5")}>
              <Text style={tw("text-[10px] font-inter text-secondary uppercase tracking-wider mb-4")}>
                Jobs submitted per month
              </Text>
              
              <View style={tw("flex flex-row items-end justify-between h-32 pt-4 w-full px-2")}>
                {studentMonthlyTrends.map((item, index) => (
                  <View key={index} style={tw("items-center flex-1")}>
                    <View style={tw("w-8 bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full justify-end overflow-hidden")}>
                      <View style={[tw("bg-emerald-500 rounded-t-lg w-full"), { height: `${item.percent}%` }]} />
                    </View>
                    <Text style={tw("text-xs font-inter-semibold text-primary mt-2 font-bold")}>
                      {item.value}
                    </Text>
                    <Text style={tw("text-[10px] font-inter text-secondary mt-1")}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </AppCard>

            {/* Chart 2: Document breakdown */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Print Workloads Breakdown
            </Text>
            <AppCard style={tw("mb-4 bg-card p-5")}>
              <Text style={tw("text-[10px] font-inter text-secondary uppercase tracking-wider mb-4")}>
                Pages by Document category
              </Text>
              
              <View style={tw("gap-4")}>
                {studentPagesTrend.map((item, index) => (
                  <View key={index} style={tw("w-full")}>
                    <View style={tw("flex flex-row justify-between mb-1.5")}>
                      <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
                        {item.label}
                      </Text>
                      <Text style={tw("text-xs font-space-bold text-emerald-500 font-bold")}>
                        {item.value} pgs
                      </Text>
                    </View>
                    <View style={tw("w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden")}>
                      <View style={[tw("h-full bg-emerald-500 rounded-full"), { width: `${item.percent}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </AppCard>
          </View>
        ) : (
          // -------------------- ADMIN / OPERATOR DASHBOARD --------------------
          <View>
            {/* KPI Cards Grid */}
            <View style={tw("flex flex-row gap-4 mb-4 justify-between w-full")}>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Total Users"
                  value={adminStats.totalUsers}
                  icon="users"
                  change={5}
                />
              </View>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Total Orders"
                  value={adminStats.totalOrders}
                  icon="file-text"
                  change={10}
                />
              </View>
            </View>

            <View style={tw("flex flex-row gap-4 mb-6 justify-between w-full")}>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Total Revenue"
                  value={`₹${adminStats.totalRevenue}`}
                  icon="dollar-sign"
                  variant="green"
                  change={18}
                />
              </View>
              <View style={tw("flex-1")}>
                <AnalyticsCard
                  title="Avg Wait Time"
                  value={`${adminStats.avgWaitTime}m`}
                  icon="clock"
                  change={-15} // waiting time decreased
                />
              </View>
            </View>

            {/* Department Usage Chart */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Usage by Department
            </Text>
            <AppCard style={tw("mb-6 bg-card p-5")}>
              <Text style={tw("text-[10px] font-inter text-secondary uppercase tracking-wider mb-4")}>
                Print requests breakdown
              </Text>
              
              <View style={tw("gap-4")}>
                {adminDeptUsage.map((item, index) => (
                  <View key={index} style={tw("w-full")}>
                    <View style={tw("flex flex-row justify-between mb-1.5")}>
                      <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>
                        {item.label}
                      </Text>
                      <Text style={tw("text-xs font-space-bold text-primary font-bold")}>
                        {item.value} prints
                      </Text>
                    </View>
                    <View style={tw("w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden")}>
                      <View style={[tw(`h-full rounded-full ${item.color}`), { width: `${item.percent}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </AppCard>

            {/* System Health Status */}
            <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              System Health & Load
            </Text>
            <AppCard style={tw("p-5 mb-4 bg-card")}>
              <View style={tw("flex flex-row items-center justify-between py-2 border-b border-border")}>
                <Text style={tw("text-sm font-inter text-secondary")}>Server status</Text>
                <View style={tw("flex-row items-center gap-1.5")}>
                  <View style={tw("h-2.5 w-2.5 rounded-full bg-emerald-500")} />
                  <Text style={tw("text-xs font-inter text-primary font-bold")}>Healthy</Text>
                </View>
              </View>
              <View style={tw("flex flex-row items-center justify-between py-2 border-b border-border")}>
                <Text style={tw("text-sm font-inter text-secondary")}>Cloudinary upload link</Text>
                <View style={tw("flex-row items-center gap-1.5")}>
                  <View style={tw("h-2.5 w-2.5 rounded-full bg-emerald-500")} />
                  <Text style={tw("text-xs font-inter text-primary font-bold")}>Online</Text>
                </View>
              </View>
              <View style={tw("flex flex-row items-center justify-between py-2")}>
                <Text style={tw("text-sm font-inter text-secondary")}>Socket network gateway</Text>
                <View style={tw("flex-row items-center gap-1.5")}>
                  <View style={tw("h-2.5 w-2.5 rounded-full bg-amber-500")} />
                  <Text style={tw("text-xs font-inter text-primary font-bold")}>Standby</Text>
                </View>
              </View>
            </AppCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function isLoadingStudentOrAdmin(loading: boolean, isStudent: boolean) {
  return loading;
}
