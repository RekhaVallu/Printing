import React, { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, tw } = useTheme();
  
  const switchVal = useSharedValue(theme === "dark" ? 1 : 0);

  useEffect(() => {
    switchVal.value = withTiming(theme === "dark" ? 1 : 0, { duration: 250 });
  }, [theme]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: switchVal.value * 24,
        },
      ],
    };
  });

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      switchVal.value,
      [0, 1],
      ["#E2E8F0", "#334155"]
    );
    return {
      backgroundColor,
    };
  });

  return (
    <AnimatedPressable
      onPress={toggleTheme}
      style={[
        tw("w-14 h-8 rounded-full p-1 flex-row items-center relative justify-start"),
        animatedTrackStyle,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: theme === "dark" }}
      accessibilityLabel="Toggle Dark Mode"
    >
      <Animated.View
        style={[
          tw("h-6 w-6 rounded-full bg-emerald-500 items-center justify-center shadow-sm"),
          animatedCircleStyle,
        ]}
      >
        <Feather
          name={theme === "dark" ? "moon" : "sun"}
          size={12}
          color="#FFFFFF"
        />
      </Animated.View>
    </AnimatedPressable>
  );
};
