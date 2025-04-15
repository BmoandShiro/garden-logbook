interface StatsCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUpward: boolean;
  };
}

export function StatsCard({ title, value, unit, icon, trend }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 dark:bg-gray-800">
      <div className="flex items-center">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="w-full">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{title}</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {value}
            {unit && <span className="ml-1 text-lg font-normal text-gray-500 dark:text-gray-400">{unit}</span>}
          </dd>
          {trend && (
            <div className="mt-2">
              <p
                className={`text-sm ${
                  trend.isUpward
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                <span className="font-medium">
                  {trend.isUpward ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="ml-2">from previous</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 