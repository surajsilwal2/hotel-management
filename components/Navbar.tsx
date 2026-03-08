"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, LayoutDashboard, BedDouble, CalendarCheck, Users, LogOut, ClipboardList } from "lucide-react";

const NAV_LINKS = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/rooms", label: "Rooms", icon: BedDouble },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
  STAFF: [
    { href: "/staff", label: "Operations", icon: ClipboardList },
    { href: "/guest/rooms", label: "Rooms View", icon: BedDouble },
  ],
  GUEST: [
    { href: "/guest/rooms", label: "Browse Rooms", icon: BedDouble },
    { href: "/guest/bookings", label: "My Bookings", icon: CalendarCheck },
    { href: "/guest/profile", label: "Profile", icon: Users },
  ],
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-700",
  STAFF: "bg-blue-100 text-blue-700",
  GUEST: "bg-green-100 text-green-700",
};

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role || "GUEST";
  const links = NAV_LINKS[role as keyof typeof NAV_LINKS] || NAV_LINKS.GUEST;

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Hotel className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">IHMS</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-800 leading-none">
                    {session.user.name}
                  </p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${ROLE_BADGE[role]}`}>
                    {role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
