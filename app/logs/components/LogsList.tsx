'use client';

import { format } from 'date-fns';
import { LogType } from '@prisma/client';
import DeleteLogButton from './DeleteLogButton';
import { TemperatureUnit, VolumeUnit, LengthUnit, UnitLabels, convertTemperature, convertVolume, convertLength, formatMeasurement } from '@/lib/units';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import Link from 'next/link';

interface LogWithLocation {
  id: string;
  logDate: string | Date;
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
  data?: any;
}

interface LogsListProps {
  logs: LogWithLocation[];
  onLogDeleted: () => void;
}

const getLogIcon = (type: LogType) => {
  const icons: Record<LogType, string> = {
    WATERING: '💧',
    ENVIRONMENTAL: '🌡️',
    LST: '🎋',
    HARVEST: '🌾',
    PEST_STRESS_DISEASE: '🐛',
    TRANSPLANT: '🪴',
    TRANSFER: '🔄',
    GERMINATION: '🌱',
    CLONING: '🧬',
    INSPECTION: '🔍',
    TREATMENT: '💊',
    STRESS: '⚠️',
    EQUIPMENT: '🔧',
    CUSTOM: '📝'
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
  const { preferences } = useUserPreferences();
  const unitPreferences = preferences.units;

  const formatMeasurementWithPreferences = (value: number | null | undefined, sourceUnit: string | undefined, targetUnit: string) => {
    if (value === null || value === undefined) return null;
    
    let convertedValue = value;
    
    // Convert from source unit to target unit
    if (sourceUnit && sourceUnit !== targetUnit) {
      if (Object.values(TemperatureUnit).includes(sourceUnit as TemperatureUnit)) {
        convertedValue = convertTemperature(value, sourceUnit as TemperatureUnit, targetUnit as TemperatureUnit);
      } else if (Object.values(VolumeUnit).includes(sourceUnit as VolumeUnit)) {
        convertedValue = convertVolume(value, sourceUnit as VolumeUnit, targetUnit as VolumeUnit);
      } else if (Object.values(LengthUnit).includes(sourceUnit as LengthUnit)) {
        convertedValue = convertLength(value, sourceUnit as LengthUnit, targetUnit as LengthUnit);
      }
    }
    
    return formatMeasurement(convertedValue, targetUnit);
  };

  return (
    <div className="bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
      <div className="flow-root">
        <ul role="list" className="divide-y divide-dark-border">
          {logs.map((log) => {
            // Merge log fields and log.data fields for display
            const merged = { ...log, ...(log.data || {}) };
            return (
              <li key={log.id} className="p-4 hover:bg-dark-bg-hover transition-colors flex items-start space-x-4">
                <Link href={`/logs/${log.id}`} className="flex-1 min-w-0 block">
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
                          {format(new Date(log.logDate), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {/* Location string always visible */}
                      <p className="mt-1 text-sm text-dark-text-secondary">
                        {getLocationString(log)}
                      </p>
                      {log.notes && (
                        <p className="mt-2 text-sm text-dark-text-primary">{log.notes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.temperature !== null && log.temperature !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            🌡️ {formatMeasurementWithPreferences(log.temperature, log.temperatureUnit, unitPreferences.temperature)}
                          </span>
                        )}
                        {log.humidity !== null && log.humidity !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            💧 {log.humidity}%
                          </span>
                        )}
                        {log.waterAmount !== null && log.waterAmount !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            🚰 {formatMeasurementWithPreferences(log.waterAmount, log.waterUnit, unitPreferences.volume)}
                          </span>
                        )}
                        {log.height !== null && log.height !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            📏 {formatMeasurementWithPreferences(log.height, log.heightUnit, unitPreferences.length)}
                          </span>
                        )}
                        {log.width !== null && log.width !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            ↔️ {formatMeasurementWithPreferences(log.width, log.widthUnit, unitPreferences.length)}
                          </span>
                        )}
                        {log.healthRating !== null && log.healthRating !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            ❤️ {log.healthRating}/5
                          </span>
                        )}
                        {/* ENVIRONMENTAL log: show key badges */}
                        {log.type === 'ENVIRONMENTAL' && (
                          <>
                            {merged.temperature !== null && merged.temperature !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌡️ {merged.temperature}{merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}
                              </span>
                            )}
                            {merged.humidity !== null && merged.humidity !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💧 {merged.humidity}%
                              </span>
                            )}
                            {merged.co2 !== null && merged.co2 !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🫧 {merged.co2} ppm
                              </span>
                            )}
                            {merged.averagePar !== null && merged.averagePar !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💡 {merged.averagePar} PAR
                              </span>
                            )}
                            {merged.vpd !== null && merged.vpd !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌫️ {merged.vpd} kPa
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex-shrink-0 flex items-center ml-4">
                  <DeleteLogButton logId={log.id} onSuccess={onLogDeleted} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 