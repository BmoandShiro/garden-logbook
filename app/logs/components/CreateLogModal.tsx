'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  LogType, 
  Stage, 
  TemperatureUnit, 
  VolumeUnit, 
  LengthUnit,
  HealthRating, 
  PruningType, 
  TrainingMethod, 
  PestType, 
  DiseaseType,
  WaterSource,
  NutrientLine,
  Jacks321Product,
  TreatmentMethod,
  StressType
} from '../../../src/types/enums';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { convertTemperature, convertVolume, convertLength } from '@/lib/units';

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
  date: string;
  time: string;
  imageUrls: string[];
  temperature?: number;
  temperatureUnit?: TemperatureUnit;
  humidity?: number;
  co2?: number;
  vpd?: number;
  par?: number;
  ppfd?: number;
  lightHeight?: number;
  lightHeightUnit?: string;
  airflow?: boolean;
  waterSource?: WaterSource;
  waterAmount?: number;
  waterUnit?: VolumeUnit;
  waterTemperature?: number;
  waterTemperatureUnit?: TemperatureUnit;
  waterPh?: number;
  runoffPh?: number;
  waterEc?: number;
  runoffEc?: number;
  nutrientLine?: NutrientLine;
  jacks321Used?: Jacks321Product[];
  partAAmount?: number;
  partBAmount?: number;
  partCAmount?: number;
  boosterAmount?: number;
  finishAmount?: number;
  customNutrients?: { name: string; amount: number; unit: string }[];
  height?: number;
  heightUnit?: string;
  width?: number;
  widthUnit?: string;
  nodeCount?: number;
  branchCount?: number;
  estimatedYield?: number;
  estimatedYieldUnit?: string;
  healthRating?: number;
  pestTypes?: PestType[];
  diseaseTypes?: DiseaseType[];
  deficiencies?: string[];
  leafColor?: string;
  pestSeverity?: number;
  diseaseSeverity?: number;
  treatmentMethods?: TreatmentMethod[];
  treatmentProducts?: string[];
  treatmentDosage?: number;
  treatmentDosageUnit?: string;
  trainingMethods?: TrainingMethod[];
  trimAmount?: number;
  trimAmountUnit?: string;
  wetWeight?: number;
  wetWeightUnit?: string;
  dryWeight?: number;
  dryWeightUnit?: string;
  trimWeight?: number;
  trimWeightUnit?: string;
  dryingTemp?: number;
  dryingHumidity?: number;
  dryingDays?: number;
  curingDays?: number;
  mediumMoisture?: number;
  mediumTemp?: number;
  mediumPh?: number;
  userId?: string;
  gardenId?: string;
  roomId?: string;
  zoneId?: string;
  plantId?: string;
  partAPpm?: number;
  partBPpm?: number;
  partCPpm?: number;
  boosterPpm?: number;
  finishPpm?: number;
  waterPpm?: number;
  runoffPpm?: number;
}

