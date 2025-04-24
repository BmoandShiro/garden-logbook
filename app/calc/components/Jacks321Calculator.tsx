'use client';

import { useState, useMemo } from 'react';
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

// Types and Enums
type GrowStage = 'propagation' | 'vegetative' | 'budset' | 'flower' | 'lateflower' | 'flush';

enum RootSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}

interface StageData {
  name: string;
  ec: number;
  ppm500: number;
  ppm700: number;
  nutrients: string[];
  co2Max?: number;
}

const STAGE_DATA: Record<GrowStage, StageData> = {
  propagation: {
    name: 'Propagation',
    ec: 1.1,
    ppm500: 775,
    ppm700: 1085,
    nutrients: ['Clone formula'],
    co2Max: 1000,
  },
  vegetative: {
    name: 'Vegetative',
    ec: 2.4,
    ppm500: 1200,
    ppm700: 1680,
    nutrients: ['Part A', 'Part B', 'Epsom'],
    co2Max: 1600,
  },
  budset: {
    name: 'Bud Set',
    ec: 1.9,
    ppm500: 1050,
    ppm700: 1470,
    nutrients: ['Bloom', 'Epsom'],
    co2Max: 1400,
  },
  flower: {
    name: 'Flower',
    ec: 2.4,
    ppm500: 1200,
    ppm700: 1680,
    nutrients: ['Part A', 'Part B', 'Epsom'],
    co2Max: 1600,
  },
  lateflower: {
    name: 'Late Flower',
    ec: 2.1,
    ppm500: 1050,
    ppm700: 1470,
    nutrients: ['Finish', 'Epsom'],
    co2Max: 1400,
  },
  flush: {
    name: 'Flush',
    ec: 0,
    ppm500: 0,
    ppm700: 0,
    nutrients: ['Clear water'],
  },
};

const BASE_GRAMS_PER_GALLON = {
  partA: 3.78,
  partB: 2.52,
  epsom: 0.99,
  bloom: 5.68,
  finish: 5.05,
};

const PPM_CONTRIBUTION = {
  partA: 13.2,
  partB: 39.7,
  epsom: 23.0,
  bloom: 26.4,
  finish: 20.8,
};

// Root size options
const ROOT_SIZE_OPTIONS = [
  { value: RootSize.SMALL, label: 'Small (1-2 gal)' },
  { value: RootSize.MEDIUM, label: 'Medium (3-4 gal)' },
  { value: RootSize.LARGE, label: 'Large (5+ gal)' },
];

