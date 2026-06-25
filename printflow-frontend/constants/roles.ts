export const USER_ROLES = ["student", "faculty", "operator", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  operator: "Operator",
  admin: "Admin",
};

export const isStaffRole = (role?: string | null) => role === "operator" || role === "admin";
export const isAdminRole = (role?: string | null) => role === "admin";
