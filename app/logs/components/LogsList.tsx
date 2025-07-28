'use client';

import { format } from 'date-fns';
import { LogType } from '@prisma/client';
import DeleteLogButton from './DeleteLogButton';
import { TemperatureUnit, VolumeUnit, LengthUnit, UnitLabels, convertTemperature, convertVolume, convertLength, formatMeasurement } from '@/lib/units';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import Link from 'next/link';
import { renderForecastedMessage } from '@/lib/renderForecastedMessage';
import { formatLogDate } from './CreateLogModal';
import LogDateField from '../../logs/[id]/LogDateField';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const weatherAlertColors: Record<string, string> = {
  Heat: 'text-red-400',
  Frost: 'text-sky-300',
  Drought: 'text-orange-400',
  Wind: 'text-slate-400',
  Flood: 'text-amber-700',
  HeavyRain: 'text-blue-700',
};

const sensorAlertColors: Record<string, string> = {
  'High Temperature (Sensor)': 'text-red-400',
  'Low Temperature (Sensor)': 'text-sky-300',
  'High Humidity (Sensor)': 'text-blue-400',
  'Low Humidity (Sensor)': 'text-yellow-400',
};

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
  onLogDeleted?: (...args: any[]) => void;
}

// Function to get a clean zone identifier
const getZoneIdentifier = (log: LogWithLocation) => {
  // Only group by actual zones, not rooms or gardens
  if (log.zone?.name) return log.zone.name;
  return null; // Don't group if no zone
};

// Function to get the full path for display in individual logs
const getFullLocationString = (log: LogWithLocation) => {
  const parts = [];
  if (log.garden?.name) parts.push(log.garden.name);
  if (log.room?.name) parts.push(log.room.name);
  if (log.zone?.name) parts.push(log.zone.name);
  if (log.plant?.name) parts.push(log.plant.name);
  return parts.join(' → ');
};

// Function to determine if logs should be grouped
const shouldGroupLogs = (log1: LogWithLocation, log2: LogWithLocation): boolean => {
  // Only group logs of the same type
  if (log1.type !== log2.type) return false;
  
  // Must be from the same zone (only actual zones, not rooms/gardens)
  const zone1 = getZoneIdentifier(log1);
  const zone2 = getZoneIdentifier(log2);
  
  // Don't group if either log doesn't have a zone
  if (!zone1 || !zone2) return false;
  
  if (zone1 !== zone2) return false;
  
  // Check time proximity (within 30 minutes for better grouping)
  const time1 = new Date(log1.logDate).getTime();
  const time2 = new Date(log2.logDate).getTime();
  const timeDiff = Math.abs(time1 - time2);
  const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  return timeDiff <= thirtyMinutes;
};

// Function to group consecutive similar logs
const groupLogs = (logs: LogWithLocation[]): (LogWithLocation | LogWithLocation[])[] => {
  if (logs.length === 0) return [];
  
  const groups: (LogWithLocation | LogWithLocation[])[] = [];
  let currentGroup: LogWithLocation[] = [logs[0]];
  
  for (let i = 1; i < logs.length; i++) {
    const currentLog = logs[i];
    const previousLog = logs[i - 1];
    
    if (shouldGroupLogs(previousLog, currentLog)) {
      currentGroup.push(currentLog);
    } else {
      if (currentGroup.length === 1) {
        groups.push(currentGroup[0]);
      } else {
        groups.push([...currentGroup]);
      }
      currentGroup = [currentLog];
    }
  }
  
  // Handle the last group
  if (currentGroup.length === 1) {
    groups.push(currentGroup[0]);
  } else {
    groups.push([...currentGroup]);
  }
  
  return groups;
};

