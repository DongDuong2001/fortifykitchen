import * as React from "react";
import { cn } from "../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-tight transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:opacity-80":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground hover:opacity-80":
            variant === "destructive",
          "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200":
            variant === "success",
          "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200":
            variant === "warning",
          "text-foreground": variant === "outline"
        },
        className
      )}
      {...props}
    />
  );
}
