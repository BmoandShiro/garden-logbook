"use client";
import { useState } from 'react';
import { Cloud, CloudSun, CloudLightning, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export interface WeatherStatus {
  hasAlerts: boolean;
  alertCount: number;
  lastChecked?: string;
  [key: string]: any;
}

export interface WeatherGarden {
  id: string;
  name: string;
  weatherStatus?: WeatherStatus;
  description?: string;
  zipcode?: string;
  plants: { id: string; name: string }[];
}

export function WeatherGardenList({ gardens }: { gardens: WeatherGarden[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  return (
    <div className="space-y-4">
      {gardens.map(garden => {
        const status = garden.weatherStatus;
        let icon = <Cloud className="w-6 h-6 text-gray-400" />;
        let summary = 'Weather status not available';
        if (status) {
          if (status.hasAlerts) {
            icon = <CloudLightning className="w-6 h-6 text-red-500" />;
            summary = `${status.alertCount} weather alert${status.alertCount === 1 ? '' : 's'}`;
          } else {
            icon = <CloudSun className="w-6 h-6 text-green-400" />;
            summary = 'All clear';
          }
        }
        return (
          <div key={garden.id} className="rounded-lg bg-dark-bg-secondary border border-emerald-800 p-4 shadow flex flex-col">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(garden.id)}>
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-lg font-semibold text-emerald-100">{garden.name}</span>
                <span className="text-sm text-emerald-300/70">{summary}</span>
              </div>
              <button className="ml-2 text-emerald-300/70 hover:text-emerald-100">
                {expanded[garden.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            {expanded[garden.id] && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-emerald-200">{garden.description}</div>
                <div className="text-xs text-emerald-300/70">Zipcode: {garden.zipcode || 'N/A'}</div>
                {status && status.hasAlerts ? (
                  <div className="mt-2 text-red-400">
                    <strong>Active Alerts:</strong>
                    <pre className="bg-emerald-950/60 rounded p-2 mt-1 text-xs text-red-200 overflow-x-auto">{JSON.stringify(status, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="mt-2 text-green-400">No active weather alerts.</div>
                )}
                <div className="mt-2">
                  <Link href={`/gardens/${garden.id}`} className="text-emerald-300 hover:underline">View Garden</Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 