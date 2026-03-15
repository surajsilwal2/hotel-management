import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Verify Khalti payment after user returns from Khalti gateway.
 * Called with the pidx returned by Khalti.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { pidx, bookingId } = await req.json();
    if (!pidx || !bookingId) {
      return NextResponse.json({ success: false, error: "pidx and bookingId are required" }, { status: 400 });
    }

    // Verify with Khalti
    const verifyRes = await fetch("https://a.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ success: false, error: "Khalti verification failed" }, { status: 502 });
    }

    const verifyData = await verifyRes.json();

    // Khalti returns status "Completed" on success
    if (verifyData.status !== "Completed") {
      return NextResponse.json(
        { success: false, error: `Payment not completed. Status: ${verifyData.status}` },
        { status: 400 }
      );
    }

    // Fetch booking to confirm amount matches
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const paidAmountNPR = verifyData.total_amount / 100;
    if (Math.abs(paidAmountNPR - booking.totalPrice) > 1) {
      return NextResponse.json(
        { success: false, error: "Amount mismatch — payment not applied" },
        { status: 400 }
      );
    }

    // Update booking to CONFIRMED + generate invoice number, persist payment metadata
    const invoiceNumber = `IHMS-${Date.now()}-${bookingId.slice(-4).toUpperCase()}`;
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status:                "CONFIRMED",
        invoiceNumber,
        invoiceIssuedAt:       new Date(),
        paymentProvider:       "KHALTI",
        paymentTransactionId:  verifyData.transaction_id,
      },
      include: {
        room: { select: { number: true, type: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        booking:       updatedBooking,
        invoiceNumber,
        transactionId: verifyData.transaction_id,
        paidAmount:    paidAmountNPR,
      },
      message: `Payment verified! Invoice ${invoiceNumber} issued.`,
    });
  } catch (error) {
    console.error("[KHALTI_VERIFY]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
