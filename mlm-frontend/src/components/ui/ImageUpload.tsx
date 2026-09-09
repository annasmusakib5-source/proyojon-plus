"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Link as LinkIcon, Check } from "lucide-react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "proyojon_plus",
  label = "Upload Image",
  placeholder = "https://example.com/image.jpg",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    try {
      setUploading(true);
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success && res.data.data?.url) {
        onChange(res.data.data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(res.data?.message || "Upload failed");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || "Failed to upload image";
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between text-xs">
        <label className="text-muted-foreground font-medium">{label}</label>
        <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg border border-border/40">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
              mode === "file"
                ? "bg-gold-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadCloud className="h-3 w-3 inline mr-1" />
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
              mode === "url"
                ? "bg-gold-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LinkIcon className="h-3 w-3 inline mr-1" />
            Direct URL
          </button>
        </div>
      </div>

      {/* Direct URL Input Mode */}
      {mode === "url" && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-foreground text-sm focus:ring-2 focus:ring-gold-500/40 focus:outline-none placeholder:text-muted-foreground/40"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Clear URL"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* File Upload Mode */}
      {mode === "file" && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            accept="image/*"
            className="hidden"
          />

          {value ? (
            /* Uploaded Preview State */
            <div className="relative group rounded-xl overflow-hidden border border-gold-500/30 bg-secondary/30 p-2 flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 border border-border/50">
                <img
                  src={value}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-0.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Image Uploaded to Cloudinary</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate font-mono">{value}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-[11px] text-gold-400 hover:underline mt-1 inline-block"
                >
                  Change image
                </button>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Dropzone / Upload Box */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-gold-400 bg-gold-500/10"
                  : "border-border/60 hover:border-gold-500/40 bg-secondary/20 hover:bg-secondary/40"
              } ${uploading ? "opacity-75 pointer-events-none" : ""}`}
            >
              {uploading ? (
                <div className="py-3 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
                  <p className="text-xs text-gold-400 font-medium">Uploading to Cloudinary...</p>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-center justify-center space-y-1.5">
                  <div className="h-9 w-9 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-400 mb-0.5">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse or drag & drop image
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, WebP or GIF (Auto-optimized via Cloudinary)
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
