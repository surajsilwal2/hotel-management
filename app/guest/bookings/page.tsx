"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, BedDouble, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Booking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  adults: number;
  children: number;
  notes: string | null;
  createdAt: string;
  room: { number: string; type: string; floor: number };
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Awaiting Confirmation", cls: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:  { label: "Confirmed",             cls: "bg-blue-100 text-blue-800" },
  CHECKED_IN: { label: "Checked In",            cls: "bg-green-100 text-green-800" },
  CHECKED_OUT:{ label: "Checked Out",           cls: "bg-slate-100 text-slate-700" },
  CANCELLED:  { label: "Cancelled",             cls: "bg-red-100 text-red-800" },
};

export default function GuestBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings?limit=50");
    const data = await res.json();
    if (data.success) setBookings(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    await fetchBookings();
    setCancelling(null);
  };

  const getNights = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
          <p className="text-slate-500 mt-1">Manage your reservations</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <BedDouble className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium mb-4">You have no bookings yet.</p>
            <Link
              href="/guest/rooms"
              className="inline-block px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
            >
              Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const cfg = STATUS_CONFIG[b.status];
              const nights = getNights(b.checkIn, b.checkOut);
              const canCancel = ["PENDING", "CONFIRMED"].includes(b.status);

              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                          <CalendarCheck className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Room {b.room?.number} — {b.room?.type}
                          </p>
                          <p className="text-sm text-slate-500">Floor {b.room?.floor}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg?.cls}`}>
                        {cfg?.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Check-in",  value: format(new Date(b.checkIn), "dd MMM yyyy") },
                        { label: "Check-out", value: format(new Date(b.checkOut), "dd MMM yyyy") },
                        { label: "Duration",  value: `${nights} night${nights > 1 ? "s" : ""}` },
                        { label: "Total",     value: `NPR ${b.totalPrice?.toLocaleString()}` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                          <p className={`text-sm font-medium text-slate-700 ${label === "Total" ? "font-bold text-slate-800" : ""}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-slate-400">
                        Booked on {format(new Date(b.createdAt), "dd MMM yyyy")} ·{" "}
                        {b.adults} adult{b.adults > 1 ? "s" : ""}
                        {b.children > 0 ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}
                        {b.notes && ` · "${b.notes}"`}
                      </p>
                      {canCancel && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          disabled={cancelling === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cancelling === b.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <XCircle className="w-3 h-3" />}
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
