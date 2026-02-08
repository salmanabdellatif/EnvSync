"use client";

import { type Project } from "@/lib/schemas";
import { Calendar, Clock, Users } from "lucide-react";

interface ProjectMetadataProps {
  project: Project;
}

export function ProjectMetadata({ project }: ProjectMetadataProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const memberCount = project._count?.members ?? project.members?.length ?? 0;

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <h3 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
        Project Info
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Created: </span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Updated: </span>
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Members: </span>
            <span>{memberCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
