'use client';

import { useState } from 'react';
import { Stage, LogType } from '@/types/enums';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Date
          </label>
          <input
            type="date"
            {...register('date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div>
          <label htmlFor="logType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Log Type
          </label>
          <select
            {...register('logType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          >
            {Object.values(LogType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Growth Stage
          </label>
          <select
            {...register('stage')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          >
            {Object.values(Stage).map((stage) => (
              <option key={stage} value={stage}>
                {stage.toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Temperature (°C)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('temperature', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Humidity (%)
          </label>
          <input
            type="number"
            step="1"
            {...register('humidity', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label htmlFor="ph" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            pH
          </label>
          <input
            type="number"
            step="0.1"
            {...register('ph', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label htmlFor="ec" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            EC (mS/cm)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('ec', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label htmlFor="par" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            PAR (μmol/m²/s)
          </label>
          <input
            type="number"
            step="1"
            {...register('par', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label htmlFor="waterAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Water Amount (ml)
          </label>
          <input
            type="number"
            step="1"
            {...register('waterAmount', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Photo</label>
        <div className="mt-1 flex items-center">
          <input
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Log Entry'}
        </button>
      </div>
    </form>
  );
} 