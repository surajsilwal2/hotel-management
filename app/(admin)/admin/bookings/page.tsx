"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarCheck, Loader2, CheckCircle, XCircle,
  LogIn, LogOut, RefreshCw,
} from "lucide-react";
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
  user: { name: string; email: string; phone?: string };
  room: { number: string; type: string; floor: number };
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",     cls: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:  { label: "Confirmed",   cls: "bg-blue-100 text-blue-800" },
  CHECKED_IN: { label: "Checked In",  cls: "bg-green-100 text-green-800" },
  CHECKED_OUT:{ label: "Checked Out", cls: "bg-slate-100 text-slate-700" },
  CANCELLED:  { label: "Cancelled",   cls: "bg-red-100 text-red-800" },
};

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] as const;

type StatusAction = {
  next: string;
  label: string;
  cls: string;
  icon: React.ElementType;
};

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  PENDING: [
    { next: "CONFIRMED",  label: "Confirm",  cls: "bg-blue-500 hover:bg-blue-600 text-white",      icon: CheckCircle },
    { next: "CANCELLED",  label: "Cancel",   cls: "bg-red-100 hover:bg-red-200 text-red-700",      icon: XCircle },
  ],
  CONFIRMED: [
    { next: "CHECKED_IN", label: "Check In", cls: "bg-green-500 hover:bg-green-600 text-white",    icon: LogIn },
    { next: "CANCELLED",  label: "Cancel",   cls: "bg-red-100 hover:bg-red-200 text-red-700",      icon: XCircle },
  ],
  CHECKED_IN: [
    { next: "CHECKED_OUT",label: "Check Out",cls: "bg-slate-600 hover:bg-slate-700 text-white",    icon: LogOut },
  ],
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (activeTab !== "ALL") params.set("status", activeTab);
    const res = await fetch(`/api/bookings?${params}`);
    const data = await res.json();
    if (data.success) {
      setBookings(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [activeTab, page]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchBookings();
    setUpdating(null);
  };

  const getNights = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">All Bookings</h1>
            <p className="text-slate-500 mt-1">{total} bookings total</p>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "ALL" ? "All" : STATUS_CONFIG[tab].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No bookings found for this filter.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Guest", "Room", "Dates", "Nights", "Total", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bookings.map((b) => {
                      const cfg = STATUS_CONFIG[b.status];
                      const nights = getNights(b.checkIn, b.checkOut);
                      const actions = STATUS_ACTIONS[b.status] || [];

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">{b.user?.name}</p>
                            <p className="text-xs text-slate-400">{b.user?.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-700">Room {b.room?.number}</p>
                            <p className="text-xs text-slate-400">
                              {b.room?.type} · Floor {b.room?.floor}
                            </p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="text-slate-700">
                              {format(new Date(b.checkIn), "dd MMM")}
                            </p>
                            <p className="text-xs text-slate-400">
                              → {format(new Date(b.checkOut), "dd MMM yyyy")}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {nights}n
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">
                            NPR {b.totalPrice?.toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              {actions.map((action) => {
                                const ActionIcon = action.icon;
                                return (
                                  <button
                                    key={action.next}
                                    onClick={() => updateStatus(b.id, action.next)}
                                    disabled={updating === b.id}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${action.cls}`}
                                  >
                                    {updating === b.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <ActionIcon className="w-3 h-3" />
                                    )}
                                    {action.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
