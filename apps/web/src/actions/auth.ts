"use server";

import { api } from "@/lib/api";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "@/lib/schemas";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// Define a standard return type for our UI to consume
export type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

const COOKIE_NAME = "access_token";
const COOKIE_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * LOGIN ACTION
 * Handles authentication and session creation.
 */
export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  // 1. Validate Form Data locally (Save API bandwidth)
  const rawData = Object.fromEntries(formData);
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Invalid email or password format." };
  }

  try {
    // 2. Call the NestJS API
    const { access_token } = await api.auth.login(validated.data);

    // 3. Set the Session Cookie
    // This is "HttpOnly", meaning JavaScript cannot read it (XSS protection)
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_DURATION,
    });
  } catch (err: any) {
    if (isRedirectError(err)) throw err;

    // Handle API errors (e.g., "Invalid credentials")
    return { error: err.message || "Login failed. Please try again." };
  }

  // 4. Redirect (Must happen OUTSIDE the try/catch block)
  redirect("/dashboard");
}

/**
 * CLI LOGIN ACTION
 * Returns the token instead of redirecting (for CLI authentication flow).
 */
export async function cliLoginAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState & { token?: string }> {
  const rawData = Object.fromEntries(formData);
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Invalid email or password format." };
  }

  try {
    const { access_token } = await api.auth.login(validated.data);

    // Return the token for CLI redirect (don't set cookie or redirect)
    return { success: true, token: access_token };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Login failed. Please try again." };
  }
}

/**
 * REGISTER ACTION
 * Handles new user creation.
 */
export async function registerAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  // 1. Validate Input
  const rawData = Object.fromEntries(formData);
  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    // Return the first validation error message
    return { error: validated.error.issues[0].message };
  }

  try {
    // 2. Call API
    const res = await api.auth.register(validated.data);

    // 3. Return Success (UI will show "Check your email")
    return { success: true, message: res.message };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Registration failed." };
  }
}

/**
 * VERIFY EMAIL ACTION
 * Validates the email token.
 */
export async function verifyEmailAction(token: string): Promise<ActionState> {
  const validated = verifyEmailSchema.safeParse({ token });

  if (!validated.success) {
    return { error: "Invalid verification token." };
  }

  try {
    const res = await api.auth.verifyEmail(validated.data.token);
    return { success: true, message: res.message };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Email verification failed." };
  }
}

/**
 * RESEND VERIFICATION ACTION
 * Triggers a new verification email.
 */
export async function resendVerificationAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const validated = resendVerificationSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    const res = await api.auth.resendVerification(validated.data);
    return { success: true, message: res.message };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Failed to resend verification email." };
  }
}

/**
 * FORGOT PASSWORD ACTION
 * Triggers a recovery email.
 */
export async function forgotPasswordAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  const validated = forgotPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    const res = await api.auth.forgotPassword(validated.data);
    return { success: true, message: res.message };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Forgot password request failed." };
  }
}

/**
 * RESET PASSWORD ACTION
 * Updates the password using the recovery token.
 */
export async function resetPasswordAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData);
  // Important: ensure 'token' is passed along with 'newPassword' from the form
  const validated = resetPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    const res = await api.auth.resetPassword(validated.data);
    return { success: true, message: res.message };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { error: err.message || "Password reset failed." };
  }
}

/**
 * LOGOUT ACTION
 * Clears the session.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/");
}

/**
 * GET TOKEN
 * Returns the access token from cookies.
 */
export async function getTokenAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token || null;
}
