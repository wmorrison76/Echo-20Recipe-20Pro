import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  multiple = true,
  onFiles,
  children,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  children?: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handle = useCallback(
    (items: FileList | null) => {
      if (!items) return;
      const files = Array.from(items);
      onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all bg-gradient-to-br from-background to-muted/40 hover:shadow-md",
        dragOver ? "border-ring ring-2 ring-ring/40" : "border-muted-foreground/30",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handle(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handle(e.target.files)}
      />
      {children ?? (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Click to select files</p>
          <p>or drag and drop here</p>
        </div>
      )}
    </div>
  );
}
