import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// GET /api/admin/stats — admin only
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // ── Room Counts by Status ────────────────────────────────────────────────
    const [totalRooms, occupiedRooms, availableRooms, cleaningRooms, maintenanceRooms] =
      await Promise.all([
        prisma.room.count(),
        prisma.room.count({ where: { status: "OCCUPIED" } }),
        prisma.room.count({ where: { status: "AVAILABLE" } }),
        prisma.room.count({ where: { status: "CLEANING" } }),
        prisma.room.count({ where: { status: "MAINTENANCE" } }),
      ]);

    // ── Revenue & Bookings ───────────────────────────────────────────────────
    const [thisMonthBookings, lastMonthBookings, totalGuests] = await Promise.all([
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        select: { totalPrice: true },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        select: { totalPrice: true },
      }),
      prisma.user.count({ where: { role: "GUEST" } }),
    ]);

    const revenueThisMonth = thisMonthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const revenueLastMonth = lastMonthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const revenueGrowth =
      revenueLastMonth === 0
        ? 100
        : ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;

    // ── Pending Check-ins/Check-outs for today ──────────────────────────────
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const [pendingCheckIns, pendingCheckOuts] = await Promise.all([
      prisma.booking.count({
        where: {
          status: "CONFIRMED",
          checkIn: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CHECKED_IN",
          checkOut: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    // ── Revenue by Month (last 6 months) ───────────────────────────────────
    const revenueByMonth = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(new Date(), 5 - i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        return prisma.booking
          .findMany({
            where: {
              status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
              createdAt: { gte: start, lte: end },
            },
            select: { totalPrice: true },
          })
          .then((bookings) => ({
            month: format(monthDate, "MMM yyyy"),
            revenue: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
            bookings: bookings.length,
          }));
      })
    );

    // ── Bookings by Room Type ───────────────────────────────────────────────
    const bookingsByTypeRaw = await prisma.booking.groupBy({
      by: ["roomId"],
      _count: { id: true },
      where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
    });

    const roomTypes = await prisma.room.findMany({
      where: { id: { in: bookingsByTypeRaw.map((b) => b.roomId) } },
      select: { id: true, type: true },
    });

    const typeCountMap: Record<string, number> = {};
    for (const b of bookingsByTypeRaw) {
      const room = roomTypes.find((r) => r.id === b.roomId);
      if (room) {
        typeCountMap[room.type] = (typeCountMap[room.type] || 0) + b._count.id;
      }
    }

    const bookingsByRoomType = Object.entries(typeCountMap).map(([type, count]) => ({
      type,
      count,
    }));

    // ── Recent Bookings ─────────────────────────────────────────────────────
    const recentBookings = await prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, number: true, type: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        cleaningRooms,
        maintenanceRooms,
        occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
        totalBookingsThisMonth: thisMonthBookings.length,
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth,
        pendingCheckIns,
        pendingCheckOuts,
        totalGuests,
        revenueByMonth,
        bookingsByRoomType,
        recentBookings,
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
