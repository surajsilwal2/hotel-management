import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { adToBS, formatBS } from "@/lib/nepali-date";

/**
 * FNMIS (Foreign Nationals Management Information System) Integration
 * Nepal Department of Immigration — Tourist Police Reporting
 *
 * Hotels are legally required to report foreign guest details within 24 hours.
 * This endpoint:
 * 1. GET  — fetch all unreported foreign guest bookings
 * 2. POST — mark a booking as reported + return formatted report data
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Find bookings with passport details that haven't been reported yet
    const unreported = await prisma.booking.findMany({
      where: {
        passportNumber:  { not: null },
        fnmisReported:   false,
        status:          { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { number: true, type: true, floor: true } },
      },
      orderBy: { checkIn: "asc" },
    });

    return NextResponse.json({ success: true, data: unreported, count: unreported.length });
  } catch (error) {
    console.error("[FNMIS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { number: true, type: true, floor: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (!booking.passportNumber) {
      return NextResponse.json(
        { success: false, error: "No passport number recorded for this booking. Please update guest details." },
        { status: 400 }
      );
    }

    // Mark as reported
    await prisma.booking.update({
      where: { id: bookingId },
      data: { fnmisReported: true, fnmisReportedAt: new Date() },
    });

    // Generate FNMIS-formatted report data
    const checkInBS = adToBS(new Date(booking.checkIn));
    const checkOutBS = adToBS(new Date(booking.checkOut));

    const reportData = {
      reportGeneratedAt: new Date().toISOString(),
      hotelName:         "IHMS — Integrated Hotel Management System",
      guestName:         booking.user.name,
      nationality:       booking.guestNationality || "N/A",
      passportNumber:    booking.passportNumber,
      purposeOfVisit:    booking.purposeOfVisit || "Tourism",
      roomNumber:        booking.room.number,
      checkInAD:         new Date(booking.checkIn).toLocaleDateString(),
      checkInBS:         formatBS(checkInBS),
      checkOutAD:        new Date(booking.checkOut).toLocaleDateString(),
      checkOutBS:        formatBS(checkOutBS),
      contactPhone:      booking.user.phone || "N/A",
      contactEmail:      booking.user.email,
    };

    return NextResponse.json({
      success: true,
      data: reportData,
      message: "Booking marked as reported to FNMIS. Report data generated.",
    });
  } catch (error) {
    console.error("[FNMIS_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
