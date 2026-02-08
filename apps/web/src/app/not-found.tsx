"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background">
      <div className="p-4 bg-muted rounded-full mb-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Page Not Found</p>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Button>
    </div>
  );
}
