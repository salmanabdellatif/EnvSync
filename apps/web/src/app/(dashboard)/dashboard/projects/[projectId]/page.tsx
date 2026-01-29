export default function ProjectDetailsPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Project: {params.projectId}</h1>
        <p className="text-muted-foreground">Manage environments and secrets</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["development", "staging", "production"].map((env) => (
          <div
            key={env}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
          >
            <h2 className="font-bold capitalize">{env}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
