"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUploader from "@/components/AvatarUploader";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", phone: user?.phone || "", address: user?.address || "" },
  });

  const onSubmit = async (data: ProfileForm) => {
    setError("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) { setError(json.error); return; }
    await update({ name: data.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ROLE_BADGE: Record<string, string> = {
    ADMIN: "bg-amber-100 text-amber-700",
    STAFF: "bg-blue-100 text-blue-700",
    GUEST: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8 pb-6 border-b border-slate-100">
            <AvatarUploader currentAvatar={user?.avatar} name={user?.name} size="lg" />
            <p className="mt-3 text-lg font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user?.role] || ""}`}>
              {user?.role}
            </span>
          </div>

          {/* Profile form */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { label: "Full Name", name: "name", type: "text", placeholder: "Your name" },
              { label: "Phone Number", name: "phone", type: "tel", placeholder: "+977-XXXXXXXXXX" },
              { label: "Address", name: "address", type: "text", placeholder: "Your address" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input
                  {...register(name as any)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {(errors as any)[name] && (
                  <p className="mt-1 text-xs text-red-600">{(errors as any)[name]?.message}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
