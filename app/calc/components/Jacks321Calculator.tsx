'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HelpCircle } from 'lucide-react';
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

// Types and Enums
type GrowStage = 'propagation' | 'vegetative' | 'budset' | 'flower' | 'lateflower' | 'flush';

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

export default function Jacks321Calculator() {
  // Core state
  const [selectedStage, setSelectedStage] = useState<GrowStage>('vegetative');
  const [isCO2Enriched, setIsCO2Enriched] = useState(false);
  const [isPPM700, setIsPPM700] = useState(false);
  const [volume, setVolume] = useState('5');
  const [sourceWaterPPM, setSourceWaterPPM] = useState('150');
  
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

  return (
    <Card className="p-6 bg-dark-bg-secondary border-dark-border">
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

        {/* Core Settings */}
        <div className="space-y-4">
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
        </div>

        {/* Results Preview */}
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
      </div>
    </Card>
  );
} 