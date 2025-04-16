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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="group bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors duration-200 border border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div 
              className="flex-grow cursor-pointer"
              onClick={() => router.push(`/gardens/${gardenId}/rooms/${room.id}`)}
            >
              <h3 className="text-lg font-medium text-emerald-100">{room.name}</h3>
              <p className="mt-1 text-sm text-emerald-300">{room.type}</p>
            </div>
            <div className="flex items-center space-x-2">
              {room.dimensions && (
                <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded">
                  {room.dimensions}
                </span>
              )}
              <DeleteButton
                onDelete={() => handleDelete(room.id)}
                itemName="Room"
                small
              />
            </div>
          </div>
          
          {room.description && (
            <div 
              className="mt-4 cursor-pointer"
              onClick={() => router.push(`/gardens/${gardenId}/rooms/${room.id}`)}
            >
              <p className="text-sm text-emerald-200 line-clamp-2">{room.description}</p>
            </div>
          )}

          <div 
            className="mt-4 flex flex-wrap gap-2 cursor-pointer"
            onClick={() => router.push(`/gardens/${gardenId}/rooms/${room.id}`)}
          >
            {room.equipment?.length > 0 && (
              <span className="text-xs bg-gray-700 text-emerald-300 px-2 py-1 rounded-full">
                {room.equipment.length} Equipment
              </span>
            )}
            {room.cleaningSOPs?.length > 0 && (
              <span className="text-xs bg-gray-700 text-emerald-300 px-2 py-1 rounded-full">
                {room.cleaningSOPs.length} SOPs
              </span>
            )}
            {room.maintenanceTasks?.length > 0 && (
              <span className="text-xs bg-gray-700 text-emerald-300 px-2 py-1 rounded-full">
                {room.maintenanceTasks.length} Tasks
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 