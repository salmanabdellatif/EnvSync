import { notFound } from "next/navigation";
import { getProjectAction } from "@/actions/projects";
import { getEnvironmentsAction } from "@/actions/environments";
import { getMembersAction } from "@/actions/members";
import { getCurrentUser } from "@/actions/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EnvironmentFormDialog,
  EnvironmentsList,
} from "@/components/environments";
import { MembersList } from "@/components/members";
import {
  ProjectFormDialog,
  ProjectMetadata,
  DangerZone,
} from "@/components/projects";
import { canEditProject } from "@/lib/roles";
import { Layers, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDetailsPageProps {
  params: Promise<{ projectSlug: string }>;
}

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const { projectSlug: slug } = await params;

  // Fetch all data in parallel
  const [project, user] = await Promise.all([
    getProjectAction(slug),
    getCurrentUser(),
  ]);

  if (!project) {
    notFound();
  }

  // Fetch environments and members in parallel (need project.id)
  const [environments, members] = await Promise.all([
    getEnvironmentsAction(project.id),
    getMembersAction(project.id),
  ]);

  // Find current user's role
  const currentUserMember = members.find((m) => m.userId === user?.id);
  const currentUserRole = currentUserMember?.role;
  const canEdit = canEditProject(currentUserRole);
  const isOwner = currentUserRole === "OWNER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        {canEdit && (
          <ProjectFormDialog
            project={project}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="environments" className="w-full">
        <TabsList>
          <TabsTrigger value="environments" className="gap-2">
            <Layers className="h-4 w-4" />
            Environments
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Environments Tab */}
        <TabsContent value="environments" className="mt-6">
          <div className="space-y-6">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Environments</h2>
                <p className="text-sm text-muted-foreground">
                  Manage environments and their secrets
                </p>
              </div>
              {canEdit && <EnvironmentFormDialog projectId={project.id} />}
            </div>

            {/* Environments list */}
            <EnvironmentsList
              environments={environments}
              projectId={project.id}
              projectSlug={project.slug}
              canEdit={canEdit}
            />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="space-y-8">
            {/* Members */}
            <MembersList
              members={members}
              projectId={project.id}
              currentUserRole={currentUserRole}
            />

            {/* Project Metadata */}
            <ProjectMetadata project={project} />

            {/* Danger Zone - Owner only */}
            {isOwner && <DangerZone project={project} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
