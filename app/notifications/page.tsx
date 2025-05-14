"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import PendingInvitesWrapper from '../components/PendingInvitesWrapper';

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

// Helper to color and style forecasted alert sections
function renderForecastedMessage(message: string) {
  // Split by section (• Heat:, • Frost:, etc.)
  const sectionOrder = [
    { key: 'Heat', color: 'text-red-400' },
    { key: 'Frost', color: 'text-sky-300' },
    { key: 'Drought', color: 'text-orange-400' },
    { key: 'Wind', color: 'text-gray-300' },
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
      // Regex: match date/time in parentheses, then value/unit at end
      // Example: - Friday (2025-05-14T06:00:00-04:00): 74°F
      const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*)\)/);
      const valueMatch = line.match(/([\d.]+\s*[^\s)]+)$/); // match value+unit at end, not inside parens
      let before = line;
      let date = null;
      let value = null;
      if (dateMatch) {
        // Find the index of the date/time
        const dateIdx = line.indexOf(dateMatch[0]);
        before = line.slice(0, dateIdx);
        date = dateMatch[0];
      }
      if (valueMatch) {
        // Find the index of the value/unit
        const valueIdx = line.lastIndexOf(valueMatch[1]);
        // Only remove value if it's not part of the date/time
        if (!date || valueIdx > (date ? line.indexOf(date) + (date?.length || 0) : 0)) {
          before = before.slice(0, valueIdx - (date ? 0 : 0));
          value = valueMatch[1];
        }
      }
      return (
        <div key={idx}>
          <span className="text-white">{before}</span>
          {date && <span className="italic text-gray-400">{date}</span>}
          {value && <span className={`font-semibold ${color}`}> {value}</span>}
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [sortOrder]);

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch(`/api/notifications`);
    const data = await res.json();
    let notifs: Notification[] = data.notifications || [];
    notifs = notifs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setNotifications(notifs);
    setLoading(false);
  }

  async function markAsRead(id: string, link?: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (link) router.push(link);
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadIds }),
    });
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }

  async function acceptInvite(inviteId: string, notificationId: string) {
    setAccepting(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/accept`, { method: 'POST' });
    setNotifications((prev) => prev.filter(n => n.meta?.inviteId !== inviteId));
    setAccepting(null);
  }

  async function declineInvite(inviteId: string, notificationId: string) {
    setDeclining(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/decline`, { method: 'POST' });
    setNotifications((prev) => prev.filter(n => n.meta?.inviteId !== inviteId));
    setDeclining(null);
  }

  async function clearAllNotifications() {
    if (!window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
    setLoading(true);
    await fetch('/api/notifications', { method: 'DELETE' });
    await fetchNotifications();
    setLoading(false);
  }

  // Group pending invite notifications
  const pendingInvites = notifications.filter(n => n.type === 'invite' && n.meta?.inviteId);
  const otherNotifications = notifications.filter(n => !(n.type === 'invite' && n.meta?.inviteId));

  // Group forecasted and current weather alerts by hierarchy
  const grouped = groupNotificationsByHierarchy(otherNotifications);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Pending Invites Dropdown */}
      <PendingInvitesWrapper />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-garden-400">Notifications</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={markAllAsRead}
            className="px-3 py-1 rounded bg-garden-600 text-white text-sm font-medium hover:bg-garden-500 disabled:opacity-50"
            disabled={notifications.every(n => n.read)}
          >
            Mark all as read
          </button>
          <button
            onClick={clearAllNotifications}
            className="px-3 py-1 rounded bg-red-700 text-white text-sm font-medium hover:bg-red-600"
          >
            Clear All Notifications
          </button>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
            className="ml-2 rounded border border-dark-border bg-dark-bg-primary text-dark-text-primary px-2 py-1 text-sm"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-dark-text-secondary">Loading notifications...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-dark-text-secondary">No notifications yet.</div>
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
                                                                  {plant.notifications.map((n: Notification) => (
                                                                    <li
                                                                      key={n.id}
                                                                      className={`p-4 rounded border transition cursor-pointer mb-2 ${n.read ? 'bg-dark-bg-primary border-dark-border' : 'bg-garden-950/60 border-garden-600 shadow-lg'}`}
                                                                      onClick={() => markAsRead(n.id, n.link)}
                                                                    >
                                                                      <div className="flex items-center justify-between">
                                                                        <div className="font-semibold text-garden-400">{n.title}</div>
                                                                        <div className="flex items-center gap-2">
                                                                          <div className="text-xs text-dark-text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
                                                                          <button
                                                                            onClick={async (e) => {
                                                                              e.stopPropagation();
                                                                              setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
                                                                              await fetch(`/api/notifications/${n.id}`, { method: "DELETE" });
                                                                            }}
                                                                            className="ml-2 px-2 py-1 rounded bg-dark-bg-secondary text-dark-text-secondary text-xs font-bold hover:bg-dark-bg-primary border border-dark-border"
                                                                            title="Clear this notification"
                                                                          >
                                                                            ×
                                                                          </button>
                                                                        </div>
                                                                      </div>
                                                                      {/* Show room and zone names if available */}
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
                                                                      {n.link && (
                                                                        <div className="mt-2 text-xs text-blue-400 underline">Go to related page</div>
                                                                      )}
                                                                    </li>
                                                                  ))}
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
                    </Disclosure.Panel>
                  </li>
                )}
              </Disclosure>
            );
          })}
        </ul>
      )}
    </div>
  );
} 