import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { FontAwesome6, Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  showBackButton,
  rightElement,
}) => {
  const { tw, colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      style={[
        tw("flex flex-row items-center justify-between px-5 pt-12 pb-4 bg-background border-b border-border w-full"),
        { minHeight: 90 },
      ]}
    >
      <View style={tw("flex flex-row items-center flex-1")}>
        {showBack || showBackButton ? (
          <AnimatedPressable
            entering={ZoomIn.delay(70).duration(220)}
            onPress={() => router.back()}
            style={tw("mr-4 h-11 w-11 rounded-full items-center justify-center border border-border bg-card")}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </AnimatedPressable>
        ) : null}
        <Text style={tw("text-2xl font-space-bold text-primary")} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={tw("flex-row items-center justify-end")}>
        {rightElement ? (
          rightElement
        ) : (
          <AnimatedPressable
            entering={ZoomIn.delay(120).duration(220)}
            onPress={() => router.push("/notifications")}
            style={tw("h-11 w-11 rounded-full items-center justify-center border border-border bg-card relative")}
            accessibilityRole="button"
            accessibilityLabel="View notifications"
          >
            <Feather name="bell" size={20} color={colors.text} />
            <View style={tw("absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-500")} />
          </AnimatedPressable>
        )}
      </View>
    </Animated.View>
  );
};
