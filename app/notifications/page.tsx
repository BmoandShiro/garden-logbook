"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingInvitesWrapper from '../components/PendingInvitesWrapper';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Define Notification type
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  meta?: { inviteId?: string };
  read: boolean;
  createdAt: string;
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

  // Group pending invite notifications
  const pendingInvites = notifications.filter(n => n.type === 'invite' && n.meta?.inviteId);
  const otherNotifications = notifications.filter(n => !(n.type === 'invite' && n.meta?.inviteId));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Pending Invites Dropdown */}
      <PendingInvitesWrapper />
      {/* Pending Invites Dropdown */}
      {pendingInvites.length > 0 && (
        <Disclosure defaultOpen={pendingOpen}>
          {({ open }) => (
            <div className="mb-6">
              <Disclosure.Button
                className="flex items-center justify-between w-full px-4 py-2 bg-dark-bg-secondary border border-garden-600 rounded-lg shadow-md focus:outline-none"
                onClick={() => setPendingOpen(!open)}
              >
                <span className="font-bold text-garden-400">Pending Garden Invites</span>
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white">
                    {pendingInvites.length}
                  </span>
                  {open ? (
                    <ChevronUpIcon className="h-5 w-5 text-garden-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-garden-400" />
                  )}
                </span>
              </Disclosure.Button>
              <Disclosure.Panel>
                <ul className="space-y-2 mt-2">
                  {pendingInvites.map((n) => (
                    <li
                      key={n.id}
                      className={`p-4 rounded border transition flex items-center justify-between bg-dark-bg-primary border-garden-600`}
                    >
                      <div>
                        <div className="font-semibold text-emerald-200">{n.title}</div>
                        <div className="text-dark-text-primary mt-1">{n.message}</div>
                        <div className="text-xs text-dark-text-secondary mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      {n.meta?.inviteId && (
                        <>
                          <button
                            onClick={() => acceptInvite(n.meta?.inviteId ?? '', n.id)}
                            disabled={accepting === n.meta?.inviteId || declining === n.meta?.inviteId}
                            className="ml-4 px-3 py-1 rounded bg-garden-600 text-white text-sm font-medium hover:bg-garden-500 disabled:opacity-50"
                          >
                            {accepting === n.meta?.inviteId ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => declineInvite(n.meta?.inviteId ?? '', n.id)}
                            disabled={declining === n.meta?.inviteId || accepting === n.meta?.inviteId}
                            className="ml-2 px-3 py-1 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
                          >
                            {declining === n.meta?.inviteId ? 'Declining...' : 'Decline'}
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      )}
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
      ) : otherNotifications.length === 0 ? (
        <div className="text-dark-text-secondary">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {otherNotifications.map((n) => (
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