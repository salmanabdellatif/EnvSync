"use client";

import { useState, useActionState, useEffect, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createEnvironmentSchema,
  type CreateEnvironmentInput,
  type Environment,
} from "@/lib/schemas";
import {
  createEnvironmentAction,
  updateEnvironmentAction,
  type ActionState,
} from "@/actions/environments";

interface EnvironmentFormDialogProps {
  projectId: string;
  environment?: Environment;
  trigger?: React.ReactNode;
}

export function EnvironmentFormDialog({
  projectId,
  environment,
  trigger,
}: EnvironmentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!environment;

  const boundAction = isEditMode
    ? updateEnvironmentAction.bind(null, projectId, environment.id)
    : createEnvironmentAction.bind(null, projectId);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    {},
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEnvironmentInput>({
    resolver: zodResolver(createEnvironmentSchema),
    defaultValues: {
      name: environment?.name ?? "",
    },
  });

  // Handle success
  useEffect(() => {
    if (state.success) {
      toast.success(isEditMode ? "Environment updated" : "Environment created");
      setOpen(false);
      reset();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, isEditMode, reset]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ name: environment?.name ?? "" });
    }
  }, [open, environment, reset]);

  const onSubmit = (data: CreateEnvironmentInput) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("name", data.name);
      formAction(formData);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            {isEditMode ? (
              <>
                <Pencil className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Environment
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Environment" : "Create Environment"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the environment name."
              : "Create a new environment for this project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., production, staging, development"
              {...register("name")}
              disabled={isPending}
            />
            {(errors.name || state.fieldErrors?.name) && (
              <p className="text-sm text-destructive">
                {errors.name?.message || state.fieldErrors?.name?.[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, dashes, and underscores allowed.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
