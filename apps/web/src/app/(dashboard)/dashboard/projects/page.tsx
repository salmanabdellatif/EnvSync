import type { Metadata } from "next";
import { getProjectsAction } from "@/actions/projects";
import { ProjectFormDialog, ProjectsList } from "@/components/projects";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FolderGit2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects - EnvSync",
  description: "Manage your projects and environment variables.",
};

export default async function ProjectsPage() {
  const projects = await getProjectsAction();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Projects" }]} />

      {/* Responsive header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your projects and environment variables
          </p>
        </div>
        <ProjectFormDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <FolderGit2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            No projects yet
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm">
            Create your first project to start syncing environment variables.
          </p>
          <ProjectFormDialog />
        </div>
      ) : (
        <ProjectsList projects={projects} />
      )}
    </div>
  );
}
