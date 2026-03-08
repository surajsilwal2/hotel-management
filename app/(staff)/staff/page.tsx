"use client";
import { useEffect, useState } from "react";
import { BedDouble, CheckCircle, Sparkles, Wrench, RefreshCw, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

type Room = {
  id: string;
  number: string;
  type: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  floor: number;
  pricePerNight: number;
};

type Booking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  user: { name: string; email: string };
  room: { number: string; type: string; floor: number };
};

const STATUS_CONFIG = {
  AVAILABLE: { color: "bg-green-100 text-green-800 border-green-200", icon: BedDouble, dot: "bg-green-500" },
  OCCUPIED: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle, dot: "bg-blue-500" },
  CLEANING: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Sparkles, dot: "bg-yellow-400" },
  MAINTENANCE: { color: "bg-red-100 text-red-800 border-red-200", icon: Wrench, dot: "bg-red-500" },
};

const BOOKING_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function StaffPanel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"rooms" | "checkins">("rooms");

  const fetchData = async () => {
    const [roomsRes, bookingsRes] = await Promise.all([
      fetch("/api/rooms?status=all").then((r) => r.json()),
      fetch("/api/bookings?status=CONFIRMED&limit=20").then((r) => r.json()),
    ]);
    if (roomsRes.success) setRooms(roomsRes.data);
    if (bookingsRes.success) setBookings(bookingsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateRoomStatus = async (roomId: string, status: Room["status"]) => {
    setUpdating(roomId);
    await fetch(`/api/staff/rooms/${roomId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
    setUpdating(null);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    setUpdating(bookingId);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
        </div>
      </div>
    );
  }

  const statusCounts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Staff Operations Panel</h1>
            <p className="text-slate-500 mt-1">Manage room statuses and guest check-ins</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"] as Room["status"][]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className={`rounded-xl p-4 flex items-center gap-3 border ${cfg.color}`}>
                <Icon className="w-5 h-5" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
                  <p className="text-xs font-medium capitalize">{s.toLowerCase()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
          {(["rooms", "checkins"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "rooms" ? "Room Status" : "Pending Check-ins"}
            </button>
          ))}
        </div>

        {tab === "rooms" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const cfg = STATUS_CONFIG[room.status];
              return (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-slate-800">Room {room.number}</p>
                      <p className="text-xs text-slate-500">Floor {room.floor} · {room.type}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {room.status}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">
                    NPR {room.pricePerNight.toLocaleString()} / night
                  </p>

                  <div className="space-y-1.5">
                    {(["AVAILABLE", "CLEANING", "MAINTENANCE"] as Room["status"][])
                      .filter((s) => s !== room.status)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => updateRoomStatus(room.id, s)}
                          disabled={updating === room.id}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 disabled:opacity-50 flex items-center gap-2"
                        >
                          {updating === room.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                          )}
                          Mark as {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "checkins" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Guest", "Room", "Check-in", "Check-out", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No confirmed bookings waiting for check-in
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{b.user?.name}</p>
                      <p className="text-xs text-slate-400">{b.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">Room {b.room?.number}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(b.checkIn).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(b.checkOut).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">NPR {b.totalPrice?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BOOKING_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "CHECKED_IN")}
                          disabled={updating === b.id}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {updating === b.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Check In
                        </button>
                      )}
                      {b.status === "CHECKED_IN" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "CHECKED_OUT")}
                          disabled={updating === b.id}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {updating === b.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
