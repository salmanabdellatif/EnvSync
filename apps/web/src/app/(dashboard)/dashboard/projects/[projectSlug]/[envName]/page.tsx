import { notFound } from "next/navigation";
import { getProjectAction } from "@/actions/projects";
import { getEnvironmentsAction } from "@/actions/environments";

interface EnvironmentPageProps {
  params: Promise<{ projectSlug: string; envName: string }>;
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
  // (API uses ID, but we have the name from the URL)
  const environments = await getEnvironmentsAction(project.id);
  const environment = environments.find((env) => env.name === envName);
  if (!environment) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm">
          {project.name} / {environment.name}
        </p>
        <h1 className="text-3xl font-bold capitalize">{environment.name}</h1>
      </div>

      {/* Secrets table placeholder */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex border-b border-border p-4 text-muted-foreground text-sm">
          <div className="flex-1 font-semibold">KEY</div>
          <div className="flex-1 font-semibold">VALUE</div>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex">
            <div className="flex-1 text-green-500">DATABASE_URL</div>
            <div className="flex-1 text-muted-foreground">••••••••••••</div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex">
            <div className="flex-1 text-green-500">API_KEY</div>
            <div className="flex-1 text-muted-foreground">••••••••••••</div>
          </div>
        </div>
      </div>
    </div>
  );
}
