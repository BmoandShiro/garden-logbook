'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreatePlantButtonProps {
  gardenId: string;
  roomId: string;
  zoneId: string;
}

export default function CreatePlantButton({ gardenId, roomId, zoneId }: CreatePlantButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [variety, setVariety] = useState('');
  const [plantedDate, setPlantedDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/plants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          species,
          variety: variety || null,
          plantedDate: plantedDate || null,
          expectedHarvestDate: expectedHarvestDate || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create plant:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to create plant: ${errorData.details || errorData.error || response.statusText}`);
      }

      toast.success('Plant created successfully');
      router.refresh();
      setIsOpen(false);
      setName('');
      setSpecies('');
      setVariety('');
      setPlantedDate('');
      setExpectedHarvestDate('');
      setNotes('');
    } catch (error) {
      toast.error('Error creating plant');
      console.error(error);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Plant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter plant name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Input
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Enter plant species"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Variety (optional)</Label>
              <Input
                id="variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="Enter plant variety"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantedDate">Planting Date (optional)</Label>
              <Input
                id="plantedDate"
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedHarvestDate">Expected Harvest Date (optional)</Label>
              <Input
                id="expectedHarvestDate"
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any notes about the plant"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="border-emerald-800 hover:bg-emerald-900/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
              >
                Add Plant
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 