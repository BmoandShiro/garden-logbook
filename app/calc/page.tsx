'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CFMCalculator from './components/CFMCalculator';
import Jacks321Calculator from './components/Jacks321Calculator';

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-semibold text-emerald-100">
          Grow Calculators
        </h1>
        <p className="text-dark-text-secondary">
          Quick tools to calculate airflow, nutrients, and more
        </p>
      </div>

      <Tabs defaultValue="cfm" className="space-y-6">
        <TabsList className="bg-dark-bg-secondary border-dark-border">
          <TabsTrigger value="cfm">CFM Calculator</TabsTrigger>
          <TabsTrigger value="jacks">Jacks 3-2-1 Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="cfm" className="mt-6">
          <CFMCalculator />
        </TabsContent>
        <TabsContent value="jacks" className="mt-6">
          <Jacks321Calculator />
        </TabsContent>
      </Tabs>
    </div>
  );
} 