import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/invoice/refund — Admins can issue a credit note and mark booking refunded
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, reason } = await req.json();
    if (!bookingId) return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    if (!booking.invoiceIssuedAt || !booking.invoiceNumber) {
      return NextResponse.json({ success: false, error: "Booking has no issued invoice to refund" }, { status: 400 });
    }

    if (booking.refunded) {
      return NextResponse.json({ success: false, error: "Booking already refunded" }, { status: 409 });
    }

    const creditNoteRef = `CN-${booking.invoiceNumber}`;

    // Mark booking as cancelled/refunded and set credit note
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        creditNoteRef,
        refunded: true,
        refundedAt: new Date(),
      },
    });

    // Optionally: record refund audit entry (simple approach)
    // If you have an audit model in your Prisma schema, call it here.
    // Example (adjust model/name/fields to your schema):
    // await prisma.refundAudit.create({
    //   data: {
    //     bookingId,
    //     reason,
    //     issuedBy: (session.user as any).email,
    //     createdAt: new Date(),
    //   },
    // });
    // Otherwise, do nothing.

    return NextResponse.json({
      success: true,
      data: { creditNoteRef, bookingId: updated.id, refundedAt: updated.refundedAt },
      message: `Refund issued and credit note ${creditNoteRef} created.`,
    });
  } catch (error) {
    console.error("[INVOICE_REFUND_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
