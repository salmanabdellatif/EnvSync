import { z } from "zod";

/**
 * --- BASE / SHARED SCHEMAS ---
 * Reusable validation rules for consistent data integrity across the app.
 */
const emailSchema = z.string().email().toLowerCase().trim();
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

/**
 * --- USER DOMAIN ---
 * Represents the core User profile.
 * Note: CreatedAt is treated as a string since it comes from JSON.
 */
export const userSchema = z.object({
  id: z.string(),
  email: emailSchema,
  name: z.string().min(2),
  avatar: z.string().url().nullish(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

/**
 * --- AUTH REQUESTS (INPUTS) ---
 * Used for form validation in Server Actions.
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatar: z.string().url().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Invalid token"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: emailSchema,
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/**
 * --- AUTH RESPONSES (OUTPUTS) ---
 * Used by the ApiClient to validate backend integrity.
 */

// Used for endpoints that return simple status updates (e.g., "Registration successful")
export const messageResponseSchema = z.object({
  message: z.string(),
});

// The core login response containing the identity and session token
export const authResponseSchema = z.object({
  user: userSchema,
  access_token: z.string(),
});

export const profileResponseSchema = userSchema;
