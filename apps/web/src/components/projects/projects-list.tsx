"use client";

import { useState, useMemo } from "react";
import { type Project } from "@/lib/schemas";
import { ProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SortOption = "created-desc" | "created-asc" | "updated-desc";
type ViewMode = "grid" | "list";

interface ProjectsListProps {
  projects: Project[];
}

const sortLabels: Record<SortOption, string> = {
  "created-desc": "Newest first",
  "created-asc": "Oldest first",
  "updated-desc": "Recently updated",
};

export function ProjectsList({ projects }: ProjectsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("created-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      switch (sortBy) {
        case "created-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "created-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "updated-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });
  }, [projects, sortBy]);

  const getSortIcon = () => {
    if (sortBy === "created-asc") return <ArrowUp className="h-4 w-4" />;
    if (sortBy === "created-desc") return <ArrowDown className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {getSortIcon()}
                <span className="ml-2 hidden sm:inline">
                  {sortLabels[sortBy]}
                </span>
                <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-background *:hover:bg-muted"
            >
              <DropdownMenuItem onClick={() => setSortBy("created-desc")}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("created-asc")}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("updated-desc")}>
                <Clock className="mr-2 h-4 w-4" />
                Recently updated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-none",
              viewMode === "grid" && "bg-muted",
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-none",
              viewMode === "list" && "bg-muted",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-full">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} viewMode="list" />
          ))}
        </div>
      )}
    </div>
  );
}
