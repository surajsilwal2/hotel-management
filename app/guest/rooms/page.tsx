"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { BedDouble, Users, Wifi, Tv, Wind, Coffee, Star, Loader2, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";

type Room = {
  id: string;
  number: string;
  type: string;
  status: string;
  pricePerNight: number;
  floor: number;
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi, AC: Wind, TV: Tv, Coffee: Coffee,
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  SINGLE:     "bg-slate-100 text-slate-700",
  DOUBLE:     "bg-blue-100 text-blue-700",
  DELUXE:     "bg-amber-100 text-amber-700",
  SUITE:      "bg-purple-100 text-purple-700",
  PENTHOUSE:  "bg-rose-100 text-rose-700",
};

export default function GuestRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filterType, setFilterType] = useState("");
  const [searchMin, setSearchMin] = useState("");
  const [searchMax, setSearchMax] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (searchMin) params.set("minPrice", searchMin);
    if (searchMax) params.set("maxPrice", searchMax);
    const res = await fetch(`/api/rooms?${params.toString()}`);
    const data = await res.json();
    if (data.success) setRooms(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, [filterType, searchMin, searchMax]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Find Your Perfect Room</h1>
          <p className="text-slate-300">
            Browse our selection of premium rooms and suites. Book with confidence — no overbooking, guaranteed.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-500">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Types</option>
            {["SINGLE", "DOUBLE", "DELUXE", "SUITE", "PENTHOUSE"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            value={searchMin}
            onChange={(e) => setSearchMin(e.target.value)}
            placeholder="Min Price (NPR)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="number"
            value={searchMax}
            onChange={(e) => setSearchMax(e.target.value)}
            placeholder="Max Price (NPR)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No rooms match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                  {room.images?.[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={`Room ${room.number}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BedDouble className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROOM_TYPE_COLORS[room.type] ?? ""}`}>
                      {room.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 text-xs font-medium text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    4.8
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-800">Room {room.number}</h3>
                    <p className="text-slate-500 text-xs">Floor {room.floor}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <Users className="w-4 h-4" />
                    <span>Up to {room.capacity} guests</span>
                  </div>
                  {room.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{room.description}</p>
                  )}

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {room.amenities.slice(0, 4).map((a) => {
                      const Icon = AMENITY_ICONS[a];
                      return (
                        <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 text-xs rounded-md">
                          {Icon && <Icon className="w-3 h-3" />}
                          {a}
                        </span>
                      );
                    })}
                    {room.amenities.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 text-xs rounded-md">
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        NPR {room.pricePerNight.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm"> / night</span>
                    </div>
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => { setSelectedRoom(null); fetchRooms(); }}
        />
      )}
    </div>
  );
}
