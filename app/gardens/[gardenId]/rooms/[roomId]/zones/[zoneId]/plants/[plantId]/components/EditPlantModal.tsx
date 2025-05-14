"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PlantModal from './PlantModal';

export default function EditPlantModal({ plant, gardenId, roomId, zoneId, plantId }: { plant: any, gardenId: string, roomId: string, zoneId: string, plantId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const initialValues = {
    name: plant.name || '',
    strainName: plant.strainName || '',
    species: plant.species || '',
    variety: plant.variety || '',
    plantedDate: plant.plantedDate ? plant.plantedDate.slice(0, 10) : '',
    expectedHarvestDate: plant.expectedHarvestDate ? plant.expectedHarvestDate.slice(0, 10) : '',
    notes: plant.notes || '',
  };

  const handleSubmit = async (values: any) => {
    console.log('EditPlantModal ids:', { gardenId, roomId, zoneId, plantId });
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants/${plantId}`, {
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
      <PlantModal
        open={open}
        setOpen={setOpen}
        title="Edit Plant"
        initialValues={initialValues}
        submitButtonLabel="Save Changes"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </>
  );
} 