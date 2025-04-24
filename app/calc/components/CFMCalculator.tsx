'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CFMCalculator() {
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    interval: '2',
  });

  const calculateCFM = () => {
    const { length, width, height, interval } = dimensions;
    if (!length || !width || !height || !interval) return null;
    
    const cfm = (Number(length) * Number(width) * Number(height)) / Number(interval);
    return Math.round(cfm);
  };

  const cfm = calculateCFM();

  return (
    <Card className="p-6 bg-dark-bg-secondary border-dark-border">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="length">Room Length (ft)</Label>
            <Input
              id="length"
              type="number"
              min="0"
              step="0.1"
              value={dimensions.length}
              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
              placeholder="Enter length"
              className="bg-dark-bg-primary border-dark-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Room Width (ft)</Label>
            <Input
              id="width"
              type="number"
              min="0"
              step="0.1"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              placeholder="Enter width"
              className="bg-dark-bg-primary border-dark-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Room Height (ft)</Label>
            <Input
              id="height"
              type="number"
              min="0"
              step="0.1"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              placeholder="Enter height"
              className="bg-dark-bg-primary border-dark-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Exchange Interval (minutes)</Label>
            <Input
              id="interval"
              type="number"
              min="0.1"
              step="0.1"
              value={dimensions.interval}
              onChange={(e) => setDimensions({ ...dimensions, interval: e.target.value })}
              placeholder="Enter interval"
              className="bg-dark-bg-primary border-dark-border"
            />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-dark-bg-primary border border-dark-border">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">
              {cfm !== null
                ? `You need a fan rated at approximately ${cfm} CFM`
                : 'Enter dimensions to calculate required CFM'}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-dark-text-secondary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add 20–30% for carbon filters or HPS lighting</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
} 