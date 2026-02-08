/**
 * Role utility functions - works in both server and client components
 */

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ALL_ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export const roleLevels: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/**
 * Check if a role can edit project (add/update environments, manage members)
 */
export function canEditProject(role: Role | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if caller can modify a target member (change role, remove)
 * Only higher-ranked roles can modify lower-ranked ones
 */
export function canModifyMember(
  callerRole: Role | undefined,
  targetRole: Role,
): boolean {
  if (!callerRole) return false;
  return roleLevels[callerRole] > roleLevels[targetRole];
}

/**
 * Get roles that the current user can assign to others
 * - OWNER can assign any role
 * - ADMIN can assign ADMIN, MEMBER, VIEWER (not OWNER)
 * - Others cannot assign roles
 */
export function getAssignableRoles(currentUserRole: Role | undefined): Role[] {
  if (currentUserRole === "OWNER") {
    return ALL_ROLES;
  }
  if (currentUserRole === "ADMIN") {
    return ["ADMIN", "MEMBER", "VIEWER"];
  }
  return [];
}

/**
 * Format role for display (e.g., "ADMIN" -> "Admin")
 */
export function formatRole(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
