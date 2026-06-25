export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "accepted" | "printing" | "ready" | "priority_approved" | "priority_rejected";
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
