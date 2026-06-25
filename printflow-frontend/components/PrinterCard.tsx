import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppCard } from "./AppCard";

export interface PrinterCardProps {
  name: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  printerType: "bw" | "color";
  pagesPerMinute: number;
  currentQueueLength: number;
  onPress?: () => void;
  selected?: boolean;
}

export const PrinterCard: React.FC<PrinterCardProps> = ({
  name,
  location,
  status,
  printerType,
  pagesPerMinute,
  currentQueueLength,
  onPress,
  selected = false,
}) => {
  const { tw, colors } = useTheme();

  // Status color dot
  let statusDotColor = "bg-slate-400";
  let statusLabel = "Offline";
  if (status === "online") {
    statusDotColor = "bg-emerald-500";
    statusLabel = "Online";
  } else if (status === "maintenance") {
    statusDotColor = "bg-amber-500";
    statusLabel = "Maintenance";
  }

  const borderStyle = selected ? { borderColor: colors.accent, borderWidth: 2 } : {};

  return (
    <AppCard
      onPress={status === "online" ? onPress : undefined}
      style={[tw(status !== "online" ? "opacity-60" : ""), borderStyle]}
    >
      <View style={tw("flex flex-row items-center justify-between mb-3")}>
        <View style={tw("flex flex-row items-center gap-2")}>
          <Feather name="printer" size={20} color={colors.text} />
          <Text style={tw("text-lg font-space-bold text-primary")}>{name}</Text>
        </View>
        
        {/* Status Dot */}
        <View style={tw("flex flex-row items-center gap-1.5")}>
          <View style={tw(`h-2.5 w-2.5 rounded-full ${statusDotColor}`)} />
          <Text style={tw("text-xs font-inter text-secondary")}>{statusLabel}</Text>
        </View>
      </View>

      <View style={tw("flex flex-row items-center justify-between text-secondary mb-4")}>
        <View style={tw("flex flex-row items-center gap-1")}>
          <Feather name="map-pin" size={14} color={colors.textSecondary} />
          <Text style={tw("text-sm font-inter text-secondary")}>{location}</Text>
        </View>

        <Text style={tw("text-xs font-space-bold text-emerald-500 uppercase tracking-wide")}>
          {printerType === "color" ? "Color Print" : "Black & White"}
        </Text>
      </View>

      <View style={tw("flex flex-row items-center justify-between pt-3 border-t border-border")}>
        <View style={tw("flex flex-row items-center gap-1.5")}>
          <Feather name="clock" size={14} color={colors.textSecondary} />
          <Text style={tw("text-xs font-inter text-secondary")}>
            {pagesPerMinute} pages/min
          </Text>
        </View>

        <View style={tw("flex flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg")}>
          <Feather name="users" size={12} color={colors.textSecondary} />
          <Text style={tw("text-xs font-inter-semibold text-primary")}>
            Queue: {currentQueueLength} jobs
          </Text>
        </View>
      </View>
    </AppCard>
  );
};
