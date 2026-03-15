"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Hotel, Users, BedDouble, TrendingUp, TrendingDown,
  CheckCircle, LogOut, Wrench, Sparkles, CalendarCheck, CalendarX,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import type { DashboardStats } from "@/types";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];
const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
};

function StatCard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

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

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Real-time hotel operations summary</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            subtitle={`${stats.occupancyRate.toFixed(1)}% occupancy rate`}
            icon={Hotel}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Revenue This Month"
            value={`NPR ${stats.revenueThisMonth.toLocaleString()}`}
            trend={stats.revenueGrowth}
            icon={TrendingUp}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Bookings This Month"
            value={stats.totalBookingsThisMonth}
            subtitle="Confirmed + Active"
            icon={CalendarCheck}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            subtitle="Registered accounts"
            icon={Users}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Room Status Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Available", val: stats.availableRooms, icon: BedDouble, cls: "text-green-600 bg-green-50" },
            { label: "Occupied", val: stats.occupiedRooms, icon: CheckCircle, cls: "text-blue-600 bg-blue-50" },
            { label: "Cleaning", val: stats.cleaningRooms, icon: Sparkles, cls: "text-yellow-600 bg-yellow-50" },
            { label: "Maintenance", val: stats.maintenanceRooms, icon: Wrench, cls: "text-red-600 bg-red-50" },
          ].map(({ label, val, icon: Icon, cls }) => (
            <div key={label} className={`rounded-xl p-4 flex items-center gap-3 ${cls}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-xs font-medium opacity-80">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-600 text-white rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingCheckIns}</p>
              <p className="text-blue-100 text-sm">Check-ins today</p>
            </div>
          </div>
          <div className="bg-slate-700 text-white rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingCheckOuts}</p>
              <p className="text-slate-300 text-sm">Check-outs today</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Revenue — Last 6 Months</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.revenueByMonth}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`NPR ${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Bookings by Room Type</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.bookingsByRoomType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={75} label>
                  {stats.bookingsByRoomType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Recent Bookings</h2>
            <a href="/admin/bookings" className="text-sm text-amber-600 hover:underline font-medium">
              View all →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Guest", "Room", "Check-in", "Check-out", "Total", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{b.user?.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      Room {b.room?.number} — {b.room?.type}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <BsDateDisplay date={b.checkIn} showBoth />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <BsDateDisplay date={b.checkOut} showBoth />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      NPR {b.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
