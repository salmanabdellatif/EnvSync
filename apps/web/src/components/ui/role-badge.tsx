"use client";

import { cn } from "@/lib/utils";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md";
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  OWNER: {
    label: "Owner",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  },
  MEMBER: {
    label: "Member",
    className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  },
};

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
};

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded border",
        config.className,
        sizeClasses[size],
      )}
    >
      {config.label}
    </span>
  );
}
