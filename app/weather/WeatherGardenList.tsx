"use client";
import { useState, useEffect } from 'react';
import { Cloud, CloudSun, CloudLightning, ChevronDown, ChevronUp, Settings } from 'lucide-react';
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

export function WeatherGardenList({ gardens, userId }: { gardens: WeatherGarden[], userId: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPeriod, setNotificationPeriod] = useState<string>('current');
  const [saving, setSaving] = useState(false);

  // Fetch current preference on mount
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.weatherNotificationPeriod) setNotificationPeriod(data.weatherNotificationPeriod);
      });
  }, [userId]);

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

  async function handleSavePreference(period: string) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherNotificationPeriod: period })
      });
      if (res.ok) {
        setNotificationPeriod(period);
        setMessage('Notification preference updated!');
        setShowSettings(false);
      } else {
        setMessage('Failed to update preference.');
      }
    } finally {
      setSaving(false);
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
        <button
          onClick={() => setShowSettings(v => !v)}
          className="p-2 rounded-full hover:bg-emerald-900/40 text-emerald-300"
          title="Weather notification settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        {message && <span className="text-emerald-300 text-sm">{message}</span>}
      </div>
      {showSettings && (
        <div className="mb-4 p-4 bg-dark-bg-secondary border border-emerald-800 rounded shadow max-w-md">
          <div className="mb-2 font-semibold text-emerald-200">Weather Notification Period</div>
          <select
            value={notificationPeriod}
            onChange={e => handleSavePreference(e.target.value)}
            disabled={saving}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="current">Current only</option>
            <option value="24h">Next 24 hours</option>
            <option value="3d">Next 3 days</option>
            <option value="week">Full week (all periods)</option>
            <option value="all">All available periods</option>
          </select>
          <div className="mt-2 text-xs text-emerald-300">Current: <span className="font-semibold">{notificationPeriod.replace('current', 'Current only').replace('24h', 'Next 24 hours').replace('3d', 'Next 3 days').replace('week', 'Full week').replace('all', 'All periods')}</span></div>
        </div>
      )}
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