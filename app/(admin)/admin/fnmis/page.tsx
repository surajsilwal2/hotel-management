"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, RefreshCw, AlertTriangle, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";

type UnreportedBooking = {
  id: string;
  checkIn: string;
  checkOut: string;
  guestNationality: string;
  passportNumber: string;
  purposeOfVisit: string;
  fnmisReported: boolean;
  fnmisReportedAt: string | null;
  user: { name: string; email: string; phone: string };
  room: { number: string; type: string; floor: number };
};

export default function FNMISPage() {
  const [bookings, setBookings] = useState<UnreportedBooking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [reporting, setReporting] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<any>(null);

  const fetchUnreported = async () => {
    setLoading(true);
    const res  = await fetch("/api/fnmis");
    const data = await res.json();
    if (data.success) setBookings(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchUnreported(); }, []);

  const markReported = async (bookingId: string) => {
    setReporting(bookingId);
    const res  = await fetch("/api/fnmis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (data.success) setLastReport(data.data);
    await fetchUnreported();
    setReporting(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              FNMIS — Tourist Police Reporting
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Foreign Nationals Management Information System · Nepal Department of Immigration
            </p>
          </div>
          <button onClick={fetchUnreported}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Legal Requirement</p>
            <p>Nepal hotels are legally required to report foreign guest details to the Tourist Police / Immigration within 24 hours of check-in. This dashboard shows all foreign guests whose details have not yet been reported.</p>
          </div>
        </div>

        {/* Last report result */}
        {lastReport && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="font-semibold text-green-800 text-sm mb-2">
              Report generated for: {lastReport.guestName}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-green-700">
              {Object.entries(lastReport).map(([k, v]) => (
                <div key={k}>
                  <span className="font-medium capitalize">{k.replace(/([A-Z])/g, " $1")}: </span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-3xl font-bold text-red-600">{bookings.length}</p>
            <p className="text-sm text-slate-500 mt-1">Unreported Foreign Guests</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-3xl font-bold text-slate-800">24h</p>
            <p className="text-sm text-slate-500 mt-1">Legal Reporting Deadline</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-3xl font-bold text-green-600">FNMIS</p>
            <p className="text-sm text-slate-500 mt-1">DoI Integrated System</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">All foreign guests reported!</p>
            <p className="text-slate-400 text-sm mt-1">No pending FNMIS reports.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-red-50">
              <p className="text-sm font-semibold text-red-700">
                {bookings.length} foreign guest{bookings.length > 1 ? "s" : ""} pending police report
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Guest","Nationality","Passport","Purpose","Room","Check-in","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.user?.name}</p>
                        <p className="text-xs text-slate-400">{b.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-700">
                          🌍 {b.guestNationality}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 text-xs">
                        {b.passportNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.purposeOfVisit}</td>
                      <td className="px-4 py-3 text-slate-600">Room {b.room?.number}</td>
                      <td className="px-4 py-3">
                        <BsDateDisplay date={b.checkIn} showBoth />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => markReported(b.id)}
                          disabled={reporting === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {reporting === b.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ShieldCheck className="w-3 h-3" />
                          }
                          Mark Reported
                        </button>
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
