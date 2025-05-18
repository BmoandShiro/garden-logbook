"use client";

import { useState, useCallback } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { WeatherAlertMessage } from '@/components/WeatherAlertMessage';
import Link from 'next/link';

// Define Notification type
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  meta?: { inviteId?: string, gardenId?: string, gardenName?: string, roomId?: string, roomName?: string, zoneId?: string, zoneName?: string, plantId?: string, plantName?: string };
  read: boolean;
  createdAt: string;
}

interface NotificationsListProps {
  notifications: Notification[];
  userEmail?: string;
}

function groupNotificationsByHierarchy(notifications: Notification[]) {
  // Only group forecasted and current weather alerts
  const grouped: any = {};
  for (const n of notifications) {
    if (!n.meta || !n.meta.plantId) continue;
    const gardenId = n.meta.gardenId || 'unknown-garden';
    const gardenName = n.meta.gardenName || 'Unknown Garden';
    const roomId = n.meta.roomId || 'unknown-room';
    const roomName = n.meta.roomName || 'Room/Plot';
    const zoneId = n.meta.zoneId || 'unknown-zone';
    const zoneName = n.meta.zoneName || 'Zone';
    const plantId = n.meta.plantId;
    const plantName = n.meta.plantName || n.title?.split('for ')[1] || 'Plant';
    if (!grouped[gardenId]) grouped[gardenId] = { name: gardenName, rooms: {} };
    if (!grouped[gardenId].rooms[roomId]) grouped[gardenId].rooms[roomId] = { name: roomName, zones: {} };
    if (!grouped[gardenId].rooms[roomId].zones[zoneId]) grouped[gardenId].rooms[roomId].zones[zoneId] = { name: zoneName, plants: {} };
    if (!grouped[gardenId].rooms[roomId].zones[zoneId].plants[plantId]) grouped[gardenId].rooms[roomId].zones[zoneId].plants[plantId] = { name: plantName, notifications: [] };
    grouped[gardenId].rooms[roomId].zones[zoneId].plants[plantId].notifications.push(n);
  }
  return grouped;
}

// Add color mapping for current alert labels
const ALERT_LABEL_COLORS: Record<string, string> = {
  Heat: 'text-red-400',
  Frost: 'text-sky-300',
  Drought: 'text-orange-400',
  Wind: 'text-slate-400',
  Flood: 'text-amber-700',
  HeavyRain: 'text-blue-700',
};

// Helper to render colored labels for current alerts
function renderCurrentAlertLabels(message: string) {
  // Regex to match lines like '• Heat: 81°F' or '• Frost: None'
  const lineRegex = /• (Heat|Frost|Drought|Wind|Flood|HeavyRain):\s*([^\n]*)/g;
  const lines: React.ReactNode[] = [];
  let match;
  while ((match = lineRegex.exec(message)) !== null) {
    const key = match[1];
    const value = match[2];
    const color = ALERT_LABEL_COLORS[key] || '';
    lines.push(
      <div key={key}>
        <span className={`font-bold ${color}`}>• {key}:</span>
        <span className="ml-1 text-white">{value}</span>
      </div>
    );
  }
  return lines;
}

