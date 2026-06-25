import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: any;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = "default",
  autoCapitalize = "none",
  leftIcon,
  rightIcon,
  style,
}) => {
  const { tw, colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle = "flex flex-col gap-2 w-full mb-4";
  
  // Dynamic border color based on focus & error
  let inputBorderStyle = "border-slate-200";
  if (isFocused) {
    inputBorderStyle = "border-emerald-500";
  }
  if (error) {
    inputBorderStyle = "border-red-500";
  }

  const isDark = colors.background === "#020617";
  if (isDark && !isFocused && !error) {
    inputBorderStyle = "border-slate-700";
  }

  const inputStyle = `flex flex-row items-center border rounded-xl px-4 h-12 bg-card ${inputBorderStyle}`;

  return (
    <View style={tw(containerStyle)}>
      {label && (
        <Text style={tw("text-sm font-inter-semibold text-secondary text-left")}>
          {label}
        </Text>
      )}
      <View style={tw(inputStyle)}>
        {leftIcon && <View style={tw("mr-2")}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? colors.textSecondary : "#94A3B8"}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            tw("flex-1 text-base font-inter text-primary h-full"),
            { paddingVertical: 0 },
            style,
          ]}
          accessibilityLabel={label}
        />
        {rightIcon && <View style={tw("ml-2")}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={tw("text-xs font-inter text-red-500 text-left mt-0.5")}>
          {error}
        </Text>
      )}
    </View>
  );
};
