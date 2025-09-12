import React from "react";
import React from "react";
import "@/tron-gradient.css";

export default function TronBackdrop({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-tron text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tron-sheen" />
      {children}
    </div>
  );
}
