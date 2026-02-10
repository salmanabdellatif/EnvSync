"use client";

import { useState, useTransition } from "react";
import { type Variable } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  Loader2,
  Copy,
  Check,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VariableRowProps {
  variable: Variable;
  canDelete: boolean;
  onDelete: (varId: string, varKey: string) => Promise<void>;
  isEven?: boolean;
}

export function VariableRow({
  variable,
  canDelete,
  onDelete,
  isEven = false,
}: VariableRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete(variable.id, variable.key);
      setIsDialogOpen(false);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.key);
    setIsCopied(true);
    toast.success("Key name copied");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between p-4 transition-all duration-200",
        isEven ? "bg-muted/30" : "bg-transparent",
        "hover:bg-muted/50",
      )}
    >
      {/* LEFT SIDE: Icon & Key Name */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Lock Icon (Static) */}
        <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <LockKeyhole className="h-5 w-5 text-emerald-500" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Key Name + Copy */}
          <div className="flex items-center gap-2">
            <code
              className="font-mono font-bold text-sm text-foreground truncate"
              title={variable.key}
            >
              {variable.key}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Row 2: Metadata (Comment | Updated At) */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
            {variable.comment && (
              <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-500/20 max-w-[250px] sm:max-w-xs truncate">
                {variable.comment}
              </span>
            )}
            <span className="text-muted-foreground/70">
              Updated {formatDistanceToNow(new Date(variable.updatedAt))} ago
              {variable.updatedUser && (
                <>
                  {" "}
                  by{" "}
                  <span className="text-green-500">
                    {variable.updatedUser.name}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE: The "Secret" Value (Blurred) */}
      <div className="hidden sm:flex items-center justify-end px-4 flex-1">
        <div className="relative group/secret flex items-center gap-3">
          {/* The Blurred Value */}
          <div className="relative overflow-hidden rounded bg-muted/50 px-3 py-1.5 select-none border border-transparent group-hover/secret:border-border transition-colors">
            <span className="font-mono text-xs text-muted-foreground/40 blur-xs">
              mock secret
            </span>

            {/* "Encrypted" Label Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-widest text-foreground/30 uppercase">
                Encrypted
              </span>
            </div>
          </div>

          {/* The Disabled View Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Viewing secrets in dashboard is coming soon.</p>
                <p className="text-[10px] text-muted-foreground">
                  Use CLI to view values.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* RIGHT SIDE: Delete Action */}
      {canDelete && (
        <div className="pl-2 border-l border-border/40 ml-2">
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Variable</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <code className="font-mono bg-muted px-1 rounded text-foreground">
                    {variable.key}
                  </code>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
