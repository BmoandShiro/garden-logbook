'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Room, MaintenanceTask, Equipment, CleaningSOP } from '@prisma/client';

interface ExtendedRoom extends Room {
  maintenanceTasks: MaintenanceTask[];
  equipment: Equipment[];
  cleaningSOPs: CleaningSOP[];
}

interface RoomListProps {
  rooms: ExtendedRoom[];
}

export default function RoomList({ rooms }: RoomListProps) {
  if (!rooms?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-dark-text-primary">No rooms yet</h3>
        <p className="mt-1 text-sm text-dark-text-secondary">Get started by creating your first room!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {rooms.map((room) => (
        <Link
          key={room.id}
          href={`/rooms/${room.id}`}
          className="block bg-dark-bg-primary rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ring-1 ring-dark-border overflow-hidden"
        >
          <div className="relative h-48">
            {room.blueprintUrl ? (
              <Image
                src={room.blueprintUrl}
                alt={`${room.name} blueprint`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-garden-900/50 to-garden-600/50">
                <svg
                  className="h-16 w-16 text-garden-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-dark-text-primary">{room.name}</h3>
              {room.type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-garden-100 text-garden-800 dark:bg-garden-900 dark:text-garden-200">
                  {room.type}
                </span>
              )}
            </div>

            {room.description && (
              <p className="text-sm text-dark-text-secondary line-clamp-2 mb-4">{room.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-dark-text-secondary">
              <div>
                <span className="block font-medium">Dimensions</span>
                <span>{room.dimensions || 'Not specified'}</span>
              </div>
              <div>
                <span className="block font-medium">Equipment</span>
                <span>{room.equipment.length} items</span>
              </div>
            </div>

            {room.maintenanceTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <p className="text-sm font-medium text-dark-text-secondary mb-2">
                  Upcoming Maintenance
                </p>
                <div className="space-y-1">
                  {room.maintenanceTasks
                    .filter((task) => !task.completed)
                    .slice(0, 2)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="text-xs text-dark-text-secondary flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-garden-500" />
                        <span>{task.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
} 