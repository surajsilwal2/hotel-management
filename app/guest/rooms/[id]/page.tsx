"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";
import { BedDouble, Users, Wifi, Tv, Wind, Coffee, Star, Loader2 } from "lucide-react";

export default function RoomDetail({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      const res = await fetch(`/api/rooms/${params.id}`);
      const data = await res.json();
      if (data.success) setRoom(data.data);
      setLoading(false);
    };
    fetchRoom();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
  );
  if (!room) return (<div className="min-h-screen flex items-center justify-center">Room not found</div>);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-80 md:h-full bg-slate-100 relative">
              {room.images?.[0] ? (
                <Image src={room.images[0]} alt={`Room ${room.number}`} fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center"><BedDouble className="w-12 h-12 text-slate-400" /></div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold">Room {room.number}</h2>
                  <p className="text-sm text-slate-500">{room.type} · Floor {room.floor}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">NPR {room.pricePerNight.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">/ night</div>
                </div>
              </div>

              <p className="text-slate-600 mb-4">{room.description}</p>

              <div className="mb-4">
                <div className="text-sm text-slate-500 mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {room.amenities?.map((a: string) => (
                    <span key={a} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{a}</span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-slate-500 mb-2">Capacity</div>
                <div className="text-sm">Up to {room.capacity} guests</div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-slate-500 mb-2">Current status</div>
                <div className="text-sm font-medium">{room.status}</div>
              </div>

              {room.bookings && room.bookings.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-sm text-amber-700 font-semibold mb-2">Upcoming bookings</div>
                  {room.bookings.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-slate-700">
                      <div>
                        {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                        {b.user?.name && (
                          <div className="text-xs text-slate-500">Booked by: {b.user.name}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{b.status}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowBooking(true)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl">Book</button>
                <a href="/guest/rooms" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl">Back</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showBooking && (
        <BookingModal room={room} onClose={() => setShowBooking(false)} onSuccess={() => setShowBooking(false)} />
      )}
    </div>
  );
}
