"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/auth-provider";
import { updateProfileAction, deleteAccountAction } from "@/actions/users";
import { updateUserSchema, type UpdateUserInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { User, Trash2 } from "lucide-react";
import { useState } from "react";

export function SettingsForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
    },
  });

  const onSubmit = async (data: UpdateUserInput) => {
    // Only send changed fields
    const changedData: Partial<UpdateUserInput> = {};

    if (dirtyFields.name && data.name) {
      changedData.name = data.name;
    }
    if (dirtyFields.avatar) {
      changedData.avatar = data.avatar || undefined;
    }

    // Don't submit if nothing changed
    if (Object.keys(changedData).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSubmitting(true);

    // Create FormData for the server action
    const formData = new FormData();
    if (changedData.name) formData.append("name", changedData.name);
    if (changedData.avatar) formData.append("avatar", changedData.avatar);

    const result = await updateProfileAction(undefined, formData);

    setIsSubmitting(false);

    if (result?.success) {
      toast.success(result.message);
    } else if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAccountAction();
    setIsDeleting(false);

    if (result?.error) {
      toast.error(result.error);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Profile</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              {...register("avatar")}
            />
            {errors.avatar && (
              <p className="text-xs text-destructive">
                {errors.avatar.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email verified</span>
            <span
              className={
                user.emailVerified ? "text-green-500" : "text-yellow-500"
              }
            >
              {user.emailVerified ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. All your
          projects and data will be permanently deleted.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all of your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Yes, delete my account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
