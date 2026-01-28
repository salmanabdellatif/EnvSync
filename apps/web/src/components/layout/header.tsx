"use client";

import { useState } from "react";
import Link from "next/link";
import { GitHubIcon, HamburgerMenu } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowRight,
  FileText,
  ExternalLink,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <div className="mx-auto max-w-3xl 2xl:max-w-5xl px-4">
        <div className="backdrop-blur-xl bg-background/70 border border-white/10 rounded-full shadow-lg shadow-black/10 transition-all duration-300 hover:border-white/20 hover:shadow-black/20">
          <nav className="flex items-center justify-between h-14 px-5 md:px-6">
            {/* Logo */}
            <Link href="/" className="text-lg font-bold tracking-tight">
              EnvSync
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <a
                href="https://github.com/salmanabdellatif/EnvSync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub Repository"
              >
                <GitHubIcon className="w-5 h-5" />
              </a>
              <div className="w-px h-4 bg-white/10 mx-1" />

              {isAuthenticated ? (
                <Button
                  href="/dashboard"
                  size="sm"
                  className="rounded-full px-5"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    href="/login"
                    variant="secondary"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Login
                  </Button>
                  <Button
                    href="/register"
                    size="sm"
                    className="rounded-full px-5"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex md:hidden">
              <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Toggle menu">
                    <HamburgerMenu isOpen={isOpen} />
                  </Button>
                </DrawerTrigger>

                <DrawerContent className="bg-background border-white/10">
                  <DrawerTitle className="sr-only">Mobile Menu</DrawerTitle>
                  <div className="flex flex-col gap-6 p-6 pb-10">
                    {/* Navigation Group */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2">
                        Menu
                      </div>

                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="justify-between text-base font-normal h-12 px-4 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 w-full"
                        >
                          <div className="flex items-center">
                            <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-400" />
                            Dashboard
                          </div>
                          <ArrowRight className="h-4 w-4 text-zinc-600" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        href="/docs"
                        onClick={() => setIsOpen(false)}
                        className="justify-between text-base font-normal h-12 px-4 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 w-full"
                      >
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-zinc-400" />
                          Documentation
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        href="https://github.com/salmanabdellatif/EnvSync"
                        target="_blank"
                        onClick={() => setIsOpen(false)}
                        className="justify-between text-base font-normal h-12 px-4 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 w-full"
                        aria-label="GitHub Repository"
                      >
                        <div className="flex items-center">
                          <GitHubIcon className="mr-3 h-5 w-5 text-zinc-400" />
                          GitHub Repository
                        </div>
                        <ExternalLink className="h-4 w-4 text-zinc-600" />
                      </Button>
                    </div>

                    {/* Actions Group - Only show when NOT authenticated */}
                    {!isAuthenticated && (
                      <>
                        <div className="h-px w-full bg-white/5" />
                        <div className="flex flex-col gap-3">
                          <Button
                            variant="secondary"
                            href="/login"
                            onClick={() => setIsOpen(false)}
                            className="w-full h-12 justify-center px-4"
                          >
                            Log In
                            <LogIn className="ml-3 h-4 w-4" />
                          </Button>

                          <Button
                            variant="primary"
                            href="/register"
                            onClick={() => setIsOpen(false)}
                            className="group w-full h-12 justify-center font-bold"
                          >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Safe area padding for iOS */}
                  <div className="h-8" />
                </DrawerContent>
              </Drawer>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
