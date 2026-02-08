"use client";

import Link from "next/link";
import { useState } from "react";
import { type Environment } from "@/lib/schemas";
import { Layers, Key, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EnvironmentFormDialog } from "./environment-form-dialog";

interface EnvironmentCardProps {
  environment: Environment;
  projectId: string;
  projectSlug: string;
  canEdit?: boolean;
  onDelete?: () => void;
}

export function EnvironmentCard({
  environment,
  projectId,
  projectSlug,
  canEdit = false,
  onDelete,
}: EnvironmentCardProps) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(environment.id);
    setCopied(true);
    toast.success("Environment ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const secretsCount = environment._count?.variables ?? 0;

  return (
    <div className="relative flex flex-col bg-card border border-border rounded-lg p-5 hover:border-primary/50 hover:bg-card/80 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Layers className="h-5 w-5 text-primary" />
        </div>

        {/* Actions - show on hover */}
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <EnvironmentFormDialog
              projectId={projectId}
              environment={environment}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <Link href={`/dashboard/projects/${projectSlug}/${environment.name}`}>
        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors capitalize">
          {environment.name}
        </h3>

        {/* Secrets count */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Key className="h-3.5 w-3.5" />
          <span>
            {secretsCount} {secretsCount === 1 ? "secret" : "secrets"}
          </span>
        </div>
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
          {environment.id.slice(0, 8)}...
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={copyId}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy ID
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
