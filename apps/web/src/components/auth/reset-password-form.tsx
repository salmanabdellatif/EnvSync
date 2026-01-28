"use client";

import { useActionState, useEffect, startTransition, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { resetPasswordAction } from "@/actions/auth";
import { KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Local form schema with confirm password (UI-only validation)
const formSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormInput = z.infer<typeof formSchema>;

// Prevent copy/paste on password fields
const preventCopyPaste = (e: React.ClipboardEvent) => {
  e.preventDefault();
  toast.error("Copy and paste is disabled for password fields");
};

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isSuccess, setIsSuccess] = useState(false);

  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    undefined,
  );

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  // Update token if it arrives late from searchParams
  useEffect(() => {
    if (token) form.setValue("token", token);
  }, [token, form]);

  const onSubmit = (data: FormInput) => {
    const formData = new FormData();
    // Only send token and newPassword to the action (not confirmPassword)
    formData.append("token", data.token);
    formData.append("newPassword", data.newPassword);
    startTransition(() => formAction(formData));
  };

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success && state?.message) {
      toast.success(state.message);
      form.reset();
      setIsSuccess(true);
    }
  }, [state, form]);

  if (!token) {
    return (
      <Card className="border-border bg-secondary/30 backdrop-blur-xl text-center p-6">
        <div className="text-destructive mb-4">
          Invalid or missing reset token.
        </div>
        <Button variant="outline" href="/forgot-password">
          Request a new link
        </Button>
      </Card>
    );
  }

  // Success state - prompt to login
  if (isSuccess) {
    return (
      <Card className="border-border bg-secondary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Password Updated</CardTitle>
          <CardDescription>
            Your password has been successfully reset
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button className="w-full" href="/login">
            Login Now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-secondary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
        <CardDescription>Please enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register("token")} />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      onCopy={preventCopyPaste}
                      onPaste={preventCopyPaste}
                      onCut={preventCopyPaste}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      onCopy={preventCopyPaste}
                      onPaste={preventCopyPaste}
                      onCut={preventCopyPaste}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" isLoading={isPending}>
              Reset password
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
