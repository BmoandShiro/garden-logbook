'use client';

import { format } from 'date-fns';
import { LogType } from '@prisma/client';
import DeleteLogButton from './DeleteLogButton';
import { TemperatureUnit, VolumeUnit, LengthUnit, UnitLabels, convertTemperature, convertVolume, convertLength, formatMeasurement } from '@/lib/units';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import Link from 'next/link';
import renderForecastedMessage from '@/components/MonthlyCalendar';
import { formatLogDate } from './CreateLogModal';
import LogDateField from '../../logs/[id]/LogDateField';

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
  nutrientWaterTemperature?: number | null;
  nutrientWaterTemperatureUnit?: string;
  destinationGardenId?: string | null;
  destinationRoomId?: string | null;
  destinationZoneId?: string | null;
  user?: {
    id: string;
    username?: string | null;
    email?: string | null;
  };
  timezone?: string;
}

interface LogsListProps {
  logs: LogWithLocation[];
  onLogDeleted?: (deletedLogId: string) => void;
}

const getLogIcon = (type: string) => {
  const icons: Record<string, string> = {
    WATERING: '💧',
    ENVIRONMENTAL: '🌡️',
    LST: '🎋',
    HST: '🌿',
    HARVEST: '🌾',
    DRYING: '🏜️',
    PEST_STRESS_DISEASE: '🐛',
    PEST_DISEASE: '🐛',
    TRANSPLANT: '🪴',
    TRANSFER: '🔄',
    GERMINATION: '🌱',
    CLONING: '🧬',
    INSPECTION: '🔍',
    TREATMENT: '💊',
    STRESS: '⚠️',
    EQUIPMENT: '🔧',
    CUSTOM: '📝',
    FLUSHING: '🚿',
    GENERAL: '📝',
    WEATHER_ALERT: '⛈️',
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

const weatherAlertColors: Record<string, string> = {
  Heat: 'text-red-400',
  Frost: 'text-sky-300',
  Drought: 'text-orange-400',
  Wind: 'text-slate-400',
  Flood: 'text-amber-700',
  HeavyRain: 'text-blue-700',
};

function renderCondensedWeatherAlert(message: string) {
  // Extract each section and value from the message
  const sectionRegex = /• (Heat|Frost|Drought|Wind|Flood|HeavyRain):\s*([\s\S]*?)(?=\n• |$)/g;
  const badges: React.ReactNode[] = [];
  let match;
  while ((match = sectionRegex.exec(message)) !== null) {
    const key = match[1];
    const value = match[2].split('\n')[0].trim();
    if (value && value !== 'None') {
      badges.push(
        <span key={key} className={`inline-block mr-3 font-semibold ${weatherAlertColors[key]}`}>{key}: {value}</span>
      );
    }
  }
  return badges.length > 0 ? <div className="flex flex-wrap items-center mt-2 text-sm">{badges}</div> : null;
}

export default function LogsList({ logs, onLogDeleted }: LogsListProps) {
  const { preferences } = useUserPreferences();
  const unitPreferences = preferences.units;

  // Helper to calculate 'since last log' for heavy rain
  function getSinceLastLog(logs: LogWithLocation[], idx: number, section: string) {
    if (section !== 'HeavyRain') return null;
    // Find previous log with heavy rain value
    for (let i = idx - 1; i >= 0; i--) {
      const prev = logs[i];
      if (prev.notes && prev.notes.includes('HeavyRain')) {
        // Extract value from previous log
        const prevMatch = prev.notes.match(/HeavyRain: ([\d.]+) in/);
        const currMatch = logs[idx].notes?.match(/HeavyRain: ([\d.]+) in/);
        if (prevMatch && currMatch) {
          const prevVal = parseFloat(prevMatch[1]);
          const currVal = parseFloat(currMatch[1]);
          const diff = currVal - prevVal;
          if (diff > 0) {
            return `+${diff.toFixed(2)} in since last log`;
          } else {
            return 'No new precipitation since last log';
          }
        }
      }
    }
    return null;
  }

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
          {logs.map((log, idx) => {
            // Merge log fields and log.data fields for display
            const merged = { ...log, ...(log.data || {}) };
            return (
              <li key={log.id} className="p-4 hover:bg-dark-bg-hover transition-colors flex items-start space-x-4">
                <Link href={`/logs/${log.id}`} className="flex-1 min-w-0 block">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-garden-100 flex items-center justify-center">
                      {getLogIcon(log.type.toString())}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-dark-text-primary truncate">
                          {log.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-dark-text-secondary">
                          <LogDateField date={String(log.logDate)} timezone={log.timezone} />
                        </p>
                      </div>
                      {/* Location string always visible */}
                      <p className="mt-1 text-sm text-dark-text-secondary">
                        {getLocationString(log)}
                      </p>
                      {log.user && (
                        <p className="text-xs text-dark-text-secondary mt-1">
                          By: {log.user.username || log.user.email || log.user.id}
                        </p>
                      )}
                      {log.notes &&
                        (String(log.type) === 'WEATHER_ALERT' || String(log.type) === 'WEATHER ALERT') ? (
                          <div>
                            {renderCondensedWeatherAlert(log.notes)}
                            {/* Add since last log for heavy rain */}
                            {(() => {
                              const match = log.notes.match(/HeavyRain: ([\d.]+) in/);
                              if (match) {
                                return (
                                  <div className="text-xs text-blue-400 mt-1">
                                    (Daily Total)
                                    <span className="ml-2">{getSinceLastLog(logs, idx, 'HeavyRain')}</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-dark-text-primary">{log.notes}</p>
                        )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.type !== 'ENVIRONMENTAL' && log.temperature !== null && log.temperature !== undefined && (
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
                        {/* LST log: show key badges */}
                        {log.type === 'LST' && (
                          <>
                            {merged.supercroppingIntensity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪓 {merged.supercroppingIntensity}
                              </span>
                            )}
                            {merged.tieDownIntensity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪢 {merged.tieDownIntensity}
                              </span>
                            )}
                            {merged.canopyShape && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌳 {merged.canopyShape}
                              </span>
                            )}
                            {merged.leafTuckingIntensity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🍃 {merged.leafTuckingIntensity}
                              </span>
                            )}
                          </>
                        )}
                        {/* WATERING log: show nutrient water temperature badge */}
                        {log.type === 'WATERING' && merged.nutrientWaterTemperature !== null && merged.nutrientWaterTemperature !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                            🌡️ {merged.nutrientWaterTemperature}{merged.nutrientWaterTemperatureUnit ? ` ${merged.nutrientWaterTemperatureUnit}` : ''} Nutrient
                          </span>
                        )}
                        {/* HST log: show key badges */}
                        {log.type === 'HST' && (
                          <>
                            {merged.toppedNode && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ✂️ Top: Node {merged.toppedNode}
                              </span>
                            )}
                            {merged.fimNode && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪒 FIM: Node {merged.fimNode}
                              </span>
                            )}
                            {merged.defoliationIntensity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🍃 Defol: {merged.defoliationIntensity}
                              </span>
                            )}
                            {merged.defoliationPercentage && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                % Defol: {merged.defoliationPercentage}
                              </span>
                            )}
                          </>
                        )}
                        {/* HARVEST log: show key badges */}
                        {log.type === 'HARVEST' && (
                          <>
                            {merged.hangMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪢 {merged.hangMethod}
                              </span>
                            )}
                            {merged.trichomeColor && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🔬 {merged.trichomeColor}
                              </span>
                            )}
                            {merged.forLiveUse && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-700 text-white">
                                LIVE
                              </span>
                            )}
                          </>
                        )}
                        {/* DRYING log: show key badges */}
                        {log.type === 'DRYING' && (
                          <>
                            {merged.trimMoisture && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ✂️ {merged.trimMoisture}
                              </span>
                            )}
                            {merged.nugMoisturePercent !== null && merged.nugMoisturePercent !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💧 {merged.nugMoisturePercent}%
                              </span>
                            )}
                            {merged.dryingRh !== null && merged.dryingRh !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💦 RH {merged.dryingRh}%
                              </span>
                            )}
                            {merged.dryingTemp !== null && merged.dryingTemp !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌡️ {merged.dryingTemp}{merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}
                              </span>
                            )}
                            {merged.estimatedDaysLeft !== null && merged.estimatedDaysLeft !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ⏳ {merged.estimatedDaysLeft}d
                              </span>
                            )}
                          </>
                        )}
                        {/* PEST_STRESS_DISEASE log: show key badges */}
                        {log.type === 'PEST_STRESS_DISEASE' && (
                          <>
                            {merged.healthRating !== null && merged.healthRating !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ❤️ {merged.healthRating}/10
                              </span>
                            )}
                            {merged.pestIdentificationStatus && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🏷️ {merged.pestIdentificationStatus}
                              </span>
                            )}
                            {merged.pestConfidenceLevel !== null && merged.pestConfidenceLevel !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🔢 {merged.pestConfidenceLevel}
                              </span>
                            )}
                            {Array.isArray(merged.pestTypes) && merged.pestTypes.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🐛 {merged.pestTypes[0]}
                              </span>
                            )}
                            {Array.isArray(merged.diseaseTypes) && merged.diseaseTypes.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🦠 {merged.diseaseTypes[0]}
                              </span>
                            )}
                            {merged.inspectionMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🔍 {merged.inspectionMethod}
                              </span>
                            )}
                            {merged.expectedRecoveryTime && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ⏳ {merged.expectedRecoveryTime}
                              </span>
                            )}
                            {merged.recoveryActions && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary max-w-[10rem] truncate">
                                🛠️ {String(merged.recoveryActions).slice(0, 20)}{String(merged.recoveryActions).length > 20 ? '…' : ''}
                              </span>
                            )}
                          </>
                        )}
                        {/* TRANSPLANT log: show key badges */}
                        {log.type === 'TRANSPLANT' && (
                          <>
                            {merged.transplantFromSize && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪴 From: {merged.transplantFromSize.replace(/_/g, ' ')}
                              </span>
                            )}
                            {merged.transplantToSize && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌱 To: {merged.transplantToSize.replace(/_/g, ' ')}
                              </span>
                            )}
                            {merged.soilMoisture && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💧 Soil: {merged.soilMoisture}
                              </span>
                            )}
                          </>
                        )}
                        {/* TRANSFER log: show key badges */}
                        {log.type === 'TRANSFER' && (
                          <>
                            {merged.destinationGardenId && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🏡 Garden: {merged.destinationGardenId}
                              </span>
                            )}
                            {merged.destinationRoomId && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🚪 Room: {merged.destinationRoomId}
                              </span>
                            )}
                            {merged.destinationZoneId && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                📦 Zone: {merged.destinationZoneId}
                              </span>
                            )}
                          </>
                        )}
                        {/* GERMINATION log: show key badges */}
                        {log.type === 'GERMINATION' && (
                          <>
                            {merged.germinationMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌱 {merged.germinationMethod}
                              </span>
                            )}
                            {merged.germinationStatus && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌱 {merged.germinationStatus}
                              </span>
                            )}
                            {merged.rh !== undefined && merged.rh !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💧 RH: {merged.rh}%
                              </span>
                            )}
                            {merged.temperature !== undefined && merged.temperature !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌡️ {merged.temperature}{merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}
                              </span>
                            )}
                            {merged.daysToSprout && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ⏳ {merged.daysToSprout} days
                              </span>
                            )}
                          </>
                        )}
                        {/* CLONING log: show key badges */}
                        {log.type === 'CLONING' && (
                          <>
                            {merged.cloningMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🧬 {merged.cloningMethod}
                              </span>
                            )}
                            {merged.cutFrom && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ✂️ {merged.cutFrom}
                              </span>
                            )}
                            {merged.additivesUsed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🧪 {Array.isArray(merged.additivesUsed) ? merged.additivesUsed.join(', ') : merged.additivesUsed}
                              </span>
                            )}
                            {merged.rh !== undefined && merged.rh !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💧 RH: {merged.rh}%
                              </span>
                            )}
                            {merged.temperature !== undefined && merged.temperature !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌡️ {merged.temperature}{merged.temperatureUnit ? ` ${merged.temperatureUnit}` : ''}
                              </span>
                            )}
                            {merged.lightHoursPerDay && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                💡 {merged.lightHoursPerDay}h
                              </span>
                            )}
                            {merged.domeUsed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🛡️ Dome
                              </span>
                            )}
                            {merged.ventsOpened && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🌬️ Vents
                              </span>
                            )}
                          </>
                        )}
                        {/* TREATMENT log: show key badges */}
                        {log.type === 'TREATMENT' && (
                          <>
                            {merged.applicationMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🧴 {merged.applicationMethod}
                              </span>
                            )}
                            {merged.coverageMethod && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🪣 {merged.coverageMethod}
                              </span>
                            )}
                            {Array.isArray(merged.targetPests) && merged.targetPests.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🐛 {merged.targetPests[0]}
                              </span>
                            )}
                            {Array.isArray(merged.bcaPredatorTypes) && merged.bcaPredatorTypes.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🦠 {merged.bcaPredatorTypes[0]}
                              </span>
                            )}
                            {merged.releaseCount !== undefined && merged.releaseCount !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🔢 {merged.releaseCount}
                              </span>
                            )}
                            {merged.phOfTreatmentSolution !== undefined && merged.phOfTreatmentSolution !== null && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                ⚗️ pH {merged.phOfTreatmentSolution}
                              </span>
                            )}
                            {merged.additives && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-dark-bg-primary text-dark-text-secondary">
                                🧪 {Array.isArray(merged.additives) ? merged.additives.join(', ') : merged.additives}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex-shrink-0 flex items-center ml-4">
                  <DeleteLogButton logId={log.id} onSuccess={onLogDeleted || (() => {})} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 