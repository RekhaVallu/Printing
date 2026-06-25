import { Platform } from "react-native";

// NOTE: Expo injects env vars at build time. Avoid Node-only globals.
const env = {
  // Expo provides env vars at build time. Use safe access without relying on Node types.
  EXPO_PUBLIC_API_URL: (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_WEB_API_URL: (globalThis as any)?.process?.env?.EXPO_PUBLIC_WEB_API_URL,
  EXPO_PUBLIC_SOCKET_URL: (globalThis as any)?.process?.env?.EXPO_PUBLIC_SOCKET_URL,
  EXPO_PUBLIC_WEB_SOCKET_URL: (globalThis as any)?.process?.env?.EXPO_PUBLIC_WEB_SOCKET_URL,
};

const apiUrl =
  Platform.OS === "web" && env.EXPO_PUBLIC_WEB_API_URL
    ? env.EXPO_PUBLIC_WEB_API_URL
    : env.EXPO_PUBLIC_API_URL;

const socketUrl =
  Platform.OS === "web" && env.EXPO_PUBLIC_WEB_SOCKET_URL
    ? env.EXPO_PUBLIC_WEB_SOCKET_URL
    : env.EXPO_PUBLIC_SOCKET_URL;

export const API_BASE_URL: string =
  apiUrl || (Platform.OS === "web" ? "http://localhost:5000/api" : "http://192.168.137.1:5000/api");

// socket.io attaches to the HTTP server root (no /api)
export const SOCKET_BASE_URL: string =
  socketUrl || API_BASE_URL.replace(/\/api\/?$/, "");

if ((globalThis as any)?.__DEV__) {
  console.info("[PrintFlow] API_BASE_URL:", API_BASE_URL);
  console.info("[PrintFlow] SOCKET_BASE_URL:", SOCKET_BASE_URL);
}