// LogGroup component for grouped logs
const LogGroup = ({ logs, onLogDeleted }: { logs: LogWithLocation[], onLogDeleted?: (...args: any[]) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstLog = logs[0];
  const zoneName = getZoneIdentifier(firstLog) || 'Unknown Zone';
  const fullPath = getFullLocationString(firstLog);
  const logType = firstLog.type;
  
  return (
    <li className="border-b border-dark-border">
      <div className="p-4 hover:bg-dark-bg-hover transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-dark-text-primary hover:text-dark-text-secondary"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {logType.replace(/_/g, ' ')} – {zoneName}
                </span>
                <span className="text-xs text-dark-text-secondary">
                  {fullPath}
                </span>
              </div>
            </button>
            <span className="inline-flex items-center px-4 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <span className="text-sm text-dark-text-secondary">
            <LogDateField date={String(firstLog.logDate)} timezone={firstLog.timezone} />
          </span>
        </div>
        
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {logs.map((log, idx) => (
              <LogItem key={log.id} log={log} onLogDeleted={onLogDeleted} isGrouped={true} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
};

// Individual log item component
const LogItem = ({ log, onLogDeleted, isGrouped = false }: { 
  log: LogWithLocation, 
  onLogDeleted?: (...args: any[]) => void,
  isGrouped?: boolean 
}) => {
  const { preferences } = useUserPreferences();
  const unitPreferences = preferences.units;
  const merged = { ...log, ...(log.data || {}) };

  const formatMeasurementWithPreferences = (value: number | null | undefined, sourceUnit: string | undefined, targetUnit: string) => {
    if (value === null || value === undefined) return null;
    
    let convertedValue = value;
    
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
    <div className={`flex items-start space-x-4 ${isGrouped ? 'pl-4 border-l-2 border-dark-border ml-4' : ''}`}>
      <Link href={`/logs/${log.id}`} className="flex-1 min-w-0 block">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-garden-100 flex items-center justify-center">
            {getLogIcon(log.type.toString())}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-dark-text-primary truncate">
                {log.type.replace(/_/g, ' ')}
              </p>
            </div>
            
            {!isGrouped && (
              <p className="mt-1 text-sm text-dark-text-secondary">
                {getFullLocationString(log)}
              </p>
            )}
            
            {/* Render log content based on type */}
            {renderLogContent(log, merged, unitPreferences)}
            
            {/* Render badges */}
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
            </div>
          </div>
        </div>
      </Link>
      <div className="flex-shrink-0 flex flex-col items-end space-y-2 ml-4 min-w-0">
        <div className="text-right max-w-full">
          <span className="text-sm text-dark-text-secondary block break-words">
            <LogDateField date={String(log.logDate)} timezone={log.timezone} />
          </span>
        </div>
        {log.user && (
          <p className="text-xs text-dark-text-secondary text-right break-words">
            By: {log.user.username || log.user.email || log.user.id}
          </p>
        )}
        <DeleteLogButton logId={log.id} onSuccess={onLogDeleted || (() => {})} />
      </div>
    </div>
  );
};

// Helper function to render log content
const renderLogContent = (log: LogWithLocation, merged: any, unitPreferences: any) => {
  if (log.notes && (String(log.type) === 'WEATHER_ALERT' || String(log.type) === 'WEATHER ALERT')) {
    return (
      <div>
        {renderCondensedWeatherAlert(log.notes)}
        {merged.sinceLastPrecipDiff && (
          <div className="text-blue-700 font-semibold text-sm mt-1">
            {merged.sinceLastPrecipDiff}
          </div>
        )}
      </div>
    );
  } else if (String(log.type) === 'SENSOR_ALERT') {
    return (
      <div className="mt-2 text-sm">
        <span
          className={`inline-block mr-3 font-semibold ${
            sensorAlertColors[merged.type] || 'text-dark-text-primary'
          }`}
        >
          {merged.type.includes('Temperature')
            ? `${merged.type}: ${formatMeasurement(
                merged.sensorTemperature,
                unitPreferences.temperature
              )}`
            : `${merged.type}: ${merged.sensorHumidity}%`}
        </span>
      </div>
    );
  } else if (String(log.type) === 'CHANGE_LOG') {
    return (
      <div className="mt-2 text-sm">
        <div className="text-dark-text-secondary mb-1">
          {merged.path || 'Unknown path'}
        </div>
        <div className="text-dark-text-primary">
          {merged.changeDetails || 'Changes made'}
        </div>
        <div className="text-emerald-400 text-xs mt-1">
          Changed by {merged.changedBy?.name || 'Unknown User'}
        </div>
      </div>
    );
  } else {
    return <p className="mt-2 text-sm text-dark-text-primary">{log.notes}</p>;
  }
};

// Helper function to render log badges
const renderLogBadges = (log: LogWithLocation, merged: any, unitPreferences: any) => {
  const badges: React.JSX.Element[] = [];
  
  // Add all the existing badge logic here...
  // For now, return empty array to avoid linter errors
  // This would contain all the badge rendering logic from the original component
  
  return badges;
};

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
    SENSOR_ALERT: '📶',
    CHANGE_LOG: '✏️',
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

function renderCondensedWeatherAlert(message: string) {
  const allTypes = ['Heat', 'Frost', 'Drought', 'Wind', 'Flood', 'HeavyRain'];
  const sectionRegex = /• (Heat|Frost|Drought|Wind|Flood|HeavyRain):\s*([^\n]*)/g;
  const found: Record<string, string> = {};
  let match;
  while ((match = sectionRegex.exec(message)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    found[key] = value;
  }
  const badges = allTypes
    .filter((key) => found[key] && found[key] !== 'None')
    .map((key) => (
      <span key={key} className={`inline-block mr-3 font-semibold ${weatherAlertColors[key]}`}>• {key}: {found[key]}</span>
    ));
  return <div className="flex flex-wrap items-center mt-2 text-sm">{badges}</div>;
}

function extractSinceLastLogMsg(notes: string | null | undefined): string | null {
  if (!notes) return null;
  // Look for a line like (Daily Total) ... since last log
  const match = notes.match(/\(Daily Total\)\s*(.+since last log|No new precipitation since last log)/i);
  return match ? match[1] : null;
}

export default function LogsList({ logs, onLogDeleted }: LogsListProps) {
  const { preferences } = useUserPreferences();
  const unitPreferences = preferences.units;

  // Group the logs
  const groupedLogs = groupLogs(logs);

  return (
    <div className="bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
      <div className="flow-root">
        <ul role="list" className="divide-y divide-dark-border">
          {groupedLogs.map((item, idx) => {
            // If item is a single log
            if (!Array.isArray(item)) {
              return (
                <li key={item.id} className="p-4 hover:bg-dark-bg-hover transition-colors">
                  <LogItem log={item} onLogDeleted={onLogDeleted} />
                </li>
              );
            }
            
            // If item is a group of logs
            return (
              <LogGroup key={`group-${idx}`} logs={item} onLogDeleted={onLogDeleted} />
            );
          })}
        </ul>
      </div>
    </div>
  );
} 