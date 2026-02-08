"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
} from "@/lib/schemas";

export type ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Fetch all environments for a project.
 */
export async function getEnvironmentsAction(projectId: string) {
  try {
    return await api.environment.list(projectId);
  } catch (error) {
    console.error("getEnvironmentsAction error:", error);
    return [];
  }
}

/**
 * Get a single environment by ID.
 */
export async function getEnvironmentAction(projectId: string, envId: string) {
  try {
    return await api.environment.getSingle(projectId, envId);
  } catch (error) {
    console.error("getEnvironmentAction error:", error);
    return null;
  }
}

/**
 * Create a new environment in a project.
 * Signature: (projectId, prevState, formData) for useActionState with .bind()
 */
export async function createEnvironmentAction(
  projectId: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
  };

  const parsed = createEnvironmentSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.environment.create(projectId, parsed.data);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create environment",
    };
  }
}

/**
 * Update an environment.
 * Signature: (projectId, envId, prevState, formData) for useActionState with .bind()
 */
export async function updateEnvironmentAction(
  projectId: string,
  envId: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
  };

  const parsed = updateEnvironmentSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await api.environment.update(projectId, envId, parsed.data);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update environment",
    };
  }
}

/**
 * Delete an environment.
 */
export async function deleteEnvironmentAction(
  projectId: string,
  envId: string,
  _prevState?: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  try {
    const result = await api.environment.delete(projectId, envId);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete environment",
    };
  }
}
