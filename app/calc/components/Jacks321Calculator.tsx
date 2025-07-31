'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, HelpCircle, Info, Thermometer, Droplets, Wind, Lightbulb, Zap, Leaf, Flower, Sprout, WashingMachine, ChevronDown, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import CreateLogModal from '@/app/logs/components/CreateLogModal';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { LogType, VolumeUnit, Stage } from '@/types/enums';

// Types and Enums
type GrowStage = 'propagation' | 'vegetative' | 'budset' | 'flower' | 'lateflower' | 'flush';

enum RootSize {
  SMALL = 'SMALL',
  NORMAL = 'NORMAL'
}

// pH ranges for nutrient uptake
interface NutrientPHRange {
  nutrient: string;
  min: number;
  max: number;
  optimal: number;
  category: 'macro' | 'micro' | 'stage';
  description?: string;
}

const PH_RANGES: NutrientPHRange[] = [
  // Macronutrients
  { nutrient: 'N, K', min: 5.5, max: 6.5, optimal: 6.0, category: 'macro' },
  { nutrient: 'Ca, Mg, S', min: 5.8, max: 6.5, optimal: 6.2, category: 'macro' },
  { nutrient: 'P', min: 5.8, max: 6.2, optimal: 6.0, category: 'macro' },
  // Micronutrients
  { nutrient: 'Fe, Mn, Zn, Cu', min: 5.5, max: 6.2, optimal: 5.8, category: 'micro' },
  { nutrient: 'Boron (B)', min: 5.0, max: 6.4, optimal: 5.7, category: 'micro' },
  { nutrient: 'Molybdenum (Mo)', min: 6.0, max: 7.0, optimal: 6.5, category: 'micro' },
  // Growth Stages
  { nutrient: 'Seedling', min: 5.5, max: 5.8, optimal: 5.6, category: 'stage', description: 'Root initiation' },
  { nutrient: 'Veg', min: 5.7, max: 6.1, optimal: 5.9, category: 'stage', description: 'N, Ca, Mg uptake' },
  { nutrient: 'Early Flower', min: 5.8, max: 6.2, optimal: 6.0, category: 'stage', description: 'P and micros' },
  { nutrient: 'Late Flower', min: 6.0, max: 6.3, optimal: 6.1, category: 'stage', description: 'K and Mo uptake' }
];

// Nutrient deficiency/toxicity symptoms
enum NutrientSymptom {
  N_DEFICIENCY = 'Nitrogen Deficiency',
  P_DEFICIENCY = 'Phosphorus Deficiency',
  K_DEFICIENCY = 'Potassium Deficiency',
  CA_DEFICIENCY = 'Calcium Deficiency',
  MG_DEFICIENCY = 'Magnesium Deficiency',
  S_DEFICIENCY = 'Sulfur Deficiency',
  FE_DEFICIENCY = 'Iron Deficiency',
  N_TOXICITY = 'Nitrogen Toxicity',
  P_TOXICITY = 'Phosphorus Toxicity',
  K_TOXICITY = 'Potassium Toxicity',
  CA_TOXICITY = 'Calcium Toxicity',
  MG_TOXICITY = 'Magnesium Toxicity'
}

interface SymptomModifier {
  partA?: number;
  partB?: number;
  epsom?: number;
  bloom?: number;
  finish?: number;
}

// Add new interfaces and types for symptom handling
interface SymptomAdjustment {
  partA?: number;
  partB?: number;
  epsom?: number;
  bloom?: number;
  finish?: number;
  warning?: string;
}

interface Warning {
  message: string;
  priority: number; // 1 = highest, 5 = lowest
  type: 'flush' | 'conflict' | 'severe' | 'antagonism' | 'notice' | 'stage-conflict';
}

// Update the symptom modifiers with the new values
const SYMPTOM_MODIFIERS: Record<NutrientSymptom, SymptomAdjustment> = {
  [NutrientSymptom.N_DEFICIENCY]: { partB: 0.15 },
  [NutrientSymptom.P_DEFICIENCY]: { partA: 0.15 },
  [NutrientSymptom.K_DEFICIENCY]: { partA: 0.15 },
  [NutrientSymptom.CA_DEFICIENCY]: { partB: 0.15 },
  [NutrientSymptom.MG_DEFICIENCY]: { epsom: 0.20 },
  [NutrientSymptom.S_DEFICIENCY]: { epsom: 0.10 },
  [NutrientSymptom.FE_DEFICIENCY]: { partA: 0.10 },
  [NutrientSymptom.N_TOXICITY]: { partB: -0.20 },
  [NutrientSymptom.P_TOXICITY]: { 
    partA: -0.20,
    warning: "⚠️ High phosphorus can lock out Fe, Mg, Zn, and Ca."
  },
  [NutrientSymptom.K_TOXICITY]: { 
    partA: -0.15,
    warning: "⚠️ Excess potassium can lock out Mg, Ca, and Zn."
  },
  [NutrientSymptom.CA_TOXICITY]: { 
    partB: -0.15,
    warning: "⚠️ Excess calcium can lock out Mg, K, Mn, and Fe."
  },
  [NutrientSymptom.MG_TOXICITY]: { 
    epsom: -0.15,
    warning: "⚠️ Excess magnesium may inhibit calcium and potassium uptake."
  }
};

interface StageData {
  name: string;
  ec: number;
  ppm500: number;
  ppm700: number;
  nutrients: string[];
  co2Max?: number;
  ratios?: {
    nutrient: string;
    ratio: number;
  }[];
}

const STAGE_DATA: Record<GrowStage, StageData> = {
  propagation: {
    name: 'Propagation',
    ec: 1.1,
    ppm500: 550,
    ppm700: 770,
    nutrients: ['Clone formula'],
    co2Max: 1000,
    ratios: [] // Optional, low PPM
  },
  vegetative: {
    name: 'Vegetative',
    ec: 2.4,
    ppm500: 1200,
    ppm700: 1680,
    nutrients: ['Part A', 'Part B', 'Epsom'],
    co2Max: 1600,
    ratios: [
      { nutrient: 'Part A', ratio: 3 },
      { nutrient: 'Part B', ratio: 2 },
      { nutrient: 'Epsom', ratio: 1 }
    ]
  },
  budset: {
    name: 'Bud Set',
    ec: 1.9,
    ppm500: 950,
    ppm700: 1330,
    nutrients: ['Bloom', 'Epsom'],
    co2Max: 1400,
    ratios: [
      { nutrient: 'Bloom', ratio: 6 },
      { nutrient: 'Epsom', ratio: 1 }
    ]
  },
  flower: {
    name: 'Flower',
    ec: 2.4,
    ppm500: 1200,
    ppm700: 1680,
    nutrients: ['Part A', 'Part B', 'Epsom'],
    co2Max: 1600,
    ratios: [
      { nutrient: 'Part A', ratio: 3 },
      { nutrient: 'Part B', ratio: 2 },
      { nutrient: 'Epsom', ratio: 1 }
    ]
  },
  lateflower: {
    name: 'Late Flower',
    ec: 2.1,
    ppm500: 1050,
    ppm700: 1470,
    nutrients: ['Finish', 'Epsom'],
    co2Max: 1400,
    ratios: [
      { nutrient: 'Finish', ratio: 6 },
      { nutrient: 'Epsom', ratio: 1 }
    ]
  },
  flush: {
    name: 'Flush',
    ec: 0,
    ppm500: 0,
    ppm700: 0,
    nutrients: ['Clear water'],
    ratios: [] // Water only
  },
};

const BASE_GRAMS_PER_GALLON = {
  partA: 3.79,    // Jack's official: 5-12-26 Part A
  partB: 2.52,    // Jack's official: 15-0-0 Part B
  epsom: 0.99,    // Jack's official: Epsom Salt
  bloom: 5.68,    // Jack's official: 10-30-20 Bloom
  finish: 5.41,   // Jack's official: 7-15-30 Finish
};

// PPM contribution per gram per gallon (total PPM values for meter reading)
const PPM_CONTRIBUTION = {
  partA: 26.4,    // Jack's Part A: ~100 total PPM / 3.79g = 26.4 PPM per gram
  partB: 79.4,    // Jack's Part B: ~200 total PPM / 2.52g = 79.4 PPM per gram
  epsom: 46.5,    // Epsom Salt: ~46 total PPM / 0.99g = 46.5 PPM per gram
  bloom: 52.8,    // Jack's Bloom: ~300 total PPM / 5.68g = 52.8 PPM per gram
  finish: 37.0,   // Jack's Finish: ~200 total PPM / 5.41g = 37.0 PPM per gram
};

