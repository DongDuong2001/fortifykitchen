import * as React from "react";
import { cn } from "../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm px-3 py-1 text-[0.8rem] font-semibold uppercase tracking-wider transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border border-border bg-[#F7F3EC] text-foreground hover:opacity-80":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground hover:opacity-80":
            variant === "destructive",
          "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200":
            variant === "success",
          "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200":
            variant === "warning",
          "text-foreground border border-border": variant === "outline"
        },
        className
      )}
      {...props}
    />
  );
}
