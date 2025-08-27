'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash, Settings, Copy } from 'lucide-react';
import PlantModal from './PlantModal';
import { PlantFormValues } from '../plants/[plantId]/components/PlantForm';

interface Plant {
  id: string;
  name: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  zoneId: string;
  userId: string;
  strainId: string | null;
  type: string | null;
  user: User;
  strainName?: string;
  species?: string;
  variety?: string;
  startDate?: Date;
  harvestDate?: Date;
  growingSeasonStart?: string;
  growingSeasonEnd?: string;
  onlyTriggerAlertsDuringSeason?: boolean;
  sensitivities?: any;
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
  const [duplicatingPlantId, setDuplicatingPlantId] = useState<string | null>(null);
  const [editPlantData, setEditPlantData] = useState<Plant | null>(null);

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
      // Add longer delay to ensure server processes the change and logs are updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting plant');
    } finally {
      setDeletingPlantId(null);
      setConfirmDeletePlant(null);
    }
  };

  const handleDuplicate = async (plantId: string) => {
    try {
      setDuplicatingPlantId(plantId);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${plantId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate plant');
      }

      toast.success('Plant duplicated successfully');
      // Add longer delay to ensure server processes the change and logs are updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error duplicating plant:', error);
      toast.error(error instanceof Error ? error.message : 'Error duplicating plant');
    } finally {
      setDuplicatingPlantId(null);
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
                    <span className="font-medium text-emerald-200">Species:</span> {plant.species || plant.strainName || 'Unknown'}
                  </p>
                  <p className="text-sm text-emerald-300/70">
                    Added by {plant.user.name || plant.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-full p-2 text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-garden-500"
                  title="Plant Settings"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPlantData(plant);
                    setOpenEditModalPlantId(plant.id);
                  }}
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full p-2 text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-garden-500"
                  title="Duplicate Plant"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(plant.id);
                  }}
                  disabled={duplicatingPlantId === plant.id}
                >
                  <Copy className="h-5 w-5" />
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
          </Card>
        ))}
      </div>
      
      {/* Edit Modal - moved outside of Card to prevent click event bubbling */}
      {editPlantData && openEditModalPlantId && (
        <PlantModal
          open={openEditModalPlantId !== null}
          setOpen={(open) => {
            if (!open) {
              setOpenEditModalPlantId(null);
              setEditPlantData(null);
            }
          }}
          title="Edit Plant"
          initialValues={{
            name: editPlantData.name || '',
            strainName: editPlantData.strainName || '',
            species: editPlantData.species || '',
            variety: editPlantData.variety || '',
            plantedDate: editPlantData.startDate ? new Date(editPlantData.startDate).toISOString().slice(0, 10) : '',
            expectedHarvestDate: editPlantData.harvestDate ? new Date(editPlantData.harvestDate).toISOString().slice(0, 10) : '',
            notes: editPlantData.notes === null ? undefined : editPlantData.notes,
            growingSeasonStart: editPlantData.growingSeasonStart || '',
            growingSeasonEnd: editPlantData.growingSeasonEnd || '',
            onlyTriggerAlertsDuringSeason: editPlantData.onlyTriggerAlertsDuringSeason || false,
            sensitivities: editPlantData.sensitivities || {
              heat: { enabled: false, threshold: '', unit: 'F' },
              humidity: { enabled: false, min: '', max: '' },
              frost: { enabled: false, windows: [] },
              drought: { enabled: false, days: '' },
              wind: { enabled: false, threshold: '' },
              flood: { enabled: false },
              heavyRain: { enabled: false, threshold: '', unit: 'in' },
            },
          }}
          submitButtonLabel="Save Changes"
          onSubmit={async (values: PlantFormValues) => {
                    setEditLoading(true);
                    setEditError(null);
                    try {
              console.log('Submitting plant update with values:', values);
              const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${openEditModalPlantId!}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
                      });
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to update plant');
                      }
                      setOpenEditModalPlantId(null);
              setEditPlantData(null);
              // Add longer delay to ensure server processes the change and logs are updated
              setTimeout(() => {
                window.location.reload();
              }, 1000);
                    } catch (error) {
                      setEditError(error instanceof Error ? error.message : 'Failed to update plant');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
          isSubmitting={editLoading}
          error={editError}
        />
      )}

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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 