"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { addMemberSchema, updateMemberRoleSchema } from "@/lib/schemas";

export type ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Fetch all members for a project.
 */
export async function getMembersAction(projectId: string) {
  try {
    return await api.members.list(projectId);
  } catch (error) {
    console.error("getMembersAction error:", error);
    return [];
  }
}

/**
 * Add a new member to a project.
 * Signature: (projectId, prevState, formData) for useActionState with .bind()
 */
export async function addMemberAction(
  projectId: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    role: formData.get("role"),
  };

  const parsed = addMemberSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.members.create(projectId, parsed.data);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add member",
    };
  }
}

/**
 * Update a member's role.
 * Signature: (projectId, userId, prevState, formData) for useActionState with .bind()
 */
export async function updateMemberRoleAction(
  projectId: string,
  userId: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    role: formData.get("role"),
  };

  const parsed = updateMemberRoleSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.members.update(projectId, userId, parsed.data);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

/**
 * Remove a member from a project.
 */
export async function removeMemberAction(
  projectId: string,
  userId: string,
  _prevState?: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  try {
    const result = await api.members.delete(projectId, userId);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}
