"use client";

import Link from "next/link";
import { type Project } from "@/lib/schemas";
import { FolderGit2, Layers } from "lucide-react";
import { AvatarStack } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuth } from "@/providers/auth-provider";

interface ProjectCardProps {
  project: Project;
  viewMode?: "grid" | "list";
}

export function ProjectCard({ project, viewMode = "grid" }: ProjectCardProps) {
  const { user } = useAuth();

  // Find current user's role in this project
  const currentUserMember = project.members?.find((m) => m.userId === user?.id);
  const currentUserRole = currentUserMember?.role;

  // Extract member users for avatar display
  const memberUsers =
    project.members?.map((m) => ({
      name: m.user.name,
      avatar: m.user.avatar,
    })) ?? [];

  if (viewMode === "list") {
    return (
      <div className="relative flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-card/80 transition-all group">
        {/* Icon */}
        <div className="p-2 bg-primary/10 rounded-md shrink-0">
          <FolderGit2 className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <Link
          href={`/dashboard/projects/${project.slug}`}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold group-hover:text-primary transition-colors truncate">
              {project.name}
            </h2>
            {currentUserRole && <RoleBadge role={currentUserRole} size="sm" />}
          </div>
          {project.description && (
            <p className="text-muted-foreground text-sm truncate">
              {project.description}
            </p>
          )}
        </Link>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{project._count?.environments ?? 0} envs</span>
          </div>
        </div>

        {/* Member avatars */}
        {memberUsers.length > 0 && (
          <div className="shrink-0">
            <AvatarStack users={memberUsers} max={3} size="sm" />
          </div>
        )}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="relative flex flex-col h-full bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-card/80 transition-all group">
      <Link href={`/dashboard/projects/${project.slug}`} className="flex-1">
        {/* Header with icon and role badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-md">
            <FolderGit2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            {currentUserRole && <RoleBadge role={currentUserRole} size="sm" />}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h2>

        {project.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {project.description}
          </p>
        )}
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{project._count?.environments ?? 0} envs</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Member avatars */}
          {memberUsers.length > 0 && (
            <AvatarStack users={memberUsers} max={3} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
