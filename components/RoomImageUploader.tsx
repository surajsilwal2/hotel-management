"use client";
import { useState } from "react";
import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";

interface RoomImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function RoomImageUploader({ images, onChange }: RoomImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { startUpload, isUploading } = useUploadThing("roomImage", {
    onClientUploadComplete: (res) => {
      const newUrls = res.map((r) => r.url);
      onChange([...images, ...newUrls]);
      setUploadError("");
    },
    onUploadError: (err) => {
      setUploadError(err.message || "Upload failed. Please try again.");
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 6 - images.length;
    if (remaining <= 0) {
      setUploadError("Maximum 6 images per room.");
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    startUpload(toUpload);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Room Images
        <span className="ml-2 text-xs text-slate-400 font-normal">({images.length}/6)</span>
      </label>

      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={url}
                alt={`Room image ${i + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload dropzone */}
      {images.length < 6 && (
        <label
          className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? "border-amber-400 bg-amber-50"
              : "border-slate-300 hover:border-amber-400 hover:bg-slate-50"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-amber-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImagePlus className="w-7 h-7" />
              <p className="text-sm font-medium text-slate-600">
                Drop images here or <span className="text-amber-600">browse</span>
              </p>
              <p className="text-xs">PNG, JPG up to 4MB · Max 6 images</p>
            </div>
          )}
        </label>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" /> {uploadError}
        </p>
      )}
    </div>
  );
}
