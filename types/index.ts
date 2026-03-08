import { Role, RoomType, RoomStatus, BookingStatus } from "@prisma/client";

// ─── Extended Session User ────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// ─── Room Types ───────────────────────────────────────────────────────────────

export interface RoomWithBookings {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  pricePerNight: number;
  floor: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  images: string[];
  bookings?: BookingWithUser[];
}

// ─── Booking Types ────────────────────────────────────────────────────────────

export interface BookingWithUser {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  totalPrice: number;
  adults: number;
  children: number;
  notes: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  room?: RoomWithBookings;
}

// ─── Admin Dashboard Stats ────────────────────────────────────────────────────

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  totalBookingsThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  pendingCheckIns: number;
  pendingCheckOuts: number;
  totalGuests: number;
  revenueByMonth: RevenueDataPoint[];
  bookingsByRoomType: BookingsByRoomType[];
  recentBookings: BookingWithUser[];
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  bookings: number;
}

export interface BookingsByRoomType {
  type: string;
  count: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Form Input Types ─────────────────────────────────────────────────────────

export interface CreateBookingInput {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  notes?: string;
}

export interface CreateRoomInput {
  number: string;
  type: RoomType;
  pricePerNight: number;
  floor: number;
  capacity: number;
  description?: string;
  amenities: string[];
}

export interface UpdateRoomStatusInput {
  status: RoomStatus;
  notes?: string;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
