"use client";
import { useEffect, useState } from "react";
import { Loader2, FileText, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";

type Booking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  adults: number;
  notes: string;
  guestNationality: string;
  passportNumber: string;
  purposeOfVisit: string;
  fnmisReported: boolean;
  fnmisReportedAt: string | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
  creditNoteRef: string | null;
  user: { name: string; email: string; phone: string };
  room: { number: string; type: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  CONFIRMED:   "bg-blue-100 text-blue-800",
  CHECKED_IN:  "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED:   "bg-red-100 text-red-800",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [working, setWorking] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    params.set("limit", "50");
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const data = await res.json();
    if (data.success) setBookings(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setWorking(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchBookings();
    setWorking(null);
  };

  const issueInvoice = async (id: string) => {
    setWorking(id + "_inv");
    const res = await fetch("/api/invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "issue", bookingId: id }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    await fetchBookings();
    setWorking(null);
    setTimeout(() => setMsg(""), 4000);
  };

  const reportFNMIS = async (id: string) => {
    setWorking(id + "_fnmis");
    const res = await fetch("/api/fnmis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    await fetchBookings();
    setWorking(null);
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Booking Management</h1>
            <p className="text-slate-500 mt-1">Manage bookings, invoices, and FNMIS reporting</p>
          </div>
          <button onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Notification */}
        {msg && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {msg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL","PENDING","CONFIRMED","CHECKED_IN","CHECKED_OUT","CANCELLED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >{s === "ALL" ? "All Bookings" : s.replace("_"," ")}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Guest","Room","Check-in","Check-out","Total","Status","Invoice","FNMIS","Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.length === 0 && (
                    <tr><td colSpan={9} className="px-6 py-10 text-center text-slate-400">No bookings found</td></tr>
                  )}
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.user?.name}</p>
                        <p className="text-xs text-slate-400">{b.user?.email}</p>
                        {b.guestNationality && (
                          <span className="text-xs text-blue-600">🌍 {b.guestNationality}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        Room {b.room?.number}<br/>
                        <span className="text-xs text-slate-400">{b.room?.type}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BsDateDisplay date={b.checkIn} showBoth />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <BsDateDisplay date={b.checkOut} showBoth />
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        NPR {b.totalPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                          {b.status}
                        </span>
                      </td>

                      {/* Invoice column */}
                      <td className="px-4 py-3">
                        {b.invoiceNumber ? (
                          <div>
                            <span className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded">
                              {b.invoiceNumber}
                            </span>
                            {b.creditNoteRef && (
                              <p className="text-xs text-red-500 mt-0.5">Reversed: {b.creditNoteRef}</p>
                            )}
                          </div>
                        ) : (
                          ["CONFIRMED","CHECKED_IN","CHECKED_OUT"].includes(b.status) && (
                            <button
                              onClick={() => issueInvoice(b.id)}
                              disabled={working === b.id + "_inv"}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-50"
                            >
                              {working === b.id + "_inv" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                              Issue
                            </button>
                          )
                        )}
                      </td>

                      {/* FNMIS column */}
                      <td className="px-4 py-3">
                        {b.passportNumber ? (
                          b.fnmisReported ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Reported
                            </span>
                          ) : (
                            <button
                              onClick={() => reportFNMIS(b.id)}
                              disabled={working === b.id + "_fnmis"}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                            >
                              {working === b.id + "_fnmis" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              Report
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {b.status === "PENDING" && (
                            <button onClick={() => updateStatus(b.id, "CONFIRMED")}
                              disabled={!!working}
                              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                              Confirm
                            </button>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button onClick={() => updateStatus(b.id, "CHECKED_IN")}
                              disabled={!!working}
                              className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                              Check In
                            </button>
                          )}
                          {b.status === "CHECKED_IN" && (
                            <button onClick={() => updateStatus(b.id, "CHECKED_OUT")}
                              disabled={!!working}
                              className="text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50">
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
