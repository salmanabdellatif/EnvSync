"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Terminal, CheckCircle2 } from "lucide-react";
import { getTokenAction } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CLI_STATE_KEY = "envsync_cli_state";

export function CLIAuthHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isCLIAuth, setIsCLIAuth] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params first (for auto-redirect from proxy), then localStorage
    const cliState =
      searchParams.get("cli_state") ||
      localStorage.getItem("envsync_cli_state");

    if (!cliState) return;

    setIsCLIAuth(true);

    // Add 1 second delay before showing the modal
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    // Parse the state to get port and secret
    try {
      const decoded = JSON.parse(atob(cliState));
      if (!decoded.port || !decoded.secret) {
        throw new Error("Invalid CLI state");
      }

      // Get the token and send to CLI (after delay)
      const fetchTimeout = setTimeout(() => {
        sendTokenToCLI(decoded.port, cliState);
      }, 1500);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(fetchTimeout);
      };
    } catch (err) {
      setError("Invalid CLI authentication state");
      localStorage.removeItem(CLI_STATE_KEY);
    }
  }, [searchParams]);

  const sendTokenToCLI = async (port: number, state: string) => {
    try {
      // Get the token from the current session using server action
      const token = await getTokenAction();
      if (!token) {
        throw new Error("No token available");
      }

      // Success state first (user sees this before redirect)
      setIsSuccess(true);

      // Clean up localStorage
      localStorage.removeItem(CLI_STATE_KEY);

      // Build callback URL for CLI
      const callbackUrl = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;

      // Use redirect instead of fetch to avoid CORS issues
      // The CLI server will respond with a page that closes or shows success
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate CLI");
      localStorage.removeItem(CLI_STATE_KEY);
    }
  };

  if (!isCLIAuth || !isVisible) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-100 flex items-center justify-center">
        <Card className="border-border bg-card shadow-2xl max-w-md w-full mx-4">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <Terminal className="w-7 h-7 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-destructive">
                CLI Auth Error
              </CardTitle>
              <CardDescription className="text-base">{error}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center pt-2 pb-6">
            <p className="text-sm text-muted-foreground">
              Please try{" "}
              <code className="bg-muted px-2 py-1 rounded font-mono text-foreground">
                envsync login
              </code>{" "}
              again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-100 flex items-center justify-center">
      <Card className="border-border bg-card shadow-2xl max-w-md w-full mx-4">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            ) : (
              <Terminal className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isSuccess ? "CLI Authenticated!" : "Authenticating CLI..."}
            </CardTitle>
            <CardDescription className="text-base">
              {isSuccess
                ? "You can close this tab and return to your terminal."
                : "Please wait while we authenticate your CLI"}
            </CardDescription>
          </div>
        </CardHeader>
        {!isSuccess && (
          <CardContent className="flex justify-center pt-2 pb-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
