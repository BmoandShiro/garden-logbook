"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 rounded-lg bg-dark-bg-secondary border border-dark-border shadow-lg text-dark-text-primary">
      <h1 className="text-2xl font-bold mb-6 text-center text-garden-400">Profile</h1>
      <div className="flex flex-col items-center gap-4 mb-8">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || user.email || "User Avatar"}
            width={96}
            height={96}
            className="rounded-full border-4 border-garden-600 shadow"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-garden-900 flex items-center justify-center text-4xl font-bold text-garden-400 border-4 border-garden-600 shadow">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <button
          className="mt-2 px-4 py-1 rounded bg-garden-700 text-white hover:bg-garden-600 text-sm opacity-60 cursor-not-allowed"
          disabled
        >
          Change Avatar (coming soon)
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <span className="block text-sm text-dark-text-secondary">User ID</span>
          <span className="block font-mono text-lg text-garden-300 break-all">{user?.id || "-"}</span>
        </div>
        <div>
          <span className="block text-sm text-dark-text-secondary">Name</span>
          <span className="block text-lg">{user?.name || "-"}</span>
        </div>
        <div>
          <span className="block text-sm text-dark-text-secondary">Email</span>
          <span className="block text-lg">{user?.email || "-"}</span>
        </div>
      </div>
    </div>
  );
} 