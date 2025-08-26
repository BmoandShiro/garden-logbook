'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  dimensions: string | null;
  createdAt: Date;
  updatedAt: Date;
  roomId: string;
  creatorId: string;
  createdBy: User;
}

interface ZoneListProps {
  zones: Zone[];
  gardenId: string;
  roomId: string;
}

export default function ZoneList({ zones, gardenId, roomId }: ZoneListProps) {
  const router = useRouter();
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
  const [openEditModalZoneId, setOpenEditModalZoneId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', type: '', dimensions: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleDelete = async (zoneId: string) => {
    try {
      setDeletingZoneId(zoneId);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      toast.success('Zone deleted successfully');
      // Add longer delay to ensure server processes the change and logs are updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Error deleting zone');
      console.error(error);
    } finally {
      setDeletingZoneId(null);
    }
  };

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 p-8 border border-dark-border rounded-lg bg-dark-bg-secondary">
        <p className="text-xl font-semibold mb-2 text-garden-400">No zones yet</p>
        <p className="text-dark-text-secondary text-center">
          Create your first zone to start organizing your plants and equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {zones.map((zone) => (
        <Card
          key={zone.id}
          className="relative p-4 cursor-pointer border-0 bg-gradient-to-br from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 transition-all"
          onClick={() => router.push(`/gardens/${gardenId}/rooms/${roomId}/zones/${zone.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-100 group-hover:text-emerald-50">{zone.name}</h3>
              {zone.description && (
                <p className="text-emerald-300/70">{zone.description}</p>
              )}
              <p className="text-sm text-emerald-300/70">
                Created by {zone.createdBy.name || zone.createdBy.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-full p-2 text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-garden-500"
                title="Zone Settings"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditFormData({
                    name: zone.name,
                    description: zone.description || '',
                    type: zone.type || '',
                    dimensions: zone.dimensions || '',
                  });
                  setOpenEditModalZoneId(zone.id);
                }}
              >
                <Settings className="h-5 w-5" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-emerald-300/70 hover:text-emerald-50 hover:bg-transparent"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleDelete(zone.id);
                }}
                disabled={deletingZoneId === zone.id}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Edit Modal for this zone */}
          <Dialog open={openEditModalZoneId === zone.id} onOpenChange={(open) => setOpenEditModalZoneId(open ? zone.id : null)}>
            <DialogContent onClick={e => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Edit Zone</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError(null);
                  try {
                    const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zone.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editFormData),
                    });
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || 'Failed to update zone');
                    }
                    setOpenEditModalZoneId(null);
                    // Add longer delay to ensure server processes the change and logs are updated
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } catch (error) {
                    setEditError(error instanceof Error ? error.message : 'Failed to update zone');
                  } finally {
                    setEditLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="edit-zone-name" className="block text-sm font-medium text-dark-text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="edit-zone-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-zone-description" className="block text-sm font-medium text-dark-text-primary">
                    Description
                  </label>
                  <textarea
                    id="edit-zone-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="edit-zone-type" className="block text-sm font-medium text-dark-text-primary">
                    Type
                  </label>
                  <input
                    type="text"
                    id="edit-zone-type"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-zone-dimensions" className="block text-sm font-medium text-dark-text-primary">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    id="edit-zone-dimensions"
                    value={editFormData.dimensions}
                    onChange={(e) => setEditFormData({ ...editFormData, dimensions: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                  />
                </div>
                {editError && <div className="text-red-500 text-sm mt-1">{editError}</div>}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenEditModalZoneId(null)}
                    className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-garden-500 border border-transparent rounded-md hover:bg-garden-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      ))}
    </div>
  );
} 