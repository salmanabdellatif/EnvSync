import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Login - EnvSync",
  description: "Securely access your infrastructure dashboard.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your dashboard
        </p>
      </div>

      {/* Interactive Form */}
      <Suspense
        fallback={
          <div className="h-[350px] animate-pulse bg-muted/20 rounded-lg" />
        }
      >
        <LoginForm />
      </Suspense>

      {/* Footer Link */}
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
