'use client';

import { useState, useEffect } from 'react';
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
  LightIntensityUnit,
  DetectionMethod,
  StressDuration,
  ExpectedRecoveryTime
} from '@/types/enums';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Custom number input component with emerald arrows
const CustomNumberInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  min,
  max,
  step
}: { 
  value: number | undefined;
  onChange: (value: number) => void; 
  placeholder: string; 
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    console.log('CustomNumberInput change:', inputValue);
    
    // Allow empty input or valid numbers including 0
    if (inputValue === '' || inputValue === '0') {
      onChange(0);
    } else {
      const newValue = parseFloat(inputValue);
      if (!isNaN(newValue)) {
        onChange(newValue);
      }
    }
  };

  const handleIncrement = () => {
    const currentValue = value || 0;
    const newValue = currentValue + 0.1;
    console.log('CustomNumberInput increment:', currentValue, '->', newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = value || 0;
    const newValue = Math.max(0, currentValue - 0.1);
    console.log('CustomNumberInput decrement:', currentValue, '->', newValue);
    onChange(newValue);
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        type="number"
        step={step || "0.1"}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value !== undefined && value !== null ? Number(value.toFixed(2)) : ''}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm bg-dark-bg-primary border border-dark-border rounded focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-button]:appearance-none"
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex items-center justify-center text-emerald-400 hover:text-emerald-300 p-1 pt-2"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex items-center justify-center text-emerald-400 hover:text-emerald-300 p-1 pb-2"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Types for form data
type PpmScale = 'PPM_500' | 'PPM_700';
type FanSpeed = 'LOW' | 'MEDIUM' | 'HIGH';
type VentilationType = 'CLOSED_LOOP' | 'EXHAUST_INTAKE';
type Jacks321Unit = 'GRAMS' | 'PPM';
type Intensity = 'LIGHT' | 'MODERATE' | 'INTENSE';
type Shape = 'EVEN' | 'SLOPED' | 'SUPER_UNEVEN';

type ContainerSize = 
  | 'AERO_CLONER'
  | 'SOLO_CUP'
  | 'CLONE'
  | 'HALF_GALLON'
  | 'ONE_GALLON'
  | 'TWO_GALLON'
  | 'TWO_HALF_GALLON'
  | 'THREE_GALLON'
  | 'FIVE_GALLON'
  | 'SEVEN_GALLON'
  | 'TEN_GALLON'
  | 'FIFTEEN_GALLON'
  | 'TWENTY_GALLON'
  | 'TWENTY_FIVE_GALLON'
  | 'THIRTY_GALLON'
  | 'FORTY_GALLON'
  | 'FORTY_FIVE_GALLON'
  | 'FIFTY_GALLON';

type SoilMoisture = 'DRY' | 'WET';

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

type InspectionMethod = 'NAKED_EYE' | 'MICROSCOPE' | 'MAGNIFYING_GLASS' | 'STICKY_TRAPS';

type AffectedArea = 
  | 'TOP_OF_PLANTS'
  | 'CANOPY_LAYER'
  | 'LEAF_UNDERSIDES'
  | 'UPPER_LEAVES'
  | 'LOWER_LEAVES'
  | 'NEW_GROWTH'
  | 'FAN_LEAVES'
  | 'SUGAR_LEAVES'
  | 'STEMS'
  | 'MAIN_STEM'
  | 'NODE_SITES'
  | 'MEDIUM_SURFACE'
  | 'POT_RIM'
  | 'ROOT_ZONE'
  | 'DRAINAGE_HOLES'
  | 'ENTIRE_PLANT'
  | 'NEARBY_PLANTS'
  | 'GROW_TENT_WALL'
  | 'LIGHT_FIXTURES'
  | 'HUMIDIFIER_DUCTS'
  | 'CLONING_EQUIPMENT'
  | 'WATER_RESERVOIR';

type LeafSymptom =
  | 'YELLOWING'
  | 'BROWNING_TIPS'
  | 'NECROTIC_SPOTS'
  | 'LEAF_CURLING'
  | 'WILTING'
  | 'EDGE_BURN'
  | 'LEAF_TWISTING'
  | 'INTERVEINAL_CHLOROSIS'
  | 'PURPLE_VEINS'
  | 'VARIEGATION'
  | 'LEAF_BLISTERING'
  | 'MOTTLED_COLOR'
  | 'LEAF_DROP'
  | 'LEAF_CUPPING'
  | 'GLOSSY_SURFACE'
  | 'PALE_NEW_GROWTH';

type PestIndicator =
  | 'VISIBLE_ADULTS'
  | 'EGGS_PRESENT'
  | 'LARVAE_IN_MEDIUM'
  | 'LEAF_MINING'
  | 'CHEW_HOLES'
  | 'FECAL_SPOTTING'
  | 'WEBBING'
  | 'SUDDEN_EXPLOSION'
  | 'POT_RIM_ACTIVITY'
  | 'LIGHT_HOVERING'
  | 'ROOT_DAMAGE'
  | 'HONEYDEW'
  | 'FRASS'
  | 'ANT_TRAILS';

type FungalSymptom =
  | 'POWDERY_MILDEW'
  | 'GREY_FUZZ'
  | 'WET_SPOTS'
  | 'YELLOW_HALOS'
  | 'SOFT_STEMS'
  | 'ROOT_SLIME'
  | 'RUST_SPOTS'
  | 'SEPTORIA'
  | 'LEAF_CANKERS'
  | 'STEM_SPLITTING'
  | 'BACTERIAL_OOZE'
  | 'SLIMY_BASE'
  | 'SUDDEN_COLLAPSE';

type StressSymptom =
  | 'STUNTED_GROWTH'
  | 'SLOW_RECOVERY'
  | 'PALE_COLOR'
  | 'UNEVEN_GROWTH'
  | 'ABNORMAL_SPACING'
  | 'BRITTLE_STEMS'
  | 'WEAK_BRANCHING'
  | 'UNEXPLAINED_DROP'
  | 'SCENT_CHANGE'
  | 'HEAT_STRESS'
  | 'LIGHT_BURN'
  | 'STRETCHING'
  | 'TIP_CURL'
  | 'OVER_TRANSPIRATION'
  | 'NUTRIENT_LOCKOUT';

type PestIdentificationStatus = 'SUSPECTED' | 'VERIFIED';

type IPMMethod = 
  | 'PHYTOSEIULUS_PERSIMILIS'
  | 'NEOSEIULUS_CALIFORNICUS'
  | 'AMBLYSEIUS_SWIRSKII'
  | 'AMBLYSEIUS_CUCUMERIS'
  | 'AMBLYSEIUS_ANDERSONI'
  | 'STRATIOLAELAPS_SCIMITUS'
  | 'ORIUS_INSIDIOSUS'
  | 'DALOTIA_CORIARIA'
  | 'CHRYSOPERLA_CARNEA'
  | 'APHIDIUS_COLEMANI'
  | 'LADYBUGS'
  | 'PRAYING_MANTIS'
  | 'BENEFICIAL_NEMATODES'
  | 'STICKY_TRAPS'
  | 'DIATOMACEOUS_EARTH'
  | 'NEEM_OIL'
  | 'INSECTICIDAL_SOAP'
  | 'COMPANION_PLANTING'
  | 'ENVIRONMENTAL_ADJUSTMENTS'
  | 'PHYSICAL_BARRIERS'
  | 'PRUNING_REMOVAL'
  | 'QUARANTINE_MEASURES';

type TreatmentProduct = 
  | 'NEEM_OIL'
  | 'INSECTICIDAL_SOAP'
  | 'SULFUR_SPRAY'
  | 'COPPER_FUNGICIDE'
  | 'BACILLUS_THURINGIENSIS'
  | 'SPINOSAD'
  | 'AZAMAX'
  | 'GREEN_CLEANER'
  | 'REGALIA'
  | 'PLANT_THERAPY'
  | 'LOST_COAST'
  | 'MONTEREY_BT'
  | 'TRIFECTA'
  | 'DR_ZYMES'
  | 'ATHENA_IPM'
  | 'OTHER';

type ApplicationMethod =
  | 'FOLIAR_SPRAY'
  | 'ROOT_DRENCH'
  | 'SOIL_APPLICATION'
  | 'SPOT_TREATMENT'
  | 'SYSTEMIC_APPLICATION'
  | 'BARRIER_APPLICATION'
  | 'BENEFICIAL_RELEASE'
  | 'ENVIRONMENTAL_CONTROL';

type ApplicationTiming =
  | 'LIGHTS_ON'
  | 'LIGHTS_OFF'
  | 'BEFORE_LIGHTS_ON'
  | 'AFTER_LIGHTS_OFF'
  | 'DURING_DARK_PERIOD'
  | 'DURING_LIGHT_PERIOD';

type Coverage =
  | 'FULL_PLANT'
  | 'TOP_CANOPY'
  | 'LOWER_CANOPY'
  | 'LEAF_UNDERSIDES'
  | 'GROWING_TIPS'
  | 'PROBLEM_AREAS'
  | 'ROOT_ZONE'
  | 'GROWING_MEDIUM';

type TreatmentType = 
  | 'FOLIAR_SPRAY'
  | 'DUNK'
  | 'SYSTEMIC_APPLICATION'
  | 'PREDATOR_RELEASE'
  | 'SOIL_AMENDMENT'
  | 'ROOT_DRENCH'
  | 'OTHER';

type FoliarSprayProduct =
  | 'NUKEM'
  | 'NEEM_OIL'
  | 'INSECTICIDAL_SOAP'
  | 'ESSENTIAL_OILS'
  | 'LOST_COAST'
  | 'CAPTAIN_JACKS'
  | 'H2O2_SOLUTIONS'
  | 'BAKING_SODA'
  | 'OTHER';

