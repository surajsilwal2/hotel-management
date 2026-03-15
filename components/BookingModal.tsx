"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Calendar, Users, BedDouble, Loader2, CheckCircle, AlertCircle, Globe, CreditCard } from "lucide-react";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import { adToBS, formatBS } from "@/lib/nepali-date";
import { useCalendar } from "@/components/CalendarContext";
import KhaltiButton from "@/components/KhaltiButton";

type Room = {
  id: string;
  number: string;
  type: string;
  pricePerNight: number;
  floor: number;
  capacity: number;
  amenities: string[];
  bookings?: any[];
};

interface BookingModalProps {
  room: Room;
  onClose: () => void;
  onSuccess: () => void;
}

const NATIONALITIES = [
  "Nepali", "Indian", "Chinese", "American", "British", "German",
  "French", "Japanese", "Australian", "Canadian", "Korean", "Other",
];

const PURPOSE_OPTIONS = ["Tourism", "Business", "Trekking", "Medical", "Education", "Transit"];

export default function BookingModal({ room, onClose, onSuccess }: BookingModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isBS } = useCalendar();

  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults]     = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes]       = useState("");

  // FNMIS fields — only shown for non-Nepali guests
  const [nationality,    setNationality]    = useState("Nepali");
  const [passportNumber, setPassportNumber] = useState("");
  const [purposeOfVisit, setPurposeOfVisit] = useState("Tourism");

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);

  const today  = format(new Date(), "yyyy-MM-dd");
  const nights = checkIn && checkOut
    ? differenceInCalendarDays(new Date(checkOut), new Date(checkIn))
    : 0;
  const totalPrice    = nights > 0 ? nights * room.pricePerNight : 0;
  const isForeigner   = nationality !== "Nepali";
  const showFNMIS     = isForeigner;

  // Show date labels in BS or AD
  const dateLabel = (dateStr: string) => {
    if (!dateStr || !isBS) return null;
    const bs = adToBS(new Date(dateStr));
    return <span className="text-xs text-amber-600 ml-1">({formatBS(bs)} BS)</span>;
  };

  const handleSubmit = async () => {
    setError("");

    if (!session) { router.push("/login"); return; }
    if (!checkIn || !checkOut) { setError("Please select check-in and check-out dates."); return; }
    if (nights <= 0)           { setError("Check-out must be after check-in."); return; }
    if (adults + children > room.capacity) {
      setError(`Max capacity for this room is ${room.capacity} guests.`);
      return;
    }
    if (showFNMIS && !passportNumber.trim()) {
      setError("Passport/citizenship number is required for foreign guests (FNMIS compliance).");
      return;
    }

    if (conflicts.length > 0) {
      setError("Selected dates conflict with existing bookings. Please choose different dates.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        checkIn:  new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        adults,
        children,
        notes,
        guestNationality: nationality,
        passportNumber:   passportNumber || null,
        purposeOfVisit:   purposeOfVisit,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) { setError(data.error); return; }

    setBookingId(data.data.id);
    setSuccess(true);
  };

  // Helper: check for overlap between two date ranges (inclusive start, exclusive end)
  const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
    const aS = new Date(aStart).getTime();
    const aE = new Date(aEnd).getTime();
    const bS = new Date(bStart).getTime();
    const bE = new Date(bEnd).getTime();
    // overlap when aStart < bEnd && aEnd > bStart
    return aS < bE && aE > bS;
  };

  // Compute conflicts whenever dates or room.bookings change
  const computeConflicts = () => {
    if (!checkIn || !checkOut || !room?.bookings?.length) {
      setConflicts([]);
      return;
    }

    const overlapping = room.bookings.filter((b: any) => {
      try {
        return rangesOverlap(checkIn, checkOut, b.checkIn.slice(0,10), b.checkOut.slice(0,10));
      } catch (e) {
        return false;
      }
    });

    setConflicts(overlapping);
  };

  useEffect(() => {
    computeConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, room?.bookings]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
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
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Booking Submitted!</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Your reservation is pending confirmation.
                </p>
              </div>
              {/* Khalti payment option */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600 mb-3 font-medium">
                  Pay now to confirm instantly:
                </p>
                <KhaltiButton
                  bookingId={bookingId}
                  amount={totalPrice}
                  onSuccess={() => setTimeout(onSuccess, 1500)}
                />
                <button
                  onClick={onSuccess}
                  className="mt-2 w-full text-sm text-slate-500 hover:text-slate-700 py-2"
                >
                  Pay later at hotel →
                </button>
              </div>
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
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value >= checkOut) setCheckOut("");
                      computeConflicts();
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {checkIn && <div className="mt-0.5">{dateLabel(checkIn)}</div>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Check-out
                  </label>
                  <input
                    type="date"
                    min={checkIn ? format(addDays(new Date(checkIn), 1), "yyyy-MM-dd") : today}
                    value={checkOut}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      computeConflicts();
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {checkOut && <div className="mt-0.5">{dateLabel(checkOut)}</div>}
                </div>
              </div>

              {/* Existing bookings for this room (show conflicts) */}
              {room?.bookings && room.bookings.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Booked dates (upcoming)</div>
                  <div className="space-y-2">
                    {room.bookings.map((b: any, i: number) => {
                      const bStart = b.checkIn.slice(0,10);
                      const bEnd = b.checkOut.slice(0,10);
                      const isOverlap = checkIn && checkOut ? rangesOverlap(checkIn, checkOut, bStart, bEnd) : false;
                      return (
                        <div key={i} className={`flex items-center justify-between text-sm px-2 py-1 rounded ${isOverlap ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-white border border-slate-100 text-slate-700'}`}>
                          <div>
                            {new Date(bStart).toLocaleDateString()} → {new Date(bEnd).toLocaleDateString()}
                            {b.user?.name && <div className="text-xs text-slate-500">By: {b.user.name}</div>}
                          </div>
                          <div className="text-xs">{b.status}</div>
                        </div>
                      );
                    })}
                  </div>
                  {conflicts.length > 0 && (
                    <div className="mt-3 text-xs text-red-700">Selected dates conflict with existing bookings highlighted above.</div>
                  )}
                </div>
              )}

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

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Globe className="w-3 h-3 inline mr-1" />Nationality
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* FNMIS Fields — only for foreign guests */}
              {showFNMIS && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                    <Globe className="w-3.5 h-3.5" />
                    Foreign Guest — FNMIS Required Fields
                  </div>
                  <p className="text-xs text-blue-600">
                    Nepal law requires hotels to record and report foreign guest details to the Tourist Police within 24 hours.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">
                      Passport / Citizenship Number *
                    </label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. A1234567"
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">
                      Purpose of Visit
                    </label>
                    <select
                      value={purposeOfVisit}
                      onChange={(e) => setPurposeOfVisit(e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {PURPOSE_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Special requests */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Special Requests (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. early check-in, extra pillow, ground floor..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Price summary */}
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
                  {isBS && checkIn && checkOut && (
                    <p className="text-xs text-amber-700 pt-0.5">
                      {formatBS(adToBS(new Date(checkIn)))} → {formatBS(adToBS(new Date(checkOut)))} BS
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {session ? "Reserve Room" : "Sign in to Book"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
