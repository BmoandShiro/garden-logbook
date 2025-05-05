'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash, Settings } from 'lucide-react';

interface Plant {
  id: string;
  name: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  zoneId: string;
  userId: string;
  strainId: string | null;
  type: string | null;
  user: User;
}

interface PlantListProps {
  plants: Plant[];
  gardenId: string;
  roomId: string;
  zoneId: string;
}

export default function PlantList({ plants, gardenId, roomId, zoneId }: PlantListProps) {
  const router = useRouter();
  const [deletingPlantId, setDeletingPlantId] = useState<string | null>(null);
  const [confirmDeletePlant, setConfirmDeletePlant] = useState<Plant | null>(null);
  const [openEditModalPlantId, setOpenEditModalPlantId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', notes: '', type: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleDelete = async (plantId: string) => {
    try {
      setDeletingPlantId(plantId);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${plantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete plant');
      }

      toast.success('Plant deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting plant');
    } finally {
      setDeletingPlantId(null);
      setConfirmDeletePlant(null);
    }
  };

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 p-8 border border-dark-border rounded-lg bg-dark-bg-secondary">
        <p className="text-xl font-semibold mb-2 text-emerald-100">No plants yet</p>
        <p className="text-emerald-300/70 text-center">
          Add your first plant to start tracking its growth and care.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {plants.map((plant) => (
          <Card
            key={plant.id}
            className="relative p-4 cursor-pointer border-0 bg-gradient-to-br from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 transition-all"
            onClick={() => router.push(`/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${plant.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-emerald-100">{plant.name}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-emerald-300/70">
                    <span className="font-medium text-emerald-200">Species:</span> {plant.strainId || 'Unknown'}
                    {plant.type && ` (${plant.type})`}
                  </p>
                  <p className="text-sm text-emerald-300/70">
                    Added by {plant.user.name || plant.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-full p-2 text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  title="Plant Settings"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditFormData({
                      name: plant.name,
                      notes: plant.notes || '',
                      type: plant.type || '',
                    });
                    setOpenEditModalPlantId(plant.id);
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
                    setConfirmDeletePlant(plant);
                  }}
                  disabled={deletingPlantId === plant.id}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Edit Modal for this plant */}
            <Dialog open={openEditModalPlantId === plant.id} onOpenChange={(open) => setOpenEditModalPlantId(open ? plant.id : null)}>
              <DialogContent onClick={e => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Edit Plant</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setEditLoading(true);
                    setEditError(null);
                    try {
                      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${plant.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editFormData),
                      });
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to update plant');
                      }
                      setOpenEditModalPlantId(null);
                      router.refresh();
                    } catch (error) {
                      setEditError(error instanceof Error ? error.message : 'Failed to update plant');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="edit-plant-name" className="block text-sm font-medium text-dark-text-primary">
                      Name
                    </label>
                    <input
                      type="text"
                      id="edit-plant-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-plant-notes" className="block text-sm font-medium text-dark-text-primary">
                      Notes
                    </label>
                    <textarea
                      id="edit-plant-notes"
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-plant-type" className="block text-sm font-medium text-dark-text-primary">
                      Type
                    </label>
                    <input
                      type="text"
                      id="edit-plant-type"
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  {editError && <div className="text-red-500 text-sm mt-1">{editError}</div>}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenEditModalPlantId(null)}
                      className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <Dialog open={!!confirmDeletePlant} onOpenChange={() => setConfirmDeletePlant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {confirmDeletePlant?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeletePlant(null)}
              className="border-emerald-800 hover:bg-emerald-900/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeletePlant && handleDelete(confirmDeletePlant.id)}
              disabled={deletingPlantId === confirmDeletePlant?.id}
              className="bg-red-900 hover:bg-red-800 text-red-100"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 