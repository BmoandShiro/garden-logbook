'use client';

import Link from 'next/link';
import type { Room } from '@prisma/client';

interface RoomWithCounts extends Room {
  _count: {
    plants: number;
    equipment: number;
    maintenanceTasks: number;
  };
}

interface RoomListProps {
  rooms: RoomWithCounts[];
}

export default function RoomList({ rooms }: RoomListProps) {
  if (!rooms.length) {
    return (
      <div className="text-center py-12 bg-emerald-900/30 rounded-lg border border-emerald-800">
        <h3 className="text-lg font-medium text-emerald-100">No rooms yet</h3>
        <p className="mt-1 text-sm text-emerald-300/70">
          Create your first room to start organizing your garden.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Link
          key={room.id}
          href={`/gardens/${room.gardenId}/rooms/${room.id}`}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-emerald-800 bg-emerald-900/30 p-4 shadow-sm transition-all hover:shadow-lg hover:border-garden-500"
        >
          <h3 className="text-sm font-medium text-emerald-100 group-hover:text-emerald-50">
            {room.name}
          </h3>
          {room.description && (
            <p className="mt-1 text-sm text-emerald-300/70 line-clamp-2">
              {room.description}
            </p>
          )}
          <div className="mt-4 flex space-x-4">
            <div className="text-xs text-emerald-300/70">
              <span className="font-medium">{room._count.plants}</span> plants
            </div>
            <div className="text-xs text-emerald-300/70">
              <span className="font-medium">{room._count.equipment}</span> equipment
            </div>
            <div className="text-xs text-emerald-300/70">
              <span className="font-medium">{room._count.maintenanceTasks}</span> tasks
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 