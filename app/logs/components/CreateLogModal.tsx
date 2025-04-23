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
  LightIntensityUnit, 
  DistanceUnit, 
  WeightUnit,
  VolumeUnit,
  TemperatureUnit,
  WaterSource,
  NutrientLine,
  Jacks321Product,
  PestType,
  PestCategory,
  DiseaseType,
  TreatmentMethod,
  TrainingMethod,
  SuspectedStressCause
} from '@/types/enums';

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
  par?: number;
  parUnit: LightIntensityUnit;
  ppfd?: number;
  lightIntensity?: number;
  lightIntensityUnit: LightIntensityUnit;
  lightHeight?: number;
  lightHeightUnit: DistanceUnit;
  airflow?: boolean;

  // Water & Feeding
  waterSource?: WaterSource;
  waterAmount?: number;
  waterUnit: VolumeUnit;
  waterTemperature?: number;
  waterTemperatureUnit: TemperatureUnit;
  waterPh?: number;
  runoffPh?: number;
  sourceWaterPpm?: number;
  waterPpm?: number;
  runoffPpm?: number;
  ppmScale: 'PPM_500' | 'PPM_700';
  nutrientLine?: NutrientLine;

  // Jack's 321
  jacks321Used: Jacks321Product[];
  jacks321Unit: 'GRAMS' | 'PPM';
  partAAmount?: number;
  partBAmount?: number;
  partCAmount?: number;
  boosterAmount?: number;
  finishAmount?: number;

  // Custom Nutrients
  customNutrients?: Record<string, any>;

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
  wetWeight?: number;
  wetWeightUnit: WeightUnit;
  dryWeight?: number;
  dryWeightUnit: WeightUnit;
  trimWeight?: number;
  trimWeightUnit: WeightUnit;

  // Drying & Curing
  dryingTemp?: number;
  dryingHumidity?: number;
  dryingDays?: number;
  curingDays?: number;

  // Soil/Medium
  mediumMoisture?: number;
  mediumTemp?: number;
  mediumPh?: number;
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
    parUnit: LightIntensityUnit.UMOL_PER_M2_S,
    lightIntensityUnit: LightIntensityUnit.UMOL_PER_M2_S,
    lightHeightUnit: DistanceUnit.CENTIMETERS,
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
    wetWeightUnit: WeightUnit.GRAMS,
    dryWeightUnit: WeightUnit.GRAMS,
    trimWeightUnit: WeightUnit.GRAMS,
    ppmScale: 'PPM_500',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        <Label htmlFor="vpd">VPD</Label>
        <Input
          type="number"
          id="vpd"
          value={formData.vpd || ''}
          onChange={(e) => setFormData({ ...formData, vpd: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="lightIntensity">Light Intensity</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            id="lightIntensity"
            value={formData.lightIntensity || ''}
            onChange={(e) => setFormData({ ...formData, lightIntensity: parseFloat(e.target.value) })}
            className="flex-1 bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
          <select
            value={formData.lightIntensityUnit}
            onChange={(e) => setFormData({ ...formData, lightIntensityUnit: e.target.value as LightIntensityUnit })}
            className="w-32 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(LightIntensityUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="airflow">Airflow</Label>
        <select
          id="airflow"
          value={formData.airflow ? 'true' : 'false'}
          onChange={(e) => setFormData({ ...formData, airflow: e.target.value === 'true' })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
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
        <Label htmlFor="waterPh">Water pH</Label>
        <Input
          type="number"
          id="waterPh"
          value={formData.waterPh || ''}
          onChange={(e) => setFormData({ ...formData, waterPh: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="runoffPh">Runoff pH</Label>
        <Input
          type="number"
          id="runoffPh"
          value={formData.runoffPh || ''}
          onChange={(e) => setFormData({ ...formData, runoffPh: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="ppmScale">PPM Scale</Label>
        <select
          id="ppmScale"
          value={formData.ppmScale}
          onChange={(e) => setFormData({ ...formData, ppmScale: e.target.value as 'PPM_500' | 'PPM_700' })}
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
        <Label htmlFor="waterPpm">Water PPM</Label>
        <Input
          type="number"
          id="waterPpm"
          value={formData.waterPpm || ''}
          onChange={(e) => setFormData({ ...formData, waterPpm: parseFloat(e.target.value) })}
          className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
        />
      </div>
      <div>
        <Label htmlFor="runoffPpm">Runoff PPM</Label>
        <Input
          type="number"
          id="runoffPpm"
          value={formData.runoffPpm || ''}
          onChange={(e) => setFormData({ ...formData, runoffPpm: parseFloat(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, jacks321Unit: e.target.value as 'GRAMS' | 'PPM' })}
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

  const renderTypeSpecificFields = () => {
    switch (formData.logType) {
      case LogType.ENVIRONMENTAL:
        return renderEnvironmentalFields();
      case LogType.WATERING:
        return (
          <>
            {renderWateringFields()}
            {renderNutrientFields()}
          </>
        );
      case LogType.PEST_DISEASE:
        return renderHealthFields();
      // Add cases for other log types
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