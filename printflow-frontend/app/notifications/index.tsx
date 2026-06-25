import React, { useEffect } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "../../components/AppHeader";
import { AppButton } from "../../components/AppButton";
import { AppEmptyState } from "../../components/AppEmptyState";
import { NotificationItem } from "../../components/NotificationItem";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";

export default function NotificationsIndex() {
  const { tw, colors } = useTheme();
  const {
    connected,
    notifications,
    unreadCount,
    refreshNotifications,
    markAllRead,
    clearAll,
    markRead,
    simulateNotification,
  } = useSocket();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const confirmClear = () => {
    Alert.alert("Clear notifications?", "This removes all notifications from your inbox.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearAll },
    ]);
  };

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader
        title="Notifications"
        showBack
        rightElement={
          <View style={tw("flex-row items-center gap-2")}>
            <View
              style={tw(
                `h-10 px-3 rounded-full border flex-row items-center gap-2 ${
                  connected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-card border-border"
                }`
              )}
            >
              <View
                style={[
                  tw("h-2 w-2 rounded-full"),
                  { backgroundColor: connected ? colors.success : colors.textSecondary },
                ]}
              />
              <Text style={tw("text-xs font-inter-semibold text-secondary")}>
                {connected ? "Live" : "Offline"}
              </Text>
            </View>
          </View>
        }
      />

      <ScrollView contentContainerStyle={tw("pb-12")} showsVerticalScrollIndicator={false}>
        <View style={tw("p-5 gap-3")}>
          <View style={tw("flex-row items-center justify-between")}>
            <View>
              <Text style={tw("text-sm font-space-bold text-primary uppercase tracking-wider font-bold")}>
                Inbox
              </Text>
              <Text style={tw("text-xs font-inter text-secondary mt-1")}>
                {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={tw("flex-row gap-2")}>
              <Pressable
                onPress={() =>
                  simulateNotification("notification_created", {
                    title: "Live Socket Test",
                    message: "This is a local simulated notification event.",
                  })
                }
                style={tw("h-10 w-10 rounded-full bg-card border border-border items-center justify-center")}
                accessibilityRole="button"
                accessibilityLabel="Simulate notification"
              >
                <Feather name="zap" size={16} color={colors.accent} />
              </Pressable>
              <Pressable
                onPress={refreshNotifications}
                style={tw("h-10 w-10 rounded-full bg-card border border-border items-center justify-center")}
                accessibilityRole="button"
                accessibilityLabel="Refresh notifications"
              >
                <Feather name="refresh-cw" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {notifications.length > 0 ? (
            <View style={tw("flex-row gap-3")}>
              <AppButton title="Mark All Read" onPress={markAllRead} variant="outline" style={tw("flex-1 h-11")} />
              <AppButton title="Clear" onPress={confirmClear} variant="danger" style={tw("w-28 h-11")} />
            </View>
          ) : null}
        </View>

        {notifications.length === 0 ? (
          <View style={tw("px-5")}>
            <AppEmptyState
              icon="bell"
              title="No Notifications"
              description="Order updates, priority decisions, and printer alerts will appear here."
              actionTitle="Simulate Live Update"
              onActionPress={() =>
                simulateNotification("order_ready", {
                  orderId: "demo",
                  message: "Demo order is ready for pickup.",
                })
              }
            />
          </View>
        ) : (
          <View style={tw("border-t border-border")}>
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                title={item.title}
                message={item.message}
                type={item.type}
                timestamp={item.timestamp}
                read={item.read}
                onPress={() => markRead(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
