"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, X, BedDouble } from "lucide-react";
import Navbar from "@/components/Navbar";
import RoomImageUploader from "@/components/RoomImageUploader";
import Image from "next/image";

type Room = {
  id: string;
  number: string;
  type: string;
  status: string;
  pricePerNight: number;
  floor: number;
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
};

const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  type: z.enum(["SINGLE", "DOUBLE", "DELUXE", "SUITE", "PENTHOUSE"]),
  pricePerNight: z.coerce.number().positive("Price must be positive"),
  floor: z.coerce.number().int().positive("Floor must be positive"),
  capacity: z.coerce.number().int().min(1).max(10),
  description: z.string().optional(),
  amenities: z.string().optional(), // comma-separated input
});

type RoomForm = z.infer<typeof roomSchema>;

const ROOM_TYPE_COLORS: Record<string, string> = {
  SINGLE: "bg-slate-100 text-slate-700",
  DOUBLE: "bg-blue-100 text-blue-700",
  DELUXE: "bg-amber-100 text-amber-700",
  SUITE: "bg-purple-100 text-purple-700",
  PENTHOUSE: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-blue-100 text-blue-700",
  CLEANING: "bg-yellow-100 text-yellow-700",
  MAINTENANCE: "bg-red-100 text-red-700",
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
  });

  const fetchRooms = async () => {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    if (data.success) setRooms(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => {
    setEditRoom(null);
    setImages([]);
    setError("");
    reset({ type: "SINGLE", capacity: 2, floor: 1 });
    setShowModal(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setImages(room.images || []);
    setError("");
    reset({
      number: room.number,
      type: room.type as any,
      pricePerNight: room.pricePerNight,
      floor: room.floor,
      capacity: room.capacity,
      description: room.description || "",
      amenities: room.amenities.join(", "),
    });
    setShowModal(true);
  };

  const onSubmit = async (data: RoomForm) => {
    setSaving(true);
    setError("");

    const payload = {
      ...data,
      amenities: data.amenities
        ? data.amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
      images,
    };

    const res = await fetch(editRoom ? `/api/rooms/${editRoom.id}` : "/api/rooms", {
      method: editRoom ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setError(json.error);
      return;
    }

    setShowModal(false);
    fetchRooms();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Delete this room? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchRooms();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Room Management</h1>
            <p className="text-slate-500 mt-1">{rooms.length} rooms total</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Cover image */}
                <div className="h-44 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                  {room.images?.[0] ? (
                    <Image src={room.images[0]} alt={`Room ${room.number}`} fill className="object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BedDouble className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROOM_TYPE_COLORS[room.type]}`}>
                      {room.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[room.status]}`}>
                      {room.status}
                    </span>
                  </div>
                  {room.images?.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      +{room.images.length - 1} more
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800">Room {room.number}</h3>
                    <span className="text-sm text-slate-500">Floor {room.floor}</span>
                  </div>
                  <p className="text-amber-600 font-semibold text-sm mb-3">
                    NPR {room.pricePerNight.toLocaleString()} / night
                  </p>
                  {room.amenities?.length > 0 && (
                    <p className="text-xs text-slate-400 mb-3 truncate">{room.amenities.join(" · ")}</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => openEdit(room)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteRoom(room.id)}
                      disabled={deleting === room.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === room.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editRoom ? `Edit Room ${editRoom.number}` : "Add New Room"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Room Number", name: "number", type: "text", placeholder: "e.g. 101" },
                  { label: "Floor", name: "floor", type: "number", placeholder: "1" },
                  { label: "Price / Night (NPR)", name: "pricePerNight", type: "number", placeholder: "2500" },
                  { label: "Max Capacity", name: "capacity", type: "number", placeholder: "2" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                    <input
                      {...register(name as any)}
                      type={type}
                      placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {(errors as any)[name] && (
                      <p className="mt-1 text-xs text-red-600">{(errors as any)[name]?.message}</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Room Type</label>
                <select
                  {...register("type")}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {["SINGLE", "DOUBLE", "DELUXE", "SUITE", "PENTHOUSE"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Amenities <span className="font-normal normal-case text-slate-400">(comma separated)</span>
                </label>
                <input
                  {...register("amenities")}
                  type="text"
                  placeholder="WiFi, AC, TV, Coffee, Minibar"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Describe the room..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* ── Image Upload ── */}
              <RoomImageUploader images={images} onChange={setImages} />

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editRoom ? "Save Changes" : "Create Room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
