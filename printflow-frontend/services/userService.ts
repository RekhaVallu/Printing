import { api } from "./api";

export interface SyncUserData {
  clerkId: string;
  email: string;
  name: string;
  rollNo?: string;
  department?: string;
}

export const syncUser = async (data: SyncUserData) => {
  const response = await api.post("/users/sync", data);
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const changeUserRole = async (id: string, role: "student" | "faculty" | "operator" | "admin") => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data;
};

export const assignPrintersToOperator = async (id: string, printerIds: string[]) => {
  const response = await api.patch(`/users/${id}/assigned-printers`, { printerIds });
  return response.data;
};
