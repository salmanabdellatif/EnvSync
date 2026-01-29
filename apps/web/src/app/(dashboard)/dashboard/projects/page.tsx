export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
          <h2 className="text-xl font-bold mb-2">Example Project</h2>
          <p className="text-muted-foreground text-sm">Project description</p>
        </div>
      </div>
    </div>
  );
}
