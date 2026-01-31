"use server";

import { api } from "@/lib/api";
import { createProjectSchema, updateProjectSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Fetch all projects for the current user.
 */
export async function getProjectsAction() {
  try {
    return await api.projects.list();
  } catch (error) {
    console.error("getProjectsAction error:", error);
    return [];
  }
}

/**
 * Fetch a single project by slug.
 */
export async function getProjectAction(slug: string) {
  try {
    return await api.projects.getBySlug(slug);
  } catch (error) {
    console.error("getProjectAction error:", error);
    return null;
  }
}

/**
 * Create a new project.
 */
export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const validated = createProjectSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: "Validation failed",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await api.projects.create(validated.data);
    revalidatePath("/dashboard/projects");
    return { success: true, message: "Project created successfully" };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

/**
 * Update an existing project.
 */
export async function updateProjectAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const validated = updateProjectSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: "Validation failed",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await api.projects.update(projectId, validated.data);
    revalidatePath("/dashboard/projects");
    return { success: true, message: "Project updated successfully" };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

/**
 * Delete a project.
 */
export async function deleteProjectAction(
  projectId: string,
): Promise<ActionState> {
  try {
    await api.projects.delete(projectId);
    revalidatePath("/dashboard/projects");
    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}
