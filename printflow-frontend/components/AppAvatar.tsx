import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export interface AppAvatarProps {
  name: string;
  size?: number;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({ name, size = 48 }) => {
  const { tw, colors } = useTheme();

  const getInitials = (fullName: string) => {
    if (!fullName) return "PF";
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <View
      style={[
        tw("rounded-full items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20"),
        { width: size, height: size },
      ]}
    >
      <Text
        style={[
          tw("font-space-bold text-emerald-600 dark:text-emerald-500"),
          { fontSize: size * 0.4 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
};
