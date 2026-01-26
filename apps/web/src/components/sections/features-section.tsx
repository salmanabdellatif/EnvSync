"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Users } from "lucide-react";
import { Window } from "@/components/ui/Window";

const features = [
  {
    id: "encryption",
    title: "Zero-Knowledge Encryption",
    shortTitle: "Encryption",
    description:
      "Your secrets are encrypted client-side using AES-256-GCM before they ever leave your device.",
    icon: <Lock className="w-4 h-4 md:w-5 md:h-5" />,
    colorClass: "bg-purple-500",
    iconBg: "bg-purple-500/20 text-purple-400",
    visual: (
      <div className="p-4 md:p-6 font-mono text-[10px] md:text-sm">
        <div className="text-muted-foreground mb-2">{"// .env.local"}</div>
        <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
          <span className="text-blue-400">DATABASE_URL</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-green-400 blur-[2px]">
            postgres://user:pass
          </span>
        </div>
        <div className="text-muted-foreground mb-2 mt-4">{"// Encrypted"}</div>
        <div className="flex flex-wrap gap-1 md:gap-2">
          <span className="text-blue-400">DATABASE_URL</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-purple-400 break-all">enc_v1_7d92f...</span>
        </div>
      </div>
    ),
  },
  {
    id: "sync",
    title: "Instant Sync",
    shortTitle: "Sync",
    description:
      "Push secrets to your entire team in under 100ms. Works across all environments.",
    icon: <Zap className="w-4 h-4 md:w-5 md:h-5" />,
    colorClass: "bg-cyan-500",
    iconBg: "bg-cyan-500/20 text-cyan-400",
    visual: (
      <div className="p-4 md:p-6 font-mono text-[10px] md:text-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-500">➜</span>
          <span className="text-foreground">envsync push</span>
        </div>
        <div className="space-y-1 md:space-y-2 text-muted-foreground">
          <div className="flex justify-between gap-2">
            <span>Encrypting...</span>
            <span className="text-green-500">12ms</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Syncing...</span>
            <span className="text-green-500">45ms</span>
          </div>
          <div className="mt-3 text-foreground bg-green-500/10 border border-green-500/20 p-2 rounded text-[10px] md:text-xs">
            ✓ Synced <span className="font-bold">v24</span> to Production
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "teams",
    title: "Secure Collaboration", // Changed from "Team Access Control"
    shortTitle: "Teams",
    description:
      "Stop sharing .env files over Slack. centralized your secrets with built-in Role-Based Access Control.",
    icon: <Users className="w-4 h-4 md:w-5 md:h-5" />,
    colorClass: "bg-pink-500",
    iconBg: "bg-pink-500/20 text-pink-400",
    visual: (
      <div className="p-4 md:p-6">
        {/* Header: Team Count */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">
            Workspace Members
          </span>
          <span className="text-[10px] md:text-xs bg-secondary px-2 py-1 rounded text-foreground">
            3 Active
          </span>
        </div>

        {/* User 1: The Owner */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
              SA
            </div>
            <div>
              <div className="text-xs md:text-sm font-medium text-foreground">
                Salman
              </div>
              <div className="text-[10px] text-muted-foreground">
                salman@envsync.com
              </div>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20 font-medium">
            Owner
          </div>
        </div>

        {/* User 2: The Member */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-white/10">
              JD
            </div>
            <div>
              <div className="text-xs md:text-sm font-medium text-foreground">
                John Doe
              </div>
              <div className="text-[10px] text-muted-foreground">
                john@company.com
              </div>
            </div>
          </div>
          {/* Dropdown simulation for RBAC */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] border border-white/10 cursor-pointer hover:bg-zinc-700 transition-colors">
            Member
            <svg
              className="w-2 h-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
  },
];

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="scroll-snap-section relative flex items-center justify-center py-24 md:py-0">
      <div className="max-w-5xl mx-auto px-4 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* LEFT: The Menu */}
          <div className="space-y-2 md:space-y-4">
            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
              Built for speed,
              <br />
              <span className="text-muted-foreground">
                engineered for trust.
              </span>
            </h2>

            <div className="space-y-1 md:space-y-2" role="tablist">
              {features.map((feature, index) => (
                <motion.button
                  layout
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  onMouseEnter={() => setActiveFeature(index)}
                  onFocus={() => setActiveFeature(index)}
                  className={`w-full text-left group cursor-pointer p-2 md:p-4 rounded-lg md:rounded-xl transition-all duration-300 border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/20
                    ${activeFeature === index ? "bg-muted/30 border-muted" : "hover:bg-muted/20"}
                  `}
                  aria-selected={activeFeature === index}
                  role="tab"
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <motion.div
                      layout="position"
                      className={`p-1.5 md:p-2 rounded-lg transition-colors duration-300 shrink-0 ${
                        activeFeature === index
                          ? feature.iconBg
                          : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                      }`}
                    >
                      {feature.icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <motion.h3
                        layout="position"
                        className={`text-sm md:text-lg font-medium transition-colors ${
                          activeFeature === index
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground/80"
                        }`}
                      >
                        <span className="hidden md:inline">
                          {feature.title}
                        </span>
                        <span className="md:hidden">{feature.shortTitle}</span>
                      </motion.h3>
                      <AnimatePresence initial={false}>
                        {activeFeature === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-[11px] md:text-sm text-muted-foreground leading-relaxed mt-1">
                              {feature.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* RIGHT: The "Window" Visual */}
          <div className="relative h-[200px] md:h-[280px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Window
                  title={
                    features[activeFeature].id === "teams"
                      ? "panel"
                      : "terminal"
                  }
                  className="h-full"
                  contentClassName="h-[calc(100%-28px)] md:h-[calc(100%-36px)] overflow-auto"
                >
                  {features[activeFeature].visual}
                </Window>

                {/* Background Glow */}
                <div
                  className={`absolute -inset-3 md:-inset-4 -z-10 rounded-full blur-xl md:blur-2xl opacity-4 transition-colors duration-500 ${features[activeFeature].colorClass}`}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
