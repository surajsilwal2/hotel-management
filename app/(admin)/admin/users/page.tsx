"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Users, Search, Loader2, Shield, UserCheck, User, Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "GUEST";
  phone: string | null;
  createdAt: string;
  _count: { bookings: number };
};

const ROLE_CONFIG: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  ADMIN: { label: "Admin", cls: "bg-amber-100 text-amber-700",  Icon: Shield },
  STAFF: { label: "Staff", cls: "bg-blue-100 text-blue-700",   Icon: UserCheck },
  GUEST: { label: "Guest", cls: "bg-green-100 text-green-700", Icon: User },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter) params.set("role", roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (data.success) {
      setUsers(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, roleFilter]);

  const updateRole = async (id: string, role: string) => {
    setUpdatingRole(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await fetchUsers();
    setUpdatingRole(null);
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This will also delete all their bookings.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await fetchUsers();
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">{total} users registered</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="GUEST">Guest</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No users found.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["User", "Role", "Phone", "Bookings", "Joined", "Change Role", ""].map((h, i) => (
                        <th
                          key={i}
                          className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((u) => {
                      const cfg = ROLE_CONFIG[u.role];
                      const { Icon } = cfg;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {u.phone || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-700">{u._count.bookings}</span>
                            <span className="text-xs text-slate-400 ml-1">booking{u._count.bookings !== 1 ? "s" : ""}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {format(new Date(u.createdAt), "dd MMM yyyy")}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={u.role}
                                onChange={(e) => updateRole(u.id, e.target.value)}
                                disabled={updatingRole === u.id}
                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:opacity-50"
                              >
                                <option value="GUEST">Guest</option>
                                <option value="STAFF">Staff</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              {updatingRole === u.id && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => deleteUser(u.id, u.name)}
                              disabled={deleting === u.id || u.role === "ADMIN"}
                              title={u.role === "ADMIN" ? "Cannot delete admins" : "Delete user"}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {deleting === u.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
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
