import { api } from "./api";

// Student Analytics
export const getStudentHistory = async () => {
  const response = await api.get("/analytics/history");
  return response.data;
};

export const getFavoritePrinter = async () => {
  const response = await api.get("/analytics/favorite-printer");
  return response.data;
};

// Admin & Operator Analytics
export const getAdminDashboard = async () => {
  const response = await api.get("/admin-analytics/dashboard");
  return response.data;
};

export const getAdminPrinters = async () => {
  const response = await api.get("/admin-analytics/printers");
  return response.data;
};

export const getAdminTrends = async () => {
  const response = await api.get("/admin-analytics/monthly-trends");
  return response.data;
};

export const getAdminTopUsers = async () => {
  const response = await api.get("/admin-analytics/top-users");
  return response.data;
};
