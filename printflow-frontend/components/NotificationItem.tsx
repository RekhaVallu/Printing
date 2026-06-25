import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface NotificationItemProps {
  title: string;
  message: string;
  type:
    | "created"
    | "accepted"
    | "printing"
    | "ready"
    | "priority_requested"
    | "priority_approved"
    | "priority_rejected"
    | "printer_status_changed";
  timestamp: Date | string;
  read: boolean;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  message,
  type,
  timestamp,
  read,
  onPress,
}) => {
  const { tw, colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 240 });
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [opacity, translateX]);

  const animatedStyle = useAnimatedStyle<any>(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  // Pick icon name & badge color based on notification type
  let iconName: keyof typeof Feather.glyphMap = "info";
  let iconBgColor = "bg-blue-50 dark:bg-blue-950/20";
  let iconColor = colors.info;

  if (type === "ready") {
    iconName = "check-circle";
    iconBgColor = "bg-emerald-50 dark:bg-emerald-950/20";
    iconColor = colors.success;
  } else if (type === "created" || type === "priority_requested") {
    iconName = "info";
    iconBgColor = "bg-blue-50 dark:bg-blue-950/20";
    iconColor = colors.info;
  } else if (type === "printing") {
    iconName = "printer";
    iconBgColor = "bg-purple-50 dark:bg-purple-950/20";
    iconColor = "#8B5CF6";
  } else if (type === "priority_approved") {
    iconName = "trending-up";
    iconBgColor = "bg-emerald-50 dark:bg-emerald-950/20";
    iconColor = colors.success;
  } else if (type === "priority_rejected") {
    iconName = "alert-circle";
    iconBgColor = "bg-red-50 dark:bg-red-950/20";
    iconColor = colors.danger;
  }

  // Format relative time helper
  const getRelativeTime = (time: Date | string) => {
    const date = typeof time === "string" ? new Date(time) : time;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const itemBg = read ? "bg-transparent" : "bg-emerald-500/5 dark:bg-emerald-500/10";
  const itemBorder = read ? "border-border" : "border-emerald-500/20";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      style={[tw(`flex flex-row items-start p-4 border-b ${itemBorder} ${itemBg} w-full`), animatedStyle]}
      accessibilityRole="button"
    >
      <View style={tw(`h-10 w-10 rounded-full items-center justify-center mr-3 flex-shrink-0 ${iconBgColor}`)}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>

      <View style={tw("flex-1 mr-2")}>
        <View style={tw("flex flex-row items-center justify-between mb-1")}>
          <Text style={tw(`text-sm font-inter-bold font-semibold ${read ? "text-primary" : "text-emerald-500 font-bold"}`)}>
            {title}
          </Text>
          <Text style={tw("text-xs font-inter text-secondary")}>
            {getRelativeTime(timestamp)}
          </Text>
        </View>

        <Text style={tw("text-xs font-inter text-secondary")} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {!read && (
        <View style={tw("h-2 w-2 rounded-full bg-emerald-500 align-self-center ml-1 flex-shrink-0")} />
      )}
    </AnimatedPressable>
  );
};
