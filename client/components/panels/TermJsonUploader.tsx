import React, { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TermData {
  term: string;
  pronunciation?: string;
  etymology?: string;
  definition: string;
}

interface UploadProgress {
  fileName: string;
  status: "pending" | "uploading" | "success" | "error";
  message: string;
  termCount?: number;
}

const REGIONS = [
  { id: "chinese", label: "Chinese", emoji: "🇨🇳" },
  { id: "japanese", label: "Japanese", emoji: "🇯🇵" },
  { id: "thai", label: "Thai", emoji: "🇹🇭" },
  { id: "korean", label: "Korean", emoji: "🇰🇷" },
  { id: "indian", label: "Indian", emoji: "🇮🇳" },
  { id: "vietnamese", label: "Vietnamese", emoji: "🇻🇳" },
  { id: "french", label: "French", emoji: "🇫🇷" },
  { id: "italian", label: "Italian", emoji: "🇮🇹" },
  { id: "spanish", label: "Spanish", emoji: "🇪🇸" },
  { id: "german", label: "German", emoji: "🇩🇪" },
  { id: "mexican", label: "Mexican", emoji: "🇲🇽" },
  { id: "brazilian", label: "Brazilian", emoji: "🇧🇷" },
  { id: "american", label: "American", emoji: "🇺🇸" },
  { id: "middle-eastern", label: "Middle Eastern", emoji: "🌍" },
  { id: "african", label: "African", emoji: "🌍" },
  { id: "oceanic", label: "Oceanic", emoji: "🌊" },
];

export function TermJsonUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("chinese");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [totalTermsUploaded, setTotalTermsUploaded] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;
    await processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files).filter((f) => f.type === "application/json");

    if (fileArray.length === 0) {
      toast.error("Please select valid JSON files");
      return;
    }

    setUploadProgress(
      fileArray.map((f) => ({
        fileName: f.name,
        status: "pending" as const,
        message: "Queued for upload",
      }))
    );

    setIsUploading(true);

    for (const file of fileArray) {
      await uploadFile(file);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const uploadFile = async (file: File) => {
    const fileName = file.name;

    try {
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName
            ? { ...p, status: "uploading", message: "Reading file..." }
            : p
        )
      );

      const text = await file.text();
      console.log(`[TermUploader] ${fileName}: Raw file size: ${text.length} bytes`);

      const terms: TermData[] = JSON.parse(text);
      console.log(`[TermUploader] ${fileName}: Parsed ${terms.length} terms from JSON`);

      if (!Array.isArray(terms)) {
        throw new Error("JSON must be an array of terms");
      }

      if (terms.length === 0) {
        throw new Error("JSON file is empty");
      }

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName
            ? {
                ...p,
                status: "uploading",
                message: `Uploading ${terms.length} terms...`,
              }
            : p
        )
      );

      const response = await fetch("/api/knowledge/upload-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms,
          region: selectedRegion,
        }),
      });

      let result: any = null;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          result = await response.json();
        } catch {
          throw new Error("Server returned invalid JSON response");
        }
      } else {
        const text = await response.text();
        result = {
          error: text || response.statusText || "Unknown server error",
        };
      }

      if (!response.ok) {
        const errorMsg =
          result?.error ||
          result?.message ||
          response.statusText ||
          "Unknown error occurred";
        throw new Error(errorMsg);
      }

      if (!result?.uploadedCount) {
        throw new Error("Invalid server response: missing uploadedCount");
      }

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName
            ? {
                ...p,
                status: "success",
                message: `Successfully uploaded ${result.uploadedCount} terms`,
                termCount: result.uploadedCount,
              }
            : p
        )
      );

      setTotalTermsUploaded((prev) => prev + result.uploadedCount);
      toast.success(
        `${fileName}: ${result.uploadedCount} terms added to ${selectedRegion}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === fileName
            ? {
                ...p,
                status: "error",
                message: `Error: ${message}`,
              }
            : p
        )
      );

      toast.error(`${fileName}: ${message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "uploading":
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card className="p-6 space-y-4 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload Culinary Terms
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Import JSON files with culinary terms to expand Echo's knowledge base
        </p>
      </div>

      {/* Region Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Regional Cuisine
        </label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`p-2 rounded-lg transition-all text-center ${
                selectedRegion === region.id
                  ? "bg-blue-500 text-white ring-2 ring-blue-300"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
              title={region.label}
            >
              <div className="text-lg">{region.emoji}</div>
              <div className="text-xs font-medium truncate">{region.label}</div>
            </button>
          ))}
        </div>
        {selectedRegion && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Terms will be added to:{" "}
            <strong>
              {REGIONS.find((r) => r.id === selectedRegion)?.label}
            </strong>
          </p>
        )}
      </div>

      {/* File Upload Input */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40"
              : "border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="text-center">
              <p className="font-medium text-gray-900 dark:text-white">
                {isDragActive ? "Drop files here" : "Click to upload or drag JSON files"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Format: {`{"term": "", "definition": ""}`}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Status
          </p>
          <div className="space-y-2">
            {uploadProgress.map((progress) => (
              <div
                key={progress.fileName}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                {getStatusIcon(progress.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {progress.fileName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {progress.message}
                  </p>
                </div>
                {progress.termCount && (
                  <Badge
                    variant="secondary"
                    className="flex-shrink-0"
                  >
                    {progress.termCount} terms
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Uploaded Counter */}
      {totalTermsUploaded > 0 && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            ✓ Total terms uploaded: <strong>{totalTermsUploaded}</strong>
          </p>
        </div>
      )}

      {/* Format Help */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-1">JSON Format:</p>
        <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
          {`[{"term": "Term Name", "pronunciation": "optional", "etymology": "optional", "definition": "Definition here"}, ...]`}
        </code>
      </div>
    </Card>
  );
}
