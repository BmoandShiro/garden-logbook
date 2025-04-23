'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  LogType,
  Stage,
  WaterSource,
  NutrientLine,
  Jacks321Product,
  TemperatureUnit,
  DistanceUnit,
  VolumeUnit,
  WeightUnit,
  PestType,
  DiseaseType,
  TreatmentMethod,
  TrainingMethod,
  SuspectedStressCause,
  PestCategory,
  LightIntensityUnit
} from '@/types/enums';

// Types for form data
type PpmScale = 'PPM_500' | 'PPM_700';
type FanSpeed = 'LOW' | 'MEDIUM' | 'HIGH';
type VentilationType = 'CLOSED_LOOP' | 'EXHAUST_INTAKE';
type Jacks321Unit = 'GRAMS' | 'PPM';
type Intensity = 'LIGHT' | 'MODERATE' | 'INTENSE';
type Shape = 'EVEN' | 'SLOPED' | 'SUPER_UNEVEN';

type HangMethod = 'ENTIRE_PLANT' | 'BRANCHES' | 'NUGS_ON_RACKS';
type TrichomeColor = 'MOSTLY_CLEAR' | 'MOSTLY_MILKY' | 'MILKY_MIXED_AMBER' | 'MORE_THAN_30_AMBER';
type TrimMoisture = 'WET' | 'DRY' | 'LIVE';
type TrimMethod = 'HAND' | 'MACHINE';

type TrainingGoal = 
  | 'HEIGHT_CONTROL'
  | 'WIDEN_PLANT'
  | 'EXTRA_COLAS'
  | 'STEM_STRENGTH'
  | 'CANOPY_CONTROL'
  | 'AIRFLOW'
  | 'LIGHT_PENETRATION'
  | 'NODE_EXPOSURE'
  | 'SYMMETRY'
  | 'REMOVE_LOWER_GROWTH'
  | 'REMOVE_DAMAGED'
  | 'EXPERIMENTAL';

interface CustomNutrient {
  name: string;
  amount: number;
  unit: string;
}

interface LocationNode {
  id: string;
  name: string;
  type: 'garden' | 'room' | 'zone' | 'plant';
  path: string[];
  plants: { id: string; name: string; }[];
  children: LocationNode[];
}

interface FormData {
  // Basic Info
  logType: LogType;
  stage: Stage;
  date: string;
  time: string;
  logTitle: string;
  notes: string;
  imageUrls: string[];
  stressCause?: SuspectedStressCause;

  // Location
  gardenId?: string;
  roomId?: string;
  zoneId?: string;
  plantId?: string;
  selectedPlants: string[];

  // Environmental
  temperature?: number;
  temperatureUnit: TemperatureUnit;
  humidity?: number;
  co2?: number;
  vpd?: number;
  dewPoint?: number;
  averagePar?: number;
  fanSpeed?: FanSpeed;
  ventilationType?: VentilationType;

  // Water & Feeding
  waterSource?: WaterSource;
  waterAmount?: number;
  waterUnit: VolumeUnit;
  waterTemperature?: number;
  waterTemperatureUnit: TemperatureUnit;
  sourceWaterPh?: number;
  nutrientWaterPh?: number;
  sourceWaterPpm?: number;
  nutrientWaterPpm?: number;
  ppmScale: PpmScale;
  nutrientLine?: NutrientLine;

  // Jack's 321
  jacks321Used: Jacks321Product[];
  jacks321Unit: Jacks321Unit;
  partAAmount?: number;
  partBAmount?: number;
  partCAmount?: number;
  boosterAmount?: number;
  finishAmount?: number;

  // Custom Nutrients
  customNutrients?: CustomNutrient[];

  // Plant Measurements
  height?: number;
  heightUnit: DistanceUnit;
  width?: number;
  widthUnit: DistanceUnit;
  nodeCount?: number;
  branchCount?: number;
  estimatedYield?: number;
  estimatedYieldUnit: WeightUnit;

  // Health & Issues
  healthRating?: number;
  pestTypes: PestType[];
  pestCategories: PestCategory[];
  diseaseTypes: DiseaseType[];
  deficiencies: string[];
  leafColor?: string;
  pestSeverity?: number;
  diseaseSeverity?: number;

  // Treatment
  treatmentMethods: TreatmentMethod[];
  treatmentProducts: string[];
  treatmentDosage?: number;
  treatmentDosageUnit?: string;

