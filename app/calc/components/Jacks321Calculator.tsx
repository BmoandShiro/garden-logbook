'use client';

import { Card } from '@/components/ui/card';

export default function Jacks321Calculator() {
  return (
    <Card className="p-6 bg-dark-bg-secondary border-dark-border">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-dark-text-primary">
          Jacks 3-2-1 Nutrient Calculator (Coming Soon)
        </h2>
        <p className="text-dark-text-secondary">
          This calculator will help you determine the grams per gallon of each Jacks component based on desired PPM inputs.
        </p>
        <div className="h-40 flex items-center justify-center border border-dark-border rounded-lg bg-dark-bg-primary">
          <p className="text-dark-text-secondary">Calculator coming soon...</p>
        </div>
      </div>
    </Card>
  );
} 