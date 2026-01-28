import { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password - EnvSync",
  description: "Set a new password for your EnvSync account.",
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
