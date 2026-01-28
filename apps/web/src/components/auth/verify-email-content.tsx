"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmailAction } from "@/actions/auth";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      const result = await verifyEmailAction(token);
      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Email verified successfully!");
      } else {
        setStatus("error");
        setMessage(result.error || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="border-border bg-secondary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary/50 mb-2">
          {status === "loading" && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="h-8 w-8 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        <CardDescription>
          {status === "loading"
            ? "Verifying your email address..."
            : "Verification process complete"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-4">
        <p
          className={`text-sm ${status === "error" ? "text-destructive" : "text-foreground"}`}
        >
          {message}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button className="w-full" href="/login">
          {status === "success" ? "Continue to Login" : "Go to Login"}
        </Button>
      </CardFooter>
    </Card>
  );
}
