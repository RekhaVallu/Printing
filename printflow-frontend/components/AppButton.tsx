import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}) => {
  const { tw, colors } = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  React.useEffect(() => {
    if (variant === "primary" && !disabled && !loading) {
      glow.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
    } else {
      glow.value = withTiming(0, { duration: 180 });
    }
  }, [disabled, glow, loading, variant]);

  const animatedStyle = useAnimatedStyle<any>(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const sheenStyle = useAnimatedStyle<any>(() => {
    const translateX = interpolate(glow.value, [0, 1], [-90, 90]);
    return {
      opacity: variant === "primary" ? 0.18 : 0,
      transform: [{ translateX }, { rotate: "14deg" }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.965, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 13, stiffness: 220 });
  };

  let btnStyle = "rounded-xl py-4 px-6 min-h-12 items-center justify-center flex-row overflow-hidden";
  let textStyle = "font-inter-bold text-base text-center flex-shrink";

  if (variant === "primary") {
    // Custom green gradient simulation style
    btnStyle += " bg-emerald-600";
    textStyle += " text-white";
  } else if (variant === "secondary") {
    btnStyle += " bg-white border border-slate-200";
    textStyle += " text-emerald-600";
  } else if (variant === "danger") {
    btnStyle += " bg-red-500";
    textStyle += " text-white";
  } else if (variant === "outline") {
    btnStyle += " bg-transparent border border-border";
    textStyle += " text-primary";
  }

  // Handle dark mode variations for secondary and outline
  const isDark = colors.background === "#020617";
  if (isDark && variant === "secondary") {
    btnStyle = "rounded-xl py-4 px-6 min-h-12 items-center justify-center flex-row shadow-sm bg-slate-800 border border-slate-700";
    textStyle = "font-inter-bold text-base text-center flex-shrink text-emerald-500";
  }

  if (disabled || loading) {
    btnStyle += " opacity-50";
  }

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[tw(btnStyle), animatedStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      <AnimatedView
        pointerEvents="none"
        style={[
          tw("absolute top-0 bottom-0 w-16"),
          sheenStyle,
          { left: "50%", backgroundColor: "#FFFFFF" },
        ]}
      />
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.accent : "#FFFFFF"} size="small" />
      ) : (
        <Text style={tw(textStyle)} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};
