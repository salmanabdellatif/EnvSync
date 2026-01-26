import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function Window({
  title = "terminal",
  children,
  className,
  headerClassName,
  contentClassName,
}: TerminalProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border overflow-hidden text-left shadow-[0_0_30px_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {/* Terminal header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary",
          headerClassName,
        )}
      >
        <div className="flex items-center gap-2" aria-hidden="true">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#27CA40]" />
        </div>

        <span className="ml-2 text-[10px] md:text-xs text-muted-foreground font-mono select-none">
          {title}
        </span>
      </div>

      {/* Terminal content */}
      <div className={cn("bg-background overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
