export default function EnvironmentPage({
  params,
}: {
  params: { projectId: string; envName: string };
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm">
          {params.projectId} / {params.envName}
        </p>
        <h1 className="text-3xl font-bold capitalize">{params.envName}</h1>
      </div>
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
