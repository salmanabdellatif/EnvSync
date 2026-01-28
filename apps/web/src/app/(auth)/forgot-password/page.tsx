import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password - EnvSync",
  description: "Reset your EnvSync account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Interactive Form */}
      <ForgotPasswordForm />

      {/* Footer Link */}
      <div className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-medium text-foreground hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
