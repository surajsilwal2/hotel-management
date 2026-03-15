import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Khalti Payment Integration
 * Docs: https://docs.khalti.com/khalti-epayment/
 * 
 * Flow:
 * 1. POST /api/payment/khalti        → Initiate, get pidx + payment_url
 * 2. User redirected to Khalti page
 * 3. Khalti redirects to /payment/success?pidx=xxx
 * 4. POST /api/payment/khalti/verify → Verify pidx with Khalti
 * 5. Update booking status on success
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { number: true, type: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Only the booking owner can pay
    if (booking.userId !== (session.user as any).id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { success: false, error: "Only pending or confirmed bookings can be paid" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Khalti requires amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(booking.totalPrice * 100);

    const payload = {
      return_url: `${appUrl}/payment/success`,
      website_url: appUrl,
      amount: amountInPaisa,
      purchase_order_id: booking.id,
      purchase_order_name: `Room ${booking.room.number} — IHMS Booking`,
      customer_info: {
        name:  booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone || "9800000000",
      },
      amount_breakdown: [
        {
          label: `Room ${booking.room.number} (${booking.room.type})`,
          amount: amountInPaisa,
        },
      ],
      product_details: [
        {
          identity: booking.roomId,
          name: `Room ${booking.room.number}`,
          total_price: amountInPaisa,
          quantity: 1,
          unit_price: amountInPaisa,
        },
      ],
    };

    const khaltiRes = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!khaltiRes.ok) {
      const err = await khaltiRes.text();
      console.error("[KHALTI_INITIATE]", err);
      return NextResponse.json(
        { success: false, error: "Failed to initiate Khalti payment" },
        { status: 502 }
      );
    }

    const khaltiData = await khaltiRes.json();

    return NextResponse.json({
      success: true,
      data: {
        pidx:        khaltiData.pidx,
        payment_url: khaltiData.payment_url,
        bookingId:   booking.id,
        amount:      booking.totalPrice,
      },
    });
  } catch (error) {
    console.error("[KHALTI_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
