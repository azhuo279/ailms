"use client";

import { useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { AlertCircle, CheckCircle2, File, RotateCcw, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import { Button } from "./button";

export interface UploadFileItem {
  id: string;
  name: string;
  /** Size in bytes. */
  size?: number;
  status: "uploading" | "uploaded" | "failed";
  /** 0-100. Only meaningful while status is "uploading". */
  progress?: number;
  errorMessage?: string;
}

export interface FileUploadProps {
  files: UploadFileItem[];
  /** Fires with the raw FileList when files are dropped onto the zone or chosen via the file input. */
  onFilesAdded?: (files: FileList) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  multiple?: boolean;
  /** Native `accept` filter, e.g. ".pdf,.png" or "image/*". */
  accept?: string;
  disabled?: boolean;
  /** Visible label — composed via the shared Field wrapper, never placeholder-only. */
  label: string;
  helperText?: string;
  className?: string;
}

function formatBytes(bytes?: number): string | null {
  if (bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Canonical File Upload — use for document intake such as invoices, PODs,
 * customs forms, manifests, and image evidence. The drop zone is keyboard
 * operable like a button; file-level progress, retry, and removal are
 * surfaced per row rather than as a single aggregate state. Composes the
 * shared Field wrapper for its label/helper text, same as Text Field/Select.
 */
export function FileUpload({
  files,
  onFilesAdded,
  onRemove,
  onRetry,
  multiple = false,
  accept,
  disabled = false,
  label,
  helperText,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      onFilesAdded?.(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded?.(e.target.files);
    }
    e.target.value = "";
  };

  return (
    <Field label={label} helperText={helperText} disabled={disabled} className={className}>
      {({ inputId, describedBy }) => (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            onChange={handleInputChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled || undefined}
            aria-describedby={describedBy}
            aria-label={`${label}, upload files`}
            onClick={openFileDialog}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle bg-surface-raised px-4 py-8 text-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              !disabled && "cursor-pointer hover:border-border-strong",
              isDragOver && !disabled && "border-focus-ring bg-option-hover",
              disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled",
            )}
          >
            <Upload
              aria-hidden="true"
              className={cn("size-6", disabled ? "text-fg-disabled" : "text-fg-muted")}
            />
            <p className={cn("text-body-m font-medium", disabled ? "text-fg-disabled" : "text-fg-primary")}>
              {isDragOver ? "Drop files to upload" : "Drag files here or click to browse"}
            </p>
          </div>

          {files.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {files.map((file) => {
                const sizeLabel = formatBytes(file.size);
                return (
                  <li
                    key={file.id}
                    className={cn(
                      "flex items-center gap-3 rounded-md border border-border-subtle bg-surface-raised px-3 py-2",
                      file.status === "failed" && "border-danger-border bg-danger-surface",
                    )}
                  >
                    <span className="flex shrink-0 items-center">
                      {file.status === "uploaded" ? (
                        <CheckCircle2 className="size-4 text-success-fg" aria-hidden="true" />
                      ) : file.status === "failed" ? (
                        <AlertCircle className="size-4 text-danger-fg" aria-hidden="true" />
                      ) : (
                        <File className="size-4 text-fg-muted" aria-hidden="true" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-body-s font-medium text-fg-primary">{file.name}</span>
                        {sizeLabel ? <span className="shrink-0 text-caption text-fg-muted">{sizeLabel}</span> : null}
                      </div>
                      {file.status === "uploading" ? (
                        <div
                          role="progressbar"
                          aria-valuenow={file.progress ?? 0}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Uploading ${file.name}`}
                          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
                        >
                          <div
                            className="h-full rounded-full bg-btn-primary transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, file.progress ?? 0))}%` }}
                          />
                        </div>
                      ) : null}
                      {file.status === "failed" && file.errorMessage ? (
                        <p role="alert" className="text-caption text-danger-fg">
                          {file.errorMessage}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {file.status === "failed" && onRetry ? (
                        <Button
                          iconOnly
                          aria-label={`Retry ${file.name}`}
                          icon={<RotateCcw />}
                          size="sm"
                          variant="ghost"
                          className="size-8"
                          onClick={() => onRetry(file.id)}
                        />
                      ) : null}
                      {onRemove ? (
                        <Button
                          iconOnly
                          aria-label={`Remove ${file.name}`}
                          icon={<X />}
                          size="sm"
                          variant="ghost"
                          className="size-8"
                          onClick={() => onRemove(file.id)}
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </Field>
  );
}
