import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

export interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  noPadding?: boolean;
  enteringDelay?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  style,
  noPadding = false,
  enteringDelay = 0,
}) => {
  const { tw, colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(enteringDelay, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(
      enteringDelay,
      withSpring(0, { damping: 18, stiffness: 170 })
    );
  }, [enteringDelay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle<any>(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.985, { damping: 16, stiffness: 260 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  };

  const cardStyle = `bg-card rounded-xl border border-border ${noPadding ? "" : "p-5"}`;
  const surfaceStyle = {
    shadowColor: isDark ? colors.accent : "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.1 : 0.08,
    shadowRadius: 22,
    elevation: 3,
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[tw(cardStyle), surfaceStyle, animatedStyle, style]}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedView style={[tw(cardStyle), surfaceStyle, animatedStyle, style]}>
      {children}
    </AnimatedView>
  );
};
