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
    setAccepting(null);
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
              <button
                onClick={() => acceptInvite(invite.id)}
                disabled={accepting === invite.id}
                className="ml-4 px-3 py-1 rounded bg-garden-600 text-white text-sm font-medium hover:bg-garden-500 disabled:opacity-50"
              >
                {accepting === invite.id ? "Accepting..." : "Accept"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 