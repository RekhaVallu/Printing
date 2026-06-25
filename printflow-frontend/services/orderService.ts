import { api } from "./api";

export const createOrder = async (data: any) => {
  const response = await api.post("/orders", data);
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const cancelOrder = async (id: string) => {
  const response = await api.patch(`/orders/${id}/cancel`);
  return response.data;
};

export const requestPriority = async (id: string, reason: string) => {
  const response = await api.patch(`/orders/${id}/request-priority`, { reason });
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const confirmCollection = async (id: string, otp: string) => {
  const response = await api.patch(`/orders/${id}/confirm-collection`, { otp });
  return response.data;
};

export const getPendingPriorityRequests = async () => {
  const response = await api.get("/orders/priority/pending");
  return response.data;
};

export const approvePriority = async (id: string) => {
  const response = await api.patch(`/orders/${id}/approve-priority`);
  return response.data;
};

export const rejectPriority = async (id: string, reason: string) => {
  const response = await api.patch(`/orders/${id}/reject-priority`, { reason });
  return response.data;
};
