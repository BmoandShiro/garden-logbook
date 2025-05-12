"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingInvitesWrapper from '../components/PendingInvitesWrapper';

// Define Notification type
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const router = useRouter();

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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
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
      ) : notifications.length === 0 ? (
        <div className="text-dark-text-secondary">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded border transition cursor-pointer ${n.read ? 'bg-dark-bg-primary border-dark-border' : 'bg-garden-950/60 border-garden-600 shadow-lg'}`}
              onClick={() => markAsRead(n.id, n.link)}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-garden-400">{n.title}</div>
                <div className="text-xs text-dark-text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-dark-text-primary mt-1">{n.message}</div>
              {n.link && (
                <div className="mt-2 text-xs text-blue-400 underline">Go to related page</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 