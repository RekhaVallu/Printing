import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppButton } from "./AppButton";

export interface AppEmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
}) => {
  const { tw, colors } = useTheme();

  return (
    <View style={tw("flex-1 items-center justify-center p-8 bg-transparent my-10")}>
      <View style={tw("h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center mb-6")}>
        <Feather name={icon} size={36} color={colors.accent} />
      </View>
      <Text style={tw("text-xl font-space-bold text-primary text-center mb-2")}>
        {title}
      </Text>
      <Text style={tw("text-sm font-inter text-secondary text-center mb-8 px-4")}>
        {description}
      </Text>
      {actionTitle && onActionPress && (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          style={tw("w-full max-w-[240px]")}
        />
      )}
    </View>
  );
};