  // Training
  trainingMethods: TrainingMethod[];
  trimAmount?: number;
  trimAmountUnit: WeightUnit;

  // Harvest
  hangMethod?: HangMethod;
  forLiveUse?: boolean;
  trichomeColor?: TrichomeColor;

  // Drying & Curing
  trimMoisture?: TrimMoisture;
  nugMoisturePercent?: number;
  trimMethod?: TrimMethod;
  dryingRh?: number;
  dryingTemp?: number;
  estimatedDaysLeft?: number;

  // Soil/Medium
  mediumMoisture?: number;
  mediumTemp?: number;
  mediumPh?: number;

  // Additives
  aspirinAmount?: number;
  nukemAmount?: number;
  oxiphosAmount?: number;
  seagreenAmount?: number;
  teabrewerBatch?: string;
  teabrewerVolume?: number;

  // LST Fields
  bendingIntensity?: string | null;
  tieDownIntensity?: string | null;
  supportedPlants: string[];
  canopyShape?: string | null;
  leafTuckingIntensity?: string | null;
  lstIntensity?: string | null;

  // HST Fields
  toppedNode?: number;
  fimNode?: number;
  defoliationIntensity?: string;
  defoliationPercentage?: number;
  trainingGoals: TrainingGoal[];
}

interface CreateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function CreateLogModal({ isOpen, onClose, userId, onSuccess }: CreateLogModalProps) {
  const [formData, setFormData] = useState<FormData>({
    logType: LogType.GENERAL,
    stage: Stage.VEGETATIVE,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    logTitle: '',
    notes: '',
    imageUrls: [],
    selectedPlants: [],
    temperatureUnit: TemperatureUnit.CELSIUS,
    fanSpeed: 'MEDIUM',
    ventilationType: 'CLOSED_LOOP',
    waterUnit: VolumeUnit.MILLILITERS,
    waterTemperatureUnit: TemperatureUnit.CELSIUS,
    heightUnit: DistanceUnit.CENTIMETERS,
    widthUnit: DistanceUnit.CENTIMETERS,
    estimatedYieldUnit: WeightUnit.GRAMS,
    jacks321Used: [],
    jacks321Unit: 'GRAMS',
    pestTypes: [],
    pestCategories: [],
    diseaseTypes: [],
    deficiencies: [],
    treatmentMethods: [],
    treatmentProducts: [],
    trainingMethods: [],
    trimAmountUnit: WeightUnit.GRAMS,
    ppmScale: 'PPM_500',
    supportedPlants: [],
    trainingGoals: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Filter locations by type
  const gardens = locations.filter(loc => loc.type === 'garden');
  const rooms = locations.filter(loc => loc.type === 'room' && (!formData.gardenId || loc.path[0] === gardens.find(g => g.id === formData.gardenId)?.name));
  const zones = locations.filter(loc => loc.type === 'zone' && (!formData.roomId || loc.path[1] === rooms.find(r => r.id === formData.roomId)?.name));
  const plants = locations.filter(loc => loc.type === 'plant' && (!formData.zoneId || loc.path[2] === zones.find(z => z.id === formData.zoneId)?.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
          plants: formData.selectedPlants.map(plantId => ({ id: plantId }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create log');
      }

      toast({
        title: 'Success',
        description: 'Log created successfully',
      });

      onClose();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create log',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="garden">Garden</Label>
        <select
          id="garden"
          value={formData.gardenId || ''}
          onChange={(e) => setFormData({ ...formData, gardenId: e.target.value })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
        >
          <option value="">Select Garden</option>
          {/* TODO: Add garden options */}
        </select>
      </div>
      <div>
        <Label htmlFor="room">Room</Label>
        <select
          id="room"
          value={formData.roomId || ''}
          onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
        >
          <option value="">Select Room</option>
          {/* TODO: Add room options */}
        </select>
      </div>
      <div>
        <Label htmlFor="zone">Zone</Label>
        <select
          id="zone"
          value={formData.zoneId || ''}
          onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
        >
          <option value="">Select Zone</option>
          {/* TODO: Add zone options */}
        </select>
      </div>
    </div>
  );

  const renderEnvironmentalFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="temperature">Temperature</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            id="temperature"
            value={formData.temperature || ''}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
          <select
            value={formData.temperatureUnit}
            onChange={(e) => setFormData({ ...formData, temperatureUnit: e.target.value as TemperatureUnit })}
            className="w-24 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(TemperatureUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="humidity">Humidity (%)</Label>
        <Input
          type="number"
          id="humidity"
          value={formData.humidity || ''}
          onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="co2">CO2 (ppm)</Label>
        <Input
          type="number"
          id="co2"
          value={formData.co2 || ''}
          onChange={(e) => setFormData({ ...formData, co2: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="vpd">VPD (kPa)</Label>
        <Input
          type="number"
          id="vpd"
          value={formData.vpd || ''}
          onChange={(e) => setFormData({ ...formData, vpd: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="dewPoint">Dew Point (°{formData.temperatureUnit === TemperatureUnit.CELSIUS ? 'C' : 'F'})</Label>
        <Input
          type="number"
          id="dewPoint"
          value={formData.dewPoint || ''}
          onChange={(e) => setFormData({ ...formData, dewPoint: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="averagePar">Average PAR (μmol/m²/s)</Label>
        <Input
          type="number"
          id="averagePar"
          value={formData.averagePar || ''}
          onChange={(e) => setFormData({ ...formData, averagePar: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="fanSpeed">Fan Speed</Label>
        <select
          id="fanSpeed"
          value={formData.fanSpeed || ''}
          onChange={(e) => setFormData({ ...formData, fanSpeed: e.target.value as FanSpeed })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>
      <div>
        <Label htmlFor="ventilationType">Air Exchange Type</Label>
        <select
          id="ventilationType"
          value={formData.ventilationType || ''}
          onChange={(e) => setFormData({ ...formData, ventilationType: e.target.value as VentilationType })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="CLOSED_LOOP">Closed Loop Airflow</option>
          <option value="EXHAUST_INTAKE">Exhaust/Intake Air Exchange</option>
        </select>
      </div>
    </div>
  );

  const renderWateringFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="waterSource">Water Source</Label>
        <select
          id="waterSource"
          value={formData.waterSource || ''}
          onChange={(e) => setFormData({ ...formData, waterSource: e.target.value as WaterSource })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="">Select Source</option>
          {Object.values(WaterSource).map((source) => (
            <option key={source} value={source}>{source.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="waterAmount">Water Amount</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            id="waterAmount"
            value={formData.waterAmount || ''}
            onChange={(e) => setFormData({ ...formData, waterAmount: parseFloat(e.target.value) })}
            className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
          <select
            value={formData.waterUnit}
            onChange={(e) => setFormData({ ...formData, waterUnit: e.target.value as VolumeUnit })}
            className="w-32 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(VolumeUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="sourceWaterPh">Source Water pH</Label>
        <Input
          type="number"
          id="sourceWaterPh"
          value={formData.sourceWaterPh || ''}
          onChange={(e) => setFormData({ ...formData, sourceWaterPh: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="nutrientWaterPh">Nutrient Water pH</Label>
        <Input
          type="number"
          id="nutrientWaterPh"
          value={formData.nutrientWaterPh || ''}
          onChange={(e) => setFormData({ ...formData, nutrientWaterPh: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="ppmScale">PPM Scale</Label>
        <select
          id="ppmScale"
          value={formData.ppmScale}
          onChange={(e) => setFormData({ ...formData, ppmScale: e.target.value as PpmScale })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="PPM_500">PPM 500 Scale (0.5 EC)</option>
          <option value="PPM_700">PPM 700 Scale (0.7 EC)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="sourceWaterPpm">Source Water PPM</Label>
        <Input
          type="number"
          id="sourceWaterPpm"
          value={formData.sourceWaterPpm || ''}
          onChange={(e) => setFormData({ ...formData, sourceWaterPpm: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="nutrientWaterPpm">Nutrient Water PPM</Label>
        <Input
          type="number"
          id="nutrientWaterPpm"
          value={formData.nutrientWaterPpm || ''}
          onChange={(e) => setFormData({ ...formData, nutrientWaterPpm: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
    </div>
  );

  const renderNutrientFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nutrientLine">Nutrient Line</Label>
        <select
          id="nutrientLine"
          value={formData.nutrientLine || ''}
          onChange={(e) => setFormData({ ...formData, nutrientLine: e.target.value as NutrientLine })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="">Select Line</option>
          {Object.values(NutrientLine).map((line) => (
            <option key={line} value={line}>{line.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {formData.nutrientLine === NutrientLine.JACKS_321 && (
        <>
          <div>
            <Label htmlFor="jacks321Unit">Measurement Unit</Label>
            <select
              id="jacks321Unit"
              value={formData.jacks321Unit}
              onChange={(e) => setFormData({ ...formData, jacks321Unit: e.target.value as Jacks321Unit })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="GRAMS">Grams</option>
              <option value="PPM">PPM</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partAAmount">Part A (5-12-26) {formData.jacks321Unit === 'GRAMS' ? '(g)' : '(ppm)'}</Label>
              <Input
                type="number"
                id="partAAmount"
                value={formData.partAAmount || ''}
                onChange={(e) => setFormData({ ...formData, partAAmount: parseFloat(e.target.value) })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                placeholder={`Enter amount in ${formData.jacks321Unit.toLowerCase()}`}
              />
            </div>
            <div>
              <Label htmlFor="partBAmount">Part B (Calcium Nitrate) {formData.jacks321Unit === 'GRAMS' ? '(g)' : '(ppm)'}</Label>
              <Input
                type="number"
                id="partBAmount"
                value={formData.partBAmount || ''}
                onChange={(e) => setFormData({ ...formData, partBAmount: parseFloat(e.target.value) })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                placeholder={`Enter amount in ${formData.jacks321Unit.toLowerCase()}`}
              />
            </div>
            <div>
              <Label htmlFor="partCAmount">Part C (Epsom Salt) {formData.jacks321Unit === 'GRAMS' ? '(g)' : '(ppm)'}</Label>
              <Input
                type="number"
                id="partCAmount"
                value={formData.partCAmount || ''}
                onChange={(e) => setFormData({ ...formData, partCAmount: parseFloat(e.target.value) })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                placeholder={`Enter amount in ${formData.jacks321Unit.toLowerCase()}`}
              />
            </div>
            <div>
              <Label htmlFor="boosterAmount">Bloom Booster {formData.jacks321Unit === 'GRAMS' ? '(g)' : '(ppm)'}</Label>
              <Input
                type="number"
                id="boosterAmount"
                value={formData.boosterAmount || ''}
                onChange={(e) => setFormData({ ...formData, boosterAmount: parseFloat(e.target.value) })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                placeholder={`Enter amount in ${formData.jacks321Unit.toLowerCase()}`}
              />
            </div>
            <div>
              <Label htmlFor="finishAmount">Finish {formData.jacks321Unit === 'GRAMS' ? '(g)' : '(ppm)'}</Label>
              <Input
                type="number"
                id="finishAmount"
                value={formData.finishAmount || ''}
                onChange={(e) => setFormData({ ...formData, finishAmount: parseFloat(e.target.value) })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                placeholder={`Enter amount in ${formData.jacks321Unit.toLowerCase()}`}
              />
            </div>
          </div>
        </>
      )}

      {formData.nutrientLine === NutrientLine.CUSTOM && (
        <div>
          <Label>Custom Nutrients</Label>
          <Textarea
            value={JSON.stringify(formData.customNutrients || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({ ...formData, customNutrients: parsed });
              } catch (error) {
                // Handle invalid JSON
              }
            }}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border min-h-[100px]"
          />
        </div>
      )}
    </div>
  );

  const renderAdditivesFields = () => (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium text-dark-text-primary">Additives</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="aspirinAmount">Uncoated Aspirin (81-325mg/gal)</Label>
          <Input
            type="number"
            id="aspirinAmount"
            value={formData.aspirinAmount || ''}
            onChange={(e) => setFormData({ ...formData, aspirinAmount: parseFloat(e.target.value) })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="mg per gallon"
          />
        </div>
        <div>
          <Label htmlFor="nukemAmount">Nukem Root Drench</Label>
          <Input
            type="number"
            id="nukemAmount"
            value={formData.nukemAmount || ''}
            onChange={(e) => setFormData({ ...formData, nukemAmount: parseFloat(e.target.value) })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="ml"
          />
        </div>
        <div>
          <Label htmlFor="oxiphosAmount">Oxiphos</Label>
          <Input
            type="number"
            id="oxiphosAmount"
            value={formData.oxiphosAmount || ''}
            onChange={(e) => setFormData({ ...formData, oxiphosAmount: parseFloat(e.target.value) })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="ml"
          />
        </div>
        <div>
          <Label htmlFor="seagreenAmount">SeaGreen</Label>
          <Input
            type="number"
            id="seagreenAmount"
            value={formData.seagreenAmount || ''}
            onChange={(e) => setFormData({ ...formData, seagreenAmount: parseFloat(e.target.value) })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="ml"
          />
        </div>
        <div>
          <Label htmlFor="teabrewerBatch">Teabrewer Batch</Label>
          <Input
            type="text"
            id="teabrewerBatch"
            value={formData.teabrewerBatch || ''}
            onChange={(e) => setFormData({ ...formData, teabrewerBatch: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Batch identifier"
          />
        </div>
        <div>
          <Label htmlFor="teabrewerVolume">Teabrewer Volume</Label>
          <Input
            type="number"
            id="teabrewerVolume"
            value={formData.teabrewerVolume || ''}
            onChange={(e) => setFormData({ ...formData, teabrewerVolume: parseFloat(e.target.value) })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="ml"
          />
        </div>
      </div>
    </div>
  );

  const renderPlantMeasurements = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="height">Height</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            id="height"
            value={formData.height || ''}
            onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
            className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
          <select
            value={formData.heightUnit}
            onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value as DistanceUnit })}
            className="w-32 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(DistanceUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="width">Width</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            id="width"
            value={formData.width || ''}
            onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
            className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
          <select
            value={formData.widthUnit}
            onChange={(e) => setFormData({ ...formData, widthUnit: e.target.value as DistanceUnit })}
            className="w-32 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(DistanceUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="nodeCount">Node Count</Label>
        <Input
          type="number"
          id="nodeCount"
          value={formData.nodeCount || ''}
          onChange={(e) => setFormData({ ...formData, nodeCount: parseInt(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="branchCount">Branch Count</Label>
        <Input
          type="number"
          id="branchCount"
          value={formData.branchCount || ''}
          onChange={(e) => setFormData({ ...formData, branchCount: parseInt(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
    </div>
  );

  const renderHealthFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="healthRating">Health Rating (1-10)</Label>
        <Input
          type="number"
          id="healthRating"
          min="1"
          max="10"
          value={formData.healthRating || ''}
          onChange={(e) => setFormData({ ...formData, healthRating: parseInt(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label>Pest Types</Label>
        <MultiSelect
          value={formData.pestTypes}
          onChange={(value) => setFormData({ ...formData, pestTypes: value as PestType[] })}
          options={Object.values(PestType).map(type => ({
            value: type,
            label: type.replace(/_/g, ' ')
          }))}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label>Disease Types</Label>
        <MultiSelect
          value={formData.diseaseTypes}
          onChange={(value) => setFormData({ ...formData, diseaseTypes: value as DiseaseType[] })}
          options={Object.values(DiseaseType).map(type => ({
            value: type,
            label: type.replace(/_/g, ' ')
          }))}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      {/* Add fields for deficiencies, leaf color, pest severity, etc. */}
    </div>
  );

  const renderLSTFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bendingIntensity">Supercropping Intensity</Label>
          <select
            id="bendingIntensity"
            value={formData.bendingIntensity || ''}
            onChange={(e) => setFormData({ ...formData, bendingIntensity: e.target.value })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Intensity</option>
            <option value="LIGHT">Light</option>
            <option value="MODERATE">Moderate</option>
            <option value="INTENSE">Intense</option>
          </select>
        </div>
        <div>
          <Label htmlFor="tieDownIntensity">Tie Down Intensity</Label>
          <select
            id="tieDownIntensity"
            value={formData.tieDownIntensity || ''}
            onChange={(e) => setFormData({ ...formData, tieDownIntensity: e.target.value })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Intensity</option>
            <option value="LIGHT">Light</option>
            <option value="MODERATE">Moderate</option>
            <option value="INTENSE">Intense</option>
          </select>
        </div>
        <div>
          <Label htmlFor="canopyShape">Canopy Shape</Label>
          <select
            id="canopyShape"
            value={formData.canopyShape || ''}
            onChange={(e) => setFormData({ ...formData, canopyShape: e.target.value })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Shape</option>
            <option value="EVEN">Even</option>
            <option value="SLOPED">Sloped</option>
            <option value="SUPER_UNEVEN">Super Uneven</option>
          </select>
        </div>
        <div>
          <Label htmlFor="leafTuckingIntensity">Leaf Tucking Intensity</Label>
          <select
            id="leafTuckingIntensity"
            value={formData.leafTuckingIntensity || ''}
            onChange={(e) => setFormData({ ...formData, leafTuckingIntensity: e.target.value })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Intensity</option>
            <option value="LIGHT">Light</option>
            <option value="MODERATE">Moderate</option>
            <option value="INTENSE">Intense</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="supportedPlants">Trunk Supports</Label>
        <MultiSelect
          value={formData.supportedPlants}
          onChange={(value) => setFormData({ ...formData, supportedPlants: value })}
          options={plants.map(plant => ({
            value: plant.id,
            label: plant.name
          }))}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          placeholder="Select plants that received trunk support"
        />
      </div>
    </div>
  );

  const renderHSTFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="toppedNode">Topped at Node</Label>
          <select
            id="toppedNode"
            value={formData.toppedNode || ''}
            onChange={(e) => setFormData({ ...formData, toppedNode: parseInt(e.target.value) || undefined })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Node</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fimNode">FIM at Node</Label>
          <select
            id="fimNode"
            value={formData.fimNode || ''}
            onChange={(e) => setFormData({ ...formData, fimNode: parseInt(e.target.value) || undefined })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Node</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="defoliationIntensity">Defoliation Intensity</Label>
          <select
            id="defoliationIntensity"
            value={formData.defoliationIntensity || ''}
            onChange={(e) => setFormData({ ...formData, defoliationIntensity: e.target.value })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Intensity</option>
            <option value="LIGHT">Light</option>
            <option value="MODERATE">Moderate</option>
            <option value="INTENSE">Intense</option>
          </select>
        </div>
        <div>
          <Label htmlFor="defoliationPercentage">Portion of Plant Defoliated (%)</Label>
          <Input
            type="number"
            id="defoliationPercentage"
            min="1"
            max="100"
            value={formData.defoliationPercentage || ''}
            onChange={(e) => setFormData({ ...formData, defoliationPercentage: parseInt(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>
      </div>
      <div>
        <Label>Training Goals</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'HEIGHT_CONTROL', label: 'Height Control' },
            { value: 'WIDEN_PLANT', label: 'Widen Plant' },
            { value: 'EXTRA_COLAS', label: 'Extra Colas' },
            { value: 'STEM_STRENGTH', label: 'Stem Strength' },
            { value: 'CANOPY_CONTROL', label: 'Canopy Control' },
            { value: 'AIRFLOW', label: 'Airflow' },
            { value: 'LIGHT_PENETRATION', label: 'Light Penetration' },
            { value: 'NODE_EXPOSURE', label: 'Node Exposure' },
            { value: 'SYMMETRY', label: 'Symmetry' },
            { value: 'REMOVE_LOWER_GROWTH', label: 'Remove Lower Growth' },
            { value: 'REMOVE_DAMAGED', label: 'Remove Diseased/Damaged' },
            { value: 'EXPERIMENTAL', label: 'Experimental' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`goal-${value}`}
                checked={formData.trainingGoals.includes(value as TrainingGoal)}
                onChange={(e) => {
                  const goals = e.target.checked
                    ? [...formData.trainingGoals, value as TrainingGoal]
                    : formData.trainingGoals.filter(g => g !== value);
                  setFormData({ ...formData, trainingGoals: goals });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`goal-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHarvestFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hangMethod">Hang Method</Label>
          <select
            id="hangMethod"
            value={formData.hangMethod || ''}
            onChange={(e) => setFormData({ ...formData, hangMethod: e.target.value as HangMethod })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Method</option>
            <option value="ENTIRE_PLANT">Entire Plant</option>
            <option value="BRANCHES">Branches</option>
            <option value="NUGS_ON_RACKS">Nugs on Racks</option>
          </select>
        </div>
        <div>
          <Label htmlFor="trichomeColor">Trichome Coloration</Label>
          <select
            id="trichomeColor"
            value={formData.trichomeColor || ''}
            onChange={(e) => setFormData({ ...formData, trichomeColor: e.target.value as TrichomeColor })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Coloration</option>
            <option value="MOSTLY_CLEAR">Mostly Clear</option>
            <option value="MOSTLY_MILKY">Mostly Milky</option>
            <option value="MILKY_MIXED_AMBER">Milky Mixed Amber</option>
            <option value="MORE_THAN_30_AMBER">More than 30% Amber</option>
          </select>
        </div>
        <div className="col-span-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="forLiveUse"
              checked={formData.forLiveUse || false}
              onChange={(e) => setFormData({ ...formData, forLiveUse: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="forLiveUse" className="text-sm font-normal">
              Harvest to be used live
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDryingFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="trimMoisture">Trim Moisture</Label>
          <select
            id="trimMoisture"
            value={formData.trimMoisture || ''}
            onChange={(e) => setFormData({ ...formData, trimMoisture: e.target.value as TrimMoisture })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Moisture</option>
            <option value="WET">Wet</option>
            <option value="DRY">Dry</option>
            <option value="LIVE">Live</option>
          </select>
        </div>
        <div>
          <Label htmlFor="nugMoisturePercent">Nug Moisture When Trimmed (%)</Label>
          <Input
            type="number"
            id="nugMoisturePercent"
            min="1"
            max="100"
            value={formData.nugMoisturePercent || ''}
            onChange={(e) => setFormData({ ...formData, nugMoisturePercent: parseInt(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>
        <div>
          <Label htmlFor="trimMethod">Trim Method</Label>
          <select
            id="trimMethod"
            value={formData.trimMethod || ''}
            onChange={(e) => setFormData({ ...formData, trimMethod: e.target.value as TrimMethod })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Method</option>
            <option value="HAND">Hand</option>
            <option value="MACHINE">Machine</option>
          </select>
        </div>
        <div>
          <Label htmlFor="dryingRh">RH (%)</Label>
          <Input
            type="number"
            id="dryingRh"
            min="1"
            max="100"
            value={formData.dryingRh || ''}
            onChange={(e) => setFormData({ ...formData, dryingRh: parseInt(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>
        <div>
          <Label htmlFor="dryingTemp">Temperature</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              id="dryingTemp"
              value={formData.dryingTemp || ''}
              onChange={(e) => setFormData({ ...formData, dryingTemp: parseFloat(e.target.value) || undefined })}
              className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
            />
            <select
              value={formData.temperatureUnit}
              onChange={(e) => setFormData({ ...formData, temperatureUnit: e.target.value as TemperatureUnit })}
              className="w-24 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
            >
              {Object.values(TemperatureUnit).map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="estimatedDaysLeft">Estimated Days Left Till Dry</Label>
          <select
            id="estimatedDaysLeft"
            value={formData.estimatedDaysLeft || ''}
            onChange={(e) => setFormData({ ...formData, estimatedDaysLeft: parseInt(e.target.value) || undefined })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Days</option>
            {Array.from({ length: 16 }, (_, i) => i).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderTypeSpecificFields = () => {
    const logType = formData.logType as string;
    switch (logType) {
      case 'ENVIRONMENTAL':
        return renderEnvironmentalFields();
      case 'WATERING':
        return (
          <>
            {renderWateringFields()}
            {renderNutrientFields()}
            {renderAdditivesFields()}
          </>
        );
      case 'LST':
        return renderLSTFields();
      case 'HST':
        return renderHSTFields();
      case 'HARVEST':
        return renderHarvestFields();
      case 'DRYING':
        return renderDryingFields();
      case 'PEST_DISEASE':
        return renderHealthFields();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-dark-bg-secondary text-dark-text-primary">
        <DialogHeader>
          <DialogTitle>Create New Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logType">Log Type</Label>
              <select
                id="logType"
                value={formData.logType}
                onChange={(e) => setFormData({ ...formData, logType: e.target.value as LogType })}
                className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
              >
                {Object.values(LogType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as Stage })}
                className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
              >
                {Object.values(Stage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="logTitle">Title</Label>
              <Input
                id="logTitle"
                value={formData.logTitle}
                onChange={(e) => setFormData({ ...formData, logTitle: e.target.value })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
              />
            </div>
          </div>

          {renderLocationFields()}

          <div>
            <Label htmlFor="plants">Plants</Label>
            <MultiSelect
              value={formData.selectedPlants}
              onChange={(value) => setFormData({ ...formData, selectedPlants: value })}
              placeholder="Select plants"
              options={[]} // TODO: Add plant options
              className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            />
          </div>

          {renderTypeSpecificFields()}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-dark-bg-primary text-dark-text-primary border-dark-border min-h-[100px]"
            />
          </div>

          {/* TODO: Add image upload functionality */}

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-dark-bg-primary text-dark-text-primary border-dark-border hover:bg-dark-bg-hover"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-garden-600 text-white hover:bg-garden-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 