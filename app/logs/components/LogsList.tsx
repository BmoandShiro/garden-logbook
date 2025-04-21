'use client';

import { format } from 'date-fns';
import { LogType } from '@prisma/client';
import DeleteLogButton from './DeleteLogButton';
import { TemperatureUnit, VolumeUnit, LengthUnit, UnitLabels, formatMeasurement } from '@/lib/units';

interface LogWithLocation {
  id: string;
  date: Date;
  type: LogType;
  notes?: string | null;
  plant?: {
    name: string;
  };
  garden?: {
    name: string;
  };
  room?: {
    name: string;
  };
  zone?: {
    name: string;
  };
  temperature?: number | null;
  temperatureUnit?: string;
  humidity?: number | null;
  waterAmount?: number | null;
  waterUnit?: string;
  height?: number | null;
  heightUnit?: string;
  width?: number | null;
  widthUnit?: string;
  healthRating?: number | null;
}

interface LogsListProps {
  logs: LogWithLocation[];
  onLogDeleted: () => void;
}

const getLogIcon = (type: LogType) => {
  const icons: Record<LogType, string> = {
    WATERING: '💧',
    FEEDING: '🌱',
    ENVIRONMENTAL: '🌡️',
    PRUNING: '✂️',
    TRAINING: '🎋',
    DEFOLIATION: '🍃',
    FLUSHING: '🚰',
    HARVEST: '🌾',
    PEST_DISEASE: '🐛',
    TRANSPLANT: '🪴',
    GERMINATION: '🌱',
    CLONING: '🧬',
    INSPECTION: '🔍',
    TREATMENT: '💊',
    STRESS: '⚠️',
    GENERAL: '📝',
  };
  return icons[type] || '📝';
};

const getLocationString = (log: LogWithLocation) => {
  const parts = [];
  if (log.garden?.name) parts.push(log.garden.name);
  if (log.room?.name) parts.push(log.room.name);
  if (log.zone?.name) parts.push(log.zone.name);
  if (log.plant?.name) parts.push(log.plant.name);
  return parts.join(' → ');
};

export default function LogsList({ logs, onLogDeleted }: LogsListProps) {
  return (
    <div className="bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
      <div className="flow-root">
        <ul role="list" className="divide-y divide-dark-border">
          {logs.map((log) => (
            <li key={log.id} className="p-4 hover:bg-dark-bg-hover transition-colors">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-garden-100 flex items-center justify-center">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dark-text-primary truncate">
                      {log.type.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-dark-text-secondary">
                        {format(new Date(log.date), 'MMM d, yyyy h:mm a')}
                      </p>
                      <DeleteLogButton logId={log.id} onSuccess={onLogDeleted} />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-dark-text-secondary">
                    {getLocationString(log)}
                  </p>
                  {log.notes && (
                    <p className="mt-2 text-sm text-dark-text-primary">{log.notes}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {log.temperature !== null && log.temperature !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        🌡️ {formatMeasurement(log.temperature, log.temperatureUnit || TemperatureUnit.CELSIUS)}
                      </span>
                    )}
                    {log.humidity !== null && log.humidity !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        💧 {log.humidity}%
                      </span>
                    )}
                    {log.waterAmount !== null && log.waterAmount !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        🚰 {formatMeasurement(log.waterAmount, log.waterUnit || VolumeUnit.MILLILITERS)}
                      </span>
                    )}
                    {log.height !== null && log.height !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        📏 {formatMeasurement(log.height, log.heightUnit || LengthUnit.CENTIMETERS)}
                      </span>
                    )}
                    {log.width !== null && log.width !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        ↔️ {formatMeasurement(log.width, log.widthUnit || LengthUnit.CENTIMETERS)}
                      </span>
                    )}
                    {log.healthRating !== null && log.healthRating !== undefined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        ❤️ {log.healthRating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 