// Root size options
const ROOT_SIZE_OPTIONS = [
  { value: RootSize.SMALL, label: 'Small Root Ball' },
  { value: RootSize.NORMAL, label: 'Normal Root Ball' }
];

// Root size modifiers (percentage of base amount)
const ROOT_SIZE_MODIFIERS: { [key in RootSize]: number } = {
  [RootSize.SMALL]: 0.85,
  [RootSize.NORMAL]: 1.0
};

// Types for nutrient calculations
interface NutrientAmount {
  grams: number;
  ppmContribution: number;
}

interface NutrientCalculation {
  partA?: NutrientAmount;
  partB?: NutrientAmount;
  bloom?: NutrientAmount;
  finish?: NutrientAmount;
  epsom?: NutrientAmount;
  totalPPM: number;
  finalPPM: number;
}

// Helper type for PPM allocations
interface PPMAllocation {
  partA?: number;
  partB?: number;
  epsom?: number;
  bloom?: number;
  finish?: number;
}

// Stage-specific nutrient adjustment configuration
interface StageNutrientConfig {
  allowedNutrients: string[];
  deficiencyAdjustments: Record<NutrientSymptom, {
    adjustment: number;
    nutrientToAdjust?: string;
    warning?: string;
    requiresSupplementation?: boolean;
  }>;
}

// Create a base empty adjustment record
const EMPTY_ADJUSTMENTS: Record<NutrientSymptom, {
  adjustment: number;
  nutrientToAdjust?: string;
  warning?: string;
  requiresSupplementation?: boolean;
}> = {
  [NutrientSymptom.N_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.P_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.K_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.CA_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.MG_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.S_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.FE_DEFICIENCY]: { adjustment: 0 },
  [NutrientSymptom.N_TOXICITY]: { adjustment: 0 },
  [NutrientSymptom.P_TOXICITY]: { adjustment: 0 },
  [NutrientSymptom.K_TOXICITY]: { adjustment: 0 },
  [NutrientSymptom.CA_TOXICITY]: { adjustment: 0 },
  [NutrientSymptom.MG_TOXICITY]: { adjustment: 0 }
};

