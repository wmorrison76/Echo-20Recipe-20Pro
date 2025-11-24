import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AskEchoPanel from "@/components/RDLab/AskEchoPanel";

export default function EchoFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="Ask Echo - Culinary Knowledge Assistant"
        aria-label="Ask Echo"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Pulsing ring animation */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse opacity-50" />

        {/* Button content */}
        <div className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 flex items-center justify-center">
          <MessageCircle className="h-6 w-6" />
        </div>
      </button>

      {/* Dialog Popup - without overlay */}
      {isOpen && (
        <>
          {/* Backdrop - optional, minimal */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup Dialog - positioned bottom right */}
          <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[95vw] h-[500px] max-h-[85vh] rounded-lg border border-slate-700 bg-slate-950 shadow-xl flex flex-col overflow-hidden">
            {/* Close button in top right */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Ask Echo Panel */}
            <div className="flex-1 overflow-hidden">
              <AskEchoPanel />
            </div>
          </div>
        </>
      )}
    </>
  );
}
