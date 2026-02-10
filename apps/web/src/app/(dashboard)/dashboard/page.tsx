import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderGit2,
  Layers,
  Users,
  Plus,
  Terminal,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectsAction } from "@/actions/projects";
import { getMembersAction } from "@/actions/members";
import { getCurrentUser } from "@/actions/auth";
import { ProjectCard } from "@/components/projects";
import { siteLinks, cliCommands } from "@/config/links";

export const metadata: Metadata = {
  title: "Dashboard - EnvSync",
  description: "Overview of your projects, environments, and team.",
};

export default async function DashboardPage() {
  const [user, projects] = await Promise.all([
    getCurrentUser(),
    getProjectsAction(),
  ]);

  // 1. EMPTY STATE (Onboarding)
  if (projects.length === 0) {
    return <EmptyDashboardState userName={user?.name} />;
  }

  // Fetch members for all projects to deduplicate
  const allMembersArrays = await Promise.all(
    projects.map((p) => getMembersAction(p.id)),
  );

  // Deduplicate: collect unique userIds, exclude the current user
  const uniqueCollaboratorIds = new Set(
    allMembersArrays
      .flat()
      .map((m) => m.userId)
      .filter((id) => id !== user?.id),
  );

  // Derived Stats
  const totalProjects = projects.length;
  const totalEnvs = projects.reduce(
    (acc, p) => acc + (p._count?.environments || 0),
    0,
  );
  const totalMembers = uniqueCollaboratorIds.size;

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // 2. ACTIVE DASHBOARD
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {greeting}, {user?.name?.split(" ")[0] || "Developer"}. You have{" "}
            {totalProjects} {totalProjects === 1 ? "project" : "projects"}{" "}
            active.
          </p>
        </div>
        <Button href="/dashboard/projects" size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderGit2}
          description="Active repositories"
          href="/dashboard/projects"
        />
        <StatsCard
          title="Environments"
          value={totalEnvs}
          icon={Layers}
          description="Across all projects"
        />
        <StatsCard
          title="Collaborators"
          value={totalMembers}
          icon={Users}
          description={totalMembers === 0 ? "Invite your team" : "Team members"}
        />
      </div>

      {/* Resources & Quick Links */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <Link
              href={siteLinks.docs}
              target="_blank"
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Documentation</p>
                  <p className="text-xs text-muted-foreground">
                    Guides, API reference, and tutorials
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">CLI Quick Start</p>
                  <p className="text-xs text-muted-foreground">
                    Install and connect in seconds
                  </p>
                </div>
              </div>
              <code className="text-xs bg-muted px-2.5 py-1 rounded font-mono text-muted-foreground hidden sm:block">
                {cliCommands.install}
              </code>
            </div>

            <Link
              href={siteLinks.github}
              target="_blank"
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-500/10">
                  <Globe className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">GitHub Repository</p>
                  <p className="text-xs text-muted-foreground">
                    Source code, issues, and contributions
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Recent Projects
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
}) {
  const content = (
    <Card
      className={
        href
          ? "transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
          : ""
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-1.5 rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Empty State Component
function EmptyDashboardState({ userName }: { userName?: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto px-4">
      {/* Icon */}
      <div className="p-4 bg-muted rounded-2xl border">
        <Terminal className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Welcome to EnvSync{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Get started by installing the CLI and pushing your first secrets. It
          only takes a minute.
        </p>
      </div>

      {/* CLI Setup Steps */}
      <div className="w-full bg-muted/30 rounded-xl text-left border overflow-hidden">
        {/* Step 1 */}
        <div className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
              1
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Install the CLI
            </span>
          </div>
          <code className="block bg-background px-3 py-2.5 rounded-md border font-mono text-sm">
            {cliCommands.install}
          </code>
        </div>

        {/* Step 2 */}
        <div className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
              2
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Login to your account
            </span>
          </div>
          <code className="block bg-background px-3 py-2.5 rounded-md border font-mono text-sm">
            {cliCommands.login}
          </code>
        </div>

        {/* Step 3 */}
        <div className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
              3
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Initialize your project
            </span>
          </div>
          <code className="block bg-background px-3 py-2.5 rounded-md border font-mono text-sm">
            {cliCommands.init}
          </code>
        </div>

        {/* Step 4 */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
              4
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Start syncing
            </span>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 bg-background px-3 py-2.5 rounded-md border font-mono text-sm text-center">
              {cliCommands.pull}
            </code>
            <code className="flex-1 bg-background px-3 py-2.5 rounded-md border font-mono text-sm text-center">
              {cliCommands.push}
            </code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button href="/dashboard/projects" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="whitespace-nowrap">Create Project</span>
        </Button>
        <Button
          href={siteLinks.docs}
          target="_blank"
          variant="outline"
          size="sm"
        >
          <BookOpen className="mr-1.5 h-4 w-4" />
          <span className="whitespace-nowrap">Documentation</span>
        </Button>
      </div>
    </div>
  );
}
