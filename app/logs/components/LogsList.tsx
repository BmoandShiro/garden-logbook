'use client';

import { format } from 'date-fns';
import { LogType } from '@prisma/client';

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
  humidity?: number | null;
  waterAmount?: number | null;
  healthRating?: number | null;
}

interface LogsListProps {
  logs: LogWithLocation[];
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

export default function LogsList({ logs }: LogsListProps) {
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
                    <p className="text-sm text-dark-text-secondary">
                      {format(new Date(log.date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-dark-text-secondary">
                    {getLocationString(log)}
                  </p>
                  {log.notes && (
                    <p className="mt-2 text-sm text-dark-text-primary">{log.notes}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {log.temperature && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        🌡️ {log.temperature}°C
                      </span>
                    )}
                    {log.humidity && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        💧 {log.humidity}%
                      </span>
                    )}
                    {log.waterAmount && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                        🚰 {log.waterAmount}ml
                      </span>
                    )}
                    {log.healthRating && (
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