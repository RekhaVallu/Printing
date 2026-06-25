import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../constants/colors";

type ThemeType = "light" | "dark";

interface ThemeContextProps {
  theme: ThemeType;
  colors: typeof colors.light;
  isDark: boolean;
  toggleTheme: () => void;
  tw: (classes: string) => any;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_STORAGE_KEY = "@printflow_theme_preference";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("dark"); // default to dark per visuals request

  useEffect(() => {
    // Load theme from storage or system scheme
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === "light" || storedTheme === "dark") {
          setTheme(storedTheme);
        } else if (systemColorScheme) {
          setTheme(systemColorScheme);
        }
      } catch (e) {
        console.error("Failed to load theme preference", e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  };

  const activeColors = theme === "light" ? colors.light : colors.dark;
  const isDark = theme === "dark";

  // Dynamic Tailwind utility mapping function
  const tw = (classes: string): any => {
    if (!classes) return {};
    const parsedStyles: any = {};
    const classList = classes.split(/\s+/).filter(Boolean);

    classList.forEach((className) => {
      // 1. Spacing Layout
      // Padding
      let match = className.match(/^p-(\d+)$/);
      if (match) { parsedStyles.padding = parseInt(match[1]) * 4; return; }
      match = className.match(/^px-(\d+)$/);
      if (match) { parsedStyles.paddingHorizontal = parseInt(match[1]) * 4; return; }
      match = className.match(/^py-(\d+)$/);
      if (match) { parsedStyles.paddingVertical = parseInt(match[1]) * 4; return; }
      match = className.match(/^pt-(\d+)$/);
      if (match) { parsedStyles.paddingTop = parseInt(match[1]) * 4; return; }
      match = className.match(/^pb-(\d+)$/);
      if (match) { parsedStyles.paddingBottom = parseInt(match[1]) * 4; return; }
      match = className.match(/^pl-(\d+)$/);
      if (match) { parsedStyles.paddingLeft = parseInt(match[1]) * 4; return; }
      match = className.match(/^pr-(\d+)$/);
      if (match) { parsedStyles.paddingRight = parseInt(match[1]) * 4; return; }

      // Margin
      match = className.match(/^m-(\d+)$/);
      if (match) { parsedStyles.margin = parseInt(match[1]) * 4; return; }
      match = className.match(/^mx-(\d+)$/);
      if (match) { parsedStyles.marginHorizontal = parseInt(match[1]) * 4; return; }
      match = className.match(/^my-(\d+)$/);
      if (match) { parsedStyles.marginVertical = parseInt(match[1]) * 4; return; }
      match = className.match(/^mt-(\d+)$/);
      if (match) { parsedStyles.marginTop = parseInt(match[1]) * 4; return; }
      match = className.match(/^mb-(\d+)$/);
      if (match) { parsedStyles.marginBottom = parseInt(match[1]) * 4; return; }
      match = className.match(/^ml-(\d+)$/);
      if (match) { parsedStyles.marginLeft = parseInt(match[1]) * 4; return; }
      match = className.match(/^mr-(\d+)$/);
      if (match) { parsedStyles.marginRight = parseInt(match[1]) * 4; return; }

      // Gap
      match = className.match(/^gap-(\d+)$/);
      if (match) { parsedStyles.gap = parseInt(match[1]) * 4; return; }

      // 2. Width / Height
      match = className.match(/^w-(\d+)$/);
      if (match) { parsedStyles.width = parseInt(match[1]) * 4; return; }
      match = className.match(/^h-(\d+)$/);
      if (match) { parsedStyles.height = parseInt(match[1]) * 4; return; }
      match = className.match(/^w-(\d+)%$/);
      if (match) { parsedStyles.width = `${match[1]}%`; return; }
      match = className.match(/^h-(\d+)%$/);
      if (match) { parsedStyles.height = `${match[1]}%`; return; }

      // 3. Static Style Properties
      switch (className) {
        // Flexbox
        case "flex": parsedStyles.display = "flex"; break;
        case "flex-1": parsedStyles.flex = 1; break;
        case "flex-grow": parsedStyles.flexGrow = 1; break;
        case "flex-shrink-0": parsedStyles.flexShrink = 0; break;
        case "flex-row": parsedStyles.flexDirection = "row"; break;
        case "flex-col": parsedStyles.flexDirection = "column"; break;
        case "flex-wrap": parsedStyles.flexWrap = "wrap"; break;
        case "items-center": parsedStyles.alignItems = "center"; break;
        case "items-start": parsedStyles.alignItems = "flex-start"; break;
        case "items-end": parsedStyles.alignItems = "flex-end"; break;
        case "justify-center": parsedStyles.justifyContent = "center"; break;
        case "justify-between": parsedStyles.justifyContent = "space-between"; break;
        case "justify-start": parsedStyles.justifyContent = "flex-start"; break;
        case "justify-end": parsedStyles.justifyContent = "flex-end"; break;
        case "align-self-start": parsedStyles.alignSelf = "flex-start"; break;
        case "align-self-center": parsedStyles.alignSelf = "center"; break;
        case "align-self-end": parsedStyles.alignSelf = "flex-end"; break;

        // Display
        case "absolute": parsedStyles.position = "absolute"; break;
        case "relative": parsedStyles.position = "relative"; break;
        case "top-0": parsedStyles.top = 0; break;
        case "bottom-0": parsedStyles.bottom = 0; break;
        case "left-0": parsedStyles.left = 0; break;
        case "right-0": parsedStyles.right = 0; break;
        case "z-10": parsedStyles.zIndex = 10; break;
        case "z-20": parsedStyles.zIndex = 20; break;
        case "overflow-hidden": parsedStyles.overflow = "hidden"; break;

        // Size helpers
        case "w-full": parsedStyles.width = "100%"; break;
        case "w-half": parsedStyles.width = "50%"; break;
        case "h-full": parsedStyles.height = "100%"; break;
        case "h-auto": parsedStyles.height = "auto"; break;

        // Typography Sizes
        case "text-xs": parsedStyles.fontSize = 12; parsedStyles.lineHeight = 16; break;
        case "text-sm": parsedStyles.fontSize = 14; parsedStyles.lineHeight = 20; break;
        case "text-base": parsedStyles.fontSize = 16; parsedStyles.lineHeight = 24; break;
        case "text-lg": parsedStyles.fontSize = 18; parsedStyles.lineHeight = 28; break;
        case "text-xl": parsedStyles.fontSize = 20; parsedStyles.lineHeight = 28; break;
        case "text-2xl": parsedStyles.fontSize = 24; parsedStyles.lineHeight = 32; break;
        case "text-3xl": parsedStyles.fontSize = 30; parsedStyles.lineHeight = 36; break;
        case "text-4xl": parsedStyles.fontSize = 36; parsedStyles.lineHeight = 44; break;
        case "text-5xl": parsedStyles.fontSize = 48; parsedStyles.lineHeight = 56; break;

        // Typography Weights & Alignment
        case "font-normal": parsedStyles.fontWeight = "400"; break;
        case "font-medium": parsedStyles.fontWeight = "500"; break;
        case "font-semibold": parsedStyles.fontWeight = "600"; break;
        case "font-bold": parsedStyles.fontWeight = "700"; break;
        case "text-center": parsedStyles.textAlign = "center"; break;
        case "text-left": parsedStyles.textAlign = "left"; break;
        case "text-right": parsedStyles.textAlign = "right"; break;

        // Fonts
        case "font-space": parsedStyles.fontFamily = "SpaceGrotesk_600SemiBold"; break;
        case "font-space-bold": parsedStyles.fontFamily = "SpaceGrotesk_700Bold"; break;
        case "font-space-medium": parsedStyles.fontFamily = "SpaceGrotesk_500Medium"; break;
        case "font-inter": parsedStyles.fontFamily = "Inter_400Regular"; break;
        case "font-inter-medium": parsedStyles.fontFamily = "Inter_500Medium"; break;
        case "font-inter-semibold": parsedStyles.fontFamily = "Inter_600SemiBold"; break;
        case "font-inter-bold": parsedStyles.fontFamily = "Inter_700Bold"; break;

        // Borders Widths
        case "border": parsedStyles.borderWidth = 1; break;
        case "border-b": parsedStyles.borderBottomWidth = 1; break;
        case "border-t": parsedStyles.borderTopWidth = 1; break;
        case "border-l": parsedStyles.borderLeftWidth = 1; break;
        case "border-r": parsedStyles.borderRightWidth = 1; break;
        case "border-2": parsedStyles.borderWidth = 2; break;

        // Border Radii
        case "rounded-none": parsedStyles.borderRadius = 0; break;
        case "rounded-sm": parsedStyles.borderRadius = 4; break;
        case "rounded": parsedStyles.borderRadius = 6; break;
        case "rounded-md": parsedStyles.borderRadius = 8; break;
        case "rounded-lg": parsedStyles.borderRadius = 12; break;
        case "rounded-xl": parsedStyles.borderRadius = 16; break;
        case "rounded-2xl": parsedStyles.borderRadius = 20; break; // card border radius
        case "rounded-3xl": parsedStyles.borderRadius = 28; break;
        case "rounded-full": parsedStyles.borderRadius = 9999; break;

        // Shadows
        case "shadow-none": parsedStyles.shadowOpacity = 0; parsedStyles.elevation = 0; break;
        case "shadow-sm":
          parsedStyles.shadowColor = "#000";
          parsedStyles.shadowOffset = { width: 0, height: 1 };
          parsedStyles.shadowOpacity = 0.05;
          parsedStyles.shadowRadius = 2;
          parsedStyles.elevation = 1;
          break;
        case "shadow":
        case "shadow-md":
          parsedStyles.shadowColor = "#000";
          parsedStyles.shadowOffset = { width: 0, height: 4 };
          parsedStyles.shadowOpacity = 0.08;
          parsedStyles.shadowRadius = 8;
          parsedStyles.elevation = 3;
          break;
        case "shadow-lg":
          parsedStyles.shadowColor = "#000";
          parsedStyles.shadowOffset = { width: 0, height: 10 };
          parsedStyles.shadowOpacity = 0.12;
          parsedStyles.shadowRadius = 16;
          parsedStyles.elevation = 6;
          break;

        // Background Theme Colors
        case "bg-background": parsedStyles.backgroundColor = activeColors.background; break;
        case "bg-surface": parsedStyles.backgroundColor = activeColors.surface; break;
        case "bg-card": parsedStyles.backgroundColor = activeColors.card; break;
        case "bg-transparent": parsedStyles.backgroundColor = "transparent"; break;

        // Background Brand Colors
        case "bg-emerald-50": parsedStyles.backgroundColor = "#F0FDF4"; break;
        case "bg-emerald-500": parsedStyles.backgroundColor = colors.emerald[500]; break;
        case "bg-emerald-600": parsedStyles.backgroundColor = colors.emerald[600]; break;
        case "bg-emerald-700": parsedStyles.backgroundColor = colors.emerald[700]; break;
        case "bg-emerald-800": parsedStyles.backgroundColor = colors.emerald[800]; break;

        // Background Slate Colors
        case "bg-slate-50": parsedStyles.backgroundColor = colors.slate[50]; break;
        case "bg-slate-100": parsedStyles.backgroundColor = colors.slate[100]; break;
        case "bg-slate-200": parsedStyles.backgroundColor = colors.slate[200]; break;
        case "bg-slate-300": parsedStyles.backgroundColor = colors.slate[300]; break;
        case "bg-slate-500": parsedStyles.backgroundColor = colors.slate[500]; break;
        case "bg-slate-800": parsedStyles.backgroundColor = colors.slate[800]; break;
        case "bg-slate-900": parsedStyles.backgroundColor = colors.slate[900]; break;
        case "bg-slate-950": parsedStyles.backgroundColor = colors.slate[950]; break;

        // Background States
        case "bg-red-500": parsedStyles.backgroundColor = activeColors.danger; break;
        case "bg-red-50": parsedStyles.backgroundColor = "#FEF2F2"; break;
        case "bg-amber-500": parsedStyles.backgroundColor = activeColors.warning; break;
        case "bg-amber-50": parsedStyles.backgroundColor = "#FFFBEB"; break;
        case "bg-blue-500": parsedStyles.backgroundColor = activeColors.info; break;
        case "bg-blue-50": parsedStyles.backgroundColor = "#EFF6FF"; break;

        // Text Theme Colors
        case "text-primary":
        case "text-text":
          parsedStyles.color = activeColors.text; break;
        case "text-secondary":
        case "text-muted":
          parsedStyles.color = activeColors.textSecondary; break;
        case "text-white": parsedStyles.color = "#FFFFFF"; break;

        // Text Brand Colors
        case "text-emerald-500": parsedStyles.color = colors.emerald[500]; break;
        case "text-emerald-600": parsedStyles.color = colors.emerald[600]; break;
        case "text-emerald-700": parsedStyles.color = colors.emerald[700]; break;

        // Text Slate Colors
        case "text-slate-100": parsedStyles.color = colors.slate[100]; break;
        case "text-slate-300": parsedStyles.color = colors.slate[300]; break;
        case "text-slate-400": parsedStyles.color = colors.slate[400]; break;
        case "text-slate-500": parsedStyles.color = colors.slate[500]; break;
        case "text-slate-600": parsedStyles.color = colors.slate[600]; break;
        case "text-slate-700": parsedStyles.color = colors.slate[700]; break;
        case "text-slate-800": parsedStyles.color = colors.slate[800]; break;
        case "text-slate-900": parsedStyles.color = colors.slate[900]; break;

        // Text State Colors
        case "text-red-500": parsedStyles.color = activeColors.danger; break;
        case "text-red-600": parsedStyles.color = "#DC2626"; break;
        case "text-amber-500": parsedStyles.color = activeColors.warning; break;
        case "text-amber-600": parsedStyles.color = "#D97706"; break;
        case "text-blue-500": parsedStyles.color = activeColors.info; break;
        case "text-blue-600": parsedStyles.color = "#2563EB"; break;

        // Borders Theme Colors
        case "border-border": parsedStyles.borderColor = activeColors.border; break;
        case "border-transparent": parsedStyles.borderColor = "transparent"; break;

        // Borders Brand Colors
        case "border-emerald-500": parsedStyles.borderColor = colors.emerald[500]; break;
        case "border-emerald-600": parsedStyles.borderColor = colors.emerald[600]; break;

        // Borders Slate Colors
        case "border-slate-100": parsedStyles.borderColor = colors.slate[100]; break;
        case "border-slate-200": parsedStyles.borderColor = colors.slate[200]; break;
        case "border-slate-300": parsedStyles.borderColor = colors.slate[300]; break;
        case "border-slate-700": parsedStyles.borderColor = colors.slate[700]; break;
        case "border-slate-800": parsedStyles.borderColor = colors.slate[800]; break;

        // Border State Colors
        case "border-red-500": parsedStyles.borderColor = activeColors.danger; break;
        case "border-amber-500": parsedStyles.borderColor = activeColors.warning; break;
        case "border-blue-500": parsedStyles.borderColor = activeColors.info; break;

        // Opacity
        case "opacity-50": parsedStyles.opacity = 0.5; break;
        case "opacity-75": parsedStyles.opacity = 0.75; break;
        case "opacity-100": parsedStyles.opacity = 1; break;
      }
    });

    return parsedStyles;
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: activeColors, isDark, toggleTheme, tw }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
