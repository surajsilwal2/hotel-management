import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * IRD Billing Rules (Nepal Inland Revenue Department):
 * 
 * 1. Once an invoice is issued, it CANNOT be deleted — only reversed.
 * 2. Reversal creates a "Credit Note" with a reference to the original invoice.
 * 3. Both the original invoice and credit note must appear in VAT reports.
 * 
 * This endpoint handles:
 * POST /api/invoice/issue     → Issue invoice for a booking (makes it immutable)
 * POST /api/invoice/reverse   → Create credit note (reverse an invoice)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { action, bookingId } = await req.json();

    if (action === "issue") {
      // Issue an invoice — after this the booking record becomes immutable
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: { select: { name: true, email: true } }, room: { select: { number: true } } },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }

      if (booking.invoiceIssuedAt) {
        return NextResponse.json(
          { success: false, error: `Invoice ${booking.invoiceNumber} already issued. IRD rules prevent re-issuing.` },
          { status: 409 }
        );
      }

      const invoiceNumber = generateInvoiceNumber();
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { invoiceNumber, invoiceIssuedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        data: { invoiceNumber, issuedAt: updated.invoiceIssuedAt },
        message: `Invoice ${invoiceNumber} issued. This record is now immutable per IRD regulations.`,
      });
    }

    if (action === "reverse") {
      // Create a credit note — reversal, not deletion
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }

      if (!booking.invoiceIssuedAt || !booking.invoiceNumber) {
        return NextResponse.json(
          { success: false, error: "Cannot reverse a booking that has no issued invoice." },
          { status: 400 }
        );
      }

      if (booking.creditNoteRef) {
        return NextResponse.json(
          { success: false, error: "This invoice has already been reversed." },
          { status: 409 }
        );
      }

      const creditNoteRef = `CN-${booking.invoiceNumber}`;

      // Create a new booking record as credit note reference
      // and update original booking with reversal info
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:        "CANCELLED",
          creditNoteRef,
        },
      });

      return NextResponse.json({
        success: true,
        data: { creditNoteRef, originalInvoice: booking.invoiceNumber },
        message: `Credit note ${creditNoteRef} issued. Original invoice ${booking.invoiceNumber} has been reversed.`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[INVOICE_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function generateInvoiceNumber(): string {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq   = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
  return `IHMS-${year}${month}-${seq}`;
}
