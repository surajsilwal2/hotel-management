import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

/**
 * BOOKING CONFLICT ALGORITHM
 * 
 * Detects overlapping reservations using interval overlap logic:
 *   Overlap exists if: requestedCheckIn < existingCheckOut AND requestedCheckOut > existingCheckIn
 *
 * This is mathematically proven to catch all overlap cases:
 *   - Requested stay starts inside an existing booking
 *   - Requested stay ends inside an existing booking
 *   - Requested stay completely contains an existing booking
 *   - Requested stay is completely contained by an existing booking
 */
export async function checkBookingConflict(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
      },
      // Interval overlap condition
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
      // Exclude current booking when updating
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
    },
  });

  return !!conflictingBooking;
}

/**
 * Calculate total price for a booking
 */
export function calculateTotalPrice(
  pricePerNight: number,
  checkIn: Date,
  checkOut: Date
): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, nights) * pricePerNight;
}

/**
 * Format currency in Nepali Rupees
 */
export function formatNPR(amount: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get number of nights between two dates
 */
export function getNights(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
