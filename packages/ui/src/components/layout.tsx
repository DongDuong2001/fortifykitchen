import * as React from "react";
import { cn } from "../lib/utils";

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  navbar?: React.ReactNode;
}

export function AppLayout({ className, sidebar, navbar, children, ...props }: LayoutProps) {
  return (
    <div className={cn("min-h-screen flex bg-background text-foreground", className)} {...props}>
      {sidebar}
      <div className="flex-1 flex flex-col">
        {navbar}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
