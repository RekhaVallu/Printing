import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppCard } from "./AppCard";

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // e.g. +12 or -5
  icon: keyof typeof Feather.glyphMap;
  variant?: "normal" | "green";
  style?: any;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  variant = "normal",
  style,
}) => {
  const { tw, colors } = useTheme();

  const isGreen = variant === "green";
  const bgStyle = isGreen ? "bg-emerald-600 border-emerald-700" : "bg-card";
  const titleColor = isGreen ? "text-emerald-100" : "text-secondary";
  const valueColor = isGreen ? "text-white" : "text-primary";
  const subtitleColor = isGreen ? "text-emerald-200" : "text-secondary text-muted";
  const iconColor = isGreen ? "#FFFFFF" : colors.accent;

  return (
    <AppCard style={[tw(`${bgStyle}`), style]}>
      <View style={tw("flex flex-row justify-between items-start mb-4")}>
        <View style={tw("flex-1 mr-2")}>
          <Text style={tw(`text-xs font-inter-semibold uppercase tracking-wider ${titleColor}`)}>
            {title}
          </Text>
        </View>
        <View style={tw(`h-8 w-8 rounded-lg items-center justify-center ${isGreen ? "bg-emerald-500/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`)}>
          <Feather name={icon} size={16} color={iconColor} />
        </View>
      </View>

      <Text style={tw(`text-3xl font-space-bold mb-1 ${valueColor}`)}>
        {value}
      </Text>

      <View style={tw("flex flex-row items-center justify-between")}>
        {subtitle && (
          <Text style={tw(`text-xs font-inter ${subtitleColor}`)}>
            {subtitle}
          </Text>
        )}

        {change !== undefined && (
          <View style={tw("flex flex-row items-center gap-0.5")}>
            <Feather
              name={change >= 0 ? "trending-up" : "trending-down"}
              size={12}
              color={change >= 0 ? (isGreen ? "#FFFFFF" : colors.accent) : colors.danger}
            />
            <Text
              style={[
                tw(`text-xs font-inter-semibold ${isGreen ? "text-white" : ""}`),
                { color: change >= 0 ? (isGreen ? "#FFFFFF" : colors.accent) : colors.danger },
              ]}
            >
              {change >= 0 ? `+${change}%` : `${change}%`}
            </Text>
          </View>
        )}
      </View>
    </AppCard>
  );
};
