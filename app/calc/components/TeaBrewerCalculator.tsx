'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
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
        className="w-full px-3 py-2 text-sm bg-dark-bg-primary border border-dark-border rounded focus:border-garden-500 focus:ring-1 focus:ring-garden-500 focus:outline-none pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pt-2"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pb-2"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

type GrowthStage = 'Seedling' | 'Veg' | 'Flower';

interface TeaRecipe {
  earthworm_castings: string;
  fish_kelp_extract: string;
  molasses: string;
}

const TEA_RECIPES: Record<GrowthStage, TeaRecipe> = {
  Seedling: {
    earthworm_castings: "0.5 cups",
    fish_kelp_extract: "2–5 mL",
    molasses: "0–1 tsp",
  },
  Veg: {
    earthworm_castings: "1 cup",
    fish_kelp_extract: "10–15 mL",
    molasses: "1 tbsp",
  },
  Flower: {
    earthworm_castings: "1 cup",
    fish_kelp_extract: "5–10 mL",
    molasses: "1 tbsp",
  },
};

const getBrewDuration = (temperature: number): string => {
  if (temperature < 65) return "36–48 hours";
  if (temperature >= 65 && temperature <= 75) return "24–36 hours";
  if (temperature > 75 && temperature <= 78) return "12–24 hours";
  if (temperature > 80) return "12–15 hours max";
  return "24–36 hours"; // Default for 78-80°F
};

const parseAmount = (amount: string): { value: number; unit: string } => {
  const match = amount.match(/^([\d.–]+)\s*(.+)$/);
  if (!match) return { value: 0, unit: '' };
  
  const value = parseFloat(match[1].replace('–', '.'));
  const unit = match[2];
  
  return { value, unit };
};

const calculateTotalAmount = (amount: string, gallons: number): string => {
  const { value, unit } = parseAmount(amount);
  const total = value * gallons;
  
  if (unit === 'cups') return `${total} cups`;
  if (unit === 'mL') return `${total} mL`;
  if (unit === 'tbsp') return `${total} tbsp`;
  if (unit === 'tsp') return `${total} tsp`;
  
  return `${total} ${unit}`;
};

export default function TeaBrewerCalculator() {
  const [selectedStage, setSelectedStage] = useState<GrowthStage>('Veg');
  const [brewSize, setBrewSize] = useState<number>(5);
  const [waterTemp, setWaterTemp] = useState<number>(72);

  const recipe = TEA_RECIPES[selectedStage];
  const brewDuration = getBrewDuration(waterTemp);

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
        <div>
          <h2 className="text-xl font-semibold mb-2">Compost Tea Brewer Calculator</h2>
          <p className="text-sm text-dark-text-secondary">
            Calculate ingredient amounts for brewing compost tea based on growth stage and brew size.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="growthStage">Growth Stage</Label>
              <InfoTooltip content="Select the current growth stage to determine appropriate ingredient ratios" />
            </div>
            <select
              id="growthStage"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as GrowthStage)}
              className="w-full px-3 py-2 text-sm bg-dark-bg-primary border border-dark-border rounded focus:border-garden-500 focus:ring-1 focus:ring-garden-500 focus:outline-none text-dark-text-primary"
            >
              <option value="Seedling">Seedling</option>
              <option value="Veg">Veg</option>
              <option value="Flower">Flower</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="brewSize">Brew Size (gallons)</Label>
              <InfoTooltip content="Enter the total volume of tea you want to brew" />
            </div>
            <CustomNumberInput
              value={brewSize}
              onChange={setBrewSize}
              placeholder="Enter brew size"
              className="bg-dark-bg-primary border-dark-border"
              min={1}
              step={1}
              id="brewSize"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="waterTemp">Water Temperature (°F)</Label>
            <InfoTooltip content="Water temperature affects brew duration and microbial activity" />
          </div>
          <CustomNumberInput
            value={waterTemp}
            onChange={setWaterTemp}
            placeholder="Enter water temperature"
            className="bg-dark-bg-primary border-dark-border"
            min={50}
            max={90}
            step={1}
            id="waterTemp"
          />
        </div>

        {/* Results */}
        <div className="p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Recipe for {brewSize} gallons during {selectedStage} stage:
              </h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Earthworm Castings:</span>
                <span className="text-garden-500">{calculateTotalAmount(recipe.earthworm_castings, brewSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fish & Kelp Extract:</span>
                <span className="text-garden-500">{calculateTotalAmount(recipe.fish_kelp_extract, brewSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Molasses:</span>
                <span className="text-garden-500">{calculateTotalAmount(recipe.molasses, brewSize)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-border">
              <div className="flex justify-between items-center">
                <span className="font-medium">Recommended Brew Duration:</span>
                <span className="text-garden-500">{brewDuration}</span>
              </div>
              <p className="text-sm text-dark-text-secondary mt-2">
                With water at {waterTemp}°F, brew for ~{brewDuration} with strong aeration.
              </p>
            </div>
          </div>
        </div>

        {/* Brew Duration Guide */}
        <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-900/30">
          <h4 className="font-medium mb-2">Brew Duration Guide:</h4>
          <div className="space-y-1 text-sm">
            <div>• &lt;65°F → 36–48 hours</div>
            <div>• 65–75°F → 24–36 hours</div>
            <div>• 75-78°F → 12–24 hours</div>
            <div>• &gt;80°F → 12-15 hours max</div>
          </div>
        </div>
      </div>
    </Card>
  );
} 