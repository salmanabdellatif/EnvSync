"use client";

import { type ProjectMember } from "@/lib/schemas";
import {
  type Role,
  canModifyMember,
  getAssignableRoles,
  formatRole,
} from "@/lib/roles";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserMinus, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberRowProps {
  member: ProjectMember;
  currentUserRole?: Role;
  onUpdateRole?: (userId: string, newRole: string) => void;
  onRemove?: (userId: string) => void;
}

export function MemberRow({
  member,
  currentUserRole,
  onUpdateRole,
  onRemove,
}: MemberRowProps) {
  // Can modify if current user has higher rank
  const canModify = canModifyMember(currentUserRole, member.role);

  // Roles current user can assign
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Check if member has wrapped key (for ghost member detection)
  const hasWrappedKey = !!member.wrappedKey;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar
          name={member.user.name}
          avatar={member.user.avatar}
          size="md"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{member.user.name}</span>
            <RoleBadge role={member.role} size="sm" />
            {!hasWrappedKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Pending</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>
                      This user cannot access secrets yet. Run{" "}
                      <code className="bg-muted-foreground px-1 rounded">
                        envsync grant {member.user.email}
                      </code>{" "}
                      to grant access.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span className="text-sm text-muted-foreground truncate block">
            {member.user.email}
          </span>
        </div>
      </div>

      {/* Actions */}
      {canModify && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-muted *:hover:text-muted-foreground *:cursor-pointer"
          >
            {assignableRoles
              .filter((r) => r !== member.role)
              .map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => onUpdateRole?.(member.userId, role)}
                >
                  Make {formatRole(role)}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove?.(member.userId)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
