"use client";

import { useState } from "react";
import { Window } from "@/components/ui/Window";

const packageManagers = [
  { id: "npm", label: "npm", install: "npm install -g @envsync-labs/cli" },
  { id: "yarn", label: "yarn", install: "yarn global add @envsync-labs/cli" },
  { id: "pnpm", label: "pnpm", install: "pnpm add -g @envsync-labs/cli" },
  { id: "bun", label: "bun", install: "bun add -g @envsync-labs/cli" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-40 hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

function CommandLine({ command }: { command: string }) {
  return (
    <div className="group flex items-center justify-between gap-2">
      <div>
        <span className="text-muted-foreground">$</span>{" "}
        <span className="text-green-500">{command}</span>
      </div>
      <CopyButton text={command} />
    </div>
  );
}

export function CliSection() {
  const [activeTab, setActiveTab] = useState<string>("npm");

  const activeManager = packageManagers.find((pm) => pm.id === activeTab)!;

  return (
    <section className="scroll-snap-section relative flex items-center justify-center">
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8 w-full">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            CLI-first workflow
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Install with your favorite package manager, sync with one command.
          </p>
        </div>

        <Window className="max-w-2xl mx-auto">
          {/* Package manager tabs inside Terminal */}
          <div className="flex gap-0 border-b border-border bg-background overflow-x-auto">
            {packageManagers.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setActiveTab(pm.id)}
                className={`px-4 py-2 text-sm font-mono transition-colors relative whitespace-nowrap ${
                  activeTab === pm.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {pm.label}
                {activeTab === pm.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Terminal content */}
          <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-3 bg-background overflow-x-auto">
            <CommandLine command={activeManager.install} />
            <CommandLine command="envsync login" />
            <div className="text-muted-foreground pl-4">
              ✓ Authenticated as user@example.com
            </div>
            <CommandLine command="envsync init" />
            <div className="text-muted-foreground pl-4">
              ✓ Initialized EnvSync in current directory
            </div>
            <CommandLine command="envsync pull" />
            <div className="text-muted-foreground pl-4">
              ✓ Downloaded 12 variables to .env
            </div>
          </div>
        </Window>
      </div>
    </section>
  );
}
