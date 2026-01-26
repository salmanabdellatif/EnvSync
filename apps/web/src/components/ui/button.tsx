import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-white to-zinc-200 text-black shadow-[0_0_25px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.3),0_4px_20px_rgba(0,0,0,0.4)] hover:scale-105",
        secondary:
          "border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-foreground/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  target?: string;
  rel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, href, target, rel, children, ...props },
    ref,
  ) => {
    const combinedClassName = cn(buttonVariants({ variant, size, className }));

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={combinedClassName}
          onClick={props.onClick as any}
        >
          {children}
        </Link>
      );
    }

    return (
      <button className={combinedClassName} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