const defaultFormData: FormData = {
  type: LogType.GENERAL,
  stage: Stage.VEGETATIVE,
  notes: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  imageUrls: [],
  temperatureUnit: TemperatureUnit.CELSIUS,
  waterUnit: VolumeUnit.MILLILITERS,
  heightUnit: LengthUnit.CENTIMETERS,
  widthUnit: LengthUnit.CENTIMETERS,
  waterTemperatureUnit: TemperatureUnit.CELSIUS,
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
  const [formData, setFormData] = useState<FormData>(defaultFormData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Find the first plant in the selected location or its children
      let selectedPlantId: string | undefined = undefined;
      if (selectedLocation && selectedLocation.plants.length > 0) {
        selectedPlantId = selectedLocation.plants[0].id;
      }

      const data = {
        date: formData.date,
        time: formData.time,
        type: formData.type,
        stage: formData.stage,
        notes: formData.notes,
        temperature: formData.temperature !== undefined && formData.temperatureUnit
          ? convertTemperature(formData.temperature, formData.temperatureUnit, TemperatureUnit.CELSIUS)
          : undefined,
        waterTemperature: formData.waterTemperature !== undefined && formData.waterTemperatureUnit
          ? convertTemperature(formData.waterTemperature, formData.waterTemperatureUnit, TemperatureUnit.CELSIUS)
          : undefined,
        waterPpm: formData.waterPpm,
        runoffPpm: formData.runoffPpm,
        partAPpm: formData.partAPpm,
        partBPpm: formData.partBPpm,
        partCPpm: formData.partCPpm,
        boosterPpm: formData.boosterPpm,
        finishPpm: formData.finishPpm,
        humidity: formData.humidity,
        waterAmount: formData.waterAmount !== undefined && formData.waterUnit
          ? convertVolume(formData.waterAmount, formData.waterUnit, VolumeUnit.MILLILITERS)
          : undefined,
        healthRating: formData.healthRating,
        user: {
          connect: {
            id: session?.user?.id
          }
        },
        ...(selectedLocation?.type === 'garden' && {
          garden: {
            connect: {
              id: selectedLocation.id
            }
          }
        }),
        ...(selectedLocation?.type === 'room' && {
          room: {
            connect: {
              id: selectedLocation.id
            }
          }
        }),
        ...(selectedLocation?.type === 'zone' && {
          zone: {
            connect: {
              id: selectedLocation.id
            }
          }
        }),
        ...(selectedPlantId && {
          plant: {
            connect: {
              id: selectedPlantId
            }
          }
        })
      };

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const dataResponse = await response.json();

      if (!response.ok) {
        throw new Error(dataResponse.error || 'Failed to create log');
      }

      toast.success('Log created successfully');
      onSuccess();
      setFormData(defaultFormData);
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
      gardenId: undefined,
      roomId: undefined,
      zoneId: undefined,
      plantId: undefined
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
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-dark-bg-secondary p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <style jsx global>{`
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              opacity: 1;
              background: linear-gradient(to bottom, #22c55e 0%, #15803d 100%);
              border-radius: 2px;
              width: 14px;
              cursor: pointer;
            }
          `}</style>
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
                  <option key={`${loc.type}:${loc.path.join('>')}:${loc.id}`} value={loc.id}>
                    {(loc.path || []).join(' → ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Show all fields for CUSTOM type, otherwise show relevant fields based on type */}
            {(formData.type === LogType.CUSTOM || formData.type === LogType.ENVIRONMENTAL) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Environmental Measurements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature field */}
                  {/* Humidity field */}
                  {/* CO2 field */}
                  {/* VPD field */}
                  {/* PAR field */}
                  {/* PPFD field */}
                  {/* Light Height field */}
                  {/* Airflow checkbox */}
                </div>
              </div>
            )}

            {(formData.type === LogType.CUSTOM || formData.type === LogType.WATERING) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Water & Feeding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="waterSource" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Water Source
                    </label>
                    <select
                      id="waterSource"
                      value={formData.waterSource || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterSource: e.target.value as WaterSource }))}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                    >
                      <option value="">Select water source</option>
                      {Object.values(WaterSource).map((source) => (
                        <option key={source} value={source}>{source.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="waterAmount" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Water Amount
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="waterAmount"
                        value={formData.waterAmount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, waterAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                        min="0"
                        step="0.1"
                      />
                      <select
                        value={formData.waterUnit || VolumeUnit.MILLILITERS}
                        onChange={(e) => setFormData(prev => ({ ...prev, waterUnit: e.target.value as VolumeUnit }))}
                        className="rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      >
                        {Object.values(VolumeUnit).map((unit) => (
                          <option key={unit} value={unit}>{unit.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="waterTemperature" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Water Temperature
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="waterTemperature"
                        value={formData.waterTemperature || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, waterTemperature: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                        step="0.1"
                      />
                      <select
                        value={formData.waterTemperatureUnit || TemperatureUnit.CELSIUS}
                        onChange={(e) => setFormData(prev => ({ ...prev, waterTemperatureUnit: e.target.value as TemperatureUnit }))}
                        className="rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      >
                        {Object.values(TemperatureUnit).map((unit) => (
                          <option key={unit} value={unit}>{unit === TemperatureUnit.CELSIUS ? '°C' : '°F'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="waterPh" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Water pH
                    </label>
                    <input
                      type="number"
                      id="waterPh"
                      value={formData.waterPh || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterPh: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      min="0"
                      max="14"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="runoffPh" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Runoff pH
                    </label>
                    <input
                      type="number"
                      id="runoffPh"
                      value={formData.runoffPh || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, runoffPh: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      min="0"
                      max="14"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="waterPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Water PPM (500 scale)
                    </label>
                    <input
                      type="number"
                      id="waterPpm"
                      value={formData.waterPpm || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label htmlFor="runoffPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                      Runoff PPM (500 scale)
                    </label>
                    <input
                      type="number"
                      id="runoffPpm"
                      value={formData.runoffPpm || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, runoffPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                
                {formData.nutrientLine === NutrientLine.JACKS_321 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Jack's 321 Measurements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="partAPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Part A (5-12-26) PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="partAPpm"
                          value={formData.partAPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, partAPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="partBPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Part B (Calcium Nitrate) PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="partBPpm"
                          value={formData.partBPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, partBPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="partCPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Part C (Epsom Salt) PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="partCPpm"
                          value={formData.partCPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, partCPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="boosterPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Booster PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="boosterPpm"
                          value={formData.boosterPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, boosterPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="finishPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Finish PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="finishPpm"
                          value={formData.finishPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, finishPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="waterPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Water PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="waterPpm"
                          value={formData.waterPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, waterPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="runoffPpm" className="block text-sm font-medium text-dark-text-primary mb-1">
                          Runoff PPM (500 scale)
                        </label>
                        <input
                          type="number"
                          id="runoffPpm"
                          value={formData.runoffPpm || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, runoffPpm: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plant measurements */}
            {(formData.type === LogType.CUSTOM || [LogType.PRUNING, LogType.INSPECTION].includes(formData.type)) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Plant Measurements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Height with unit */}
                  {/* Width with unit */}
                  {/* Node Count */}
                  {/* Branch Count */}
                  {/* Estimated Yield with unit */}
                </div>
              </div>
            )}

            {(formData.type === LogType.CUSTOM || [LogType.INSPECTION, LogType.PEST_DISEASE].includes(formData.type)) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Health & Issues</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Health Rating */}
                  {/* Pest Types multi-select */}
                  {/* Disease Types multi-select */}
                  {/* Deficiencies multi-select */}
                  {/* Leaf Color */}
                  {/* Pest Severity */}
                  {/* Disease Severity */}
                </div>
              </div>
            )}

            {(formData.type === LogType.CUSTOM || formData.type === LogType.TREATMENT) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Treatment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Treatment Methods multi-select */}
                  {/* Treatment Products */}
                  {/* Treatment Dosage with unit */}
                </div>
              </div>
            )}

            {/* Training Details */}
            {(formData.type === LogType.CUSTOM || LogType.PRUNING === formData.type) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Training Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Training Methods multi-select */}
                  {/* Trim Amount with unit */}
                </div>
              </div>
            )}

            {/* Harvest Details */}
            {(formData.type === LogType.CUSTOM || LogType.HARVEST === formData.type) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Harvest & Drying Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wet Weight with unit */}
                  {/* Dry Weight with unit */}
                  {/* Trim Weight with unit */}
                  {/* Drying Temperature */}
                  {/* Drying Humidity */}
                  {/* Drying Days */}
                  {/* Curing Days */}
                </div>
              </div>
            )}

            {/* Notes field - always shown */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notes</h3>
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