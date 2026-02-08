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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { addMemberSchema, type AddMemberInput } from "@/lib/schemas";
import { addMemberAction, type ActionState } from "@/actions/members";
import { type Role, getAssignableRoles, formatRole } from "@/lib/roles";

interface AddMemberDialogProps {
  projectId: string;
  currentUserRole: Role;
}

export function AddMemberDialog({
  projectId,
  currentUserRole,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);

  const boundAction = addMemberAction.bind(null, projectId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    {},
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const selectedRole = watch("role");

  // Assignable roles based on current user
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Handle success
  useEffect(() => {
    if (state.success) {
      toast.success("Member added successfully");
      setOpen(false);
      reset();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, reset]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ email: "", role: "MEMBER" });
    }
  }, [open, reset]);

  const onSubmit = (data: AddMemberInput) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("role", data.role);
      formAction(formData);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a user to collaborate on this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="teammate@example.com"
              {...register("email")}
              disabled={isPending}
            />
            {(errors.email || state.fieldErrors?.email) && (
              <p className="text-sm text-destructive">
                {errors.email?.message || state.fieldErrors?.email?.[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue("role", value as AddMemberInput["role"])
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRole(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(errors.role || state.fieldErrors?.role) && (
              <p className="text-sm text-destructive">
                {errors.role?.message || state.fieldErrors?.role?.[0]}
              </p>
            )}
          </div>

          {/* Warning about CLI grant */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              The new member won't be able to access secrets until you run{" "}
              <code className="bg-muted px-1 rounded text-xs">
                envsync grant {"<email>"}
              </code>{" "}
              from the CLI.
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
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
