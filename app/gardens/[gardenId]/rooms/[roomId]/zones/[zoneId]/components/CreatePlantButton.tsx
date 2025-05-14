'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PlantModal from '../plants/[plantId]/components/PlantModal';
import { useToast } from '@/components/ui/use-toast';

interface CreatePlantButtonProps {
  gardenId: string;
  roomId: string;
  zoneId: string;
}

export default function CreatePlantButton({ gardenId, roomId, zoneId }: CreatePlantButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const initialValues = {
    name: '',
    strainName: '',
    species: '',
    variety: '',
    plantedDate: '',
    expectedHarvestDate: '',
    notes: '',
    growingSeasonStart: '',
    growingSeasonEnd: '',
    onlyTriggerAlertsDuringSeason: false,
    sensitivities: undefined,
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError('');
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          type: 'ZONE_PLANT',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || response.statusText);
      }

      toast({ title: 'Plant created successfully' });
      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      setError(error.message || 'Error creating plant');
      toast({ title: error.message || 'Error creating plant', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Plant
      </Button>

      <PlantModal
        open={isOpen}
        setOpen={setIsOpen}
        title="Add New Plant"
        initialValues={initialValues}
        submitButtonLabel="Add Plant"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </>
  );
} 