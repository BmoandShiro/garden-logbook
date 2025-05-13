'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import PlantForm, { PlantFormValues } from '../components/PlantForm';

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

  const initialValues: PlantFormValues = {
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

  const handleSubmit = async (values: PlantFormValues) => {
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

      toast.success('Plant created successfully');
      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      setError(error.message || 'Error creating plant');
      toast.error(error.message || 'Error creating plant');
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-bg-primary text-emerald-100">
          <DialogHeader>
            <DialogTitle>Add New Plant</DialogTitle>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <PlantForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => setIsOpen(false)}
            submitButtonLabel="Add Plant"
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 