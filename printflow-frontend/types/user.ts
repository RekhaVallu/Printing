export interface User {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "operator" | "admin";
  rollNo?: string;
  department?: string;
  assignedPrinters?: string[];
  createdAt: string;
  updatedAt: string;
}
