"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, BedDouble, Loader2, XCircle, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import KhaltiButton from "@/components/KhaltiButton";
import { getNepalisFiscalYear } from "@/lib/nepali-date";

type Booking = {
  id: string; status: string; checkIn: string; checkOut: string;
  totalPrice: number; adults: number; children: number; notes: string;
  guestNationality: string; fnmisReported: boolean; invoiceNumber: string | null;
  createdAt: string; room: { number: string; type: string; floor: number };
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Awaiting Confirmation", cls: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:   { label: "Confirmed",             cls: "bg-blue-100 text-blue-800" },
  CHECKED_IN:  { label: "Checked In",            cls: "bg-green-100 text-green-800" },
  CHECKED_OUT: { label: "Checked Out",           cls: "bg-slate-100 text-slate-700" },
  CANCELLED:   { label: "Cancelled",             cls: "bg-red-100 text-red-800" },
};

export default function GuestBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings?limit=50");
    const data = await res.json();
    if (data.success) setBookings(data.data);
    setLoading(false);
  };
  useEffect(() => { fetchBookings(); }, []);

  const cancelBooking = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id);
    // Find booking in local cache to decide whether to create a refund request
    const bk = bookings.find((x) => x.id === id) as any;
    await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });

    // If this booking was paid (invoice issued or payment provider present), create a refund request so admins can process it
    try {
      if (bk && (bk.invoiceNumber || (bk as any).paymentProvider)) {
        await fetch(`/api/refunds`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id, reason: "Customer cancelled via UI" }) });
      }
    } catch (err) {
      // non-fatal — refund request can be created later by user or admin
      console.error("Failed to create refund request", err);
    }

    await fetchBookings(); setCancelling(null);
  };

  const getNights = (ci: string, co: string) =>
    Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
          <p className="text-slate-500 mt-1">
            Manage your reservations · <span className="text-amber-600 font-medium">{getNepalisFiscalYear(new Date())}</span>
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <BedDouble className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No bookings yet.</p>
            <a href="/guest/rooms" className="mt-4 inline-block px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors">Browse Rooms</a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const cfg = STATUS_CONFIG[b.status];
              const nights = getNights(b.checkIn, b.checkOut);
              const canCancel = ["PENDING","CONFIRMED"].includes(b.status);
              const canPay = b.status === "PENDING" && !b.invoiceNumber;
              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                          <CalendarCheck className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Room {b.room?.number} — {b.room?.type}</p>
                          <p className="text-sm text-slate-500">Floor {b.room?.floor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.invoiceNumber && (
                          <span className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                            Invoice: {b.invoiceNumber}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Check-in</p>
                        <BsDateDisplay date={b.checkIn} showBoth className="text-sm font-medium text-slate-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Check-out</p>
                        <BsDateDisplay date={b.checkOut} showBoth className="text-sm font-medium text-slate-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Duration</p>
                        <p className="text-sm font-medium text-slate-700">{nights} night{nights > 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total</p>
                        <p className="text-sm font-bold text-slate-800">NPR {b.totalPrice?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-50">
                      <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                        <span>{b.adults} adult{b.adults > 1 ? "s" : ""}{b.children > 0 ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}</span>
                        {b.guestNationality && b.guestNationality !== "Nepali" && <span className="text-blue-500">🌍 {b.guestNationality}</span>}
                        {b.fnmisReported && <span className="text-green-500">✓ FNMIS Reported</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {canPay && (
                          <button onClick={() => setExpandedPayment(expandedPayment === b.id ? null : b.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors">
                            <CreditCard className="w-3 h-3" /> Pay Online
                          </button>
                        )}
                        {canCancel && (
                          <button onClick={() => cancelBooking(b.id)} disabled={cancelling === b.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                            {cancelling === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedPayment === b.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <KhaltiButton bookingId={b.id} amount={b.totalPrice}
                          onSuccess={() => { setExpandedPayment(null); fetchBookings(); }} />
                      </div>
                    )}
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
