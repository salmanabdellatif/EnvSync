"use client";

import { useActionState, useEffect, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/schemas";
import { registerAction } from "@/actions/auth";
import { GitHubIcon, GoogleIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLI_STATE_KEY = "envsync_cli_state";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    undefined,
  );

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Store CLI state in localStorage when present in URL
  useEffect(() => {
    const cliState = searchParams.get("cli_state");
    if (cliState) {
      localStorage.setItem(CLI_STATE_KEY, cliState);
    }
  }, [searchParams]);

  const onSubmit = (data: RegisterInput) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    startTransition(() => formAction(formData));
  };

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success && state?.message) {
      toast.success(state.message);
      form.reset();
    }
  }, [state, form]);

  // Build OAuth URLs with CLI state preservation
  const cliState = searchParams.get("cli_state");
  const githubUrl = cliState
    ? `${API_URL}/auth/github?cli_state=${encodeURIComponent(cliState)}`
    : `${API_URL}/auth/github`;
  const googleUrl = cliState
    ? `${API_URL}/auth/google?cli_state=${encodeURIComponent(cliState)}`
    : `${API_URL}/auth/google`;

  return (
    <Card className="border-border bg-secondary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      <CardContent className="pt-6 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input className="bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" isLoading={isPending}>
              Create account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center gap-4 w-full">
          <span className="flex-1 border-t border-border" />
          <span className="text-xs uppercase text-muted-foreground">
            Or continue with
          </span>
          <span className="flex-1 border-t border-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          <Button variant="secondary" href={githubUrl}>
            <GitHubIcon size={16} className="mr-2" />
            GitHub
          </Button>
          <Button variant="secondary" href={googleUrl}>
            <GoogleIcon size={16} className="mr-2" />
            Google
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
