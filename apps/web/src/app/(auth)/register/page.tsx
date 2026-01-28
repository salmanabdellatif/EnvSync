import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Create Account - EnvSync",
  description:
    "Create your EnvSync account to manage environment variables securely.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      {/* Interactive Form */}
      <Suspense
        fallback={
          <div className="h-[400px] animate-pulse bg-muted/20 rounded-lg" />
        }
      >
        <RegisterForm />
      </Suspense>

      {/* Footer Link */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
