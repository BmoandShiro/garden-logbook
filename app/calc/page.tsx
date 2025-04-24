import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculator | Garden Logbook',
  description: 'Garden calculator tools',
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-dark-text-primary">Calculator</h1>
      </div>
      <div className="flex flex-col items-center justify-center h-40 p-8 border border-dark-border rounded-lg bg-dark-bg-secondary">
        <p className="text-xl font-semibold mb-2 text-garden-400">Coming Soon</p>
        <p className="text-dark-text-secondary text-center">
          Garden calculator tools will be available here.
        </p>
      </div>
    </div>
  );
} 