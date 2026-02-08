"use client";

import { useState } from "react";
import { type Environment } from "@/lib/schemas";
import { EnvironmentCard } from "./environment-card";
import { EnvironmentFormDialog } from "./environment-form-dialog";
import { deleteEnvironmentAction } from "@/actions/environments";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EnvironmentsListProps {
  environments: Environment[];
  projectId: string;
  projectSlug: string;
  canEdit?: boolean;
}

export function EnvironmentsList({
  environments,
  projectId,
  projectSlug,
  canEdit = false,
}: EnvironmentsListProps) {
  const [deleteEnvId, setDeleteEnvId] = useState<string | null>(null);

  const handleDeleteEnv = async () => {
    if (!deleteEnvId) return;

    const result = await deleteEnvironmentAction(projectId, deleteEnvId);

    if (result.success) {
      toast.success("Environment deleted");
    } else {
      toast.error(result.error || "Failed to delete environment");
    }

    setDeleteEnvId(null);
  };

  if (environments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
        <div className="p-3 bg-muted rounded-full mb-4">
          <Layers className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No environments yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first environment to start managing secrets.
        </p>
        {canEdit && <EnvironmentFormDialog projectId={projectId} />}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.map((env) => (
          <EnvironmentCard
            key={env.id}
            environment={env}
            projectId={projectId}
            projectSlug={projectSlug}
            canEdit={canEdit}
            onDelete={() => setDeleteEnvId(env.id)}
          />
        ))}
      </div>

      {/* Delete Environment Confirmation */}
      <AlertDialog
        open={!!deleteEnvId}
        onOpenChange={() => setDeleteEnvId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this environment? All secrets will
              be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnv}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
