import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

export const AppLoader: React.FC = () => {
  const { tw, colors } = useTheme();
  return (
    <View style={tw("flex-1 justify-center items-center bg-background")}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
};

export const SkeletonLoader: React.FC<{ height?: number; width?: string | number; style?: any }> = ({
  height = 20,
  width = "100%",
  style,
}) => {
  const { tw } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 700 }),
        withTiming(0.4, { duration: 700 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        tw("bg-slate-200 dark:bg-slate-800 rounded-lg"),
        { height, width },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  const { tw } = useTheme();
  return (
    <View style={tw("bg-card rounded-2xl border border-border p-5 mb-4 shadow-sm gap-3")}>
      <SkeletonLoader height={24} width="60%" />
      <SkeletonLoader height={16} width="40%" />
      <View style={tw("flex flex-row justify-between mt-2")}>
        <SkeletonLoader height={16} width="30%" />
        <SkeletonLoader height={16} width="25%" />
      </View>
    </View>
  );
};
