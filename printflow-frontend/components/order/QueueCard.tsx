import React from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppCard } from "../AppCard";
import { StatusBadge, OrderStatus } from "../StatusBadge";

export type QueueCardProps = {
  fileName: string;
  status: OrderStatus;
  queuePosition?: number;
  eta?: number;
  printerName?: string;
  userName?: string;
};

export default function QueueCard({
  fileName,
  status,
  queuePosition = 0,
  eta = 0,
  printerName,
  userName,
}: QueueCardProps) {
  const { tw, colors } = useTheme();

  return (
    <AppCard style={tw("p-4")}>
      <View style={tw("flex-row items-start justify-between gap-3 mb-3")}>
        <View style={tw("flex-1")}>
          <View style={tw("flex-row items-center gap-2")}>
            <Feather name="file-text" size={16} color={colors.accent} />
            <Text style={tw("text-sm font-inter-bold text-primary font-bold flex-1")} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
          <Text style={tw("text-xs font-inter text-secondary mt-1")}>
            {printerName || "Assigned printer"}{userName ? ` - ${userName}` : ""}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={tw("flex-row justify-between border-t border-border pt-3")}>
        <Text style={tw("text-xs font-inter text-secondary")}>Queue #{queuePosition}</Text>
        <Text style={tw("text-xs font-inter-semibold text-primary font-bold")}>{eta} mins</Text>
      </View>
    </AppCard>
  );
}
