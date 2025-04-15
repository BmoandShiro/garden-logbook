import { Plant, Stage } from '@prisma/client';
import Link from 'next/link';

interface GrowCycleCardProps {
  plant: Plant & {
    strain?: {
      name: string;
    } | null;
  };
}

const stageColors: Record<Stage, { bg: string; text: string; border: string }> = {
  SEEDLING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  VEGETATIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  FLOWERING: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  HARVEST: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  DRYING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CURING: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function GrowCycleCard({ plant }: GrowCycleCardProps) {
  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(plant.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const stageStyle = stageColors[plant.stage];

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              <Link href={`/plants/${plant.id}`} className="hover:underline">
                {plant.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {plant.strain?.name || 'Unknown strain'}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              stageStyle.bg
            } ${stageStyle.text} ${stageStyle.border}`}
          >
            {plant.stage.toLowerCase()}
          </span>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Days in cycle</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{daysSinceStart}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{plant.location || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {plant.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{plant.notes}</p>
          </div>
        )}

        <div className="mt-4">
          <Link
            href={`/plants/${plant.id}/log`}
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
          >
            Add log entry
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 