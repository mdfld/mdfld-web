"use client";

import { useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ImportRow } from "@/lib/import/types";

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  onParsed: (rows: ImportRow[]) => void;
}

export default function ImportCsvDropZone({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/bulk-import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse file.");
        return;
      }
      if (data.rows.length === 0) {
        setError("No products found in this file. Make sure you're using the MDFLD template format.");
        return;
      }
      onParsed(data.rows as ImportRow[]);
    } catch {
      setError("Something went wrong reading the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        dragging ? "border-primary bg-primary-50" : "border-divider"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />
      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-default-500">Parsing your file...</p>
        </div>
      ) : (
        <>
          <Icon icon="solar:upload-outline" className="w-8 h-8 text-default-300 mx-auto mb-3" />
          <p className="text-sm text-default-500 mb-1">
            Drag & drop any CSV export here
          </p>
          <p className="text-xs text-default-400 mb-4">
            We'll detect the format and map it to MDFLD automatically —{" "}
            <button
              className="text-primary underline"
              onClick={() => inputRef.current?.click()}
            >
              or browse file
            </button>
          </p>
          {error && (
            <p className="text-xs text-danger mt-2">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
