import * as React from "react";
import { cn } from "../lib/utils";

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {}

export function Navbar({ className, children, ...props }: NavbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur sticky top-0 z-40 w-full",
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}
