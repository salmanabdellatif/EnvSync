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
 * Update user profile request.
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  avatar: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("http"), {
      message: "Must be a valid URL",
    }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

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

/**
 * --- PROJECT DOMAIN ---
 */

// Simplified user for project members
const projectMemberUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().url().nullish(),
});

export const projectMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
  joinedAt: z.string().datetime(),
  user: projectMemberUserSchema,
  wrappedKey: z.string().nullable().optional(),
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const membersListSchema = z.array(projectMemberSchema);

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  description: z.string().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  owner: projectMemberUserSchema.optional(),
  members: z.array(projectMemberSchema).optional(),
  _count: z
    .object({
      environments: z.number(),
      members: z.number(),
    })
    .optional(),
});

export type Project = z.infer<typeof projectSchema>;

export const projectsListSchema = z.array(projectSchema);

// Input schemas for forms
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * --- ENVIRONMENT DOMAIN ---
 * New schemas for environment management
 */

export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  _count: z
    .object({
      variables: z.number(),
    })
    .optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export const environmentsListSchema = z.array(environmentSchema);

// Input schemas for Environment actions
export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Only letters, numbers, dashes, and underscores",
    ),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;

export const updateEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50)
    .regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, dashes, and underscores")
    .optional(),
});

export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;

/**
 * --- MEMBER MANAGEMENT INPUTS ---
 * Inputs for adding/managing project members
 */

export const addMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  // We include OWNER here because you might be promoting someone to owner.
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
