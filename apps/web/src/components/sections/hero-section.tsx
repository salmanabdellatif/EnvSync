"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="scroll-snap-section relative flex flex-col items-center justify-center">
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Badge with Tailwind glow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-sm text-foreground/80 shadow-[0_0_20px_rgba(var(--color-green-500),0.15)]">
          Now in public beta
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight drop-shadow-[0_0_40px_rgba(var(--foreground),0.3)]">
          Secrets, synced.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
          End-to-end encrypted environment variables for modern teams. Sync your{" "}
          <code className="text-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
            .env
          </code>{" "}
          files securely.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button href="/register" size="lg" className="group">
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <Button href="/docs" size="lg" variant="secondary">
            Read the docs
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute z-20 bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
        <span className="text-xs">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-border flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-muted-foreground animate-bounce" />
        </div>
      </div>
    </section>
  );
}
