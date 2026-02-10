import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectAction } from "@/actions/projects";
import { getEnvironmentsAction } from "@/actions/environments";
import { getVariablesAction } from "@/actions/variables";
import { getMembersAction } from "@/actions/members";
import { getCurrentUser } from "@/actions/auth";
import { VariablesList } from "@/components/variables";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface EnvironmentPageProps {
  params: Promise<{ projectSlug: string; envName: string }>;
}

export async function generateMetadata({
  params,
}: EnvironmentPageProps): Promise<Metadata> {
  const { projectSlug, envName } = await params;
  const project = await getProjectAction(projectSlug);
  return {
    title: project
      ? `${envName} · ${project.name} - EnvSync`
      : "Environment - EnvSync",
    description: `Environment variables for ${envName}.`,
  };
}

export default async function EnvironmentPage({
  params,
}: EnvironmentPageProps) {
  const { projectSlug: slug, envName } = await params;

  // Fetch project by slug
  const project = await getProjectAction(slug);
  if (!project) {
    notFound();
  }

  // Fetch all environments and find by name
  const environments = await getEnvironmentsAction(project.id);
  const environment = environments.find((env) => env.name === envName);
  if (!environment) {
    notFound();
  }

  // Fetch variables and check permissions
  const [variables, members, currentUser] = await Promise.all([
    getVariablesAction(project.id, environment.id),
    getMembersAction(project.id),
    getCurrentUser(),
  ]);

  // Find current user's role
  const currentUserRole = members.find(
    (m) => m.userId === currentUser?.id,
  )?.role;

  // Only ADMIN and OWNER can delete
  const canDelete = currentUserRole === "ADMIN" || currentUserRole === "OWNER";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name, href: `/dashboard/projects/${project.slug}` },
          { label: environment.name },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold capitalize">{environment.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Environment variables for {environment.name}
        </p>
      </div>

      {/* Variables List */}
      <VariablesList
        variables={variables}
        projectId={project.id}
        envId={environment.id}
        canDelete={canDelete}
      />
    </div>
  );
}
