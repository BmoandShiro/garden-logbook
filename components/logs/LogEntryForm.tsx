'use client';

import { useState } from 'react';
import { Stage, LogType } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const logEntrySchema = z.object({
  date: z.string(),
  plantId: z.string(),
  logType: z.nativeEnum(LogType),
  stage: z.nativeEnum(Stage),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  ph: z.number().optional(),
  ec: z.number().optional(),
  par: z.number().optional(),
  waterAmount: z.number().optional(),
  nutrients: z.string().optional(),
  notes: z.string().optional(),
});

type LogEntryFormData = z.infer<typeof logEntrySchema>;

interface LogEntryFormProps {
  plantId: string;
  onSubmit: (data: LogEntryFormData) => Promise<void>;
  strains: Array<{ id: string; name: string }>;
}

export function LogEntryForm({ plantId, onSubmit, strains }: LogEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LogEntryFormData>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      plantId,
      logType: LogType.GENERAL,
      stage: Stage.VEGETATIVE,
      nutrients: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: LogEntryFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      await onSubmit(data);
      reset();
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error submitting log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logType">Log Type</Label>
          <Select
            id="logType"
            {...register('logType')}
          >
            {Object.values(LogType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stage">Growth Stage</Label>
          <Select
            id="stage"
            {...register('stage')}
          >
            {Object.values(Stage).map((stage) => (
              <option key={stage} value={stage}>
                {stage.toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            {...register('temperature', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="humidity">Humidity (%)</Label>
          <Input
            id="humidity"
            type="number"
            step="1"
            {...register('humidity', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ph">pH</Label>
          <Input
            id="ph"
            type="number"
            step="0.1"
            {...register('ph', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ec">EC (mS/cm)</Label>
          <Input
            id="ec"
            type="number"
            step="0.1"
            {...register('ec', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="par">PAR (μmol/m²/s)</Label>
          <Input
            id="par"
            type="number"
            step="1"
            {...register('par', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="waterAmount">Water Amount (ml)</Label>
          <Input
            id="waterAmount"
            type="number"
            step="1"
            {...register('waterAmount', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="photo">Photo</Label>
        <div className="mt-1 flex items-center">
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Log Entry'}
        </Button>
      </div>
    </form>
  );
} 