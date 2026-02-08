"use client";

import { type ProjectMember } from "@/lib/schemas";
import { MemberRow } from "./member-row";
import { AddMemberDialog } from "./add-member-dialog";
import { updateMemberRoleAction, removeMemberAction } from "@/actions/members";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { canEditProject, type Role } from "@/lib/roles";

interface MembersListProps {
  members: ProjectMember[];
  projectId: string;
  currentUserRole?: Role;
}

export function MembersList({
  members,
  projectId,
  currentUserRole,
}: MembersListProps) {
  const canManageMembers = canEditProject(currentUserRole);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const formData = new FormData();
    formData.append("role", newRole);

    const result = await updateMemberRoleAction(
      projectId,
      userId,
      {},
      formData,
    );

    if (result.success) {
      toast.success("Role updated successfully");
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleRemove = async (userId: string) => {
    const result = await removeMemberAction(projectId, userId);

    if (result.success) {
      toast.success(result.message || "Member removed");
    } else {
      toast.error(result.error || "Failed to remove member");
    }
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 bg-muted rounded-full mb-4">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No team members yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add team members to collaborate on this project.
        </p>
        {canManageMembers && currentUserRole && (
          <AddMemberDialog
            projectId={projectId}
            currentUserRole={currentUserRole}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        {canManageMembers && currentUserRole && (
          <AddMemberDialog
            projectId={projectId}
            currentUserRole={currentUserRole}
          />
        )}
      </div>

      {/* Members list */}
      <div className="border border-border rounded-lg divide-y divide-border">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            currentUserRole={currentUserRole}
            onUpdateRole={handleUpdateRole}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