type BCAPredatorType =
  | 'PERSIMILIS'
  | 'CALIFORNICUS'
  | 'PIRATE_BUG'
  | 'SWIRSKII'
  | 'CUCUMERIS'
  | 'NEMATODES'
  | 'LADY_BEETLES'
  | 'GREEN_LACEWING'
  | 'ROVE_BEETLES'
  | 'HYPOSASPIS_MILES'
  | 'OTHER';

type CoverageMethod =
  | 'HAND_PUMP_SPRAYER'
  | 'FOGGER'
  | 'ATOMIZER_SPRAYER'
  | 'SPRAY_BOTTLE'
  | 'DUNK'
  | 'ROOT_DRENCH'
  | 'OTHER';

type TreatmentAdditive =
  | 'INSECTICIDAL_SOAP'
  | 'EMULSIFIER_SOAP'
  | 'PH_UP'
  | 'PH_DOWN';

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

// Add these types near the other type definitions at the top
type GerminationMethod = 
  | 'PAPER_TOWEL'
  | 'DIRECT_SOIL'
  | 'SOAK_THEN_SOIL'
  | 'PLUGS_OR_CUBES'
  | 'ROCKWOOL'
  | 'PROPAGATOR'
  | 'OTHER';

type GerminationStatus = 
  | 'NOT_STARTED'
  | 'PENDING'
  | 'TAPROOTED'
  | 'FAILED'
  | 'ADDED_MOISTURE'
  | 'SPROUTED';

type CloningMethod = 
  | 'AEROPONIC_CLONER'
  | 'PLUGS'
  | 'ROCKWOOL'
  | 'MEDIUM_DIRECT'
  | 'WATER_ONLY'
  | 'OTHER';

type CloningAdditive =
  | 'ROOTING_GEL'
  | 'ROOTING_POWDER'
  | 'HONEY'
  | 'ALOE'
  | 'OTHER';

type CutType =
  | 'TOP_CUT'
  | 'MID_CUT'
  | 'LOWER_BRANCH'
  | 'FAN_LEAF_NODE'
  | 'MULTI_NODE_CUT'
  | 'OTHER';

type LightType =
  | 'LED'
  | 'HPS'
  | 'CMH'
  | 'MH'
  | 'FLUORESCENT'
  | 'OTHER';

type SanitationMethod =
  | 'FIRE'
  | 'ALCOHOL'
  | 'SOAP'
  | 'BLEACH'
  | 'AUTOCLAVE'
  | 'PRESSURE_COOKER'
  | 'BOILED_WATER'
  | 'OTHER';

interface FormData {
  // Basic Info
  logType: LogType;
  stage: Stage;
  datetime: string; // ISO local datetime string (e.g., '2025-05-27T16:15')
  logTitle: string;
  notes: string;
  imageUrls: string[];
  stressCause?: SuspectedStressCause;

  // Location
  gardenId?: string;
  roomId?: string;
  zoneId?: string;
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
  // Additional Jack's fields
  epsomAmount?: number;
  bloomAmount?: number;
  // Jack's PPM values
  partAPpm?: number;
  partBPpm?: number;
  epsomPpm?: number;
  bloomPpm?: number;
  finishPpm?: number;

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
  detectionMethods: DetectionMethod[];
  stressDuration?: StressDuration;
  suspectedCause?: string;
  recoveryActions?: string;
  expectedRecoveryTime?: ExpectedRecoveryTime;

  // Treatment
  treatmentMethods: TreatmentMethod[];
  treatmentProducts: TreatmentProduct[];
  applicationMethod?: ApplicationMethod;
  applicationTiming?: ApplicationTiming;
  coverage?: Coverage;
  treatmentDosage?: number;
  treatmentDosageUnit?: string;
  sprayPressure?: number;
  sprayDistance?: number;
  sprayDistanceUnit?: DistanceUnit;
  mixingRatio?: string;
  phAdjusted?: boolean;
  finalSprayPh?: number;
  waterTemp?: number;
  waterTempUnit?: TemperatureUnit;
  reentry?: number; // Hours until safe reentry
  repeatIn?: number; // Days until next application
  tankMixProducts?: string[];

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
  // Tea Brewer fields
  teaBrewSize?: number;
  teaWaterTemp?: number;
  teaGrowthStage?: string;
  teaEarthwormCastings?: string;
  teaFishKelpExtract?: string;
  teaMolasses?: string;
  teaBrewDuration?: string;

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

  // Pest & Disease Inspection
  inspectionMethod?: InspectionMethod;
  affectedAreas: AffectedArea[];
  leafSymptoms: LeafSymptom[];
  pestIndicators: PestIndicator[];
  fungalSymptoms: FungalSymptom[];
  stressSymptoms: StressSymptom[];
  pestIdentificationStatus?: PestIdentificationStatus;
  pestConfidenceLevel?: number;

  // IPM Methods
  ipmMethods: IPMMethod[];

  // Transplant Fields
  transplantFromSize?: ContainerSize;
  transplantToSize?: ContainerSize;
  soilMoisture?: SoilMoisture;

  // Transfer Fields
  destinationGardenId?: string;
  destinationRoomId?: string;
  destinationZoneId?: string;

  // Germination Fields
  germinationMethod?: GerminationMethod;
  germinationStatus?: GerminationStatus;
  germinationRh?: number;
  germinationTemp?: number;
  daysToSprout?: number;

  // Cloning Fields
  cloningMethod?: CloningMethod;
  cloningAdditives: CloningAdditive[];
  cutType?: CutType;
  cloningRh?: number;
  cloningTemp?: number;
  lightHoursPerDay?: number;
  lightType?: LightType;
  domeUsed: boolean;
  ventsOpened: boolean;
  ventsClosed: boolean;
  domeRemoved: boolean;
  sanitationMethod?: SanitationMethod;
  cloneGardenId?: string;
  cloneRoomId?: string;
  cloneZoneId?: string;

  // Treatment Fields
  treatmentType?: TreatmentType;
  foliarSprayProducts: FoliarSprayProduct[];
  bcaPredatorTypes: BCAPredatorType[];
  releaseCount?: number;
  bcaAcclimation: boolean;
  targetPests: PestType[];
  coverageMethod?: CoverageMethod;
  treatmentPh?: number;
  treatmentAdditives: TreatmentAdditive[];

  // Water Temperature
  sourceWaterTemperature?: number;
  sourceWaterTemperatureUnit?: TemperatureUnit;
  nutrientWaterTemperature?: number;
  nutrientWaterTemperatureUnit?: TemperatureUnit;
}

interface CreateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  initialValues?: {
    gardenId?: string;
    roomId?: string;
    zoneId?: string;
    selectedPlants?: string[];
    logType?: LogType;
    stage?: Stage;
    logTitle?: string;
    notes?: string;
    waterAmount?: number;
    waterUnit?: VolumeUnit;
    sourceWaterPh?: number;
    nutrientWaterPh?: number;
    sourceWaterPpm?: number;
    nutrientWaterPpm?: number;
    ppmScale?: PpmScale;
    sourceWaterTemperature?: number;
    nutrientWaterTemperature?: number;
    jacks321Used?: Jacks321Product[];
    jacks321Unit?: Jacks321Unit;
    partAAmount?: number;
    partBAmount?: number;
    epsomAmount?: number;
    bloomAmount?: number;
    finishAmount?: number;
    // Jack's PPM values
    partAPpm?: number;
    partBPpm?: number;
    epsomPpm?: number;
    bloomPpm?: number;
    finishPpm?: number;
    // Tea Brewer fields
    teaBrewSize?: number;
    teaWaterTemp?: number;
    teaGrowthStage?: string;
    teaEarthwormCastings?: string;
    teaFishKelpExtract?: string;
    teaMolasses?: string;
    teaBrewDuration?: string;
  };
}

