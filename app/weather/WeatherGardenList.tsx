"use client";
import { useState, useEffect } from 'react';
import { Cloud, CloudSun, CloudLightning, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import Link from 'next/link';
import { format, addHours, differenceInSeconds } from 'date-fns';
import LogDateField from '../logs/[id]/LogDateField';

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

export function WeatherGardenList({ gardens: initialGardens, userId, userEmail }: { gardens?: WeatherGarden[], userId: string, userEmail?: string | null }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPeriod, setNotificationPeriod] = useState<string>('current');
  const [saving, setSaving] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, any[]>>({});
  const [alertsLoading, setAlertsLoading] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [gardens, setGardens] = useState<WeatherGarden[]>(initialGardens || []);

  const isOwner = userEmail === "bmostradingpost@gmail.com";

  // If gardens not provided, fetch them for the user
  useEffect(() => {
    if (!initialGardens) {
      fetch(`/api/gardens?userId=${userId}`)
        .then(res => res.json())
        .then(data => setGardens(data.gardens || []));
    }
  }, [initialGardens, userId]);

  // Fetch current preference on mount
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.weatherNotificationPeriod) setNotificationPeriod(data.weatherNotificationPeriod);
      });
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<string, string> = {};
      gardens.forEach(garden => {
        const lastChecked = garden.weatherStatus?.lastChecked;
        if (lastChecked) {
          const nextCheck = addHours(new Date(lastChecked), 4);
          const now = new Date();
          let diff = Math.max(0, differenceInSeconds(nextCheck, now));
          const hours = Math.floor(diff / 3600);
          diff -= hours * 3600;
          const minutes = Math.floor(diff / 60);
          const seconds = diff - minutes * 60;
          newTimers[garden.id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newTimers[garden.id] = '';
        }
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [gardens]);

  const toggle = (id: string) => {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  };

  useEffect(() => {
    gardens.forEach(garden => {
      setAlertsLoading(a => ({ ...a, [garden.id]: true }));
      fetch(`/api/gardens/${garden.id}/weather-alerts`)
        .then(res => res.json())
        .then(data => {
          setActiveAlerts(a => ({ ...a, [garden.id]: data.alerts || [] }));
        })
        .catch(() => {
          setActiveAlerts(a => ({ ...a, [garden.id]: [] }));
        })
        .finally(() => {
          setAlertsLoading(a => ({ ...a, [garden.id]: false }));
        });
    });
  }, [gardens]);

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

  function formatAlertDate(dateString: string, timezone: string | null | undefined) {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    let utcString = format(date, 'yyyy-MM-dd HH:mm:ss') + ' UTC';
    let localString = '';
    if (timezone) {
      try {
        localString = date.toLocaleString('en-US', { timeZone: timezone, hour12: false });
      } catch {}
    }
    return localString ? `${localString} (${timezone})\n${utcString}` : utcString;
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-4">
        {isOwner && (
          <button
            onClick={handleRunWeatherCheck}
            disabled={loading}
            className="px-4 py-2 rounded bg-garden-600 text-white font-semibold hover:bg-garden-500 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Weather Check'}
          </button>
        )}
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
        const alerts = activeAlerts[garden.id] || [];
        if (garden.name === "BMOs Garden") {
          console.log("BMOs Garden raw alerts:", alerts);
          const allTypes = alerts.flatMap(a => a.meta?.alertTypes || []);
          console.log("BMOs Garden all alert types:", allTypes);
        }
        let icon = <Cloud className="w-6 h-6 text-gray-400" />;
        let summary = 'Weather status not available';
        // Deduplicate for current user only
        const userAlerts = alerts.filter(alert => alert.userId === userId);
        const uniquePlantAlertPairs = new Set<string>();
        userAlerts.forEach(alert => {
          const plantId = alert.meta?.plantId;
          const alertTypes = alert.meta?.alertTypes || [];
          alertTypes.forEach((type: string) => {
            if (plantId && type) {
              uniquePlantAlertPairs.add(`${plantId}:${type}`);
            }
          });
        });
        const alertCount = uniquePlantAlertPairs.size;
        if (alertCount > 0) {
          icon = <CloudLightning className="w-6 h-6 text-red-500" />;
          summary = `${alertCount} weather alert${alertCount === 1 ? '' : 's'}`;
        } else {
          icon = <CloudSun className="w-6 h-6 text-green-400" />;
          summary = 'All clear';
        }
        return (
          <div key={garden.id} className="rounded-lg bg-dark-bg-secondary border border-emerald-800 p-4 shadow flex flex-col">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(garden.id)}>
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-lg font-semibold text-emerald-100">{garden.name}</span>
                <span className="text-sm text-emerald-300/70">{summary}</span>
                {status?.lastChecked && (
                  <span className="ml-4 text-xs text-emerald-300/70">Last checked: {format(new Date(status.lastChecked), 'PPpp')}</span>
                )}
                {status?.lastChecked && (
                  <span className="ml-2 text-xs text-emerald-200">Next check in: {timers[garden.id]}</span>
                )}
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
                {alertsLoading[garden.id] ? (
                  <div className="mt-2 text-emerald-300">Loading alerts...</div>
                ) : alerts.length > 0 ? (
                  <div className="mt-2 text-red-400">
                    <strong>Active Alerts:</strong>
                    <ul className="space-y-2 mt-2">
                      {/* Group alerts by plantId and show only the most recent per plant */}
                      {Object.values(
                        alerts.reduce((acc: Record<string, any>, alert: any) => {
                          const plantId = alert.meta?.plantId;
                          if (!plantId) return acc;
                          // If not present or this alert is newer, set it
                          if (!acc[plantId] || new Date(alert.createdAt) > new Date(acc[plantId].createdAt)) {
                            acc[plantId] = alert;
                          }
                          return acc;
                        }, {})
                      ).map((alert: any, idx: number) => (
                        <li key={alert.id} className="bg-emerald-950/60 rounded p-2 text-xs text-red-200">
                          <div>
                            <span className="font-semibold">Plant:</span> <Link href={`/gardens/${alert.meta?.gardenId}/rooms/${alert.meta?.roomId}/zones/${alert.meta?.zoneId}/plants/${alert.meta?.plantId}`} className="text-emerald-300 hover:underline">{alert.meta?.plantName || alert.meta?.plantId}</Link>
                          </div>
                          <div><span className="font-semibold">Alert Type:</span> {alert.meta?.alertType || alert.type}</div>
                          {/* Detailed breakdown for each alert type */}
                          {alert.meta?.currentAlerts ? (
                            <div className="mt-1 whitespace-pre-line">
                              {['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'].map((type, idx) => {
                                let value = 'None';
                                const ca = alert.meta.currentAlerts[type];
                                if (ca) {
                                  if (type === 'heat' || type === 'frost') value = `${ca.weather.temperature}°F`;
                                  else if (type === 'wind') value = `${ca.weather.windSpeed} mph`;
                                  else if (type === 'heavyRain' || type === 'flood') value = `${ca.weather.precipitation ?? 'N/A'} precipitation`;
                                  else if (type === 'drought') value = `${ca.weather.daysWithoutRain} days`;
                                  else value = `${ca.severity}`;
                                }
                                return <div key={type}>• {type.charAt(0).toUpperCase() + type.slice(1)}: {value}</div>;
                              })}
                            </div>
                          ) : alert.meta?.weatherInfo ? (
                            <div className="mt-1 whitespace-pre-line">
                              {['conditions', 'temperature', 'humidity', 'windSpeed', 'precipitation'].map(key => (
                                <div key={key}>• {key.charAt(0).toUpperCase() + key.slice(1)}: {alert.meta.weatherInfo[key]}</div>
                              ))}
                            </div>
                          ) : alert.message ? (
                            <div className="mt-1 whitespace-pre-line">{alert.message}</div>
                          ) : null}
                          <div><span className="font-semibold">Time:</span><br />
                            <LogDateField date={alert.createdAt} timezone={alert.meta?.timezone} />
                          </div>
                        </li>
                      ))}
                    </ul>
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