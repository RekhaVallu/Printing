import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export type OrderStatus = "pending" | "accepted" | "printing" | "ready" | "collected" | "cancelled";

export interface StatusBadgeProps {
  status: OrderStatus;
  style?: any;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const { tw } = useTheme();

  let badgeColorStyle = "bg-amber-50 border-amber-500/20 text-amber-600";
  let label = "Pending";

  switch (status) {
    case "pending":
      badgeColorStyle = "bg-amber-50 dark:bg-amber-950/20 border-amber-500/20 text-amber-600 dark:text-amber-500";
      label = "Pending";
      break;
    case "accepted":
      badgeColorStyle = "bg-blue-50 dark:bg-blue-950/20 border-blue-500/20 text-blue-600 dark:text-blue-500";
      label = "Accepted";
      break;
    case "printing":
      badgeColorStyle = "bg-purple-50 dark:bg-purple-950/20 border-purple-500/20 text-purple-600 dark:text-purple-500";
      label = "Printing";
      break;
    case "ready":
      badgeColorStyle = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-500";
      label = "Ready";
      break;
    case "collected":
      badgeColorStyle = "bg-emerald-600 border-emerald-700 text-white";
      label = "Collected";
      break;
    case "cancelled":
      badgeColorStyle = "bg-red-50 dark:bg-red-950/20 border-red-500/20 text-red-600 dark:text-red-500";
      label = "Cancelled";
      break;
  }

  return (
    <View
      style={[
        tw(`px-3 py-1 rounded-full border items-center justify-center self-start ${badgeColorStyle}`),
        style,
      ]}
    >
      <Text style={tw("text-xs font-inter-semibold font-medium text-center uppercase tracking-wide")}>
        {label}
      </Text>
    </View>
  );
};
