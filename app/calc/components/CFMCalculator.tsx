'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

export default function CFMCalculator() {
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    interval: '2',
  });
  const [isClosedLoop, setIsClosedLoop] = useState(true);
  const [hasScrubbing, setHasScrubbing] = useState(true);
  const [heatBoost, setHeatBoost] = useState(false);

  const calculateCFM = () => {
    const { length, width, height, interval } = dimensions;
    if (!length || !width || !height || !interval) return null;
    
    const baseCFM = (Number(length) * Number(width) * Number(height)) / Number(interval);
    const roundedBaseCFM = Math.round(baseCFM);
    
    let modifiedCFM = roundedBaseCFM;
    const modifiers: string[] = [];
    
    if (isClosedLoop && hasScrubbing) {
      modifiedCFM *= 1.25;
      modifiers.push('25% for carbon filter');
    }
    
    if (heatBoost) {
      modifiedCFM *= 1.25;
      modifiers.push('25% for high-heat setup');
    }
    
    return {
      base: roundedBaseCFM,
      modified: Math.round(modifiedCFM),
      modifiers,
    };
  };

  const cfm = calculateCFM();

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="length">Room Length (ft)</Label>
              <InfoTooltip content="Enter your room's interior dimensions in feet. This will calculate the total air volume of the space." />
            </div>
            <CustomNumberInput
              value={dimensions.length ? parseFloat(dimensions.length) : undefined}
              onChange={(value) => setDimensions({ ...dimensions, length: value.toString() })}
              placeholder="Enter length"
              className="bg-dark-bg-primary border-dark-border"
              min={0}
              step={0.1}
              id="length"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="width">Room Width (ft)</Label>
              <InfoTooltip content="Enter your room's interior dimensions in feet. This will calculate the total air volume of the space." />
            </div>
            <CustomNumberInput
              value={dimensions.width ? parseFloat(dimensions.width) : undefined}
              onChange={(value) => setDimensions({ ...dimensions, width: value.toString() })}
              placeholder="Enter width"
              className="bg-dark-bg-primary border-dark-border"
              min={0}
              step={0.1}
              id="width"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="height">Room Height (ft)</Label>
              <InfoTooltip content="Enter your room's interior dimensions in feet. This will calculate the total air volume of the space." />
            </div>
            <CustomNumberInput
              value={dimensions.height ? parseFloat(dimensions.height) : undefined}
              onChange={(value) => setDimensions({ ...dimensions, height: value.toString() })}
              placeholder="Enter height"
              className="bg-dark-bg-primary border-dark-border"
              min={0}
              step={0.1}
              id="height"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="interval">Exchange Interval (minutes)</Label>
              <InfoTooltip content="How often do you want the air fully exchanged? 1–3 minutes is typical for grow rooms." />
            </div>
            <CustomNumberInput
              value={dimensions.interval ? parseFloat(dimensions.interval) : undefined}
              onChange={(value) => setDimensions({ ...dimensions, interval: value.toString() })}
              placeholder="Enter interval"
              className="bg-dark-bg-primary border-dark-border"
              min={0.1}
              step={0.1}
              id="interval"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Room Type</Label>
                <p className="text-sm text-dark-text-secondary">
                  {isClosedLoop 
                    ? "Closed Loop (no exhaust to outside)"
                    : "Open Loop (exhaust to outside)"}
                </p>
              </div>
              <Switch
                checked={isClosedLoop}
                onCheckedChange={setIsClosedLoop}
                aria-label="Toggle room type"
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
              />
            </div>

            {isClosedLoop && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Carbon Filter Scrubbing</Label>
                  <p className="text-sm text-dark-text-secondary">
                    Carbon filters and ducting reduce airflow — adds 25% CFM for scrubbing setups.
                  </p>
                </div>
                <Switch
                  checked={hasScrubbing}
                  onCheckedChange={setHasScrubbing}
                  aria-label="Toggle scrubbing setup"
                  className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-dark-border"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="heatBoost" 
                checked={heatBoost} 
                onCheckedChange={(checked) => setHeatBoost(checked as boolean)}
                className="bg-dark-bg-secondary border-dark-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <Label htmlFor="heatBoost">
                Add extra 25% boost for high-heat setups (HPS or high-power LED + filter)
              </Label>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">
                {cfm !== null
                  ? cfm.modifiers.length > 0
                    ? `Recommended CFM with modifiers: ${cfm.modified} CFM`
                    : `You need a fan rated at ${cfm.base} CFM`
                  : 'Enter dimensions to calculate required CFM'}
              </h3>
              <InfoTooltip content="CFM = Cubic Feet per Minute. This is the minimum fan strength needed to move all the air in your room at the selected rate." />
            </div>
            {cfm && cfm.modifiers.length > 0 && (
              <p className="text-sm text-dark-text-secondary">
                (base: {cfm.base} + {cfm.modifiers.join(' + ')})
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 