// Helper to color and style forecasted alert sections
function renderForecastedMessage(message: string) {
  // Update the sectionOrder for forecasted alerts to use the same color for Wind as current alerts
  const sectionOrder = [
    { key: 'Heat', color: 'text-red-400' },
    { key: 'Frost', color: 'text-sky-300' },
    { key: 'Drought', color: 'text-orange-400' },
    { key: 'Wind', color: 'text-slate-400' },
    { key: 'Flood', color: 'text-amber-700' },
    { key: 'HeavyRain', color: 'text-blue-700' },
  ];
  // Regex to split sections
  const sectionRegex = /• (Heat|Frost|Drought|Wind|Flood|HeavyRain):/g;
  const parts = message.split(sectionRegex);
  // parts: [before, section1, content1, section2, content2, ...]
  let rendered: React.ReactNode[] = [];
  let i = 1;
  while (i < parts.length) {
    const section = parts[i];
    const content = parts[i + 1] || '';
    const color = sectionOrder.find(s => s.key === section)?.color || '';
    // Style date/time in italics and lighter color, and value/unit in section color
    const contentLines = content.split('\n').map((line, idx) => {
      // For all alert types except Flood: Only show day label and value/unit, remove date/time
      if (["Heat", "Frost", "Drought", "Wind", "HeavyRain"].includes(section)) {
        // For Drought: ... Chance of Rain: XX%
        if (section === 'Drought') {
          const droughtMatch = line.match(/- ([^(]+) \([^)]*\):.*Chance of Rain: (\d+)%/);
          if (droughtMatch) {
            const dayLabel = droughtMatch[1].trim();
            const percent = droughtMatch[2];
            return (
              <div key={idx}>
                <span className="text-white">{dayLabel} </span>
                <span className="text-blue-400 font-semibold">{percent}%</span>
              </div>
            );
          }
          // If chance of rain is N/A or missing, do not render anything
          return null;
        } else {
          // Match: - Friday Night (2025-05-16T18:00:00-04:00): 80°F
          const valueMatch = line.match(/- ([^(]+) \([^)]*\): ([^\n]+)/);
          if (valueMatch) {
            const dayLabel = valueMatch[1].trim();
            const value = valueMatch[2].trim();
            return (
              <div key={idx}>
                <span className="text-white">{dayLabel} </span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            );
          }
        }
      }
      // For unmatched lines and Flood: Only show day label and value/unit, remove date/time
      const genericMatch = line.match(/- ([^(]+) \([^)]*\): ([^\n]+)/);
      if (genericMatch) {
        const dayLabel = genericMatch[1].trim();
        const value = genericMatch[2].trim();
        return (
          <div key={idx}>
            <span className="text-white">{dayLabel} </span>
            <span className={`font-semibold ${color}`}>{value}</span>
          </div>
        );
      }
      // If no match, just show the line as plain text
      return (
        <div key={idx}>
          <span className="text-white">{line}</span>
        </div>
      );
    });
    rendered.push(
      <div key={section} className={`mb-3`}>
        <span className={`font-bold ${color}`}>• {section}:</span>
        <div className="pl-4">{contentLines}</div>
      </div>
    );
    i += 2;
  }
  // Add any text before the first section (e.g., intro)
  if (parts[0].trim()) {
    rendered.unshift(<div key="intro" className="mb-2 whitespace-pre-line">{parts[0]}</div>);
  }
  // Add a line break before the outro ("Please prepare...")
  let outroIdx = parts.findIndex(p => p && p.trim().startsWith('Please prepare'));
  if (outroIdx > 0) {
    parts[outroIdx] = '\n' + parts[outroIdx];
  }
  // Add any text after the last section (e.g., outro)
  if (parts.length % 2 === 0 && parts[parts.length - 1].trim()) {
    rendered.push(<div key="outro" className="mt-2 whitespace-pre-line">{parts[parts.length - 1]}</div>);
  }
  return rendered;
}

