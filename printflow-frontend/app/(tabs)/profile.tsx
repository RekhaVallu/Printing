import React, { useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppAuth } from "../../context/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppAvatar } from "../../components/AppAvatar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { trackEvent, resetUser } from "../../utils/posthog";

export default function Profile() {
  const { signOut } = useAuth();
  const { dbUser } = useAppAuth();
  const { tw, colors, theme } = useTheme();

  useEffect(() => {
    trackEvent("screen_viewed", { screenName: "profile" });
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      resetUser();
      trackEvent("feature_used", { featureName: "sign_out" });
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const isDark = theme === "dark";

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="Profile & Preferences" />

      <ScrollView contentContainerStyle={tw("p-5 pb-12")} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        {dbUser && (
          <AppCard style={tw("flex flex-row items-center p-5 mb-6 bg-card")}>
            <AppAvatar name={dbUser.name} size={64} />
            <View style={tw("ml-4 flex-1")}>
              <Text style={tw("text-lg font-space-bold text-primary font-bold")}>
                {dbUser.name}
              </Text>
              <Text style={tw("text-xs font-inter text-secondary mt-0.5")} numberOfLines={1}>
                {dbUser.email}
              </Text>
              
              {/* Role badge */}
              <View style={tw("flex-row mt-2")}>
                <View style={tw("bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded-md")}>
                  <Text style={tw("text-[10px] font-space-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider")}>
                    {dbUser.role}
                  </Text>
                </View>
              </View>
            </View>
          </AppCard>
        )}

        {/* Student Details Card */}
        {dbUser?.role === "student" && (
          <>
            <Text style={tw("text-xs font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
              Academic Details
            </Text>
            <AppCard style={tw("p-5 mb-6 bg-card gap-4")}>
              <View style={tw("flex flex-row justify-between items-center")}>
                <Text style={tw("text-sm font-inter text-secondary")}>Roll Number</Text>
                <Text style={tw("text-sm font-inter-semibold text-primary font-bold")}>
                  {dbUser.rollNo || "N/A"}
                </Text>
              </View>
              <View style={tw("flex flex-row justify-between items-center")}>
                <Text style={tw("text-sm font-inter text-secondary")}>Department</Text>
                <Text style={tw("text-sm font-inter-semibold text-primary font-bold")}>
                  {dbUser.department || "N/A"}
                </Text>
              </View>
            </AppCard>
          </>
        )}

        {/* App Settings Card */}
        <Text style={tw("text-xs font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Application Settings
        </Text>
        <AppCard style={tw("p-5 mb-8 bg-card")}>
          {/* Theme Switcher */}
          <View style={tw("flex flex-row items-center justify-between py-1")}>
            <View style={tw("flex-row items-center gap-3")}>
              <View style={tw("h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center")}>
                <Feather name={isDark ? "moon" : "sun"} size={16} color={colors.accent} />
              </View>
              <View>
                <Text style={tw("text-sm font-inter-semibold text-primary font-bold")}>
                  Dark Interface
                </Text>
                <Text style={tw("text-[10px] font-inter text-secondary")}>
                  Toggle light or dark UI theme
                </Text>
              </View>
            </View>
            
            <ThemeToggle />
          </View>
        </AppCard>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          style={tw("flex flex-row items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10")}
          accessibilityRole="button"
          accessibilityLabel="Sign out of application"
        >
          <Feather name="log-out" size={18} color={colors.danger} style={tw("mr-2")} />
          <Text style={tw("text-sm font-inter-bold text-red-500 font-bold")}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
