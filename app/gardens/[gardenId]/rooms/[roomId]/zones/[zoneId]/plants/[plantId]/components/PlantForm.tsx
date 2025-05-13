"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface PlantFormValues {
  name: string;
  strainName?: string;
  species: string;
  variety?: string;
  plantedDate?: string;
  expectedHarvestDate?: string;
  notes?: string;
}

export default function PlantForm({
  initialValues,
  onSubmit,
  onCancel,
  submitButtonLabel = 'Save',
  isSubmitting = false,
}: {
  initialValues: PlantFormValues;
  onSubmit: (values: PlantFormValues) => void;
  onCancel: () => void;
  submitButtonLabel?: string;
  isSubmitting?: boolean;
}) {
  const [form, setForm] = useState<PlantFormValues>(initialValues);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter plant name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="strainName">Strain</Label>
        <Input
          id="strainName"
          name="strainName"
          value={form.strainName || ''}
          onChange={handleChange}
          placeholder="Enter strain name (e.g. Mandarin Cookie R3 #01)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="species">Species</Label>
        <Input
          id="species"
          name="species"
          value={form.species}
          onChange={handleChange}
          placeholder="Enter plant species"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="variety">Variety (optional)</Label>
        <Input
          id="variety"
          name="variety"
          value={form.variety || ''}
          onChange={handleChange}
          placeholder="Enter plant variety"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plantedDate">Planting Date (optional)</Label>
        <Input
          id="plantedDate"
          name="plantedDate"
          type="date"
          value={form.plantedDate || ''}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expectedHarvestDate">Expected Harvest Date (optional)</Label>
        <Input
          id="expectedHarvestDate"
          name="expectedHarvestDate"
          type="date"
          value={form.expectedHarvestDate || ''}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={form.notes || ''}
          onChange={handleChange}
          placeholder="Enter any notes about the plant"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          {isSubmitting ? 'Saving...' : submitButtonLabel}
        </Button>
      </div>
    </form>
  );
} 