'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HelpCircle, ChevronDown } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
  type: 'flush' | 'conflict' | 'severe' | 'antagonism' | 'notice';
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
    ppm500: 775,
    ppm700: 1085,
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
    ppm500: 1050,
    ppm700: 1470,
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
  partA: 3.78,
  partB: 2.52,
  epsom: 0.99,
  bloom: 5.68,
  finish: 5.05,
};

// PPM contribution per gram per gallon
const PPM_CONTRIBUTION = {
  partA: 13.2,
  partB: 39.7,
  epsom: 23.0,
  bloom: 26.4,
  finish: 20.8,
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

  // Update target PPM when stage changes
  useEffect(() => {
    const newTargetPPM = isPPM700 ? 
      STAGE_DATA[selectedStage].ppm700.toString() : 
      STAGE_DATA[selectedStage].ppm500.toString();
    setTargetPPM(newTargetPPM);
  }, [selectedStage, isPPM700]);

  // Update target PPM when scale changes
  useEffect(() => {
    const newTargetPPM = isPPM700 ? 
      STAGE_DATA[selectedStage].ppm700.toString() : 
      STAGE_DATA[selectedStage].ppm500.toString();
    setTargetPPM(newTargetPPM);
  }, [isPPM700]);

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

  // Add helper functions for symptom processing
  const getSymptomWarnings = (selectedSymptoms: NutrientSymptom[]): Warning[] => {
    const warnings: Warning[] = [];
    
    // Check for conflicts (deficiency + toxicity of same nutrient)
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

    if (hasNitrogenConflict || hasPhosphorusConflict || hasPotassiumConflict || 
        hasCalciumConflict || hasMagnesiumConflict) {
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
    }

    // Check for severe toxicity (multiple toxicities selected)
    const toxicityCount = selectedSymptoms.filter(s => s.includes('Toxicity')).length;
    if (toxicityCount >= 3) {
      warnings.push({
        message: `⚠️ Severe Toxicity Detected:
Nutrient toxicity may be causing widespread lockout.
A full flush is recommended before adjusting feed.`,
        priority: 1,
        type: 'flush'
      });
    }

    // Check for general underfeeding
    const deficiencyCount = selectedSymptoms.filter(s => s.includes('Deficiency')).length;
    if (deficiencyCount >= 3) {
      warnings.push({
        message: `⚠️ Possible General Underfeeding:
Multiple major deficiencies detected.
Recommend increasing total PPM by +150 to +200 PPM, maintaining current nutrient ratios.`,
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

    // Special case: Iron deficiency + Phosphorus toxicity
    if (selectedSymptoms.includes(NutrientSymptom.FE_DEFICIENCY) && 
        selectedSymptoms.includes(NutrientSymptom.P_TOXICITY)) {
      warnings.push({
        message: "⚠️ Iron deficiency may be due to high phosphorus levels.",
        priority: 4,
        type: 'antagonism'
      });
    }

    return warnings.sort((a, b) => a.priority - b.priority);
  };

  // Update the calculate modifiers function
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

    // Get all warnings
    const warnings = getSymptomWarnings(selectedSymptoms);
    const shouldFlush = warnings.some(w => w.type === 'flush');
    
    if (!shouldFlush) {
      // Apply symptom modifiers if not flushing
      selectedSymptoms.forEach(symptom => {
        const symptomMod = SYMPTOM_MODIFIERS[symptom];
        Object.entries(symptomMod).forEach(([key, value]) => {
          if (key !== 'warning' && typeof value === 'number') {
            const nutrientKey = key as keyof SymptomModifier;
            // Cap adjustments at ±30%
            modifiers[nutrientKey] = Math.min(0.30, Math.max(-0.30, 
              (modifiers[nutrientKey] || 0) + value
            ));
          }
        });
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

  // Calculate nutrient amounts based on stage, volume, and modifiers
  const calculateNutrients = (): NutrientCalculation => {
    if (selectedStage === 'flush') {
      return {
        totalPPM: 0,
        finalPPM: parseInt(sourceWaterPPM)
      };
    }

    const stageData = STAGE_DATA[selectedStage];
    const volumeNum = parseFloat(volume);
    const targetPPMNum = parseInt(targetPPM || '0');
    const sourcePPMNum = parseInt(sourceWaterPPM);
    const nutrientPPM = targetPPMNum - sourcePPMNum;
    const modifiers = calculateModifiers();

    // Calculate weighted PPM total and shares
    let weightedPPM = 0;
    const ppmShares: PPMAllocation = {};

    if (stageData.ratios && stageData.ratios.length > 0) {
      // Calculate total weighted PPM
      weightedPPM = stageData.ratios.reduce((total, { nutrient, ratio }) => {
        const ppmPerGram = getPPMPerGram(nutrient);
        return total + (ratio * ppmPerGram);
      }, 0);

      // Calculate PPM shares
      stageData.ratios.forEach(({ nutrient, ratio }) => {
        const ppmPerGram = getPPMPerGram(nutrient);
        const share = (ratio * ppmPerGram) / weightedPPM;
        const nutrientKey = getNutrientKey(nutrient);
        if (nutrientKey) {
          ppmShares[nutrientKey] = share;
        }
      });
    }

    // Initialize calculation result
    const calc: NutrientCalculation = {
      totalPPM: 0,
      finalPPM: sourcePPMNum
    };

    // Calculate grams and PPM for each nutrient
    Object.entries(ppmShares).forEach(([nutrientKey, share]) => {
      if (share && share > 0) {
        const allocatedPPM = nutrientPPM * share;
        const ppmPerGram = PPM_CONTRIBUTION[nutrientKey as keyof typeof PPM_CONTRIBUTION];
        const baseGrams = (allocatedPPM / ppmPerGram) * volumeNum;
        const modifier = 1 + (modifiers[nutrientKey as keyof SymptomModifier] || 0);
        const adjustedGrams = baseGrams * modifier;
        const nutrientAmount: NutrientAmount = {
          grams: adjustedGrams,
          ppmContribution: (adjustedGrams / volumeNum) * ppmPerGram
        };

        (calc as any)[nutrientKey] = nutrientAmount;
        calc.totalPPM += nutrientAmount.ppmContribution;
      }
    });

    calc.finalPPM = calc.totalPPM + sourcePPMNum;
    return calc;
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
                {isCO2Enriched && <TableCell>{data.co2Max || '—'}</TableCell>}
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
          />
        </div>

        {/* Volume and Source Water Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="volume">Solution Volume (gallons)</Label>
              <InfoTooltip content="Enter the total volume of nutrient solution you want to mix" />
            </div>
            <Input
              id="volume"
              type="number"
              min="0.1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Enter volume in gallons"
              className="bg-dark-bg-secondary border-dark-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="sourceWaterPPM">Source Water PPM</Label>
              <InfoTooltip content="Enter the PPM of your source water before adding nutrients" />
            </div>
            <Input
              id="sourceWaterPPM"
              type="number"
              min="0"
              step="1"
              value={sourceWaterPPM}
              onChange={(e) => setSourceWaterPPM(e.target.value)}
              placeholder="Enter source water PPM"
              className="bg-dark-bg-secondary border-dark-border"
            />
          </div>
        </div>

        {/* Target PPM Input */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="targetPPM">Target PPM (you can edit this)</Label>
            <InfoTooltip content="Default is set by growth stage, but you can adjust as needed" />
          </div>
          <Input
            id="targetPPM"
            type="number"
            min="0"
            step="50"
            value={targetPPM}
            onChange={(e) => setTargetPPM(e.target.value)}
            placeholder="Enter target PPM"
            className="bg-dark-bg-secondary border-dark-border"
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
                      className="bg-dark-bg-secondary border-dark-border"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastFeedPPM">Last Feed PPM</Label>
                    <Input
                      id="lastFeedPPM"
                      type="number"
                      value={lastFeedPPM}
                      onChange={(e) => setLastFeedPPM(e.target.value)}
                      placeholder="Enter last feed PPM"
                      className="bg-dark-bg-secondary border-dark-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="runoffPPM">Runoff PPM</Label>
                    <Input
                      id="runoffPPM"
                      type="number"
                      value={runoffPPM}
                      onChange={(e) => setRunoffPPM(e.target.value)}
                      placeholder="Enter runoff PPM"
                      className="bg-dark-bg-secondary border-dark-border"
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
                    <Input
                      id="feedPH"
                      type="number"
                      value={feedPH}
                      onChange={(e) => setFeedPH(e.target.value)}
                      placeholder="Enter feed pH"
                      min="0"
                      max="14"
                      step="0.1"
                      className="bg-dark-bg-secondary border-dark-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="runoffPH">Runoff pH</Label>
                      <InfoTooltip content="Compare with feed pH to detect root zone issues." />
                    </div>
                    <Input
                      id="runoffPH"
                      type="number"
                      value={runoffPH}
                      onChange={(e) => setRunoffPH(e.target.value)}
                      placeholder="Enter runoff pH (optional)"
                      min="0"
                      max="14"
                      step="0.1"
                      className="bg-dark-bg-secondary border-dark-border"
                    />
                  </div>
                </div>

                {/* pH Warnings */}
                {getPHWarnings().length > 0 && (
                  <div className="p-3 rounded bg-yellow-900/20 border border-yellow-900/30">
                    {getPHWarnings().map((warning, index) => (
                      <p key={index} className="text-sm">{warning}</p>
                    ))}
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
                            className="bg-dark-bg-secondary border-dark-border"
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
                            className="bg-dark-bg-secondary border-dark-border"
                          />
                          <Label>{symptom}</Label>
                        </div>
                      ))}
                  </div>

                  {/* Display Warnings */}
                  <SymptomWarnings warnings={getSymptomWarnings(selectedSymptoms)} />

                  {/* Display Active Modifiers */}
                  {selectedSymptoms.length > 0 && (
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

                {lastFeedPPM && runoffPPM && (
                  <div className="p-3 rounded bg-dark-bg-primary border border-dark-border">
                    <p className="text-sm">{getRunoffWarning()}</p>
                  </div>
                )}

                {isSmallRoots && (
                  <div className="mt-4 p-3 rounded bg-dark-bg-secondary border border-dark-border">
                    <p className="text-sm">
                      ℹ️ Amounts reduced to {ROOT_SIZE_MODIFIERS[RootSize.SMALL] * 100}% for small root ball
                    </p>
                  </div>
                )}
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
              <p className="text-sm text-dark-text-secondary">
                Target PPM ({isPPM700 ? '700' : '500'}): {targetPPM}
              </p>
            </div>

            <Separator className="bg-dark-border" />

            <div className="space-y-3">
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

              {nutrientCalc.epsom && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Epsom Salt</span>
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
    </div>
  );
} 