import React from "react";
import Loader from "@/components/Loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-300">
      <Loader />
      <div className="mt-4 flex flex-col items-center space-y-2">
        <span className="font-heading text-lg font-bold uppercase tracking-wider text-primary">
          Fortify Kitchen
        </span>
        <span className="text-xs font-semibold tracking-widest text-muted-foreground animate-pulse">
          Đang tải trải nghiệm dinh dưỡng...
        </span>
      </div>
    </div>
  );
}
