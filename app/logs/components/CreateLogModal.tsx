'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { LogType, Stage } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { TemperatureUnit, VolumeUnit, LengthUnit, convertTemperature, convertVolume, convertLength } from '@/lib/units';

interface CreateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

interface LocationOption {
  id: string;
  name: string;
  type: 'garden' | 'room' | 'zone' | 'plant';
  path: string[];
  plants: Array<{ id: string; name: string }>;
}

interface FormData {
  type: LogType;
  stage: Stage;
  notes: string;
  temperature: number | null;
  temperatureUnit: TemperatureUnit;
  humidity: number | null;
  waterAmount: number | null;
  waterUnit: VolumeUnit;
  healthRating: number | null;
  height: number | null;
  heightUnit: LengthUnit;
  width: number | null;
  widthUnit: LengthUnit;
  gardenId: string | null;
  roomId: string | null;
  zoneId: string | null;
  plantId: string | null;
  date: string;
  time: string;
}

const initialFormData: FormData = {
  type: LogType.WATERING,
  stage: Stage.VEGETATIVE,
  notes: '',
  temperature: null,
  temperatureUnit: TemperatureUnit.CELSIUS,
  humidity: null,
  waterAmount: null,
  waterUnit: VolumeUnit.MILLILITERS,
  healthRating: null,
  height: null,
  heightUnit: LengthUnit.CENTIMETERS,
  width: null,
  widthUnit: LengthUnit.CENTIMETERS,
  gardenId: null,
  roomId: null,
  zoneId: null,
  plantId: null,
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0].slice(0, 5),
};

