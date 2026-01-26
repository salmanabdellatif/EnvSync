import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authResponseSchema,
  messageResponseSchema,
  profileResponseSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ResendVerificationInput,
} from "./schemas";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type FetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

class ApiClient {
  /**
   * Helper to resolve headers and inject the HttpOnly access_token.
   */
  private async getHeaders(options?: FetchOptions) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };
  }

  /**
   * Core defensive fetch wrapper with Zod validation.
   */
  private async request<T>(
    endpoint: string,
    options?: FetchOptions,
    schema?: z.ZodSchema<T>,
  ): Promise<T> {
    const headers = await this.getHeaders(options);
    const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized (Global Redirect)
    // We skip redirecting if the user is ALREADY trying to login
    if (response.status === 401 && endpoint !== "/auth/login") {
      redirect("/login");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API Error: ${response.status} ${response.statusText}`,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();

    // Data Validation Boundary (The Zod Bridge)
    if (schema) {
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        console.error("API Contract Violation!", parsed.error.format());
        throw new Error(
          "Internal Data Error: Backend response does not match frontend contract.",
        );
      }
      return parsed.data;
    }

    return json as T;
  }

  /**
   * --- DOMAIN MODULES ---
   */

  auth = {
    login: (body: LoginInput) =>
      this.request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        authResponseSchema,
      ),

    register: (body: RegisterInput) =>
      this.request(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        messageResponseSchema,
      ),

    me: () =>
      this.request("/auth/me", { method: "GET" }, profileResponseSchema),

    verifyEmail: (token: string) =>
      this.request(
        `/auth/verify-email?token=${token}`,
        { method: "GET" },
        messageResponseSchema,
      ),

    resendVerification: (body: ResendVerificationInput) =>
      this.request(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        messageResponseSchema,
      ),

    forgotPassword: (body: ForgotPasswordInput) =>
      this.request(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        messageResponseSchema,
      ),

    resetPassword: (body: ResetPasswordInput) =>
      this.request(
        "/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        messageResponseSchema,
      ),
  };
}

export const api = new ApiClient();
