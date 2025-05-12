"use client";

import { useEffect, useState } from "react";

interface PendingInvite {
  id: string;
  gardenId: string;
  email: string;
  invitedAt: string;
  accepted: boolean;
  garden: { id: string; name: string };
}

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

export default function PendingInvitesWrapper({ className = "" }: { className?: string }) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchInvitesAndNotifications();
  }, []);

  async function fetchInvitesAndNotifications() {
    setLoading(true);
    const res = await fetch("/api/gardens/invites/pending");
    const data = await res.json();
    setInvites(data.invites || []);
    setNotifications(data.notifications || []);
    setLoading(false);
  }

  async function acceptInvite(inviteId: string, notificationId?: string) {
    setAccepting(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/accept`, { method: "POST" });
    if (notificationId) {
      await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
    }
    await fetchInvitesAndNotifications();
    setAccepting(null);
  }

  async function declineInvite(inviteId: string, notificationId?: string) {
    setDeclining(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/decline`, { method: "POST" });
    if (notificationId) {
      await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
    }
    await fetchInvitesAndNotifications();
    setDeclining(null);
  }

  if (loading) return null;
  if (invites.length === 0) return null;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="bg-dark-bg-secondary border border-garden-600 rounded-lg p-4 shadow-md">
        <div className="font-bold text-garden-400 mb-2">Pending Garden Invites</div>
        <ul className="space-y-2">
          {invites.map((invite) => {
            const notification = notifications?.find(n => n.meta?.inviteId === invite.id);
            return (
              <li key={invite.id} className="flex items-center justify-between bg-dark-bg-primary rounded px-3 py-2">
                <div>
                  <span className="font-semibold text-emerald-200">{invite.garden.name}</span>
                  <span className="ml-2 text-xs text-dark-text-secondary">Invited: {new Date(invite.invitedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => acceptInvite(invite.id, notification?.id)}
                    disabled={accepting === invite.id || declining === invite.id}
                    className="px-3 py-1 rounded bg-garden-600 text-white text-sm font-medium hover:bg-garden-500 disabled:opacity-50"
                  >
                    {accepting === invite.id ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    onClick={() => declineInvite(invite.id, notification?.id)}
                    disabled={declining === invite.id || accepting === invite.id}
                    className="px-3 py-1 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
                  >
                    {declining === invite.id ? "Declining..." : "Decline"}
                  </button>
                  <button
                    onClick={async () => {
                      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
                      if (notification?.id) {
                        await fetch(`/api/notifications/${notification.id}`, { method: "DELETE" });
                      }
                      await fetch(`/api/gardens/invites/${invite.id}/decline`, { method: "POST" });
                      await fetchInvitesAndNotifications();
                    }}
                    className="ml-2 px-2 py-1 rounded bg-dark-bg-secondary text-dark-text-secondary text-xs font-bold hover:bg-dark-bg-primary border border-dark-border"
                    title="Clear this invite"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 