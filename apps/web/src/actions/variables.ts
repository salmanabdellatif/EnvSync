"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * Fetch all variables for an environments.
 */
export async function getVariablesAction(projectId: string, envId: string) {
  try {
    return await api.variables.list(projectId, envId);
  } catch (error) {
    console.error("getVariablesAction error:", error);
    return [];
  }
}

/**
 * Delete an variable.
 */
export async function deleteVariableAction(
  projectId: string,
  envId: string,
  varId: string,
) {
  try {
    const result = await api.variables.delete(projectId, envId, varId);
    revalidatePath("/dashboard/projects", "layout");
    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete variable",
    };
  }
}