// Root size modifiers (percentage of base amount)
const ROOT_SIZE_MODIFIERS: { [key in RootSize]: number } = {
  [RootSize.SMALL]: 0.7, // 70% of base amount for small roots
  [RootSize.MEDIUM]: 0.85, // 85% of base amount for medium roots
  [RootSize.LARGE]: 1.0, // 100% of base amount for large roots (base)
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

export default function Jacks321Calculator() {
  // Core state
  const [selectedStage, setSelectedStage] = useState<GrowStage>('vegetative');
  const [isCO2Enriched, setIsCO2Enriched] = useState(false);
  const [isPPM700, setIsPPM700] = useState(false);
  const [volume, setVolume] = useState('5');
  const [sourceWaterPPM, setSourceWaterPPM] = useState('150');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [rootSize, setRootSize] = useState<RootSize>(RootSize.LARGE);
  const [lastFeedPPM, setLastFeedPPM] = useState('');
  const [runoffPPM, setRunoffPPM] = useState('');
  
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

  // Calculate nutrient amounts based on stage, volume, and root size
  const calculateNutrients = (): NutrientCalculation => {
    if (selectedStage === 'flush') {
      return {
        totalPPM: 0,
        finalPPM: parseInt(sourceWaterPPM)
      };
    }

    const stageData = STAGE_DATA[selectedStage];
    const targetPPM = isPPM700 ? stageData.ppm700 : stageData.ppm500;
    const volumeNum = parseFloat(volume);
    const modifier = ROOT_SIZE_MODIFIERS[rootSize];

    // Base calculations (grams per gallon * volume * root size modifier)
    const calc: NutrientCalculation = {
      totalPPM: 0,
      finalPPM: parseInt(sourceWaterPPM)
    };

    if (stageData.nutrients.includes('Part A')) {
      calc.partA = {
        grams: BASE_GRAMS_PER_GALLON.partA * volumeNum * modifier,
        ppmContribution: PPM_CONTRIBUTION.partA * modifier
      };
      calc.totalPPM += calc.partA.ppmContribution;
    }

    if (stageData.nutrients.includes('Part B')) {
      calc.partB = {
        grams: BASE_GRAMS_PER_GALLON.partB * volumeNum * modifier,
        ppmContribution: PPM_CONTRIBUTION.partB * modifier
      };
      calc.totalPPM += calc.partB.ppmContribution;
    }

    if (stageData.nutrients.includes('Bloom')) {
      calc.bloom = {
        grams: BASE_GRAMS_PER_GALLON.bloom * volumeNum * modifier,
        ppmContribution: PPM_CONTRIBUTION.bloom * modifier
      };
      calc.totalPPM += calc.bloom.ppmContribution;
    }

    if (stageData.nutrients.includes('Finish')) {
      calc.finish = {
        grams: BASE_GRAMS_PER_GALLON.finish * volumeNum * modifier,
        ppmContribution: PPM_CONTRIBUTION.finish * modifier
      };
      calc.totalPPM += calc.finish.ppmContribution;
    }

    if (stageData.nutrients.includes('Epsom')) {
      calc.epsom = {
        grams: BASE_GRAMS_PER_GALLON.epsom * volumeNum * modifier,
        ppmContribution: PPM_CONTRIBUTION.epsom * modifier
      };
      calc.totalPPM += calc.epsom.ppmContribution;
    }

    calc.finalPPM = calc.totalPPM + parseInt(sourceWaterPPM);
    return calc;
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
    rootSize,
    sourceWaterPPM,
    isPPM700
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
              {isCO2Enriched && <TableHead>CO₂ PPM Max</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(STAGE_DATA).map(([stage, data]) => (
              <TableRow 
                key={stage}
                className={`cursor-pointer hover:bg-dark-bg-primary ${
                  selectedStage === stage ? 'bg-dark-bg-primary' : ''
                }`}
                onClick={() => setSelectedStage(stage as GrowStage)}
              >
                <TableCell>{data.name}</TableCell>
                <TableCell>{data.ec}</TableCell>
                <TableCell>{isPPM700 ? data.ppm700 : data.ppm500}</TableCell>
                <TableCell>{data.nutrients.join(', ')}</TableCell>
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
              className="bg-dark-bg-primary border-dark-border"
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
              className="bg-dark-bg-primary border-dark-border"
            />
          </div>
        </div>

        {/* Advanced Options */}
        <Accordion type="single" collapsible className="border border-dark-border rounded-lg">
          <AccordionItem value="advanced" className="border-0">
            <AccordionTrigger className="px-4">Advanced Options</AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Root Ball Size</Label>
                  <Select 
                    value={rootSize} 
                    onValueChange={(value: string) => setRootSize(value as RootSize)}
                  >
                    <SelectTrigger className="w-full bg-dark-bg-secondary border-dark-border text-dark-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-bg-secondary border-dark-border">
                      {ROOT_SIZE_OPTIONS.map(option => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-dark-text-primary hover:bg-dark-bg-primary focus:bg-dark-bg-primary"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      className="bg-dark-bg-primary border-dark-border"
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
                      className="bg-dark-bg-primary border-dark-border"
                    />
                  </div>
                </div>

                {lastFeedPPM && runoffPPM && (
                  <div className="p-3 rounded bg-dark-bg-primary border border-dark-border">
                    <p className="text-sm">{getRunoffWarning()}</p>
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
            </div>

            <Separator className="bg-dark-border" />

            <div className="space-y-3">
              {nutrientCalc.partA && (
                <div className="flex justify-between items-center">
                  <span>Part A (5-12-26)</span>
                  <div className="text-right">
                    <p className="font-medium">{nutrientCalc.partA.grams}g</p>
                    <p className="text-sm text-dark-text-secondary">
                      Adds {nutrientCalc.partA.ppmContribution} PPM
                    </p>
                  </div>
                </div>
              )}

              {nutrientCalc.partB && (
                <div className="flex justify-between items-center">
                  <span>Part B (Calcium Nitrate)</span>
                  <div className="text-right">
                    <p className="font-medium">{nutrientCalc.partB.grams}g</p>
                    <p className="text-sm text-dark-text-secondary">
                      Adds {nutrientCalc.partB.ppmContribution} PPM
                    </p>
                  </div>
                </div>
              )}

              {nutrientCalc.bloom && (
                <div className="flex justify-between items-center">
                  <span>Bloom (10-30-20)</span>
                  <div className="text-right">
                    <p className="font-medium">{nutrientCalc.bloom.grams}g</p>
                    <p className="text-sm text-dark-text-secondary">
                      Adds {nutrientCalc.bloom.ppmContribution} PPM
                    </p>
                  </div>
                </div>
              )}

              {nutrientCalc.finish && (
                <div className="flex justify-between items-center">
                  <span>Finish (7-15-30)</span>
                  <div className="text-right">
                    <p className="font-medium">{nutrientCalc.finish.grams}g</p>
                    <p className="text-sm text-dark-text-secondary">
                      Adds {nutrientCalc.finish.ppmContribution} PPM
                    </p>
                  </div>
                </div>
              )}

              {nutrientCalc.epsom && (
                <div className="flex justify-between items-center">
                  <span>Epsom Salt</span>
                  <div className="text-right">
                    <p className="font-medium">{nutrientCalc.epsom.grams}g</p>
                    <p className="text-sm text-dark-text-secondary">
                      Adds {nutrientCalc.epsom.ppmContribution} PPM
                    </p>
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
                  <span>{nutrientCalc.totalPPM}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Final Solution PPM</span>
                  <span>{nutrientCalc.finalPPM}</span>
                </div>
              </div>

              {rootSize !== RootSize.LARGE && (
                <div className="mt-4 p-3 rounded bg-dark-bg-secondary border border-dark-border">
                  <p className="text-sm">
                    ℹ️ Amounts adjusted for {ROOT_SIZE_OPTIONS.find(opt => opt.value === rootSize)?.label}
                  </p>
                </div>
              )}
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