// Stage-specific nutrient configurations
const STAGE_NUTRIENT_CONFIG: Record<GrowStage, StageNutrientConfig> = {
  propagation: {
    allowedNutrients: ['Clone formula'],
    deficiencyAdjustments: EMPTY_ADJUSTMENTS
  },
  vegetative: {
    allowedNutrients: ['Part A', 'Part B', 'Epsom'],
    deficiencyAdjustments: {
      ...EMPTY_ADJUSTMENTS,
      [NutrientSymptom.N_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.P_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.K_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.CA_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.MG_DEFICIENCY]: { adjustment: 0.20, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.S_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.FE_DEFICIENCY]: { adjustment: 0.10, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.N_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.P_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.K_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.CA_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.MG_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Epsom' }
    }
  },
  budset: {
    allowedNutrients: ['Bloom', 'Epsom'],
    deficiencyAdjustments: {
      ...EMPTY_ADJUSTMENTS,
      [NutrientSymptom.N_DEFICIENCY]: { 
        adjustment: 0.10, 
        nutrientToAdjust: 'Bloom',
        warning: 'Nitrogen adjustments in Bud Set should be minimal. Monitor closely.'
      },
      [NutrientSymptom.P_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Bloom' },
      [NutrientSymptom.K_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Bloom' },
      [NutrientSymptom.CA_DEFICIENCY]: { 
        requiresSupplementation: true,
        adjustment: 0,
        warning: 'Calcium supplementation recommended in Bud Set. Do not adjust base nutrients.'
      },
      [NutrientSymptom.MG_DEFICIENCY]: { adjustment: 0.20, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.S_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.FE_DEFICIENCY]: { 
        adjustment: 0.10, 
        nutrientToAdjust: 'Bloom',
        warning: 'Iron adjustments via Bloom in Bud Set should be monitored carefully.'
      },
      [NutrientSymptom.N_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Bloom' },
      [NutrientSymptom.P_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Bloom' },
      [NutrientSymptom.K_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Bloom' },
      [NutrientSymptom.MG_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Epsom' }
    }
  },
  flower: {
    allowedNutrients: ['Part A', 'Part B', 'Epsom'],
    deficiencyAdjustments: {
      ...EMPTY_ADJUSTMENTS,
      [NutrientSymptom.N_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.P_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.K_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.CA_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.MG_DEFICIENCY]: { adjustment: 0.20, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.S_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.FE_DEFICIENCY]: { adjustment: 0.10, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.N_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.P_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.K_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Part A' },
      [NutrientSymptom.CA_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Part B' },
      [NutrientSymptom.MG_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Epsom' }
    }
  },
  lateflower: {
    allowedNutrients: ['Finish', 'Epsom'],
    deficiencyAdjustments: {
      ...EMPTY_ADJUSTMENTS,
      [NutrientSymptom.N_DEFICIENCY]: { 
        adjustment: 0,
        warning: 'Nitrogen increase not recommended in Late Flower. Consider earlier adjustment in cycle.'
      },
      [NutrientSymptom.P_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Finish' },
      [NutrientSymptom.K_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Finish' },
      [NutrientSymptom.CA_DEFICIENCY]: { 
        requiresSupplementation: true,
        adjustment: 0,
        warning: 'Calcium supplementation recommended in Late Flower. Do not adjust base nutrients.'
      },
      [NutrientSymptom.MG_DEFICIENCY]: { adjustment: 0.20, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.S_DEFICIENCY]: { adjustment: 0.15, nutrientToAdjust: 'Epsom' },
      [NutrientSymptom.FE_DEFICIENCY]: { 
        requiresSupplementation: true,
        adjustment: 0,
        warning: 'Iron supplementation recommended in Late Flower. Consider micronutrient blend.'
      },
      [NutrientSymptom.N_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Finish' },
      [NutrientSymptom.P_TOXICITY]: { adjustment: -0.20, nutrientToAdjust: 'Finish' },
      [NutrientSymptom.K_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Finish' },
      [NutrientSymptom.MG_TOXICITY]: { adjustment: -0.15, nutrientToAdjust: 'Epsom' }
    }
  },
  flush: {
    allowedNutrients: ['Clear water'],
    deficiencyAdjustments: EMPTY_ADJUSTMENTS
  }
};

// Add interface for luxury uptake mode
interface LuxuryUptakeState {
  enabled: boolean;
  multiplier: number;
  warning?: string;
}

// Add new interface for PPM adjustment tracking
interface PPMAdjustment {
  baseTargetPPM: number;
  luxuryScaledPPM?: number;
  underfeedingPPM?: number;
  finalTargetPPM: number;
  luxuryRatio?: number;
}

// Custom number input component with emerald arrows
const CustomNumberInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  min,
  max,
  step,
  id
}: { 
  value: number | undefined;
  onChange: (value: number) => void; 
  placeholder: string; 
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
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
    const stepValue = step || 1;
    const maxValue = max || Infinity;
    const newValue = Math.min(maxValue, currentValue + stepValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = value || 0;
    const stepValue = step || 1;
    const minValue = min || 0;
    const newValue = Math.max(minValue, currentValue - stepValue);
    onChange(newValue);
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value !== undefined && value !== null && !isNaN(value) ? value : ''}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm bg-dark-bg-secondary border border-dark-border rounded focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-button]:appearance-none"
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
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default function Jacks321Calculator() {
  // Core state
  const [selectedStage, setSelectedStage] = useState<GrowStage>('vegetative');
  const [isCO2Enriched, setIsCO2Enriched] = useState(false);
  const [isPPM700, setIsPPM700] = useState(false);
  const [volume, setVolume] = useState('5');
  const [sourceWaterPPM, setSourceWaterPPM] = useState('150');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSmallRoots, setIsSmallRoots] = useState(false);
  const [lastFeedPPM, setLastFeedPPM] = useState('');
  const [runoffPPM, setRunoffPPM] = useState('');
  const [feedPH, setFeedPH] = useState('6.0');
  const [runoffPH, setRunoffPH] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<NutrientSymptom[]>([]);
  const [targetPPM, setTargetPPM] = useState('');
  
  // Add new state for luxury uptake mode
  const [luxuryUptakeMode, setLuxuryUptakeMode] = useState<LuxuryUptakeState>({
    enabled: false,
    multiplier: 1
  });

  // Add state for transition warnings
  const [transitionWarning, setTransitionWarning] = useState<string | null>(null);

  // Add state for PPM adjustment tracking
  const [ppmAdjustments, setPPMAdjustments] = useState<PPMAdjustment>({
    baseTargetPPM: 0,
    finalTargetPPM: 0
  });

  // Add state for first water toggle
  const [isFirstWater, setIsFirstWater] = useState(false);

  // Add state for watering log modal
  const [isWateringLogModalOpen, setIsWateringLogModalOpen] = useState(false);
  const { data: session } = useSession();

  // Helper components
  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-dark-text-secondary ml-1" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Add constants for PPM adjustments
  const UNDERFEEDING_PPM_INCREASE = 200;
  const CO2_PPM_MODIFIER = 1.2; // 20% increase in PPM when CO2 enriched

  // Helper function to convert between PPM scales
  const convertPPM = (ppm: number, to700: boolean) => {
    return to700 ? ppm * 1.4 : ppm / 1.4;
  };

  // Helper function to get CO2 max for display
  const getDisplayCO2Max = (stage: GrowStage): string => {
    const co2Max = STAGE_DATA[stage].co2Max;
    if (!co2Max) return '—';
    return isPPM700 ? Math.round(convertPPM(co2Max, true)).toString() : co2Max.toString();
  };

  // Helper function to format PPM progression
  const formatPPMProgression = (adj: PPMAdjustment): string => {
    const parts = [adj.baseTargetPPM.toString()];
    if (adj.luxuryScaledPPM) {
      parts.push(adj.luxuryScaledPPM.toString());
    }
    if (adj.underfeedingPPM) {
      parts.push(adj.underfeedingPPM.toString());
    }
    return parts.join(' → ');
  };

  // Update useEffect for targetPPM to handle luxury uptake first
  useEffect(() => {
    const stageData = STAGE_DATA[selectedStage];
    let basePPM = isPPM700 ? stageData.ppm700 : stageData.ppm500;
    
    // Step 1: Apply luxury uptake if enabled
    if (luxuryUptakeMode.enabled && luxuryUptakeMode.multiplier > 1 && 
        selectedStage !== 'propagation' && selectedStage !== 'flush') {
      basePPM = Math.floor(basePPM * luxuryUptakeMode.multiplier);
    }

    // Step 2: Apply CO2 enrichment if applicable
    if (isCO2Enriched && stageData.co2Max && basePPM < stageData.co2Max) {
      basePPM = Math.min(stageData.co2Max, Math.floor(basePPM * CO2_PPM_MODIFIER));
    }

    // Step 3: Check for underfeeding
    const warnings = getSymptomWarnings(selectedSymptoms);
    const isUnderfeeding = warnings.some(warning => 
      warning.message.includes('Possible General Underfeeding')
    );

    if (isUnderfeeding) {
      basePPM += UNDERFEEDING_PPM_INCREASE;
    }

    setTargetPPM(basePPM.toString());
    setPPMAdjustments({
      baseTargetPPM: isPPM700 ? stageData.ppm700 : stageData.ppm500,
      finalTargetPPM: basePPM,
      underfeedingPPM: isUnderfeeding ? basePPM : undefined,
      luxuryScaledPPM: luxuryUptakeMode.enabled && luxuryUptakeMode.multiplier > 1 ? 
        Math.floor((isPPM700 ? stageData.ppm700 : stageData.ppm500) * luxuryUptakeMode.multiplier) : undefined
    });
  }, [selectedStage, isPPM700, isCO2Enriched, selectedSymptoms, luxuryUptakeMode]);

  // Update calculateNutrients to use the already-adjusted target PPM
  const calculateNutrients = (): NutrientCalculation => {
    if (selectedStage === 'flush' || shouldFlush()) {
      return {
        totalPPM: 0,
        finalPPM: parseInt(sourceWaterPPM)
      };
    }

    const volumeNum = parseFloat(volume);
    const sourcePPMNum = parseInt(sourceWaterPPM);
    const targetPPMNum = parseInt(targetPPM);
    
    // Calculate nutrient PPM (target PPM already includes luxury uptake if enabled)
    const nutrientPPM = targetPPMNum - sourcePPMNum;

    // Full-strength reference values from Jack's official schedule
    const FULL_STRENGTH_VALUES = {
      vegetative: {
        partA: 3.79,
        partB: 2.52,
        epsom: 0.99,
        targetPPM500: 1200,
        targetPPM700: 1680
      },
      flower: {
        partA: 3.79,
        partB: 2.52,
        epsom: 0.99,
        targetPPM500: 1200,
        targetPPM700: 1680
      },
      propagation: {
        partA: 3.79,
        partB: 2.52,
        epsom: 0, // Excluded at propagation stage
        targetPPM500: 550,
        targetPPM700: 770
      },
      budset: {
        bloom: 5.68,
        epsom: 0.99,
        targetPPM500: 950,
        targetPPM700: 1330
      },
      lateflower: {
        finish: 5.41,
        epsom: 0.99,
        targetPPM500: 1050,
        targetPPM700: 1470
        }
    };

    const calc: NutrientCalculation = {
      totalPPM: 0,
      finalPPM: sourcePPMNum
    };

    // Get the appropriate full-strength values for current stage
    let stageValues;
    switch (selectedStage) {
      case 'propagation':
        stageValues = FULL_STRENGTH_VALUES.propagation;
        break;
      case 'vegetative':
        stageValues = FULL_STRENGTH_VALUES.vegetative;
        break;
      case 'flower':
        stageValues = FULL_STRENGTH_VALUES.flower;
        break;
      case 'budset':
        stageValues = FULL_STRENGTH_VALUES.budset;
        break;
      case 'lateflower':
        stageValues = FULL_STRENGTH_VALUES.lateflower;
        break;
      default:
        stageValues = FULL_STRENGTH_VALUES.vegetative;
    }

    // Get the correct target PPM based on scale
    const fullStrengthPPM = isPPM700 ? stageValues.targetPPM700 : stageValues.targetPPM500;

    // Calculate scaling factor based on target PPM
    const scaleFactor = nutrientPPM / fullStrengthPPM;

    // Check for underfeeding
    const warnings = getSymptomWarnings(selectedSymptoms);
    const isUnderfeeding = warnings.some(warning => 
      warning.message.includes('Possible General Underfeeding')
    );

    // Calculate modifiers (only apply if not underfeeding)
    const modifiers = calculateModifiers();

    // Calculate grams for each nutrient based on scaling
    if (selectedStage === 'propagation' || selectedStage === 'vegetative' || selectedStage === 'flower') {
      // 3-2-1 ratio stages
      const stageValues321 = stageValues as typeof FULL_STRENGTH_VALUES.vegetative;
      const partAGrams = stageValues321.partA * scaleFactor * (1 + (modifiers.partA || 0)) * volumeNum;
      const partBGrams = stageValues321.partB * scaleFactor * (1 + (modifiers.partB || 0)) * volumeNum;
      const epsomGrams = stageValues321.epsom * scaleFactor * (1 + (modifiers.epsom || 0)) * volumeNum;

      // Real-world PPM-per-gram constants from Jack's official feed chart
      const PPM_PER_GRAM = {
        partA: 79.2,    // 300 PPM / 3.79g = 79.2 PPM/g
        partB: 198.4,   // 500 PPM / 2.52g = 198.4 PPM/g
        epsom: 404.0    // 400 PPM / 0.99g = 404.0 PPM/g
      };

      // Calculate PPM from the adjusted grams per gallon
      const partAGramsPerGallon = partAGrams / volumeNum;
      const partBGramsPerGallon = partBGrams / volumeNum;
      const epsomGramsPerGallon = epsomGrams / volumeNum;

      calc.partA = {
        grams: partAGrams,
        ppmContribution: partAGramsPerGallon * PPM_PER_GRAM.partA
      };
      calc.partB = {
        grams: partBGrams,
        ppmContribution: partBGramsPerGallon * PPM_PER_GRAM.partB
      };
      if (epsomGrams > 0) {
        calc.epsom = {
          grams: epsomGrams,
          ppmContribution: epsomGramsPerGallon * PPM_PER_GRAM.epsom
        };
      }
    } else if (selectedStage === 'budset') {
      // Bloom + Epsom stage
      const stageValuesBloom = stageValues as typeof FULL_STRENGTH_VALUES.budset;
      const bloomGrams = stageValuesBloom.bloom * scaleFactor * (1 + (modifiers.bloom || 0)) * volumeNum;
      const epsomGrams = stageValuesBloom.epsom * scaleFactor * (1 + (modifiers.epsom || 0)) * volumeNum;
        
      // PPM-per-gram constants for bloom stage
      const PPM_PER_GRAM_BLOOM = {
        bloom: 52.8,    // Based on Jack's bloom formula
        epsom: 404.0    // Same as above
      };

      // Calculate PPM from the adjusted grams per gallon
      const bloomGramsPerGallon = bloomGrams / volumeNum;
      const epsomGramsPerGallon = epsomGrams / volumeNum;

      calc.bloom = {
        grams: bloomGrams,
        ppmContribution: bloomGramsPerGallon * PPM_PER_GRAM_BLOOM.bloom
      };
      calc.epsom = {
        grams: epsomGrams,
        ppmContribution: epsomGramsPerGallon * PPM_PER_GRAM_BLOOM.epsom
      };
    } else if (selectedStage === 'lateflower') {
      // Finish + Epsom stage
      const stageValuesFinish = stageValues as typeof FULL_STRENGTH_VALUES.lateflower;
      const finishGrams = stageValuesFinish.finish * scaleFactor * (1 + (modifiers.finish || 0)) * volumeNum;
      const epsomGrams = stageValuesFinish.epsom * scaleFactor * (1 + (modifiers.epsom || 0)) * volumeNum;

      // PPM-per-gram constants for finish stage
      const PPM_PER_GRAM_FINISH = {
        finish: 37.0,   // Based on Jack's finish formula
        epsom: 404.0    // Same as above
      };

      // Calculate PPM from the adjusted grams per gallon
      const finishGramsPerGallon = finishGrams / volumeNum;
      const epsomGramsPerGallon = epsomGrams / volumeNum;

      calc.finish = {
        grams: finishGrams,
        ppmContribution: finishGramsPerGallon * PPM_PER_GRAM_FINISH.finish
      };
      calc.epsom = {
        grams: epsomGrams,
        ppmContribution: epsomGramsPerGallon * PPM_PER_GRAM_FINISH.epsom
      };
    }

    // Calculate total PPM (this will be the meter reading)
    calc.totalPPM = nutrientPPM;
    calc.finalPPM = calc.totalPPM + sourcePPMNum;
    return calc;
  };

  // Helper function to check if we should flush
  const shouldFlush = (): boolean => {
    const warnings = getSymptomWarnings(selectedSymptoms);
    return warnings.some(w => 
      w.type === 'flush' || 
      w.type === 'conflict'
    );
  };

  // Calculate pH warnings
  const getPHWarnings = (): string[] => {
    const warnings: string[] = [];
    const feedPHNum = parseFloat(feedPH);
    const runoffPHNum = runoffPH ? parseFloat(runoffPH) : null;

    // Check current growth stage
    const stageRanges = PH_RANGES.filter(range => range.category === 'stage');
    const currentStageRange = stageRanges.find(range => {
      switch (selectedStage) {
        case 'propagation':
          return range.nutrient === 'Seedling';
        case 'vegetative':
          return range.nutrient === 'Veg';
        case 'budset':
        case 'flower':
          return range.nutrient === 'Early Flower';
        case 'lateflower':
          return range.nutrient === 'Late Flower';
        default:
          return false;
      }
    });

    if (currentStageRange && feedPHNum) {
      if (feedPHNum < currentStageRange.min) {
        warnings.push(`⚠️ pH too low for ${currentStageRange.nutrient} stage (${currentStageRange.description})`);
      } else if (feedPHNum > currentStageRange.max) {
        warnings.push(`⚠️ pH too high for ${currentStageRange.nutrient} stage (${currentStageRange.description})`);
      }
    }

    // Check nutrient availability
    if (feedPHNum) {
      const affectedMacros = PH_RANGES
        .filter(range => range.category === 'macro' && (feedPHNum < range.min || feedPHNum > range.max))
        .map(range => range.nutrient);

      const affectedMicros = PH_RANGES
        .filter(range => range.category === 'micro' && (feedPHNum < range.min || feedPHNum > range.max))
        .map(range => range.nutrient);

      if (affectedMacros.length > 0) {
        warnings.push(`⚠️ pH may limit availability of: ${affectedMacros.join(', ')}`);
      }
      if (affectedMicros.length > 0) {
        warnings.push(`⚠️ pH may limit micronutrient availability: ${affectedMicros.join(', ')}`);
      }

      // Specific lockout warnings
      if (feedPHNum < 5.5) {
        warnings.push('⚠️ Risk of calcium and magnesium deficiency at this pH');
      } else if (feedPHNum > 6.5) {
        warnings.push('⚠️ Risk of iron and manganese lockout at this pH');
      }
    }

    // Runoff drift warning
    if (runoffPHNum && feedPHNum) {
      const drift = Math.abs(runoffPHNum - feedPHNum);
      if (drift > 0.5) {
        warnings.push(`⚠️ Significant pH drift detected (${drift.toFixed(1)} difference) – check root health`);
        if (runoffPHNum > feedPHNum) {
          warnings.push('📈 Rising runoff pH may indicate salt buildup');
        } else {
          warnings.push('📉 Falling runoff pH may indicate root zone acidification');
        }
      }
    }

    return warnings;
  };

  // Add helper function to check for stage-based conflicts
  const getStageBasedConflicts = (symptoms: NutrientSymptom[]): Warning[] => {
    const warnings: Warning[] = [];
    const stageConfig = STAGE_NUTRIENT_CONFIG[selectedStage];
    
    symptoms.forEach(symptom => {
      const adjustment = stageConfig.deficiencyAdjustments[symptom];
      if (adjustment.warning) {
        warnings.push({
          message: adjustment.warning,
          priority: 3,
          type: 'stage-conflict'
        });
      }
      if (adjustment.requiresSupplementation) {
        warnings.push({
          message: `⚠️ Stage-Based Conflict:
This nutrient is not typically active in the current stage.
Proceed cautiously. Use external supplements or wait for new growth before adjusting further.`,
          priority: 2,
          type: 'stage-conflict'
        });
      }
    });

    return warnings;
  };

  // Update luxury uptake conditions check
  const checkLuxuryUptakeConditions = () => {
    if (!lastFeedPPM || selectedStage === 'propagation' || selectedStage === 'flush') {
      setTransitionWarning(null);
      return;
    }

    const lastFeedValue = parseInt(lastFeedPPM);
    const stageData = STAGE_DATA[selectedStage];
    
    // Determine which stage's PPM to use as reference
    let referencePPM;
    if (isFirstWater) {
      // Get the previous stage in the sequence
      const stageSequence: GrowStage[] = ['propagation', 'vegetative', 'budset', 'flower', 'lateflower', 'flush'];
      const currentIndex = stageSequence.indexOf(selectedStage);
      const previousStage = currentIndex > 0 ? stageSequence[currentIndex - 1] : selectedStage;
      referencePPM = isPPM700 ? STAGE_DATA[previousStage].ppm700 : STAGE_DATA[previousStage].ppm500;
    } else {
      referencePPM = isPPM700 ? stageData.ppm700 : stageData.ppm500;
    }
    
    if (lastFeedValue > referencePPM + 150) {
      const multiplier = Math.min(lastFeedValue / referencePPM, 1.8);
      
      // Update warning message to reflect first water context
      setTransitionWarning(`
📌 Transition Warning – Luxury Uptake Detected:
Your last feeding strength (${lastFeedValue} PPM) was significantly higher than the ${isFirstWater ? 'previous' : 'recommended'} stage's PPM (${referencePPM}).
This often results in temporary deficiency-like symptoms as the plant adjusts to reduced nutrient availability.

Adjustment Tip:
Consider scaling this stage's strength to match your prior feeding ratio.
If your previous feeding was ${multiplier.toFixed(2)}× ${isFirstWater ? 'the previous stage' : 'recommended'}, you may want to feed this stage at the same ratio.

💡 Suggestion:
Enable Luxury Uptake Mode to automatically match feed strength to your previous ratio.`);

      // Update luxury uptake state if enabled
      if (luxuryUptakeMode.enabled) {
        setLuxuryUptakeMode({
          enabled: true,
          multiplier: multiplier,
          warning: multiplier >= 1.8 ? 
            'Warning: High feed ratio detected. Monitor runoff EC and plant response carefully.' : 
            undefined
        });
      }
    } else {
      setTransitionWarning(null);
      if (luxuryUptakeMode.enabled) {
        setLuxuryUptakeMode(prev => ({
          ...prev,
          multiplier: 1,
          warning: undefined
        }));
      }
    }
  };

  // Update getSymptomWarnings to include stage-based conflicts
  const getSymptomWarnings = (selectedSymptoms: NutrientSymptom[]): Warning[] => {
    const warnings: Warning[] = [];
    
    // Check for conflicts first
    const hasNitrogenConflict = selectedSymptoms.includes(NutrientSymptom.N_DEFICIENCY) && 
                               selectedSymptoms.includes(NutrientSymptom.N_TOXICITY);
    const hasPhosphorusConflict = selectedSymptoms.includes(NutrientSymptom.P_DEFICIENCY) && 
                                   selectedSymptoms.includes(NutrientSymptom.P_TOXICITY);
    const hasPotassiumConflict = selectedSymptoms.includes(NutrientSymptom.K_DEFICIENCY) && 
                                    selectedSymptoms.includes(NutrientSymptom.K_TOXICITY);
    const hasCalciumConflict = selectedSymptoms.includes(NutrientSymptom.CA_DEFICIENCY) && 
                                  selectedSymptoms.includes(NutrientSymptom.CA_TOXICITY);
    const hasMagnesiumConflict = selectedSymptoms.includes(NutrientSymptom.MG_DEFICIENCY) && 
                                    selectedSymptoms.includes(NutrientSymptom.MG_TOXICITY);

    const hasConflicts = hasNitrogenConflict || hasPhosphorusConflict || hasPotassiumConflict || 
                        hasCalciumConflict || hasMagnesiumConflict;

    if (hasConflicts) {
      warnings.push({
        message: `⚠️ Conflicting Symptom Detected:
Both toxicity and deficiency symptoms selected for the same nutrient.
This often indicates pH imbalance, root health issues, salt buildup, or nutrient antagonism.
Recommended Action:
Perform a full flush with pH-balanced water, followed immediately by a refeed at your target PPM using a clean, balanced nutrient solution.
Verify root zone pH and EC runoff after flushing to ensure healthy conditions.`,
        priority: 1,
        type: 'conflict'
      });
      return warnings;
    }

    // Add stage-based conflicts
    warnings.push(...getStageBasedConflicts(selectedSymptoms));

    // Check for severe toxicity
    const toxicityCount = selectedSymptoms.filter(s => s.includes('Toxicity')).length;
    if (toxicityCount >= 3) {
      warnings.push({
        message: `⚠️ Severe Toxicity Detected:
Nutrient toxicity may be causing widespread lockout.
A full flush is recommended before adjusting feed.`,
        priority: 1,
        type: 'flush'
      });
      return warnings;
    }

    // Only check for underfeeding if no conflicts or severe toxicity
    const deficiencyCount = selectedSymptoms.filter(s => s.includes('Deficiency')).length;
    if (deficiencyCount >= 3) {
      warnings.push({
        message: `⚠️ Possible General Underfeeding:
Multiple major deficiencies detected.
Recommend increasing total PPM by +200 PPM, maintaining current nutrient ratios.`,
        priority: 3,
        type: 'severe'
      });
    }

    // Add antagonism warnings
    selectedSymptoms.forEach(symptom => {
      const modifier = SYMPTOM_MODIFIERS[symptom];
      if (modifier.warning) {
        warnings.push({
          message: modifier.warning,
          priority: 4,
          type: 'antagonism'
        });
      }
    });

    return warnings.sort((a, b) => a.priority - b.priority);
  };

  // Update calculateModifiers to use stage-specific adjustments
  const calculateModifiers = (): SymptomModifier => {
    const modifiers: SymptomModifier = {
      partA: 0,
      partB: 0,
      epsom: 0,
      bloom: 0,
      finish: 0
    };

    // Apply root size modifier first
    if (isSmallRoots) {
      const rootSizeModifier = -0.15; // -15% for small roots
      Object.keys(modifiers).forEach(key => {
        modifiers[key as keyof SymptomModifier] = rootSizeModifier;
      });
    }

    // Get stage configuration
    const stageConfig = STAGE_NUTRIENT_CONFIG[selectedStage];
    
    // Get all warnings
    const warnings = getSymptomWarnings(selectedSymptoms);
    const shouldFlush = warnings.some(w => w.type === 'flush');
    const isUnderfeeding = warnings.some(w => w.message.includes('Possible General Underfeeding'));
    
    if (!shouldFlush && !isUnderfeeding) {
      // Apply stage-specific symptom modifiers
      selectedSymptoms.forEach(symptom => {
        const adjustment = stageConfig.deficiencyAdjustments[symptom];
        if (adjustment.adjustment !== 0 && adjustment.nutrientToAdjust) {
          const nutrientKey = getNutrientKey(adjustment.nutrientToAdjust);
          if (nutrientKey) {
            // Cap adjustments at ±30%
            modifiers[nutrientKey] = Math.min(0.30, Math.max(-0.30, 
              (modifiers[nutrientKey] || 0) + adjustment.adjustment
            ));
          }
        }
      });
    }

    return modifiers;
  };

  // Update the component to display warnings
  const SymptomWarnings: React.FC<{ warnings: Warning[] }> = ({ warnings }) => {
    if (warnings.length === 0) return null;

    return (
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div 
            key={index} 
            className={`p-3 rounded ${
              warning.type === 'flush' || warning.type === 'conflict'
                ? 'bg-red-900/20 border border-red-900/30'
                : warning.type === 'severe'
                ? 'bg-yellow-900/20 border border-yellow-900/30'
                : 'bg-dark-bg-secondary border border-dark-border'
            }`}
          >
            <p className="text-sm whitespace-pre-line">{warning.message}</p>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to get PPM per gram for a nutrient
  const getPPMPerGram = (nutrient: string): number => {
    switch (nutrient) {
      case 'Part A': return PPM_CONTRIBUTION.partA;
      case 'Part B': return PPM_CONTRIBUTION.partB;
      case 'Epsom': return PPM_CONTRIBUTION.epsom;
      case 'Bloom': return PPM_CONTRIBUTION.bloom;
      case 'Finish': return PPM_CONTRIBUTION.finish;
      default: return 0;
    }
  };

  // Helper function to get nutrient key for calculations
  const getNutrientKey = (nutrient: string): keyof PPMAllocation | null => {
    switch (nutrient) {
      case 'Part A': return 'partA';
      case 'Part B': return 'partB';
      case 'Epsom': return 'epsom';
      case 'Bloom': return 'bloom';
      case 'Finish': return 'finish';
      default: return null;
    }
  };

  // Calculate runoff warning based on PPM values
  const getRunoffWarning = (): string => {
    if (!lastFeedPPM || !runoffPPM) return '';
    
    const lastFeedValue = parseInt(lastFeedPPM);
    const runoffValue = parseInt(runoffPPM);
    const percentChange = ((runoffValue - lastFeedValue) / lastFeedValue) * 100;
    
    if (percentChange > 20) {
      return 'Warning: Runoff PPM is significantly higher than feed PPM. Consider reducing nutrient strength.';
    } else if (percentChange < -20) {
      return 'Warning: Runoff PPM is significantly lower than feed PPM. Consider increasing nutrient strength.';
    } else if (percentChange > 10) {
      return 'Note: Runoff PPM is moderately higher than feed PPM.';
    } else if (percentChange < -10) {
      return 'Note: Runoff PPM is moderately lower than feed PPM.';
    }
    return 'Runoff PPM is within acceptable range.';
  };

  // Memoize nutrient calculations
  const nutrientCalc = useMemo(() => calculateNutrients(), [
    selectedStage,
    volume,
    isSmallRoots,
    sourceWaterPPM,
    isPPM700,
    targetPPM,
    selectedSymptoms
  ]);

  // Calculate if we're in an underfeeding state
  const isUnderfeeding = useMemo(() => {
    const warnings = getSymptomWarnings(selectedSymptoms);
    return warnings.some(w => w.message.includes('Possible General Underfeeding'));
  }, [selectedSymptoms]);

  // Add effect to check luxury uptake conditions when relevant values change
  useEffect(() => {
    checkLuxuryUptakeConditions();
  }, [lastFeedPPM, selectedStage, isPPM700, isFirstWater]);

  // Function to get current calculator data for the modal
  const getCurrentCalculatorData = () => ({
    // Basic info
    logType: LogType.WATERING,
    stage: (() => {
      // Map calculator stages to enum values
      switch (selectedStage) {
        case 'propagation': return Stage.PROPAGATION;
        case 'vegetative': return Stage.VEGETATIVE;
        case 'budset': return Stage.BUDSET;
        case 'flower': return Stage.FLOWER;
        case 'lateflower': return Stage.LATEFLOWER;
        case 'flush': return Stage.FLUSH;
        default: return Stage.VEGETATIVE;
      }
    })(),
    logTitle: `Watering - ${STAGE_DATA[selectedStage].name} Stage`,
    notes: `Nutrient mix: ${nutrientCalc ? 
      Object.entries(nutrientCalc)
        .filter(([key, value]) => key !== 'totalPPM' && key !== 'finalPPM' && value && typeof value === 'object' && 'grams' in value)
        .map(([key, value]) => `${key === 'partA' ? 'Part A' : key === 'partB' ? 'Part B' : key === 'epsom' ? 'Epsom' : key}: ${(value as any).grams.toFixed(2)}g`)
        .join(', ') : 'No nutrients'} | Target PPM: ${targetPPM} | Final PPM: ${nutrientCalc?.finalPPM.toFixed(1) || 0}`,
    
    // Water & Feeding data
    waterAmount: parseFloat(volume),
    waterUnit: VolumeUnit.GALLONS,
    nutrientWaterPh: parseFloat(feedPH),
    sourceWaterPpm: parseInt(sourceWaterPPM),
    nutrientWaterPpm: nutrientCalc?.finalPPM || 0,
    ppmScale: isPPM700 ? 'PPM_700' as const : 'PPM_500' as const,
    
    // Jack's 321 data
    jacks321Used: nutrientCalc ? 
      Object.keys(nutrientCalc).filter(key => 
        key !== 'totalPPM' && key !== 'finalPPM' && nutrientCalc[key as keyof NutrientCalculation]
      ) as any : [],
    jacks321Unit: 'GRAMS' as const,
    partAAmount: nutrientCalc?.partA?.grams ? Number(nutrientCalc.partA.grams.toFixed(2)) : undefined,
    partBAmount: nutrientCalc?.partB?.grams ? Number(nutrientCalc.partB.grams.toFixed(2)) : undefined,
    epsomAmount: nutrientCalc?.epsom?.grams ? Number(nutrientCalc.epsom.grams.toFixed(2)) : undefined,
    bloomAmount: nutrientCalc?.bloom?.grams ? Number(nutrientCalc.bloom.grams.toFixed(2)) : undefined,
    finishAmount: nutrientCalc?.finish?.grams ? Number(nutrientCalc.finish.grams.toFixed(2)) : undefined,
    
    // Jack's PPM values (calculated from grams)
    partAPpm: nutrientCalc?.partA?.ppmContribution,
    partBPpm: nutrientCalc?.partB?.ppmContribution,
    epsomPpm: nutrientCalc?.epsom?.ppmContribution,
    bloomPpm: nutrientCalc?.bloom?.ppmContribution,
    finishPpm: nutrientCalc?.finish?.ppmContribution,
    
    // Location (empty for user to select)
    selectedPlants: [], // Empty array means "all plants"
  });

  return (
    <div className="space-y-6">
      {/* Stage Selection Chart */}
      <div className="rounded-lg border border-dark-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>EC</TableHead>
              <TableHead>PPM ({isPPM700 ? '700' : '500'})</TableHead>
              <TableHead>Nutrients</TableHead>
              <TableHead>PPM Ratio</TableHead>
              {isCO2Enriched && <TableHead>CO₂ PPM Max</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(STAGE_DATA).map(([stage, data]) => (
              <TableRow 
                key={stage}
                className={`cursor-pointer transition-colors ${
                  selectedStage === stage 
                    ? 'bg-dark-bg-secondary border-l-2 border-l-primary' 
                    : 'hover:bg-dark-bg-primary'
                }`}
                onClick={() => setSelectedStage(stage as GrowStage)}
              >
                <TableCell>{data.name}</TableCell>
                <TableCell>{data.ec}</TableCell>
                <TableCell>{isPPM700 ? data.ppm700 : data.ppm500}</TableCell>
                <TableCell>{data.nutrients.join(', ')}</TableCell>
                <TableCell>
                  {data.ratios && data.ratios.length > 0 ? (
                    <>
                      {data.ratios.map(r => r.ratio).join(' : ')}
                      <span className="text-dark-text-secondary ml-2">
                        ({data.ratios.map(r => r.nutrient).join(' : ')})
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                {isCO2Enriched && <TableCell>{getDisplayCO2Max(stage as GrowStage)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CO₂ Optimization Note */}
      <Collapsible
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        className="border border-dark-border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-dark-bg-primary hover:bg-dark-bg-secondary transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="font-medium">Extreme CO₂ Optimization Mode (Advanced Growers Only)</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isAdvancedOpen ? 'transform rotate-180' : ''
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4 text-sm bg-dark-bg-secondary/50">
            <p>
              Some advanced cultivators operate successfully with feed and CO₂ levels up to <strong>2400 PPM</strong> — 
              well above standard recommendations — under exceptionally controlled conditions.
            </p>

            <div className="space-y-2">
              <p className="font-medium">📈 Verified parameters from real-world results:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>CO₂ Levels</strong>: ~2400 PPM (supplemented + monitored)</li>
                <li><strong>Feed PPM</strong>: Up to 2400 (500 scale)</li>
                <li><strong>Light Intensity (PPFD)</strong>: 1000–1300 µmol/m²/s</li>
                <li><strong>pH</strong>: 5.7–6.4 (buffered coco substrate)</li>
                <li><strong>Root Zone</strong>: Coco coir with beneficial microbes</li>
                <li><strong>Irrigation</strong>: Precision drip system</li>
                <li><strong>Water Source</strong>: Ozone-treated &amp; tested at less than 25 PPM</li>
                <li><strong>Water Temperature</strong>: Actively maintained in optimal range (typically 65–68°F / 18–20°C)</li>
                <li><strong>VPD</strong>: Monitored and adjusted for phase</li>
                <li><strong>Real-Time Monitoring</strong>: pH, EC, DO, runoff, and canopy/environmental conditions</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-lg">
              <p className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <strong>Warning:</strong>
              </p>
              <p>
                Exceeding 1600 PPM should only be attempted in environments with <strong>automated systems and full-spectrum environmental control</strong>. 
                For most grow operations, exceeding this threshold risks lockouts, microbial collapse, or reduced efficiency without tangible yield gains.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* pH Range Chart - Now Collapsible */}
      <Collapsible
        className="border border-dark-border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-dark-bg-primary hover:bg-dark-bg-secondary transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-medium">Nutrient Uptake pH Ranges</span>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Macronutrients */}
            <div>
              <h5 className="text-sm font-medium mb-2">Macronutrients</h5>
              <div className="space-y-1">
                {PH_RANGES.filter(range => range.category === 'macro').map((range, index) => {
                  const isOutOfRange = feedPH && (parseFloat(feedPH) < range.min || parseFloat(feedPH) > range.max);
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between text-sm ${
                        isOutOfRange ? 'text-red-400' : ''
                      }`}
                    >
                      <span className="w-24">{range.nutrient}</span>
                      <span>→</span>
                      <span className="w-20 text-right">{range.min} – {range.max}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micronutrients */}
            <div>
              <h5 className="text-sm font-medium mb-2">Micronutrients</h5>
              <div className="space-y-1">
                {PH_RANGES.filter(range => range.category === 'micro').map((range, index) => {
                  const isOutOfRange = feedPH && (parseFloat(feedPH) < range.min || parseFloat(feedPH) > range.max);
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between text-sm ${
                        isOutOfRange ? 'text-red-400' : ''
                      }`}
                    >
                      <span className="w-24">{range.nutrient}</span>
                      <span>→</span>
                      <span className="w-20 text-right">{range.min} – {range.max}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Growth Stages */}
            <div>
              <h5 className="text-sm font-medium mb-2">Growth Stages</h5>
              <div className="space-y-1">
                {PH_RANGES.filter(range => range.category === 'stage').map((range, index) => {
                  const isOutOfRange = feedPH && (parseFloat(feedPH) < range.min || parseFloat(feedPH) > range.max);
                  const isCurrentStage = (
                    (range.nutrient === 'Seedling' && selectedStage === 'propagation') ||
                    (range.nutrient === 'Veg' && selectedStage === 'vegetative') ||
                    (range.nutrient === 'Early Flower' && (selectedStage === 'budset' || selectedStage === 'flower')) ||
                    (range.nutrient === 'Late Flower' && selectedStage === 'lateflower')
                  );
                  return (
                    <div key={index} className="space-y-1">
                      <div 
                        className={`flex justify-between text-sm ${
                          isOutOfRange ? 'text-red-400' : ''
                        } ${isCurrentStage ? 'font-medium' : ''}`}
                      >
                        <span className="w-24">{range.nutrient}</span>
                        <span>→</span>
                        <span className="w-20 text-right">{range.min} – {range.max}</span>
                      </div>
                      {range.description && (
                        <p className="text-xs text-dark-text-secondary pl-4">
                          ({range.description})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Core Settings */}
      <div className="space-y-4">
        {/* CO₂ Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>CO₂ Enriched Environment</Label>
            <p className="text-sm text-dark-text-secondary">
              Higher PPM ranges may be tolerated with CO₂ supplementation
            </p>
          </div>
          <Switch
            checked={isCO2Enriched}
            onCheckedChange={setIsCO2Enriched}
            aria-label="Toggle CO2 enriched environment"
            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
          />
        </div>

        {/* PPM Scale Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>PPM Scale</Label>
            <p className="text-sm text-dark-text-secondary">
              Toggle between 500 and 700 scale PPM display
            </p>
          </div>
          <Switch
            checked={isPPM700}
            onCheckedChange={setIsPPM700}
            aria-label="Toggle PPM scale"
            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
          />
        </div>

        {/* Volume and Source Water Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="volume">Solution Volume (gallons)</Label>
              <InfoTooltip content="Enter the total volume of nutrient solution you want to mix" />
            </div>
            <CustomNumberInput
              value={parseFloat(volume)}
              onChange={(value) => setVolume(value.toString())}
              placeholder="Enter volume in gallons"
              className="bg-dark-bg-secondary border-dark-border"
              min={0.1}
              step={0.1}
              id="volume"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="sourceWaterPPM">Source Water PPM</Label>
              <InfoTooltip content="Enter the PPM of your source water before adding nutrients" />
            </div>
            <CustomNumberInput
              value={parseInt(sourceWaterPPM)}
              onChange={(value) => setSourceWaterPPM(value.toString())}
              placeholder="Enter source water PPM"
              className="bg-dark-bg-secondary border-dark-border"
              min={0}
              step={1}
              id="sourceWaterPPM"
            />
          </div>
        </div>

        {/* Target PPM Input */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="targetPPM">Target PPM (you can edit this)</Label>
            <InfoTooltip content="Default is set by growth stage, but you can adjust as needed" />
          </div>
          <CustomNumberInput
            value={parseInt(targetPPM)}
            onChange={(value) => setTargetPPM(value.toString())}
            placeholder="Enter target PPM"
            className="bg-dark-bg-secondary border-dark-border"
            min={0}
            step={50}
            id="targetPPM"
          />
        </div>

        {/* Advanced Options */}
        <Accordion type="single" collapsible className="border border-dark-border rounded-lg">
          <AccordionItem value="advanced" className="border-0">
            <AccordionTrigger className="px-4">Advanced Options</AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-4">
                {/* Root Ball Size */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smallRoots"
                      checked={isSmallRoots}
                      onCheckedChange={(checked) => setIsSmallRoots(checked as boolean)}
                      className="bg-dark-bg-secondary border-dark-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="smallRoots">
                        Small Root Ball
                      </Label>
                      <p className="text-sm text-dark-text-secondary">
                        Reduces nutrient strength to {ROOT_SIZE_MODIFIERS[RootSize.SMALL] * 100}% for seedlings, clones, or small plants
                      </p>
                    </div>
                  </div>
                </div>

                {isSmallRoots && (
                  <div className="mt-4 p-3 rounded bg-dark-bg-secondary border border-dark-border">
                    <p className="text-sm">
                      ℹ️ Amounts reduced to {ROOT_SIZE_MODIFIERS[RootSize.SMALL] * 100}% for small root ball
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastFeedPPM">Last Feed PPM</Label>
                    <CustomNumberInput
                      value={parseInt(lastFeedPPM)}
                      onChange={(value) => setLastFeedPPM(value.toString())}
                      placeholder="Enter last feed PPM"
                      className="bg-dark-bg-secondary border-dark-border"
                      min={0}
                      step={1}
                      id="lastFeedPPM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="runoffPPM">Runoff PPM</Label>
                    <CustomNumberInput
                      value={parseInt(runoffPPM)}
                      onChange={(value) => setRunoffPPM(value.toString())}
                      placeholder="Enter runoff PPM"
                      className="bg-dark-bg-secondary border-dark-border"
                      min={0}
                      step={1}
                      id="runoffPPM"
                    />
                  </div>
                </div>

                {/* pH Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="feedPH">Feed pH</Label>
                      <InfoTooltip content="Target pH range: 5.6-6.5. Outside this range can cause nutrient lockout." />
                    </div>
                    <CustomNumberInput
                      value={parseFloat(feedPH)}
                      onChange={(value) => setFeedPH(value.toString())}
                      placeholder="Enter feed pH"
                      className="bg-dark-bg-secondary border-dark-border"
                      min={0}
                      max={14}
                      step={0.1}
                      id="feedPH"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="runoffPH">Runoff pH</Label>
                      <InfoTooltip content="Compare with feed pH to detect root zone issues." />
                    </div>
                    <CustomNumberInput
                      value={runoffPH ? parseFloat(runoffPH) : undefined}
                      onChange={(value) => setRunoffPH(value ? value.toString() : '')}
                      placeholder="Enter runoff pH (optional)"
                      className="bg-dark-bg-secondary border-dark-border"
                      min={0}
                      max={14}
                      step={0.1}
                      id="runoffPH"
                    />
                  </div>
                </div>

                {/* pH and Runoff Warnings */}
                {(getPHWarnings().length > 0 || (lastFeedPPM && runoffPPM) || 
                  (lastFeedPPM && parseInt(lastFeedPPM) > (isPPM700 ? STAGE_DATA[selectedStage].ppm700 : STAGE_DATA[selectedStage].ppm500) + 150)) && (
                  <div className="p-3 rounded bg-yellow-900/20 border border-yellow-900/30">
                    {getPHWarnings().map((warning, index) => (
                      <p key={index} className="text-sm">{warning}</p>
                    ))}
                    {lastFeedPPM && runoffPPM && (
                      <p className="text-sm">{getRunoffWarning()}</p>
                    )}
                    {lastFeedPPM && parseInt(lastFeedPPM) > (isPPM700 ? STAGE_DATA[selectedStage].ppm700 : STAGE_DATA[selectedStage].ppm500) + 150 && (
                      <p className="text-sm">
                        ⚠️ Luxury Uptake Detected:
                        Your last feed may exceed this stage's recommended strength.
                        📌 See full warning at bottom of page.
                      </p>
                    )}
                  </div>
                )}

                {/* Symptom Selection */}
                <div className="space-y-4">
                  <Label>Nutrient Symptoms</Label>
                  <div className="space-y-1">
                    {Object.values(NutrientSymptom)
                      .filter(symptom => symptom.includes('Deficiency'))
                      .map(symptom => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSymptoms([...selectedSymptoms, symptom]);
                              } else {
                                setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                              }
                            }}
                            className="bg-dark-bg-secondary border-dark-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <Label>{symptom}</Label>
                        </div>
                      ))}
                    <Separator className="my-2" />
                    {Object.values(NutrientSymptom)
                      .filter(symptom => symptom.includes('Toxicity'))
                      .map(symptom => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSymptoms([...selectedSymptoms, symptom]);
                              } else {
                                setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                              }
                            }}
                            className="bg-dark-bg-secondary border-dark-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <Label>{symptom}</Label>
                        </div>
                      ))}
                  </div>

                  {/* Display Warnings */}
                  <SymptomWarnings warnings={getSymptomWarnings(selectedSymptoms)} />

                  {/* Display Active Modifiers */}
                  {selectedSymptoms.length > 0 && !isUnderfeeding && (
                    <div className="p-3 rounded bg-dark-bg-secondary border border-dark-border">
                      <h4 className="text-sm font-medium mb-2">Applied Modifiers</h4>
                      <div className="space-y-1">
                        {Object.entries(calculateModifiers()).map(([key, value]) => (
                          value !== 0 && (
                            <div key={key} className="flex justify-between text-sm">
                              <span>{key}</span>
                              <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {(value * 100).toFixed(1)}%
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Selected Stage Info */}
      <div className="p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            Selected: {STAGE_DATA[selectedStage].name}
          </h3>
          <p className="text-sm text-dark-text-secondary">
            Target EC: {STAGE_DATA[selectedStage].ec} | 
            Target PPM ({isPPM700 ? '700' : '500'}): {isPPM700 ? STAGE_DATA[selectedStage].ppm700 : STAGE_DATA[selectedStage].ppm500}
          </p>
          <p className="text-sm text-dark-text-secondary">
            Recommended nutrients: {STAGE_DATA[selectedStage].nutrients.join(', ')}
          </p>
        </div>
      </div>

      {/* Nutrient Calculation Results */}
      {selectedStage !== 'flush' && (
        <div className="p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Nutrient Mix for {volume} gallons
              </h3>

              {/* Luxury Uptake Badge */}
              {luxuryUptakeMode.enabled && luxuryUptakeMode.multiplier > 1 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/20 border border-yellow-900/30 rounded text-sm mb-2">
                  <span>🔄</span>
                  <span>Luxury Uptake: {(luxuryUptakeMode.multiplier * 100).toFixed(0)}%</span>
                </div>
              )}

              <p className="text-sm text-dark-text-secondary">
                Target PPM ({isPPM700 ? '700' : '500'}): {targetPPM}
              </p>
            </div>

            <Separator className="bg-dark-border" />

            <div className="space-y-3">
              {/* Epsom Salt - Always First */}
              {nutrientCalc.epsom && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Epsom Salt</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-dark-text-secondary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Always mix Epsom Salt first to avoid precipitates with calcium nitrate</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {(calculateModifiers().epsom ?? 0) !== 0 && (
                        <span className="ml-2 text-sm text-dark-text-secondary">
                          ({((calculateModifiers().epsom ?? 0) * 100).toFixed(1)}% modifier)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{nutrientCalc.epsom.grams.toFixed(2)}g</p>
                      <p className="text-sm text-dark-text-secondary">
                        Base: {(BASE_GRAMS_PER_GALLON.epsom * parseFloat(volume)).toFixed(2)}g | 
                        <span className="font-medium text-emerald-400"> Adds {nutrientCalc.epsom.ppmContribution.toFixed(1)} PPM</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Part A */}
              {nutrientCalc.partA && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Part A (5-12-26)</span>
                      {(calculateModifiers().partA ?? 0) !== 0 && (
                        <span className="ml-2 text-sm text-dark-text-secondary">
                          ({((calculateModifiers().partA ?? 0) * 100).toFixed(1)}% modifier)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{nutrientCalc.partA.grams.toFixed(2)}g</p>
                      <p className="text-sm text-dark-text-secondary">
                        Base: {(BASE_GRAMS_PER_GALLON.partA * parseFloat(volume)).toFixed(2)}g | 
                        <span className="font-medium text-emerald-400"> Adds {nutrientCalc.partA.ppmContribution.toFixed(1)} PPM</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Part B */}
              {nutrientCalc.partB && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Part B (Calcium Nitrate)</span>
                      {(calculateModifiers().partB ?? 0) !== 0 && (
                        <span className="ml-2 text-sm text-dark-text-secondary">
                          ({((calculateModifiers().partB ?? 0) * 100).toFixed(1)}% modifier)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{nutrientCalc.partB.grams.toFixed(2)}g</p>
                      <p className="text-sm text-dark-text-secondary">
                        Base: {(BASE_GRAMS_PER_GALLON.partB * parseFloat(volume)).toFixed(2)}g | 
                        <span className="font-medium text-emerald-400"> Adds {nutrientCalc.partB.ppmContribution.toFixed(1)} PPM</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloom */}
              {nutrientCalc.bloom && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Bloom (10-30-20)</span>
                      {(calculateModifiers().bloom ?? 0) !== 0 && (
                        <span className="ml-2 text-sm text-dark-text-secondary">
                          ({((calculateModifiers().bloom ?? 0) * 100).toFixed(1)}% modifier)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{nutrientCalc.bloom.grams.toFixed(2)}g</p>
                      <p className="text-sm text-dark-text-secondary">
                        Base: {(BASE_GRAMS_PER_GALLON.bloom * parseFloat(volume)).toFixed(2)}g | 
                        <span className="font-medium text-emerald-400"> Adds {nutrientCalc.bloom.ppmContribution.toFixed(1)} PPM</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Finish */}
              {nutrientCalc.finish && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Finish (7-15-30)</span>
                      {(calculateModifiers().finish ?? 0) !== 0 && (
                        <span className="ml-2 text-sm text-dark-text-secondary">
                          ({((calculateModifiers().finish ?? 0) * 100).toFixed(1)}% modifier)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{nutrientCalc.finish.grams.toFixed(2)}g</p>
                      <p className="text-sm text-dark-text-secondary">
                        Base: {(BASE_GRAMS_PER_GALLON.finish * parseFloat(volume)).toFixed(2)}g | 
                        <span className="font-medium text-emerald-400"> Adds {nutrientCalc.finish.ppmContribution.toFixed(1)} PPM</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="bg-dark-border" />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Source Water PPM</span>
                  <span>{sourceWaterPPM}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nutrient PPM Added</span>
                  <span className="font-medium text-emerald-400">{nutrientCalc.totalPPM.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Final Solution PPM</span>
                  <span className="text-emerald-400">{nutrientCalc.finalPPM.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStage === 'flush' && (
        <div className="p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
          <p className="text-center text-dark-text-secondary py-2">
            Flush with plain pH-adjusted water
          </p>
        </div>
      )}

      {/* Luxury Uptake Mode Toggle */}
      {selectedStage !== 'propagation' && selectedStage !== 'flush' && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Luxury Uptake Mode</Label>
            <p className="text-sm text-dark-text-secondary">
              Automatically scale feed strength to match your last feed ratio
            </p>
          </div>
          <Switch
            checked={luxuryUptakeMode.enabled}
            onCheckedChange={(checked) => {
              const lastFeedValue = parseInt(lastFeedPPM);
              const stageData = STAGE_DATA[selectedStage];
              const recommendedPPM = isPPM700 ? stageData.ppm700 : stageData.ppm500;
              const multiplier = lastFeedValue && recommendedPPM ? 
                Math.min(lastFeedValue / recommendedPPM, 1.8) : 1;

              setLuxuryUptakeMode({
                enabled: checked,
                multiplier: checked && multiplier > 1 ? multiplier : 1,
                warning: multiplier >= 1.8 ? 
                  'Warning: High feed ratio detected. Monitor runoff EC and plant response carefully.' : 
                  undefined
              });
            }}
            aria-label="Toggle luxury uptake mode"
            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
          />
        </div>
      )}

      {/* Luxury Uptake Multiplier Display */}
      {luxuryUptakeMode.enabled && luxuryUptakeMode.multiplier > 1 && (
        <div className="p-3 rounded bg-dark-bg-secondary border border-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {(luxuryUptakeMode.multiplier).toFixed(2)}× Scaling Applied
            </span>
            {luxuryUptakeMode.warning && (
              <span className="text-sm text-yellow-400">
                {luxuryUptakeMode.warning}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transition Warning Display */}
      {transitionWarning && (
        <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-900/30">
          <p className="text-sm whitespace-pre-line">{transitionWarning}</p>
        </div>
      )}

      {/* Add First Water toggle after Luxury Uptake toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>First Water of New Stage</Label>
          <p className="text-sm text-dark-text-secondary">
            Calculate feed ratio based on previous stage's recommended PPM
          </p>
        </div>
        <Switch
          checked={isFirstWater}
          onCheckedChange={setIsFirstWater}
          aria-label="Toggle first water of new stage"
          className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
        />
      </div>

      {/* Add Watering Log Button */}
      {session?.user && nutrientCalc && nutrientCalc.totalPPM > 0 && (
        <div className="mt-6 pt-4 border-t border-dark-border">
          <Button
            onClick={() => setIsWateringLogModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Watering Log
          </Button>
        </div>
      )}

      {/* Watering Log Modal */}
      {session?.user && (
        <CreateLogModal
          isOpen={isWateringLogModalOpen}
          onClose={() => setIsWateringLogModalOpen(false)}
          userId={session.user.id}
          onSuccess={() => {
            setIsWateringLogModalOpen(false);
            // Optionally refresh or show success message
          }}
          initialValues={getCurrentCalculatorData()}
        />
      )}
    </div>
  );
} 