export default function NotificationsList({ notifications, userEmail }: NotificationsListProps) {
  const [loading, setLoading] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  // --- Pagination state ---
  // { [plantId]: { page: number, pageSize: number } }
  const [plantPagination, setPlantPagination] = useState<Record<string, { page: number; pageSize: number }>>({});
  const PAGE_SIZE_OPTIONS = [1, 3, 10, 25, 50];
  const DEFAULT_PAGE_SIZE = 10;

  // Group pending invite notifications
  const otherNotifications = localNotifications.filter((n: Notification) => !(n.type === 'invite' && n.meta?.inviteId));

  // Group forecasted and current weather alerts by hierarchy
  const grouped = groupNotificationsByHierarchy(otherNotifications);

  // Helper to get pagination state for a plant
  const getPagination = useCallback((plantId: string) => {
    return plantPagination[plantId] || { page: 1, pageSize: DEFAULT_PAGE_SIZE };
  }, [plantPagination]);

  // Helper to set pagination state for a plant
  const setPagination = (plantId: string, page: number, pageSize?: number) => {
    setPlantPagination(prev => ({
      ...prev,
      [plantId]: {
        page: Math.max(1, page),
        pageSize: pageSize ?? (prev[plantId]?.pageSize || DEFAULT_PAGE_SIZE),
      },
    }));
  };

  // Only show Clear All if user is bmostradingpost@gmail.com
  const canClearAll = userEmail === 'bmostradingpost@gmail.com';

  async function handleMarkAllRead() {
    setLoading(true);
    const ids = localNotifications.map(n => n.id);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    setLocalNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    setLoading(false);
    window.location.reload();
  }

  async function handleClearAll() {
    setLoading(true);
    await fetch('/api/notifications', { method: 'DELETE' });
    setLocalNotifications([]);
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-garden-400">Notifications</h1>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={loading || localNotifications.length === 0}
            className="px-3 py-1 rounded bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Marking...' : 'Mark all as read'}
          </button>
          {canClearAll && (
            <button
              onClick={handleClearAll}
              disabled={loading || localNotifications.length === 0}
              className="px-3 py-1 rounded bg-red-700 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear all'}
            </button>
          )}
        </div>
      </div>
      {Object.keys(grouped).length === 0 && otherNotifications.filter(n => n.type !== 'invite').length === 0 ? (
        <div className="text-dark-text-secondary">No new notifications.</div>
      ) : (
        <ul className="space-y-2">
          {Object.entries(grouped).map(([gardenId, gardenObj]) => {
            const garden = gardenObj as { name: string; rooms: Record<string, any> };
            return (
              <Disclosure key={gardenId} defaultOpen>
                {({ open }) => (
                  <li className="border rounded bg-dark-bg-secondary">
                    <Disclosure.Button className="w-full flex items-center justify-between px-4 py-2 text-lg font-semibold text-garden-400">
                      <span>{garden.name}</span>
                      {open ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </Disclosure.Button>
                    <Disclosure.Panel>
                      <ul className="pl-4">
                        {Object.entries(garden.rooms).map(([roomId, roomObj]) => {
                          const room = roomObj as { name: string; zones: Record<string, any> };
                          return (
                            <Disclosure key={roomId} defaultOpen>
                              {({ open: openRoom }) => (
                                <li>
                                  <Disclosure.Button className="w-full flex items-center justify-between px-2 py-1 text-emerald-300 font-medium">
                                    <span>{room.name}</span>
                                    {openRoom ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                  </Disclosure.Button>
                                  <Disclosure.Panel>
                                    <ul className="pl-4">
                                      {Object.entries(room.zones).map(([zoneId, zoneObj]) => {
                                        const zone = zoneObj as { name: string; plants: Record<string, any> };
                                        return (
                                          <Disclosure key={zoneId} defaultOpen>
                                            {({ open: openZone }) => (
                                              <li>
                                                <Disclosure.Button className="w-full flex items-center justify-between px-2 py-1 text-emerald-200">
                                                  <span>{zone.name}</span>
                                                  {openZone ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                </Disclosure.Button>
                                                <Disclosure.Panel>
                                                  <ul className="pl-4">
                                                    {Object.entries(zone.plants).map(([plantId, plantObj]) => {
                                                      const plant = plantObj as { name: string; notifications: Notification[] };
                                                      const { page, pageSize } = getPagination(plantId);
                                                      const total = plant.notifications.length;
                                                      const totalPages = Math.max(1, Math.ceil(total / pageSize));
                                                      const pagedNotifications = plant.notifications.slice((page - 1) * pageSize, page * pageSize);
                                                      return (
                                                        <Disclosure key={plantId} defaultOpen>
                                                          {({ open: openPlant }) => (
                                                            <li>
                                                              <Disclosure.Button className="w-full flex items-center justify-between px-2 py-1 text-emerald-100">
                                                                <span>{plant.name}</span>
                                                                {openPlant ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                              </Disclosure.Button>
                                                              <Disclosure.Panel>
                                                                <ul className="pl-4">
                                                                  {pagedNotifications.map((n: Notification) => {
                                                                    const notificationContent = (
                                                                      <>
                                                                        <div className="flex items-center justify-between">
                                                                          <div className="font-semibold text-garden-400">{n.title}</div>
                                                                          <div className="flex items-center gap-2">
                                                                            <div className="text-xs text-dark-text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
                                                                          </div>
                                                                        </div>
                                                                        {n.meta && (n.meta.roomName || n.meta.zoneName) && (
                                                                          <div className="text-xs text-emerald-300 mt-1">
                                                                            {n.meta.roomName && <span>Room/Plot: {n.meta.roomName} </span>}
                                                                            {n.meta.zoneName && <span>Zone: {n.meta.zoneName}</span>}
                                                                          </div>
                                                                        )}
                                                                        {n.type === 'WEATHER_FORECAST_ALERT' && n.message ? (
                                                                          <div className="mt-1">{renderForecastedMessage(n.message)}</div>
                                                                        ) : (
                                                                          <div className="text-dark-text-primary mt-1 whitespace-pre-line">{n.message}</div>
                                                                        )}
                                                                        {n.type === 'LOG' && (
                                                                          <div className="mt-2 text-xs font-bold text-emerald-400">Log Entry</div>
                                                                        )}
                                                                      </>
                                                                    );
                                                                    const notificationClass = `p-4 rounded border transition mb-2 ${n.read ? 'bg-dark-bg-primary border-dark-border' : 'bg-garden-950/60 border-green-400 shadow-lg'}${n.link ? ' cursor-pointer hover:border-green-500' : ''}`;
                                                                    return n.link ? (
                                                                      <Link key={n.id} href={n.link} className={notificationClass} prefetch={false}>
                                                                        {notificationContent}
                                                                      </Link>
                                                                    ) : (
                                                                      <li key={n.id} className={notificationClass}>
                                                                        {notificationContent}
                                                                      </li>
                                                                    );
                                                                  })}
                                                                </ul>
                                                                {/* Pagination controls */}
                                                                <div className="flex items-center justify-between mt-2 px-2">
                                                                  <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-dark-text-secondary">Page size:</span>
                                                                    <select
                                                                      value={pageSize}
                                                                      onChange={e => setPagination(plantId, 1, Number(e.target.value))}
                                                                      className="rounded bg-dark-bg-primary text-dark-text-secondary border border-dark-border px-1 py-0.5 text-xs focus:outline-none appearance-none pr-8"
                                                                    >
                                                                      {PAGE_SIZE_OPTIONS.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                      ))}
                                                                    </select>
                                                                  </div>
                                                                  <div className="flex items-center gap-2">
                                                                    <button
                                                                      className="px-2 py-1 rounded text-xs bg-dark-bg-primary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-hover disabled:opacity-50"
                                                                      onClick={() => setPagination(plantId, page - 1)}
                                                                      disabled={page === 1}
                                                                    >
                                                                      Previous
                                                                    </button>
                                                                    <span className="text-xs text-dark-text-secondary">
                                                                      Page {page} of {totalPages}
                                                                    </span>
                                                                    <button
                                                                      className="px-2 py-1 rounded text-xs bg-dark-bg-primary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-hover disabled:opacity-50"
                                                                      onClick={() => setPagination(plantId, page + 1)}
                                                                      disabled={page === totalPages}
                                                                    >
                                                                      Next
                                                                    </button>
                                                                  </div>
                                                                </div>
                                                              </Disclosure.Panel>
                                                            </li>
                                                          )}
                                                        </Disclosure>
                                                      );
                                                    })}
                                                  </ul>
                                                </Disclosure.Panel>
                                              </li>
                                            )}
                                          </Disclosure>
                                        );
                                      })}
                                    </ul>
                                  </Disclosure.Panel>
                                </li>
                              )}
                            </Disclosure>
                          );
                        })}
                      </ul>
                    </Disclosure.Panel>
                  </li>
                )}
              </Disclosure>
            );
          })}
        </ul>
      )}
      {/* Render non-grouped notifications (e.g., general alerts, if any, that are not plant-specific) */}
      {otherNotifications.filter(n => !n.meta?.plantId && n.type !== 'invite').length > 0 && (
        <ul className="space-y-2 mt-4">
          {otherNotifications
            .filter(n => !n.meta?.plantId && n.type !== 'invite')
            .map((n: Notification) => {
              const notificationContent = (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-garden-400">{n.title}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-dark-text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-dark-text-primary mt-1 whitespace-pre-line">{n.message}</div>
                  {n.type === 'LOG' && (
                    <div className="mt-2 text-xs font-bold text-emerald-400">Log Entry</div>
                  )}
                  {n.link && (
                    <div className="mt-2 text-xs text-blue-400 underline">Go to related page</div>
                  )}
                </>
              );
              const notificationClass = `p-4 rounded border transition mb-2 ${n.read ? 'bg-dark-bg-primary border-dark-border' : 'bg-garden-950/60 border-green-400 shadow-lg'}${n.link ? ' cursor-pointer hover:border-green-500' : ''}`;
              return n.link ? (
                <Link key={n.id} href={n.link} className={notificationClass} prefetch={false}>
                  {notificationContent}
                </Link>
              ) : (
                <li key={n.id} className={notificationClass}>
                  {notificationContent}
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
} 