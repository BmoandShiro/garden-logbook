'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';

interface Plant {
  id: string;
  name: string;
  species: string;
  variety: string | null;
  plantedDate: Date | null;
  expectedHarvestDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  zoneId: string;
  creatorId: string;
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
                    <span className="font-medium text-emerald-200">Species:</span> {plant.species}
                    {plant.variety && ` (${plant.variety})`}
                  </p>
                  {plant.plantedDate && (
                    <p className="text-sm text-emerald-300/70">
                      <span className="font-medium text-emerald-200">Planted:</span>{' '}
                      {new Date(plant.plantedDate).toLocaleDateString()}
                    </p>
                  )}
                  {plant.expectedHarvestDate && (
                    <p className="text-sm text-emerald-300/70">
                      <span className="font-medium text-emerald-200">Expected Harvest:</span>{' '}
                      {new Date(plant.expectedHarvestDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm text-emerald-300/70">
                    Added by {plant.user.name || plant.user.email}
                  </p>
                </div>
              </div>
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