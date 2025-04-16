'use client';

import { useRouter } from 'next/navigation';
import DeleteButton from '../../../components/DeleteButton';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  dimensions?: string | null;
  blueprintUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  gardenId: string;
  equipment: Array<{
    id: string;
    name: string;
  }>;
  cleaningSOPs: Array<{
    id: string;
    title: string;
  }>;
  maintenanceTasks: Array<{
    id: string;
    title: string;
  }>;
}

interface RoomListProps {
  rooms: Room[];
  gardenId: string;
}

export default function RoomList({ rooms, gardenId }: RoomListProps) {
  const router = useRouter();

  const handleDelete = async (roomId: string) => {
    try {
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      router.refresh();
      toast.success('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  if (!rooms.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-emerald-100">No rooms yet</h3>
        <p className="mt-2 text-sm text-emerald-300">Create your first room to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-emerald-800 bg-emerald-900/30 shadow-sm transition-all hover:shadow-lg hover:border-emerald-600"
        >
          <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="p-2">
              <DeleteButton
                onDelete={() => handleDelete(room.id)}
                itemName="Room"
                small
              />
            </div>
          </div>
          <div 
            className="flex-grow cursor-pointer"
            onClick={() => router.push(`/gardens/${gardenId}/rooms/${room.id}`)}
          >
            <div className="aspect-h-3 aspect-w-4 relative bg-emerald-950 sm:aspect-none sm:h-48">
              <div className="h-full w-full bg-gradient-to-br from-emerald-900 to-emerald-950 group-hover:from-emerald-800 group-hover:to-emerald-900 transition-colors" />
            </div>
            <div className="flex flex-1 flex-col space-y-2 p-4">
              <h3 className="text-sm font-medium text-emerald-100 group-hover:text-emerald-50">{room.name}</h3>
              {room.type && (
                <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded inline-block w-fit">
                  {room.type}
                </span>
              )}
              {room.description && (
                <p className="text-sm text-emerald-300/70 line-clamp-3">
                  {room.description}
                </p>
              )}
              <div className="flex flex-1 items-end justify-between">
                <div className="flex flex-wrap gap-2">
                  {room.equipment?.length > 0 && (
                    <span className="text-xs text-emerald-300/70">
                      {room.equipment.length} equipment
                    </span>
                  )}
                  {room.cleaningSOPs?.length > 0 && (
                    <span className="text-xs text-emerald-300/70">
                      {room.cleaningSOPs.length} SOPs
                    </span>
                  )}
                  {room.maintenanceTasks?.length > 0 && (
                    <span className="text-xs text-emerald-300/70">
                      {room.maintenanceTasks.length} tasks
                    </span>
                  )}
                </div>
                {room.dimensions && (
                  <span className="text-xs text-emerald-300/70">
                    {room.dimensions}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 