"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    const res = await fetch("/api/refunds");
    const data = await res.json();
    if (data.success) setRequests(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const processRefund = async (id: string, bookingId: string) => {
    if (!confirm("Process refund and issue credit note for this booking?")) return;
    setProcessing(id);

    // Call invoice refund endpoint (admin-only)
    const r = await fetch("/api/invoice/refund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
    const j = await r.json();
    if (!j.success) { alert(j.error || 'Failed'); setProcessing(null); return; }

    // Mark refund request as PROCESSED
    await fetch("/api/refunds", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "PROCESSED" }) });

    await fetchRequests(); setProcessing(null);
    alert("Refund processed and credit note created.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Refund Requests</h1>
          <p className="text-slate-500 mt-1">List of pending refund requests from guests</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">No refund requests</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">Booking {r.booking?.id} — Room {r.booking?.room?.number}</p>
                      <p className="text-sm text-slate-500">Requested by: {r.booking?.user?.name} · {new Date(r.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-slate-500 mt-2">Reason: {r.reason || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Status: {r.status}</p>
                      <div className="mt-3">
                        <button onClick={() => processRefund(r.id, r.bookingId)} disabled={processing === r.id} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">{processing === r.id ? 'Processing...' : 'Process Refund'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
