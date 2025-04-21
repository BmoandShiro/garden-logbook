'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { LogType, Stage } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  humidity: number | null;
  waterAmount: number | null;
  healthRating: number | null;
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
  humidity: null,
  waterAmount: null,
  healthRating: null,
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

export default function CreateLogModal({ isOpen, onClose, userId, onSuccess }: CreateLogModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', userId],
    queryFn: () => fetchLocations(userId),
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combine date and time into a single Date object
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      // Find the first plant in the selected location or its children
      let plantId = null;
      if (selectedLocation) {
        if (selectedLocation.type === 'plant') {
          plantId = selectedLocation.id;
        } else {
          // Look for plants in the selected location
          const plants = selectedLocation.plants;
          if (plants && plants.length > 0) {
            plantId = plants[0].id; // Use the first plant found
          }
        }
      }

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
          date: dateTime.toISOString(),
          plantId, // Add the found plantId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create log');
      }

      toast.success('Log created successfully');
      onSuccess();
      setFormData(initialFormData);
      setSelectedLocation(null);
      onClose();
    } catch (error) {
      console.error('Error creating log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create log');
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value;
    const location = locations.find(loc => loc.id === locationId) || null;
    setSelectedLocation(location);

    // Reset all location IDs
    setFormData(prev => ({
      ...prev,
      gardenId: null,
      roomId: null,
      zoneId: null,
      plantId: null,
    }));

    if (location) {
      // Find parent locations in correct order based on path
      const updates: Partial<FormData> = {};
      
      // Find locations for each level of the path
      const gardenName = location.path[0];
      const roomName = location.path[1];
      const zoneName = location.path[2];
      
      const garden = locations.find(loc => loc.type === 'garden' && loc.name === gardenName);
      const room = locations.find(loc => loc.type === 'room' && loc.name === roomName && loc.path[0] === gardenName);
      const zone = locations.find(loc => loc.type === 'zone' && loc.name === zoneName && loc.path[0] === gardenName && loc.path[1] === roomName);

      // Set IDs in hierarchical order
      if (garden) updates.gardenId = garden.id;
      if (room) updates.roomId = room.id;
      if (zone) updates.zoneId = zone.id;

      // Handle plant selection
      if (location.type === 'plant') {
        updates.plantId = location.id;
      } else if (location.plants && location.plants.length > 0) {
        updates.plantId = location.plants[0].id;
      }

      // Update all IDs at once
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
    }
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
                onChange={handleLocationChange}
                className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
              >
                <option value="">Select a location</option>
                {locations?.map((loc: LocationOption) => (
                  <option key={`${loc.type}:${loc.id}`} value={loc.id}>
                    {loc.path.join(' → ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-dark-text-primary mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  id="temperature"
                  step="0.1"
                  value={formData.temperature || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value ? Number(e.target.value) : null }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="humidity" className="block text-sm font-medium text-dark-text-primary mb-1">
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

              <div>
                <label htmlFor="waterAmount" className="block text-sm font-medium text-dark-text-primary mb-1">
                  Water Amount (ml)
                </label>
                <input
                  type="number"
                  id="waterAmount"
                  min="0"
                  value={formData.waterAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, waterAmount: e.target.value ? Number(e.target.value) : null }))}
                  className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="healthRating" className="block text-sm font-medium text-dark-text-primary mb-1">
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