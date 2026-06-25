import { useSocket } from "../context/SocketContext";

export function useNotifications() {
  return useSocket();
}
