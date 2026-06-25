import { User } from "./user";
import { Printer } from "./printer";

export interface Order {
  _id: string;
  userId: string | User;
  printerId: string | Printer;
  fileName: string;
  fileUrl: string;
  totalPages: number;
  copies: number;
  printSides: "single" | "double";
  status: "pending" | "accepted" | "printing" | "ready" | "collected" | "cancelled";
  priorityLevel: "normal" | "priority";
  priorityScore: number;
  priorityRequested: boolean;
  priorityApproved: boolean;
  priorityReason?: string;
  confidential: boolean;
  queuePosition: number;
  eta: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}
