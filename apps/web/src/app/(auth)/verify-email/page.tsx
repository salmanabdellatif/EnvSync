import { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailContent } from "@/components/auth";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email - EnvSync",
  description: "Verify your email address for EnvSync.",
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <Suspense fallback={<LoadingFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