async function fetchLocations(userId: string): Promise<LocationOption[]> {
  const response = await fetch(`/api/locations?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

const getLocationPath = (location: LocationOption): string[] => {
  const pathParts = location.path || [];
  return [...pathParts, location.name];
};

const getLocationLabel = (location: LocationOption): string => {
  return getLocationPath(location).join(' > ');
};

const filterLocations = (locations: LocationOption[], searchTerm: string): LocationOption[] => {
  if (!searchTerm) return locations;
  
  return locations.filter((loc: LocationOption) => {
    const path = getLocationPath(loc);
    return path.some((part: string) => 
      part.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
};

export default function CreateLogModal({ isOpen, onClose, userId, onSuccess }: CreateLogModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [gardenId, setGardenId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', userId],
    queryFn: () => fetchLocations(userId),
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Find the first plant in the selected location or its children
      let selectedPlantId = null;
      if (selectedLocation) {
        if (selectedLocation.plants.length > 0) {
          selectedPlantId = selectedLocation.plants[0].id;
        }
      }

      // Convert measurements to standard units before sending
      const standardizedData = {
        type: formData.type,
        stage: formData.stage,
        notes: formData.notes,
        date: formData.date,
        temperature: formData.temperature !== null 
          ? convertTemperature(formData.temperature, formData.temperatureUnit, TemperatureUnit.CELSIUS)
          : null,
        temperatureUnit: TemperatureUnit.CELSIUS,
        waterAmount: formData.waterAmount !== null
          ? convertVolume(formData.waterAmount, formData.waterUnit, VolumeUnit.MILLILITERS)
          : null,
        waterUnit: VolumeUnit.MILLILITERS,
        height: formData.height !== null
          ? convertLength(formData.height, formData.heightUnit, LengthUnit.CENTIMETERS)
          : null,
        heightUnit: LengthUnit.CENTIMETERS,
        width: formData.width !== null
          ? convertLength(formData.width, formData.widthUnit, LengthUnit.CENTIMETERS)
          : null,
        widthUnit: LengthUnit.CENTIMETERS,
        humidity: formData.humidity,
        healthRating: formData.healthRating,
        userId: session?.user?.id,
        gardenId: selectedLocation?.type === 'garden' ? selectedLocation.id : null,
        roomId: selectedLocation?.type === 'room' ? selectedLocation.id : null,
        zoneId: selectedLocation?.type === 'zone' ? selectedLocation.id : null,
        plantId: selectedPlantId,
      };

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(standardizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create log');
      }

      toast.success('Log created successfully');
      onSuccess();
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      console.error('Error creating log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (locationId: string) => {
    const selectedLocation = locations?.find(loc => loc.id === locationId);
    if (!selectedLocation) return;

    setSelectedLocation(selectedLocation);

    // Reset all location IDs
    const baseFormData: FormData = {
      ...formData,
      gardenId: null,
      roomId: null,
      zoneId: null,
      plantId: null
    };

    // Set the appropriate location ID based on type
    let updatedFormData: FormData = { ...baseFormData };
    
    switch (selectedLocation.type) {
      case 'garden':
        updatedFormData.gardenId = selectedLocation.id;
        break;
      case 'room':
        updatedFormData.gardenId = selectedLocation.path[0];
        updatedFormData.roomId = selectedLocation.id;
        break;
      case 'zone':
        updatedFormData.gardenId = selectedLocation.path[0];
        updatedFormData.roomId = selectedLocation.path[1];
        updatedFormData.zoneId = selectedLocation.id;
        break;
      case 'plant':
        updatedFormData.gardenId = selectedLocation.path[0];
        updatedFormData.roomId = selectedLocation.path[1];
        updatedFormData.zoneId = selectedLocation.path[2];
        updatedFormData.plantId = selectedLocation.id;
        break;
    }

    // Set the first plant if available
    if (selectedLocation.plants?.length > 0 && !selectedLocation.type.includes('plant')) {
      updatedFormData.plantId = selectedLocation.plants[0].id;
    }

    setFormData(updatedFormData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-dark-bg-secondary p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-dark-text-primary mb-4">
            Create New Log
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-dark-text-primary mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-dark-text-primary mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-dark-text-primary mb-1">
                Log Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as LogType }))}
                className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
              >
                {Object.values(LogType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-dark-text-primary mb-1">
                Stage
              </label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as Stage }))}
                className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
              >
                {Object.values(Stage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-dark-text-primary mb-1">
                Location
              </label>
              <select
                id="location"
                value={selectedLocation?.id || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
              >
                <option value="">Select a location</option>
                {locations?.map((loc: LocationOption) => (
                  <option key={`${loc.type}:${loc.id}`} value={loc.id}>
                    {(loc.path || []).join(' → ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="temperature" className="block text-sm font-medium text-dark-text-primary">
                  Temperature
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="temperature"
                    step="0.1"
                    value={formData.temperature || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value ? Number(e.target.value) : null }))}
                    className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  />
                  <select
                    value={formData.temperatureUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperatureUnit: e.target.value as TemperatureUnit }))}
                    className="block w-24 rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  >
                    {Object.values(TemperatureUnit).map((unit) => (
                      <option key={unit} value={unit}>{unit === TemperatureUnit.CELSIUS ? '°C' : '°F'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="humidity" className="block text-sm font-medium text-dark-text-primary">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  id="humidity"
                  min="0"
                  max="100"
                  value={formData.humidity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, humidity: e.target.value ? Number(e.target.value) : null }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="waterAmount" className="block text-sm font-medium text-dark-text-primary">
                  Water Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="waterAmount"
                    min="0"
                    step="0.1"
                    value={formData.waterAmount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, waterAmount: e.target.value ? Number(e.target.value) : null }))}
                    className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  />
                  <select
                    value={formData.waterUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, waterUnit: e.target.value as VolumeUnit }))}
                    className="block w-24 rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  >
                    {Object.values(VolumeUnit).map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="healthRating" className="block text-sm font-medium text-dark-text-primary">
                  Health Rating (1-5)
                </label>
                <input
                  type="number"
                  id="healthRating"
                  min="1"
                  max="5"
                  value={formData.healthRating || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthRating: e.target.value ? Number(e.target.value) : null }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="height" className="block text-sm font-medium text-dark-text-primary">
                  Height
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="height"
                    min="0"
                    step="0.1"
                    value={formData.height || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value ? Number(e.target.value) : null }))}
                    className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  />
                  <select
                    value={formData.heightUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, heightUnit: e.target.value as LengthUnit }))}
                    className="block w-24 rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  >
                    {Object.values(LengthUnit).map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="width" className="block text-sm font-medium text-dark-text-primary">
                  Width
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="width"
                    min="0"
                    step="0.1"
                    value={formData.width || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : null }))}
                    className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  />
                  <select
                    value={formData.widthUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, widthUnit: e.target.value as LengthUnit }))}
                    className="block w-24 rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  >
                    {Object.values(LengthUnit).map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-dark-text-primary mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-dark-text-primary bg-dark-bg-primary hover:bg-dark-bg-hover rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-garden-600 hover:bg-garden-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-400"
              >
                Create Log
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 