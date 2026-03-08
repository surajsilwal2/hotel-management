"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Calendar, Users, BedDouble, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { addDays, format, differenceInCalendarDays } from "date-fns";

type Room = {
  id: string;
  number: string;
  type: string;
  pricePerNight: number;
  floor: number;
  capacity: number;
  amenities: string[];
};

interface BookingModalProps {
  room: Room;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ room, onClose, onSuccess }: BookingModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const nights = checkIn && checkOut ? differenceInCalendarDays(new Date(checkOut), new Date(checkIn)) : 0;
  const totalPrice = nights > 0 ? nights * room.pricePerNight : 0;

  const handleSubmit = async () => {
    setError("");

    if (!session) {
      router.push("/login");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }

    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      return;
    }

    if (adults + children > room.capacity) {
      setError(`This room has a maximum capacity of ${room.capacity} guests.`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        adults,
        children,
        notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => { onSuccess(); }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Room {room.number}</p>
              <p className="text-xs text-slate-500">{room.type} · Floor {room.floor}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-800">Booking Confirmed!</h3>
              <p className="text-slate-500 text-sm mt-1">Your reservation has been submitted for confirmation.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Check-in
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Check-out
                  </label>
                  <input
                    type="date"
                    min={checkIn ? format(addDays(new Date(checkIn), 1), "yyyy-MM-dd") : today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Users className="w-3 h-3 inline mr-1" />Adults
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Children
                  </label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Special Requests (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. early check-in, extra pillow..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Price Summary */}
              {nights > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 space-y-1.5 border border-amber-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>NPR {room.pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-1.5 flex justify-between font-semibold text-slate-800">
                    <span>Total</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {session ? "Confirm Booking" : "Sign in to Book"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