// Utility to robustly parse and display log dates in local time
export function formatLogDate(date: string | Date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function CreateLogModal({ isOpen, onClose, userId, onSuccess, initialValues }: CreateLogModalProps) {
  const [formData, setFormData] = useState<FormData>({
    logType: initialValues?.logType || LogType.EQUIPMENT,
    stage: initialValues?.stage || Stage.VEGETATIVE,
    datetime: (() => {
      const d = new Date();
      d.setSeconds(0, 0); // Remove seconds/milliseconds for input compatibility
      return d.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
    })(),
    logTitle: initialValues?.logTitle || '',
    notes: initialValues?.notes || '',
    imageUrls: [],
    selectedPlants: initialValues?.selectedPlants || [], // This will be used for both regular plant selection and mother plants in cloning
    temperatureUnit: TemperatureUnit.CELSIUS,
    fanSpeed: 'MEDIUM',
    ventilationType: 'CLOSED_LOOP',
    waterUnit: initialValues?.waterUnit || VolumeUnit.MILLILITERS,
    waterTemperatureUnit: TemperatureUnit.CELSIUS,
    heightUnit: DistanceUnit.CENTIMETERS,
    widthUnit: DistanceUnit.CENTIMETERS,
    estimatedYieldUnit: WeightUnit.GRAMS,
    jacks321Used: initialValues?.jacks321Used || [],
    jacks321Unit: initialValues?.jacks321Unit || 'GRAMS',
    pestTypes: [],
    pestCategories: [],
    diseaseTypes: [],
    deficiencies: [],
    treatmentMethods: [],
    treatmentProducts: [],
    trainingMethods: [],
    trimAmountUnit: WeightUnit.GRAMS,
    ppmScale: initialValues?.ppmScale || 'PPM_500',
    supportedPlants: [],
    trainingGoals: [],
    affectedAreas: [],
    leafSymptoms: [],
    pestIndicators: [],
    fungalSymptoms: [],
    stressSymptoms: [],
    ipmMethods: [],
    cloningAdditives: [],
    domeUsed: false,
    ventsOpened: false,
    ventsClosed: false,
    domeRemoved: false,
    cloneGardenId: '',
    cloneRoomId: '',
    cloneZoneId: '',
    treatmentType: 'FOLIAR_SPRAY',
    foliarSprayProducts: [],
    bcaPredatorTypes: [],
    bcaAcclimation: false,
    targetPests: [],
    coverageMethod: 'HAND_PUMP_SPRAYER',
    treatmentPh: 7.0,
    treatmentAdditives: [],
    detectionMethods: [],
    sourceWaterTemperatureUnit: TemperatureUnit.CELSIUS,
    nutrientWaterTemperatureUnit: TemperatureUnit.CELSIUS,
    // Water & Feeding fields
    waterAmount: initialValues?.waterAmount,
    sourceWaterPh: initialValues?.sourceWaterPh,
    nutrientWaterPh: initialValues?.nutrientWaterPh,
    sourceWaterPpm: initialValues?.sourceWaterPpm,
    nutrientWaterPpm: initialValues?.nutrientWaterPpm,
    sourceWaterTemperature: initialValues?.sourceWaterTemperature,
    nutrientWaterTemperature: initialValues?.nutrientWaterTemperature,
    // Jack's 321 fields
    partAAmount: initialValues?.partAAmount,
    partBAmount: initialValues?.partBAmount,
    epsomAmount: initialValues?.epsomAmount,
    bloomAmount: initialValues?.bloomAmount,
    finishAmount: initialValues?.finishAmount,
    partAPpm: initialValues?.partAPpm,
    partBPpm: initialValues?.partBPpm,
    epsomPpm: initialValues?.epsomPpm,
    bloomPpm: initialValues?.bloomPpm,
    finishPpm: initialValues?.finishPpm,
    teaBrewSize: initialValues?.teaBrewSize,
    teaWaterTemp: initialValues?.teaWaterTemp,
    teaGrowthStage: initialValues?.teaGrowthStage,
    teaEarthwormCastings: initialValues?.teaEarthwormCastings,
    teaFishKelpExtract: initialValues?.teaFishKelpExtract,
    teaMolasses: initialValues?.teaMolasses,
    teaBrewDuration: initialValues?.teaBrewDuration,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Replace locations state with separate states
  const [gardens, setGardens] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [plants, setPlants] = useState<{ id: string; name: string }[]>([]);

  // Fetch gardens on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/gardens')
        .then(res => res.json())
        .then(setGardens)
        .then(() => {
          // If we have initial values, set them up
          if (initialValues) {
            if (initialValues.gardenId) {
              handleGardenChange(initialValues.gardenId);
            }
          }
        });
    }
  }, [isOpen, initialValues?.gardenId]);

  // Update form data when initial values change (for calculator integration)
  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData(prevData => ({
        ...prevData,
        logType: initialValues.logType || prevData.logType,
        stage: initialValues.stage || prevData.stage,
        logTitle: initialValues.logTitle || prevData.logTitle,
        notes: initialValues.notes || prevData.notes,
        waterAmount: initialValues.waterAmount,
        waterUnit: initialValues.waterUnit || prevData.waterUnit,
        sourceWaterPh: initialValues.sourceWaterPh,
        nutrientWaterPh: initialValues.nutrientWaterPh,
        sourceWaterPpm: initialValues.sourceWaterPpm,
        nutrientWaterPpm: initialValues.nutrientWaterPpm,
        ppmScale: initialValues.ppmScale || prevData.ppmScale,
        sourceWaterTemperature: initialValues.sourceWaterTemperature,
        nutrientWaterTemperature: initialValues.nutrientWaterTemperature,
        jacks321Used: initialValues.jacks321Used || prevData.jacks321Used,
        jacks321Unit: initialValues.jacks321Unit || prevData.jacks321Unit,
        partAAmount: initialValues.partAAmount,
        partBAmount: initialValues.partBAmount,
        epsomAmount: initialValues.epsomAmount,
        bloomAmount: initialValues.bloomAmount,
        finishAmount: initialValues.finishAmount,
        partAPpm: initialValues.partAPpm,
        partBPpm: initialValues?.partBPpm,
        epsomPpm: initialValues.epsomPpm,
        bloomPpm: initialValues.bloomPpm,
        finishPpm: initialValues.finishPpm,
        teaBrewSize: initialValues?.teaBrewSize || prevData.teaBrewSize,
        teaWaterTemp: initialValues?.teaWaterTemp || prevData.teaWaterTemp,
        teaGrowthStage: initialValues?.teaGrowthStage || prevData.teaGrowthStage,
        teaEarthwormCastings: initialValues?.teaEarthwormCastings || prevData.teaEarthwormCastings,
        teaFishKelpExtract: initialValues?.teaFishKelpExtract || prevData.teaFishKelpExtract,
        teaMolasses: initialValues?.teaMolasses || prevData.teaMolasses,
        teaBrewDuration: initialValues?.teaBrewDuration || prevData.teaBrewDuration,
      }));
    }
  }, [isOpen, initialValues]);

  const handleGardenChange = (gardenId: string) => {
    setFormData({ ...formData, gardenId, roomId: '', zoneId: '', selectedPlants: [] });
    fetch(`/api/gardens/${gardenId}/rooms`)
      .then(res => res.json())
      .then(setRooms);
    setZones([]);
    setPlants([]);
  };

  const handleRoomChange = (roomId: string) => {
    setFormData({ ...formData, roomId, zoneId: '', selectedPlants: [] });
    fetch(`/api/gardens/${formData.gardenId}/rooms/${roomId}/zones`)
      .then(res => res.json())
      .then(setZones);
    setPlants([]);
  };

  const handleZoneChange = (zoneId: string) => {
    setFormData({ ...formData, zoneId, selectedPlants: [] });
    fetch(`/api/gardens/${formData.gardenId}/rooms/${formData.roomId}/zones/${zoneId}/plants`)
      .then(res => res.json())
      .then(setPlants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      
      // If no specific plants are selected and we have a zone, create logs for all plants in the zone
      let plantsToLog = formData.selectedPlants;
      
      if (plantsToLog.length === 0 && formData.zoneId) {
        console.log('No plants selected, fetching zone plants...');
        // Get all plants in the zone
        const zonePlantsResponse = await fetch(`/api/gardens/${formData.gardenId}/rooms/${formData.roomId}/zones/${formData.zoneId}/plants`);
        if (zonePlantsResponse.ok) {
          const zonePlants = await zonePlantsResponse.json();
          plantsToLog = zonePlants.map((plant: any) => plant.id);
          console.log('Found zone plants:', plantsToLog);
        }
      }

      // If still no plants, create a zone-level log
      if (plantsToLog.length === 0) {
        console.log('Creating zone-level log...');
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            userId,
            plants: [] // Zone-level log
          }),
        });

        console.log('Zone-level log response:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Zone-level log error:', errorText);
          throw new Error(`Failed to create log: ${errorText}`);
        }
      } else {
        // Create logs for each selected plant
        console.log('Creating logs for plants:', plantsToLog);
        const logPromises = plantsToLog.map(plantId => 
          fetch('/api/logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              userId,
              selectedPlants: [plantId]
            }),
          })
        );

        const responses = await Promise.all(logPromises);
        const failedResponses = responses.filter(response => !response.ok);
        
        if (failedResponses.length > 0) {
          console.error('Failed responses:', failedResponses);
          const errorTexts = await Promise.all(failedResponses.map(r => r.text()));
          console.error('Error texts:', errorTexts);
          throw new Error('Failed to create some logs');
        }
      }

      console.log('Log creation successful');
      toast({
        title: 'Success',
        description: plantsToLog.length > 1 ? `Created logs for ${plantsToLog.length} plants` : 'Log created successfully',
      });

      onClose();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Log creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create log',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="garden">Garden</Label>
          <select
            id="garden"
            value={formData.gardenId || ''}
            onChange={e => handleGardenChange(e.target.value)}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
          >
            <option value="">Select Garden</option>
            {gardens.map((garden: any) => (
              <option key={garden.id} value={garden.id}>{garden.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="room">Room</Label>
          <select
            id="room"
            value={formData.roomId || ''}
            onChange={e => handleRoomChange(e.target.value)}
            disabled={!formData.gardenId}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
          >
            <option value="">Select Room</option>
            {rooms.map((room: any) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="zone">Zone</Label>
          <select
            id="zone"
            value={formData.zoneId || ''}
            onChange={e => handleZoneChange(e.target.value)}
            disabled={!formData.roomId}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
          >
            <option value="">Select Zone</option>
            {zones.map((zone: any) => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
      </div>
      {formData.logType === 'CLONING' && (
        <p className="text-sm text-dark-text-secondary italic">
          ℹ️ Use these location fields to select the mother plant(s) you are taking cuttings from. Create one entry per mother plant.
        </p>
      )}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <CustomNumberInput
            value={formData.waterAmount}
            onChange={(value) => setFormData({ ...formData, waterAmount: value })}
            placeholder="Enter amount"
            className="flex-1 bg-dark-bg-primary text-dark-text-primary"
          />
          <select
            value={formData.waterUnit}
            onChange={(e) => setFormData({ ...formData, waterUnit: e.target.value as VolumeUnit })}
            className="w-20 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary"
          >
            {Object.values(VolumeUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="sourceWaterPh">Source Water pH</Label>
        <CustomNumberInput
          value={formData.sourceWaterPh}
          onChange={(value) => setFormData({ ...formData, sourceWaterPh: value })}
          placeholder="Enter pH value"
          className="bg-dark-bg-primary text-dark-text-primary"
        />
      </div>
      <div>
        <Label htmlFor="nutrientWaterPh">Nutrient Water pH</Label>
        <CustomNumberInput
          value={formData.nutrientWaterPh}
          onChange={(value) => setFormData({ ...formData, nutrientWaterPh: value })}
          placeholder="Enter pH value"
          className="bg-dark-bg-primary text-dark-text-primary"
        />
      </div>
      <div className="col-span-1 sm:col-span-2">
        <Label htmlFor="ppmScale">PPM Scale</Label>
        <select
          id="ppmScale"
          value={formData.ppmScale}
          onChange={(e) => setFormData({ ...formData, ppmScale: e.target.value as PpmScale })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="PPM_500">PPM 500 Scale (0.5 EC)</option>
          <option value="PPM_700">PPM 700 Scale (0.7 EC)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="sourceWaterPpm">Source Water PPM</Label>
        <CustomNumberInput
          value={formData.sourceWaterPpm}
          onChange={(value) => setFormData({ ...formData, sourceWaterPpm: value })}
          placeholder="Enter PPM value"
          className="bg-dark-bg-primary text-dark-text-primary"
        />
      </div>
      <div>
        <Label htmlFor="nutrientWaterPpm">Nutrient Water PPM</Label>
        <CustomNumberInput
          value={formData.nutrientWaterPpm}
          onChange={(value) => setFormData({ ...formData, nutrientWaterPpm: value })}
          placeholder="Enter PPM value"
          className="bg-dark-bg-primary text-dark-text-primary"
        />
      </div>
      <div>
        <Label htmlFor="sourceWaterTemperature">Source Water Temperature</Label>
        <div className="flex gap-2">
          <CustomNumberInput
            value={formData.sourceWaterTemperature}
            onChange={(value) => setFormData({ ...formData, sourceWaterTemperature: value })}
            placeholder="Enter temperature"
            className="flex-1 bg-dark-bg-primary text-dark-text-primary"
          />
          <select
            value={formData.sourceWaterTemperatureUnit || TemperatureUnit.CELSIUS}
            onChange={(e) => setFormData({ ...formData, sourceWaterTemperatureUnit: e.target.value as TemperatureUnit })}
            className="w-20 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {Object.values(TemperatureUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="nutrientWaterTemperature">Nutrient Water Temperature</Label>
        <div className="flex gap-2">
          <CustomNumberInput
            value={formData.nutrientWaterTemperature}
            onChange={(value) => setFormData({ ...formData, nutrientWaterTemperature: value })}
            placeholder="Enter temperature"
            className="flex-1 bg-dark-bg-primary text-dark-text-primary"
          />
          <select
            value={formData.nutrientWaterTemperatureUnit || TemperatureUnit.CELSIUS}
            onChange={(e) => setFormData({ ...formData, nutrientWaterTemperatureUnit: e.target.value as TemperatureUnit })}
            className="w-20 rounded-md border border-dark-border bg-dark-bg-primary px-2 py-2 text-sm text-dark-text-primary focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {Object.values(TemperatureUnit).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
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
          {/* Commented out PPM dropdown - forcing grams for Jack's 321
          <div>
            <Label htmlFor="jacks321Unit">Measurement Unit</Label>
            <select
              id="jacks321Unit"
              value={formData.jacks321Unit}
              onChange={(e) => handleUnitChange(e.target.value as Jacks321Unit)}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="GRAMS">Grams</option>
              <option value="PPM">PPM</option>
            </select>
          </div>
          */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partAAmount">Part A (5-12-26) (g)</Label>
              <CustomNumberInput
                value={formData.partAAmount}
                onChange={(value) => setFormData({ ...formData, partAAmount: value })}
                placeholder="Enter amount in grams"
                className="bg-dark-bg-primary text-dark-text-primary"
              />
              {formData.partAPpm && (
                <p className="text-xs text-dark-text-secondary mt-1">PPM: {formData.partAPpm.toFixed(1)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="partBAmount">Part B (Calcium Nitrate) (g)</Label>
              <CustomNumberInput
                value={formData.partBAmount}
                onChange={(value) => setFormData({ ...formData, partBAmount: value })}
                placeholder="Enter amount in grams"
                className="bg-dark-bg-primary text-dark-text-primary"
              />
              {formData.partBPpm && (
                <p className="text-xs text-dark-text-secondary mt-1">PPM: {formData.partBPpm.toFixed(1)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="finishAmount">Finish (g)</Label>
              <CustomNumberInput
                value={formData.finishAmount}
                onChange={(value) => setFormData({ ...formData, finishAmount: value })}
                placeholder="Enter amount in grams"
                className="bg-dark-bg-primary text-dark-text-primary"
              />
              {formData.finishPpm && (
                <p className="text-xs text-dark-text-secondary mt-1">PPM: {formData.finishPpm.toFixed(1)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="epsomAmount">Epsom Salt (g)</Label>
              <CustomNumberInput
                value={formData.epsomAmount}
                onChange={(value) => setFormData({ ...formData, epsomAmount: value })}
                placeholder="Enter amount in grams"
                className="bg-dark-bg-primary text-dark-text-primary"
              />
              {formData.epsomPpm && (
                <p className="text-xs text-dark-text-secondary mt-1">PPM: {formData.epsomPpm.toFixed(1)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bloomAmount">Bloom Booster (g)</Label>
              <CustomNumberInput
                value={formData.bloomAmount}
                onChange={(value) => setFormData({ ...formData, bloomAmount: value })}
                placeholder="Enter amount in grams"
                className="bg-dark-bg-primary text-dark-text-primary"
              />
              {formData.bloomPpm && (
                <p className="text-xs text-dark-text-secondary mt-1">PPM: {formData.bloomPpm.toFixed(1)}</p>
              )}
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
          <CustomNumberInput
            value={formData.aspirinAmount}
            onChange={(value) => setFormData({ ...formData, aspirinAmount: value })}
            placeholder="mg per gallon"
            className="bg-dark-bg-primary border-dark-border"
            min={0}
            step={0.1}
          />
        </div>
        <div>
          <Label htmlFor="nukemAmount">Nukem Root Drench</Label>
          <CustomNumberInput
            value={formData.nukemAmount}
            onChange={(value) => setFormData({ ...formData, nukemAmount: value })}
            placeholder="ml"
            className="bg-dark-bg-primary border-dark-border"
            min={0}
            step={0.1}
          />
        </div>
        <div>
          <Label htmlFor="oxiphosAmount">Oxiphos</Label>
          <CustomNumberInput
            value={formData.oxiphosAmount}
            onChange={(value) => setFormData({ ...formData, oxiphosAmount: value })}
            placeholder="ml"
            className="bg-dark-bg-primary border-dark-border"
            min={0}
            step={0.1}
          />
        </div>
        <div>
          <Label htmlFor="seagreenAmount">SeaGreen</Label>
          <CustomNumberInput
            value={formData.seagreenAmount}
            onChange={(value) => setFormData({ ...formData, seagreenAmount: value })}
            placeholder="ml"
            className="bg-dark-bg-primary border-dark-border"
            min={0}
            step={0.1}
          />
        </div>
        <div>
          <Label htmlFor="teaBrewSize">Tea Brewer Size (gallons)</Label>
          <CustomNumberInput
            value={formData.teaBrewSize}
            onChange={(value) => setFormData({ ...formData, teaBrewSize: value })}
            placeholder="Enter brew size"
            className="bg-dark-bg-primary border-dark-border"
            min={1}
            step={1}
          />
        </div>
        <div>
          <Label htmlFor="teaWaterTemp">Tea Water Temperature</Label>
          <CustomNumberInput
            value={formData.teaWaterTemp}
            onChange={(value) => setFormData({ ...formData, teaWaterTemp: value })}
            placeholder="Enter water temperature"
            className="bg-dark-bg-primary border-dark-border"
            min={50}
            max={90}
            step={1}
          />
        </div>
        <div>
          <Label htmlFor="teaGrowthStage">Tea Growth Stage</Label>
          <Input
            type="text"
            id="teaGrowthStage"
            value={formData.teaGrowthStage || ''}
            onChange={(e) => setFormData({ ...formData, teaGrowthStage: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Enter growth stage"
          />
        </div>
        <div>
          <Label htmlFor="teaEarthwormCastings">Tea Earthworm Castings</Label>
          <Input
            type="text"
            id="teaEarthwormCastings"
            value={formData.teaEarthwormCastings || ''}
            onChange={(e) => setFormData({ ...formData, teaEarthwormCastings: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Enter earthworm castings"
          />
        </div>
        <div>
          <Label htmlFor="teaFishKelpExtract">Tea Fish Kelp Extract</Label>
          <Input
            type="text"
            id="teaFishKelpExtract"
            value={formData.teaFishKelpExtract || ''}
            onChange={(e) => setFormData({ ...formData, teaFishKelpExtract: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Enter fish kelp extract"
          />
        </div>
        <div>
          <Label htmlFor="teaMolasses">Tea Molasses</Label>
          <Input
            type="text"
            id="teaMolasses"
            value={formData.teaMolasses || ''}
            onChange={(e) => setFormData({ ...formData, teaMolasses: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Enter molasses"
          />
        </div>
        <div>
          <Label htmlFor="teaBrewDuration">Tea Brew Duration</Label>
          <Input
            type="text"
            id="teaBrewDuration"
            value={formData.teaBrewDuration || ''}
            onChange={(e) => setFormData({ ...formData, teaBrewDuration: e.target.value })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            placeholder="Enter brew duration"
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
        <Label htmlFor="inspectionMethod">Method Inspected</Label>
        <select
          id="inspectionMethod"
          value={formData.inspectionMethod || ''}
          onChange={(e) => setFormData({ ...formData, inspectionMethod: e.target.value as InspectionMethod })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="">Select Method</option>
          <option value="NAKED_EYE">Naked Eye</option>
          <option value="MICROSCOPE">Microscope</option>
          <option value="MAGNIFYING_GLASS">Magnifying Glass</option>
          <option value="STICKY_TRAPS">Sticky Traps</option>
        </select>
      </div>

      <div>
        <Label>Area of Plant Most Affected</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'TOP_OF_PLANTS', label: 'Top of Plants' },
            { value: 'CANOPY_LAYER', label: 'Canopy Layer (General)' },
            { value: 'LEAF_UNDERSIDES', label: 'Underside of Leaves' },
            { value: 'UPPER_LEAVES', label: 'Upper Leaves' },
            { value: 'LOWER_LEAVES', label: 'Lower Leaves' },
            { value: 'NEW_GROWTH', label: 'New Growth / Shoots' },
            { value: 'FAN_LEAVES', label: 'Fan Leaves' },
            { value: 'SUGAR_LEAVES', label: 'Sugar Leaves' },
            { value: 'STEMS', label: 'Stems' },
            { value: 'MAIN_STEM', label: 'Main Stem / Trunk' },
            { value: 'NODE_SITES', label: 'Node Sites' },
            { value: 'MEDIUM_SURFACE', label: 'Medium / Soil Surface' },
            { value: 'POT_RIM', label: 'Inside Pot Rim' },
            { value: 'ROOT_ZONE', label: 'Root Zone' },
            { value: 'DRAINAGE_HOLES', label: 'Drainage Holes' },
            { value: 'ENTIRE_PLANT', label: 'Entire Plant (Systemic)' },
            { value: 'NEARBY_PLANTS', label: 'Nearby Plants (Spread Potential)' },
            { value: 'GROW_TENT_WALL', label: 'Grow Tent Wall / Surface' },
            { value: 'LIGHT_FIXTURES', label: 'Light Fixtures / Hanging Gear' },
            { value: 'HUMIDIFIER_DUCTS', label: 'Humidifier / Ducts' },
            { value: 'CLONING_EQUIPMENT', label: 'Cloning Tray or Dome' },
            { value: 'WATER_RESERVOIR', label: 'Water Reservoir (Hydro)' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`area-${value}`}
                checked={formData.affectedAreas.includes(value as AffectedArea)}
                onChange={(e) => {
                  const areas = e.target.checked
                    ? [...formData.affectedAreas, value as AffectedArea]
                    : formData.affectedAreas.filter(a => a !== value);
                  setFormData({ ...formData, affectedAreas: areas });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`area-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>🍃 Leaf Symptoms</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'YELLOWING', label: 'Yellowing (Chlorosis)' },
            { value: 'BROWNING_TIPS', label: 'Browning tips (Nutrient burn)' },
            { value: 'NECROTIC_SPOTS', label: 'Necrotic spots' },
            { value: 'LEAF_CURLING', label: 'Leaf curling (upward or downward)' },
            { value: 'WILTING', label: 'Wilting / Drooping' },
            { value: 'EDGE_BURN', label: 'Edge burn / crisping' },
            { value: 'LEAF_TWISTING', label: 'Leaf twisting' },
            { value: 'INTERVEINAL_CHLOROSIS', label: 'Interveinal chlorosis' },
            { value: 'PURPLE_VEINS', label: 'Purpling of veins or stems' },
            { value: 'VARIEGATION', label: 'Variegation' },
            { value: 'LEAF_BLISTERING', label: 'Leaf blistering' },
            { value: 'MOTTLED_COLOR', label: 'Mottled leaf color' },
            { value: 'LEAF_DROP', label: 'Leaf drop (early or aggressive)' },
            { value: 'LEAF_CUPPING', label: 'Leaf cupping' },
            { value: 'GLOSSY_SURFACE', label: 'Glossy leaf surface' },
            { value: 'PALE_NEW_GROWTH', label: 'Pale new growth' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`leaf-${value}`}
                checked={formData.leafSymptoms.includes(value as LeafSymptom)}
                onChange={(e) => {
                  const symptoms = e.target.checked
                    ? [...formData.leafSymptoms, value as LeafSymptom]
                    : formData.leafSymptoms.filter(s => s !== value);
                  setFormData({ ...formData, leafSymptoms: symptoms });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`leaf-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>🪱 Pest Indicators</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'VISIBLE_ADULTS', label: 'Visible adults (flying or crawling)' },
            { value: 'EGGS_PRESENT', label: 'Eggs on leaves or stems' },
            { value: 'LARVAE_IN_MEDIUM', label: 'Larvae in medium' },
            { value: 'LEAF_MINING', label: 'Leaf mining trails' },
            { value: 'CHEW_HOLES', label: 'Chew holes' },
            { value: 'FECAL_SPOTTING', label: 'Fecal spotting' },
            { value: 'WEBBING', label: 'Webbing (silk threads)' },
            { value: 'SUDDEN_EXPLOSION', label: 'Sudden pest explosion' },
            { value: 'POT_RIM_ACTIVITY', label: 'Crawling on pot rim' },
            { value: 'LIGHT_HOVERING', label: 'Hovering around lights' },
            { value: 'ROOT_DAMAGE', label: 'Root damage signs' },
            { value: 'HONEYDEW', label: 'Sticky residue (honeydew)' },
            { value: 'FRASS', label: 'Frass (insect droppings)' },
            { value: 'ANT_TRAILS', label: 'Ant trails (feeding on aphid honeydew)' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pest-${value}`}
                checked={formData.pestIndicators.includes(value as PestIndicator)}
                onChange={(e) => {
                  const indicators = e.target.checked
                    ? [...formData.pestIndicators, value as PestIndicator]
                    : formData.pestIndicators.filter(i => i !== value);
                  setFormData({ ...formData, pestIndicators: indicators });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`pest-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>🍄 Fungal/Bacterial Symptoms</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'POWDERY_MILDEW', label: 'White powdery patches (mildew)' },
            { value: 'GREY_FUZZ', label: 'Grey fuzz (botrytis)' },
            { value: 'WET_SPOTS', label: 'Brown/black wet spots' },
            { value: 'YELLOW_HALOS', label: 'Yellow concentric halos' },
            { value: 'SOFT_STEMS', label: 'Soft stems (damping off)' },
            { value: 'ROOT_SLIME', label: 'Root slime or smell' },
            { value: 'RUST_SPOTS', label: 'Leaf rust spots' },
            { value: 'SEPTORIA', label: 'Septoria (small yellow/black leaf spots)' },
            { value: 'LEAF_CANKERS', label: 'Leaf cankers' },
            { value: 'STEM_SPLITTING', label: 'Stem splitting' },
            { value: 'BACTERIAL_OOZE', label: 'Bacterial ooze' },
            { value: 'SLIMY_BASE', label: 'Slimy build-up at base' },
            { value: 'SUDDEN_COLLAPSE', label: 'Sudden plant collapse' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`fungal-${value}`}
                checked={formData.fungalSymptoms.includes(value as FungalSymptom)}
                onChange={(e) => {
                  const symptoms = e.target.checked
                    ? [...formData.fungalSymptoms, value as FungalSymptom]
                    : formData.fungalSymptoms.filter(s => s !== value);
                  setFormData({ ...formData, fungalSymptoms: symptoms });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`fungal-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>🧪 General / Other Plant Stress Signs</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'COLD_STRESS', label: 'Cold stress' },
            { value: 'ROOT_BOUND', label: 'Root bound' },
            { value: 'PHYSICAL_DAMAGE', label: 'Physical damage' },
            { value: 'TRANSPLANT_SHOCK', label: 'Transplant shock' },
            { value: 'CHEMICAL_SPRAY_DAMAGE', label: 'Chemical/foliar spray damage' },
            { value: 'STUNTED_GROWTH', label: 'Stunted growth' },
            { value: 'SLOW_RECOVERY', label: 'Slow recovery after watering' },
            { value: 'PALE_COLOR', label: 'Pale overall color' },
            { value: 'UNEVEN_GROWTH', label: 'Uneven growth patterns' },
            { value: 'ABNORMAL_SPACING', label: 'Abnormal internode spacing' },
            { value: 'BRITTLE_STEMS', label: 'Brittle stems or snapping' },
            { value: 'WEAK_BRANCHING', label: 'Weak branching' },
            { value: 'UNEXPLAINED_DROP', label: 'Leaf drop with no pest visible' },
            { value: 'SCENT_CHANGE', label: 'Scent change (e.g. sour or rot smell)' },
            { value: 'HEAT_STRESS', label: 'Heat stress signs' },
            { value: 'LIGHT_BURN', label: 'Light burn indicators' },
            { value: 'STRETCHING', label: 'Stretching or lanky structure' },
            { value: 'TIP_CURL', label: 'Tip curl (wind or VPD stress)' },
            { value: 'OVER_TRANSPIRATION', label: 'Over-transpiration (leaf taco)' },
            { value: 'NUTRIENT_LOCKOUT', label: 'Nutrient lockout mimicking disease' },
            { value: 'OTHER', label: 'Other' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`stress-${value}`}
                checked={formData.stressSymptoms.includes(value as StressSymptom)}
                onChange={(e) => {
                  const symptoms = e.target.checked
                    ? [...formData.stressSymptoms, value as StressSymptom]
                    : formData.stressSymptoms.filter(s => s !== value);
                  setFormData({ ...formData, stressSymptoms: symptoms });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`stress-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Pest Identification Status</Label>
        <select
          value={formData.pestIdentificationStatus || ''}
          onChange={(e) => setFormData({ ...formData, pestIdentificationStatus: e.target.value as PestIdentificationStatus })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="">Select Status</option>
          <option value="SUSPECTED">Suspected</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </div>

      <div>
        <Label>Confidence Level (1-5)</Label>
        <select
          value={formData.pestConfidenceLevel || ''}
          onChange={(e) => setFormData({ ...formData, pestConfidenceLevel: parseInt(e.target.value) || undefined })}
          className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
        >
          <option value="">Select Level</option>
          {[1, 2, 3, 4, 5].map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>Pest Types</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.values(PestType).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pest-type-${type}`}
                checked={formData.pestTypes.includes(type)}
                onChange={(e) => {
                  const types = e.target.checked
                    ? [...formData.pestTypes, type]
                    : formData.pestTypes.filter(t => t !== type);
                  setFormData({ ...formData, pestTypes: types });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`pest-type-${type}`} className="text-sm font-normal">
                {type.replace(/_/g, ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Disease Types</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.values(DiseaseType).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`disease-type-${type}`}
                checked={formData.diseaseTypes.includes(type)}
                onChange={(e) => {
                  const types = e.target.checked
                    ? [...formData.diseaseTypes, type]
                    : formData.diseaseTypes.filter(t => t !== type);
                  setFormData({ ...formData, diseaseTypes: types });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`disease-type-${type}`} className="text-sm font-normal">
                {type.replace(/_/g, ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>🦋 IPM Methods & Beneficial Organisms</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { value: 'PHYTOSEIULUS_PERSIMILIS', label: 'Phytoseiulus persimilis (Spider Mite Predator)' },
            { value: 'NEOSEIULUS_CALIFORNICUS', label: 'Neoseiulus californicus (Spider Mite Predator)' },
            { value: 'AMBLYSEIUS_SWIRSKII', label: 'Amblyseius swirskii (Thrips/Whitefly Predator)' },
            { value: 'AMBLYSEIUS_CUCUMERIS', label: 'Amblyseius cucumeris (Thrips Predator)' },
            { value: 'AMBLYSEIUS_ANDERSONI', label: 'Amblyseius andersoni (Broad/Russet Mite Predator)' },
            { value: 'STRATIOLAELAPS_SCIMITUS', label: 'Stratiolaelaps scimitus (Fungus Gnat Predator)' },
            { value: 'ORIUS_INSIDIOSUS', label: 'Orius insidiosus (Minute Pirate Bug)' },
            { value: 'DALOTIA_CORIARIA', label: 'Dalotia coriaria (Rove Beetle)' },
            { value: 'CHRYSOPERLA_CARNEA', label: 'Chrysoperla carnea (Green Lacewing)' },
            { value: 'APHIDIUS_COLEMANI', label: 'Aphidius colemani (Aphid Parasitoid)' },
            { value: 'LADYBUGS', label: 'Ladybugs' },
            { value: 'PRAYING_MANTIS', label: 'Praying Mantis' },
            { value: 'BENEFICIAL_NEMATODES', label: 'Beneficial Nematodes' },
            { value: 'STICKY_TRAPS', label: 'Sticky Traps' },
            { value: 'DIATOMACEOUS_EARTH', label: 'Diatomaceous Earth' },
            { value: 'NEEM_OIL', label: 'Neem Oil' },
            { value: 'INSECTICIDAL_SOAP', label: 'Insecticidal Soap' },
            { value: 'COMPANION_PLANTING', label: 'Companion Planting' },
            { value: 'ENVIRONMENTAL_ADJUSTMENTS', label: 'Environmental Adjustments' },
            { value: 'PHYSICAL_BARRIERS', label: 'Physical Barriers' },
            { value: 'PRUNING_REMOVAL', label: 'Pruning & Removal of Affected Areas' },
            { value: 'QUARANTINE_MEASURES', label: 'Quarantine Measures' }
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`ipm-${value}`}
                checked={formData.ipmMethods.includes(value as IPMMethod)}
                onChange={(e) => {
                  const methods = e.target.checked
                    ? [...formData.ipmMethods, value as IPMMethod]
                    : formData.ipmMethods.filter(m => m !== value);
                  setFormData({ ...formData, ipmMethods: methods });
                }}
                className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
              />
              <Label htmlFor={`ipm-${value}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Add state for supportedPlantIds above renderLSTFields
  const [supportedPlantIds, setSupportedPlantIds] = useState<string[]>(formData.supportedPlants || []);

  // Keep formData.supportedPlants in sync with supportedPlantIds
  useEffect(() => {
    setFormData((prev) => ({ ...prev, supportedPlants: supportedPlantIds.filter(Boolean) }));
    // eslint-disable-next-line
  }, [supportedPlantIds]);

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
        <div className="space-y-2">
          {supportedPlantIds.map((plantId, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={plantId}
                onChange={e => {
                  const updated = [...supportedPlantIds];
                  updated[idx] = e.target.value;
                  setSupportedPlantIds(updated);
                }}
                className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
              >
                <option value="">Select plant that received trunk support</option>
                {plants.map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSupportedPlantIds(supportedPlantIds.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 px-2 py-1 rounded focus:outline-none"
                aria-label="Remove plant"
              >
                ×
              </button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => setSupportedPlantIds([...supportedPlantIds, ''])}
            className="w-full bg-garden-600 text-white hover:bg-garden-700 mt-2"
          >
            Add Another Plant
          </Button>
        </div>
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

  const renderTransplantFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="transplantFromSize">Transplant From</Label>
          <select
            id="transplantFromSize"
            value={formData.transplantFromSize || ''}
            onChange={(e) => setFormData({ ...formData, transplantFromSize: e.target.value as ContainerSize })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Size</option>
            {[
              { value: 'AERO_CLONER', label: 'Aero Cloner' },
              { value: 'SOLO_CUP', label: 'Solo Cup' },
              { value: 'CLONE', label: 'Clone' },
              { value: 'HALF_GALLON', label: '0.5 Gallon' },
              { value: 'ONE_GALLON', label: '1 Gallon' },
              { value: 'TWO_GALLON', label: '2 Gallon' },
              { value: 'TWO_HALF_GALLON', label: '2.5 Gallon' },
              { value: 'THREE_GALLON', label: '3 Gallon' },
              { value: 'FIVE_GALLON', label: '5 Gallon' },
              { value: 'SEVEN_GALLON', label: '7 Gallon' },
              { value: 'TEN_GALLON', label: '10 Gallon' },
              { value: 'FIFTEEN_GALLON', label: '15 Gallon' },
              { value: 'TWENTY_GALLON', label: '20 Gallon' },
              { value: 'TWENTY_FIVE_GALLON', label: '25 Gallon' },
              { value: 'THIRTY_GALLON', label: '30 Gallon' }
            ].map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="transplantToSize">Transplant To</Label>
          <select
            id="transplantToSize"
            value={formData.transplantToSize || ''}
            onChange={(e) => setFormData({ ...formData, transplantToSize: e.target.value as ContainerSize })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Size</option>
            {[
              { value: 'AERO_CLONER', label: 'Aero Cloner' },
              { value: 'SOLO_CUP', label: 'Solo Cup' },
              { value: 'HALF_GALLON', label: '0.5 Gallon' },
              { value: 'ONE_GALLON', label: '1 Gallon' },
              { value: 'TWO_GALLON', label: '2 Gallon' },
              { value: 'TWO_HALF_GALLON', label: '2.5 Gallon' },
              { value: 'THREE_GALLON', label: '3 Gallon' },
              { value: 'FIVE_GALLON', label: '5 Gallon' },
              { value: 'SEVEN_GALLON', label: '7 Gallon' },
              { value: 'TEN_GALLON', label: '10 Gallon' },
              { value: 'FIFTEEN_GALLON', label: '15 Gallon' },
              { value: 'TWENTY_GALLON', label: '20 Gallon' },
              { value: 'TWENTY_FIVE_GALLON', label: '25 Gallon' },
              { value: 'THIRTY_GALLON', label: '30 Gallon' },
              { value: 'FORTY_GALLON', label: '40 Gallon' },
              { value: 'FORTY_FIVE_GALLON', label: '45 Gallon' },
              { value: 'FIFTY_GALLON', label: '50 Gallon' }
            ].map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="soilMoisture">Soil Moisture When Transplanting</Label>
          <select
            id="soilMoisture"
            value={formData.soilMoisture || ''}
            onChange={(e) => setFormData({ ...formData, soilMoisture: e.target.value as SoilMoisture })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Moisture</option>
            <option value="DRY">Dry</option>
            <option value="WET">Wet</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTransferFields = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-dark-text-primary">Transfer To</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="destinationGarden">Garden</Label>
            <select
              id="destinationGarden"
              value={formData.destinationGardenId || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  destinationGardenId: e.target.value,
                  destinationRoomId: '',
                  destinationZoneId: ''
                });
              }}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
            >
              <option value="">Select Garden</option>
              {gardens.map((garden: any) => (
                <option key={garden.id} value={garden.id}>{garden.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="destinationRoom">Room</Label>
            <select
              id="destinationRoom"
              value={formData.destinationRoomId || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  destinationRoomId: e.target.value,
                  destinationZoneId: ''
                });
              }}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
              disabled={!formData.destinationGardenId}
            >
              <option value="">Select Room</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="destinationZone">Zone</Label>
            <select
              id="destinationZone"
              value={formData.destinationZoneId || ''}
              onChange={(e) => setFormData({ ...formData, destinationZoneId: e.target.value })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
              disabled={!formData.destinationRoomId}
            >
              <option value="">Select Zone</option>
              {zones.map((zone: any) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGerminationFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="germinationMethod">Germination Method</Label>
          <select
            id="germinationMethod"
            value={formData.germinationMethod || ''}
            onChange={(e) => setFormData({ ...formData, germinationMethod: e.target.value as GerminationMethod })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Method</option>
            <option value="PAPER_TOWEL">Paper Towel</option>
            <option value="DIRECT_SOIL">Direct Soil</option>
            <option value="SOAK_THEN_SOIL">Soak then Soil</option>
            <option value="PLUGS_OR_CUBES">Plugs or Cubes</option>
            <option value="ROCKWOOL">Rockwool</option>
            <option value="PROPAGATOR">Propagator</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="germinationStatus">Germination Status</Label>
          <select
            id="germinationStatus"
            value={formData.germinationStatus || ''}
            onChange={(e) => setFormData({ ...formData, germinationStatus: e.target.value as GerminationStatus })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="PENDING">Pending</option>
            <option value="TAPROOTED">Taprooted</option>
            <option value="FAILED">Failed</option>
            <option value="ADDED_MOISTURE">Added Moisture</option>
            <option value="SPROUTED">Sprouted</option>
          </select>
        </div>

        <div>
          <Label htmlFor="germinationRh">RH (%)</Label>
          <Input
            type="number"
            id="germinationRh"
            min="1"
            max="100"
            value={formData.germinationRh || ''}
            onChange={(e) => setFormData({ ...formData, germinationRh: parseInt(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>

        <div>
          <Label htmlFor="germinationTemp">Temperature</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              id="germinationTemp"
              value={formData.germinationTemp || ''}
              onChange={(e) => setFormData({ ...formData, germinationTemp: parseFloat(e.target.value) || undefined })}
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
          <Label htmlFor="daysToSprout">Days to Sprout</Label>
          <select
            id="daysToSprout"
            value={formData.daysToSprout || ''}
            onChange={(e) => setFormData({ ...formData, daysToSprout: parseInt(e.target.value) || undefined })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Days</option>
            {Array.from({ length: 22 }, (_, i) => i).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderCloningFields = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-dark-text-primary">Clone Location</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cloneGarden">Clone Garden</Label>
            <select
              id="cloneGarden"
              value={formData.cloneGardenId || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  cloneGardenId: e.target.value,
                  cloneRoomId: '',
                  cloneZoneId: ''
                });
              }}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Garden</option>
              {gardens.map((garden: any) => (
                <option key={garden.id} value={garden.id}>{garden.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cloneRoom">Clone Room</Label>
            <select
              id="cloneRoom"
              value={formData.cloneRoomId || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  cloneRoomId: e.target.value,
                  cloneZoneId: ''
                });
              }}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
              disabled={!formData.cloneGardenId}
            >
              <option value="">Select Room</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cloneZone">Clone Zone</Label>
            <select
              id="cloneZone"
              value={formData.cloneZoneId || ''}
              onChange={(e) => setFormData({ ...formData, cloneZoneId: e.target.value })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
              disabled={!formData.cloneRoomId}
            >
              <option value="">Select Zone</option>
              {zones.map((zone: any) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-dark-text-primary">Cloning Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cloningMethod">Cloning Method</Label>
            <select
              id="cloningMethod"
              value={formData.cloningMethod || ''}
              onChange={(e) => setFormData({ ...formData, cloningMethod: e.target.value as CloningMethod })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Method</option>
              <option value="AEROPONIC_CLONER">Aeroponic Cloner</option>
              <option value="PLUGS">Plugs</option>
              <option value="ROCKWOOL">Rockwool</option>
              <option value="MEDIUM_DIRECT">Soil/Coco/Medium Direct</option>
              <option value="WATER_ONLY">Water Only</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cutType">Cut From</Label>
            <select
              id="cutType"
              value={formData.cutType || ''}
              onChange={(e) => setFormData({ ...formData, cutType: e.target.value as CutType })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Cut Type</option>
              <option value="TOP_CUT">Top Cut</option>
              <option value="MID_CUT">Mid Cut</option>
              <option value="LOWER_BRANCH">Lower Branch</option>
              <option value="FAN_LEAF_NODE">Fan Leaf Node</option>
              <option value="MULTI_NODE_CUT">Multi Node Cut</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <Label>Additives Used</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'ROOTING_GEL', label: 'Rooting Gel' },
                { value: 'ROOTING_POWDER', label: 'Rooting Powder' },
                { value: 'HONEY', label: 'Honey' },
                { value: 'ALOE', label: 'Aloe' },
                { value: 'OTHER', label: 'Other' }
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`additive-${value}`}
                    checked={formData.cloningAdditives.includes(value as CloningAdditive)}
                    onChange={(e) => {
                      const additives = e.target.checked
                        ? [...formData.cloningAdditives, value as CloningAdditive]
                        : formData.cloningAdditives.filter(a => a !== value);
                      setFormData({ ...formData, cloningAdditives: additives });
                    }}
                    className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                  />
                  <Label htmlFor={`additive-${value}`} className="text-sm font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="sanitationMethod">Sanitation Method</Label>
            <select
              id="sanitationMethod"
              value={formData.sanitationMethod || ''}
              onChange={(e) => setFormData({ ...formData, sanitationMethod: e.target.value as SanitationMethod })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Method</option>
              <option value="FIRE">Fire</option>
              <option value="ALCOHOL">Alcohol</option>
              <option value="SOAP">Soap</option>
              <option value="BLEACH">Bleach</option>
              <option value="AUTOCLAVE">Autoclave</option>
              <option value="PRESSURE_COOKER">Pressure Cooker</option>
              <option value="BOILED_WATER">Boiled Water</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cloningRh">RH (%)</Label>
            <Input
              type="number"
              id="cloningRh"
              min="1"
              max="100"
              value={formData.cloningRh || ''}
              onChange={(e) => setFormData({ ...formData, cloningRh: parseInt(e.target.value) || undefined })}
              className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
            />
          </div>

          <div>
            <Label htmlFor="cloningTemp">Temperature</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                id="cloningTemp"
                value={formData.cloningTemp || ''}
                onChange={(e) => setFormData({ ...formData, cloningTemp: parseFloat(e.target.value) || undefined })}
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
            <Label htmlFor="lightHoursPerDay">Light Hours per Day</Label>
            <select
              id="lightHoursPerDay"
              value={formData.lightHoursPerDay || ''}
              onChange={(e) => setFormData({ ...formData, lightHoursPerDay: parseInt(e.target.value) || undefined })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Hours</option>
              {[18, 19, 20, 21, 22, 23, 24].map(hours => (
                <option key={hours} value={hours}>{hours}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="lightType">Light Type</Label>
            <select
              id="lightType"
              value={formData.lightType || ''}
              onChange={(e) => setFormData({ ...formData, lightType: e.target.value as LightType })}
              className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
            >
              <option value="">Select Type</option>
              <option value="LED">LED</option>
              <option value="HPS">HPS</option>
              <option value="CMH">CMH</option>
              <option value="MH">MH</option>
              <option value="FLUORESCENT">Fluorescent</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="domeUsed"
              checked={formData.domeUsed}
              onChange={(e) => setFormData({ ...formData, domeUsed: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="domeUsed" className="text-sm font-normal">
              Dome Used
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ventsOpened"
              checked={formData.ventsOpened}
              onChange={(e) => setFormData({ ...formData, ventsOpened: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="ventsOpened" className="text-sm font-normal">
              Vents Opened
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ventsClosed"
              checked={formData.ventsClosed}
              onChange={(e) => setFormData({ ...formData, ventsClosed: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="ventsClosed" className="text-sm font-normal">
              Vents Closed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="domeRemoved"
              checked={formData.domeRemoved}
              onChange={(e) => setFormData({ ...formData, domeRemoved: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="domeRemoved" className="text-sm font-normal">
              Dome Removed
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTreatmentFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="treatmentType">Treatment Type</Label>
          <select
            id="treatmentType"
            value={formData.treatmentType || ''}
            onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value as TreatmentType })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Type</option>
            <option value="FOLIAR_SPRAY">Foliar Spray</option>
            <option value="DUNK">Dunk</option>
            <option value="SYSTEMIC_APPLICATION">Systemic Application</option>
            <option value="PREDATOR_RELEASE">Predator Release</option>
            <option value="SOIL_AMENDMENT">Soil Amendment</option>
            <option value="ROOT_DRENCH">Root Drench</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <Label>Foliar Spray Products</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { value: 'NUKEM', label: 'NUKEM' },
              { value: 'NEEM_OIL', label: 'Neem Oil' },
              { value: 'INSECTICIDAL_SOAP', label: 'Insecticidal Soap' },
              { value: 'ESSENTIAL_OILS', label: 'Essential Oils' },
              { value: 'LOST_COAST', label: 'Lost Coast' },
              { value: 'CAPTAIN_JACKS', label: 'Captain Jacks' },
              { value: 'H2O2_SOLUTIONS', label: 'H2O2 Solutions' },
              { value: 'BAKING_SODA', label: 'Baking Soda' },
              { value: 'OTHER', label: 'Other' }
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`spray-${value}`}
                  checked={formData.foliarSprayProducts.includes(value as FoliarSprayProduct)}
                  onChange={(e) => {
                    const products = e.target.checked
                      ? [...formData.foliarSprayProducts, value as FoliarSprayProduct]
                      : formData.foliarSprayProducts.filter(p => p !== value);
                    setFormData({ ...formData, foliarSprayProducts: products });
                  }}
                  className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                />
                <Label htmlFor={`spray-${value}`} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>BCA Predator Types</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { value: 'PERSIMILIS', label: 'Persimilis' },
              { value: 'CALIFORNICUS', label: 'Californicus' },
              { value: 'PIRATE_BUG', label: 'Pirate Bug' },
              { value: 'SWIRSKII', label: 'Swirskii' },
              { value: 'CUCUMERIS', label: 'Cucumeris' },
              { value: 'NEMATODES', label: 'Nematodes' },
              { value: 'LADY_BEETLES', label: 'Lady Beetles' },
              { value: 'GREEN_LACEWING', label: 'Green Lacewing' },
              { value: 'ROVE_BEETLES', label: 'Rove Beetles' },
              { value: 'HYPOSASPIS_MILES', label: 'Hyposaspis Miles' },
              { value: 'OTHER', label: 'Other' }
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`predator-${value}`}
                  checked={formData.bcaPredatorTypes.includes(value as BCAPredatorType)}
                  onChange={(e) => {
                    const types = e.target.checked
                      ? [...formData.bcaPredatorTypes, value as BCAPredatorType]
                      : formData.bcaPredatorTypes.filter(t => t !== value);
                    setFormData({ ...formData, bcaPredatorTypes: types });
                  }}
                  className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                />
                <Label htmlFor={`predator-${value}`} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="releaseCount">Release Count</Label>
          <Input
            type="number"
            id="releaseCount"
            value={formData.releaseCount || ''}
            onChange={(e) => setFormData({ ...formData, releaseCount: parseInt(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>

        <div>
          <Label htmlFor="applicationMethod">Application Method</Label>
          <select
            id="applicationMethod"
            value={formData.applicationMethod || ''}
            onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value as ApplicationMethod })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Method</option>
            <option value="SPRINKLED">Sprinkled</option>
            <option value="SACHETS">Sachets</option>
            <option value="CARRIER_DUST">Carrier Dust</option>
            <option value="OPEN_BOTTLE_LAZY_RELEASE">Open Bottle Lazy Release</option>
          </select>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="bcaAcclimation"
              checked={formData.bcaAcclimation}
              onChange={(e) => setFormData({ ...formData, bcaAcclimation: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
            />
            <Label htmlFor="bcaAcclimation" className="text-sm font-normal">
              BCA Acclimation Prior to Release
            </Label>
          </div>
        </div>

        <div>
          <Label>Target Pests</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.values(PestType).map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`target-${type}`}
                  checked={formData.targetPests.includes(type)}
                  onChange={(e) => {
                    const pests = e.target.checked
                      ? [...formData.targetPests, type]
                      : formData.targetPests.filter(p => p !== type);
                    setFormData({ ...formData, targetPests: pests });
                  }}
                  className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                />
                <Label htmlFor={`target-${type}`} className="text-sm font-normal">
                  {type.replace(/_/g, ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="coverageMethod">Coverage Method</Label>
          <select
            id="coverageMethod"
            value={formData.coverageMethod || ''}
            onChange={(e) => setFormData({ ...formData, coverageMethod: e.target.value as CoverageMethod })}
            className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
          >
            <option value="">Select Method</option>
            <option value="HAND_PUMP_SPRAYER">Hand Pump Sprayer</option>
            <option value="FOGGER">Fogger</option>
            <option value="ATOMIZER_SPRAYER">Atomizer Sprayer</option>
            <option value="SPRAY_BOTTLE">Spray Bottle</option>
            <option value="DUNK">Dunk</option>
            <option value="ROOT_DRENCH">Root Drench</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="treatmentPh">pH of Treatment Solution</Label>
          <Input
            type="number"
            id="treatmentPh"
            min="0"
            max="14"
            step="0.1"
            value={formData.treatmentPh || ''}
            onChange={(e) => setFormData({ ...formData, treatmentPh: parseFloat(e.target.value) || undefined })}
            className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
          />
        </div>

        <div>
          <Label>Additives</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { value: 'INSECTICIDAL_SOAP', label: 'Insecticidal Soap' },
              { value: 'EMULSIFIER_SOAP', label: 'Emulsifier Soap' },
              { value: 'PH_UP', label: 'pH Up' },
              { value: 'PH_DOWN', label: 'pH Down' }
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`additive-${value}`}
                  checked={formData.treatmentAdditives.includes(value as TreatmentAdditive)}
                  onChange={(e) => {
                    const additives = e.target.checked
                      ? [...formData.treatmentAdditives, value as TreatmentAdditive]
                      : formData.treatmentAdditives.filter(a => a !== value);
                    setFormData({ ...formData, treatmentAdditives: additives });
                  }}
                  className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                />
                <Label htmlFor={`additive-${value}`} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypeSpecificFields = () => {
    switch (formData.logType) {
      case LogType.WATERING:
        return (
          <>
            {renderWateringFields()}
            {renderNutrientFields()}
            {renderAdditivesFields()}
          </>
        );
      case LogType.ENVIRONMENTAL:
        return renderEnvironmentalFields();
      case LogType.LST:
        return renderLSTFields();
      case LogType.HST:
        return renderHSTFields();
      case LogType.HARVEST:
        return renderHarvestFields();
      case LogType.DRYING:
        return renderDryingFields();
      case LogType.PEST_STRESS_DISEASE:
        return (
          <>
            {renderHealthFields()}
            <div className="space-y-4 mt-4">
              <div>
                <Label>Method of Detection</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.values(DetectionMethod).map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`detection-${method}`}
                        checked={formData.detectionMethods.includes(method)}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...formData.detectionMethods, method]
                            : formData.detectionMethods.filter(m => m !== method);
                          setFormData({ ...formData, detectionMethods: methods });
                        }}
                        className="h-4 w-4 rounded border-dark-border bg-dark-bg-primary text-garden-600 focus:ring-garden-500"
                      />
                      <Label htmlFor={`detection-${method}`} className="text-sm font-normal">
                        {method.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="stressDuration">Duration of Stress</Label>
                <select
                  id="stressDuration"
                  value={formData.stressDuration || ''}
                  onChange={(e) => setFormData({ ...formData, stressDuration: e.target.value as StressDuration })}
                  className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
                >
                  <option value="">Select Duration</option>
                  {Object.values(StressDuration).map((duration) => (
                    <option key={duration} value={duration}>
                      {duration.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="suspectedCause">Suspected Cause</Label>
                <Textarea
                  id="suspectedCause"
                  value={formData.suspectedCause || ''}
                  onChange={(e) => setFormData({ ...formData, suspectedCause: e.target.value })}
                  className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                  placeholder="Describe what you think caused the stress..."
                />
              </div>

              <div>
                <Label htmlFor="recoveryActions">Recovery Actions Taken</Label>
                <Textarea
                  id="recoveryActions"
                  value={formData.recoveryActions || ''}
                  onChange={(e) => setFormData({ ...formData, recoveryActions: e.target.value })}
                  className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
                  placeholder="Describe what actions you've taken to help the plant recover..."
                />
              </div>

              <div>
                <Label htmlFor="expectedRecoveryTime">Expected Recovery Time</Label>
                <select
                  id="expectedRecoveryTime"
                  value={formData.expectedRecoveryTime || ''}
                  onChange={(e) => setFormData({ ...formData, expectedRecoveryTime: e.target.value as ExpectedRecoveryTime })}
                  className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
                >
                  <option value="">Select Expected Time</option>
                  {Object.values(ExpectedRecoveryTime).map((time) => (
                    <option key={time} value={time}>
                      {time.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );
      case LogType.TRANSPLANT:
        return renderTransplantFields();
      case LogType.TRANSFER:
        return renderTransferFields();
      case LogType.GERMINATION:
        return renderGerminationFields();
      case LogType.CLONING:
        return renderCloningFields();
      case LogType.TREATMENT:
        return renderTreatmentFields();
      case LogType.EQUIPMENT:
        return null;
      default:
        return null;
    }
  };

  // Replace MultiSelect for plants with single-select dropdowns
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);

  const handleAddPlantField = () => {
    setSelectedPlantIds([...selectedPlantIds, '']);
  };

  const handlePlantChange = (index: number, plantId: string) => {
    const updated = [...selectedPlantIds];
    updated[index] = plantId;
    setSelectedPlantIds(updated);
    setFormData({ ...formData, selectedPlants: updated.filter(id => id) });
  };

  // Handle unit switching for Jack's 321
  const handleUnitChange = (newUnit: Jacks321Unit) => {
    if (newUnit === formData.jacks321Unit) return;
    
    // PPM to Grams conversion constants (total PPM values for meter reading)
    const PPM_PER_GRAM = {
      partA: 26.4,    // Jack's Part A: ~100 total PPM / 3.79g = 26.4 PPM per gram
      partB: 79.4,    // Jack's Part B: ~200 total PPM / 2.52g = 79.4 PPM per gram
      epsom: 46.5,    // Epsom Salt: ~46 total PPM / 0.99g = 46.5 PPM per gram
      bloom: 52.8,    // Jack's Bloom: ~300 total PPM / 5.68g = 52.8 PPM per gram
      finish: 37.0,   // Jack's Finish: ~200 total PPM / 5.41g = 37.0 PPM per gram
    };
    
    const newFormData = { ...formData, jacks321Unit: newUnit };
    
    if (newUnit === 'GRAMS') {
      // Convert PPM to Grams: grams = ppm / ppm_per_gram
      if (formData.partAPpm) newFormData.partAAmount = formData.partAPpm / PPM_PER_GRAM.partA;
      if (formData.partBPpm) newFormData.partBAmount = formData.partBPpm / PPM_PER_GRAM.partB;
      if (formData.epsomPpm) newFormData.epsomAmount = formData.epsomPpm / PPM_PER_GRAM.epsom;
      if (formData.bloomPpm) newFormData.bloomAmount = formData.bloomPpm / PPM_PER_GRAM.bloom;
      if (formData.finishPpm) newFormData.finishAmount = formData.finishPpm / PPM_PER_GRAM.finish;
    } else {
      // Convert Grams to PPM: ppm = grams * ppm_per_gram
      if (formData.partAAmount) newFormData.partAPpm = formData.partAAmount * PPM_PER_GRAM.partA;
      if (formData.partBAmount) newFormData.partBPpm = formData.partBAmount * PPM_PER_GRAM.partB;
      if (formData.epsomAmount) newFormData.epsomPpm = formData.epsomAmount * PPM_PER_GRAM.epsom;
      if (formData.bloomAmount) newFormData.bloomPpm = formData.bloomAmount * PPM_PER_GRAM.bloom;
      if (formData.finishAmount) newFormData.finishPpm = formData.finishAmount * PPM_PER_GRAM.finish;
    }
    
    setFormData(newFormData);
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
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                type="datetime-local"
                id="datetime"
                value={formData.datetime}
                onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                className="bg-dark-bg-primary text-dark-text-primary border-dark-border"
              />
            </div>
          </div>

          {renderLocationFields()}

          <div>
            <Label>Plants</Label>
            <div className="space-y-2">
              {selectedPlantIds.map((plantId: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={plantId}
                    onChange={e => handlePlantChange(idx, e.target.value)}
                    className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary"
                  >
                    <option value="">Select plant</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = selectedPlantIds.filter((_, i) => i !== idx);
                      setSelectedPlantIds(updated);
                      setFormData({ ...formData, selectedPlants: updated.filter(id => id) });
                    }}
                    className="text-red-500 hover:text-red-700 px-2 py-1 rounded focus:outline-none"
                    aria-label="Remove plant"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                type="button"
                onClick={handleAddPlantField}
                className="bg-garden-600 text-white hover:bg-garden-700 w-full"
              >
                Add Another Plant
              </Button>
            </div>
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