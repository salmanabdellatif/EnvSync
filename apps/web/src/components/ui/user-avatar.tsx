"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatar && <AvatarImage src={avatar} alt={name} />}
      <AvatarFallback className="bg-muted text-foreground font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface AvatarStackProps {
  users: Array<{ name: string; avatar?: string | null }>;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarStack({ users, max = 4, size = "sm" }: AvatarStackProps) {
  const displayedUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayedUsers.map((user, index) => (
        <UserAvatar
          key={index}
          name={user.name}
          avatar={user.avatar}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
            sizeClasses[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
