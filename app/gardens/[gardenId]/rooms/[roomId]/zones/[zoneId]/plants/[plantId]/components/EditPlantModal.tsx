"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PlantForm, { PlantFormValues } from './PlantForm';

export default function EditPlantModal({ plant, params }: { plant: any, params: any }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const initialValues: PlantFormValues = {
    name: plant.name || '',
    strainName: plant.strainName || '',
    species: plant.species || '',
    variety: plant.variety || '',
    plantedDate: plant.plantedDate ? plant.plantedDate.slice(0, 10) : '',
    expectedHarvestDate: plant.expectedHarvestDate ? plant.expectedHarvestDate.slice(0, 10) : '',
    notes: plant.notes || '',
  };

  const handleSubmit = async (values: PlantFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/gardens/${params.gardenId}/rooms/${params.roomId}/zones/${params.zoneId}/plants/${params.plantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update plant');
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="mb-2 px-3 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => setOpen(true)}>
        Edit
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <PlantForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            submitButtonLabel="Save Changes"
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 