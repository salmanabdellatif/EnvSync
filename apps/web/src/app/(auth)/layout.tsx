import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-grid-static p-4 relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          href="/"
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Centered Form Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md">
          {/* Form Content */}
          <div className="relative z-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
