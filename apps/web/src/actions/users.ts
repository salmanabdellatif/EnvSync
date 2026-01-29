"use server";

import { api } from "@/lib/api";
import { updateUserSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";

// Define a standard return type for our UI to consume
export type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

const COOKIE_NAME = "access_token";

/**
 * GET PROFILE ACTION
 * Fetches current user profile.
 */
export async function getProfileAction() {
  try {
    return await api.users.me();
  } catch {
    return null;
  }
}

/**
 * UPDATE PROFILE ACTION
 * Updates user name and/or avatar.
 */
export async function updateProfileAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const validated = updateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await api.users.update(validated.data);
    revalidatePath("/dashboard/settings");
    return { success: true, message: "Profile updated successfully" };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Failed to update profile" };
  }
}

/**
 * DELETE ACCOUNT ACTION
 * Permanently deletes user account.
 */
export async function deleteAccountAction(): Promise<ActionState> {
  try {
    await api.users.delete();

    // Clear auth cookie
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    redirect("/");
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Failed to delete account" };
  }
}
