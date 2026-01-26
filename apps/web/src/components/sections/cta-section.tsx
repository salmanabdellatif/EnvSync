"use client";

import { Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="scroll-snap-section relative flex items-center justify-center">
      <div className="relative z-10 text-center space-y-8 px-4 w-full">
        <h2 className="text-3xl md:text-5xl font-bold drop-shadow-[0_0_40px_rgba(var(--foreground),0.3)]">
          Ready to sync?
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Start managing your environment variables the right way.
        </p>
        <Button href="/register" size="lg" variant="primary" className="group">
          Get started for free
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>

        <Footer />
      </div>
    </section>
  );
}
