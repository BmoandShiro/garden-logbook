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

export default function PendingInvitesWrapper({ className = "" }: { className?: string }) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    setLoading(true);
    const res = await fetch("/api/gardens/invites/pending");
    const data = await res.json();
    setInvites(data.invites || []);
    setLoading(false);
  }

  async function acceptInvite(inviteId: string) {
    setAccepting(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/accept`, { method: "POST" });
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    await fetch(`/api/notifications?inviteId=${inviteId}`, { method: "DELETE" });
    setAccepting(null);
  }

  async function declineInvite(inviteId: string) {
    setDeclining(inviteId);
    await fetch(`/api/gardens/invites/${inviteId}/decline`, { method: "POST" });
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    await fetch(`/api/notifications?inviteId=${inviteId}`, { method: "DELETE" });
    setDeclining(null);
  }

  if (loading) return null;
  if (invites.length === 0) return null;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="bg-dark-bg-secondary border border-garden-600 rounded-lg p-4 shadow-md">
        <div className="font-bold text-garden-400 mb-2">Pending Garden Invites</div>
        <ul className="space-y-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between bg-dark-bg-primary rounded px-3 py-2">
              <div>
                <span className="font-semibold text-emerald-200">{invite.garden.name}</span>
                <span className="ml-2 text-xs text-dark-text-secondary">Invited: {new Date(invite.invitedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => acceptInvite(invite.id)}
                  disabled={accepting === invite.id || declining === invite.id}
                  className="px-3 py-1 rounded bg-garden-600 text-white text-sm font-medium hover:bg-garden-500 disabled:opacity-50"
                >
                  {accepting === invite.id ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => declineInvite(invite.id)}
                  disabled={declining === invite.id || accepting === invite.id}
                  className="px-3 py-1 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
                >
                  {declining === invite.id ? "Declining..." : "Decline"}
                </button>
                <button
                  onClick={async () => {
                    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
                    await fetch(`/api/notifications?inviteId=${invite.id}`, { method: "DELETE" });
                  }}
                  className="ml-2 px-2 py-1 rounded bg-dark-bg-secondary text-dark-text-secondary text-xs font-bold hover:bg-dark-bg-primary border border-dark-border"
                  title="Clear this invite"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 