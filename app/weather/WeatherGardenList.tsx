"use client";
import { useState } from 'react';
import { Cloud, CloudSun, CloudLightning, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export interface WeatherStatus {
  hasAlerts: boolean;
  alertCount: number;
  lastChecked?: string;
  alerts?: any[];
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  async function handleRunWeatherCheck() {
    setLoading(true);
    setMessage(null);
    try {
      await fetch('/api/weather/test', { method: 'POST' });
      setMessage('Weather check triggered! Refresh in a few seconds.');
    } catch (e) {
      setMessage('Failed to trigger weather check.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={handleRunWeatherCheck}
          disabled={loading}
          className="px-4 py-2 rounded bg-garden-600 text-white font-semibold hover:bg-garden-500 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Weather Check'}
        </button>
        {message && <span className="text-emerald-300 text-sm">{message}</span>}
      </div>
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
                {status?.lastChecked && (
                  <div className="text-xs text-emerald-300/70">
                    Last checked: {format(new Date(status.lastChecked), 'PPpp')}
                  </div>
                )}
                {status && status.hasAlerts ? (
                  <div className="mt-2 text-red-400">
                    <strong>Active Alerts:</strong>
                    {Array.isArray(status.alerts) && status.alerts.length > 0 ? (
                      <ul className="space-y-2 mt-2">
                        {status.alerts.map((alert: any, idx: number) => (
                          <li key={alert.plantId + alert.alertType + idx} className="bg-emerald-950/60 rounded p-2 text-xs text-red-200">
                            <div>
                              <span className="font-semibold">Plant:</span> <Link href={`/gardens/${garden.id}/plants/${alert.plantId}`} className="text-emerald-300 hover:underline">{alert.plantName}</Link>
                            </div>
                            <div><span className="font-semibold">Alert Type:</span> {alert.alertType}</div>
                            <div><span className="font-semibold">Weather:</span> {alert.weatherInfo && (
                              <span>
                                {alert.weatherInfo.conditions} | Temp: {alert.weatherInfo.temperature}°F | Humidity: {alert.weatherInfo.humidity}% | Wind: {alert.weatherInfo.windSpeed} mph | Precip: {alert.weatherInfo.precipitation ?? 'N/A'}
                              </span>
                            )}</div>
                            <div><span className="font-semibold">Time:</span> {alert.timestamp ? format(new Date(alert.timestamp), 'PPpp') : ''}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div>No detailed alert info available.</div>
                    )}
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