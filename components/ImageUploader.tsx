"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploader({ onFileSelect, disabled, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0]?.errors?.[0]?.message;
        setError(firstError ?? "File rejected. Please use JPEG, PNG, or WebP under 10MB.");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
  });

  function clearPreview(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setError(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragActive && !isDragReject
            ? "border-primary bg-primary/5"
            : isDragReject
              ? "border-destructive bg-destructive/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20",
          disabled && "pointer-events-none opacity-60",
          preview ? "py-4" : "py-12"
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative w-full max-w-sm">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={clearPreview}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow hover:bg-destructive/90"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground truncate">{fileName}</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {isDragActive ? (
                <Upload className="h-6 w-6 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop it here!" : "Drag & drop your menu image"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or <span className="text-primary font-medium">browse files</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              JPEG, PNG, WebP · Max 10MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">{error}</p>
      )}
    </div>
  );
}
