'use client';

import { useRouter } from 'next/navigation';
import DeleteButton from '../../../components/DeleteButton';
import { toast } from 'sonner';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import LogsListWrapper from '@/app/logs/components/LogsListWrapper';

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
  logsByRoomId?: Record<string, any[]>;
}

export default function RoomList({ rooms, gardenId, logsByRoomId }: RoomListProps) {
  const router = useRouter();
  const [openEditModalRoomId, setOpenEditModalRoomId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    type: '',
    dimensions: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

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
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="Room Settings"
              onClick={() => {
                setEditFormData({
                  name: room.name,
                  description: room.description || '',
                  type: room.type || '',
                  dimensions: room.dimensions || '',
                });
                setOpenEditModalRoomId(room.id);
              }}
            >
              <Settings className="h-5 w-5" />
            </button>
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
          {/* Edit Modal for this room */}
          <Dialog open={openEditModalRoomId === room.id} onOpenChange={(open) => setOpenEditModalRoomId(open ? room.id : null)}>
            <DialogContent onClick={e => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Edit Room</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError(null);
                  try {
                    const response = await fetch(`/api/gardens/${gardenId}/rooms/${room.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editFormData),
                    });
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || 'Failed to update room');
                    }
                    setOpenEditModalRoomId(null);
                    router.refresh();
                  } catch (error) {
                    setEditError(error instanceof Error ? error.message : 'Failed to update room');
                  } finally {
                    setEditLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="edit-room-name" className="block text-sm font-medium text-dark-text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="edit-room-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-room-description" className="block text-sm font-medium text-dark-text-primary">
                    Description
                  </label>
                  <textarea
                    id="edit-room-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="edit-room-type" className="block text-sm font-medium text-dark-text-primary">
                    Type
                  </label>
                  <input
                    type="text"
                    id="edit-room-type"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-room-dimensions" className="block text-sm font-medium text-dark-text-primary">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    id="edit-room-dimensions"
                    value={editFormData.dimensions}
                    onChange={(e) => setEditFormData({ ...editFormData, dimensions: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                {editError && <div className="text-red-500 text-sm mt-1">{editError}</div>}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenEditModalRoomId(null)}
                    className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Recent Logs for this room/plot */}
          {logsByRoomId && logsByRoomId[room.id] && logsByRoomId[room.id].length > 0 && (
            <div className="p-4 border-t border-emerald-800 bg-dark-bg-secondary">
              <button
                className="flex items-center w-full text-left text-sm font-semibold text-emerald-100 mb-2 focus:outline-none"
                onClick={() => setExpandedLogs(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
                aria-expanded={expandedLogs[room.id]}
                aria-controls={`logs-list-${room.id}`}
              >
                <span className="flex-1">Recent Logs</span>
                {expandedLogs[room.id] ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </button>
              {expandedLogs[room.id] && (
                <div id={`logs-list-${room.id}`}>
                  <LogsListWrapper logs={logsByRoomId[room.id]} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 