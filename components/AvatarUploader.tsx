"use client";
import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { useSession } from "next-auth/react";

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
}

export default function AvatarUploader({ currentAvatar, name, size = "md" }: AvatarUploaderProps) {
  const { update } = useSession();
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState("");

  const sizeClasses = { sm: "w-16 h-16", md: "w-24 h-24", lg: "w-32 h-32" };
  const iconSize = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };

  const { startUpload, isUploading } = useUploadThing("userAvatar", {
    onClientUploadComplete: async (res) => {
      const url = res[0]?.url;
      if (url) {
        setPreview(url);
        // Refresh session to reflect new avatar
        await update();
        setError("");
      }
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    startUpload([file]);
  };

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="relative cursor-pointer group">
        {/* Avatar circle */}
        <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex items-center justify-center`}>
          {preview ? (
            <Image src={preview} alt="Profile" fill className="object-cover" />
          ) : (
            <span className="text-slate-500 font-bold text-lg">{initials}</span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isUploading ? (
            <Loader2 className={`${iconSize[size]} text-white animate-spin`} />
          ) : (
            <Camera className={`${iconSize[size]} text-white`} />
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />
      </label>

      <p className="text-xs text-slate-400">
        {isUploading ? "Uploading..." : "Click to change photo"}
      </p>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
