"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

type UserWithUsername = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: any;
  username?: string | null;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as UserWithUsername | undefined;
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (loading || !username || username === (user?.username || "")) return;
    setLoading(true);
    try {
      // Implement the logic to save the new username
      // This is a placeholder and should be replaced with actual implementation
      console.log("Saving new username:", username);
      // Assuming the username is saved successfully
      setEditing(false);
      setUsername(user?.username || "");
    } catch (error) {
      console.error("Error saving username:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <span className="block text-sm text-dark-text-secondary">Username</span>
          {editing ? (
            <div className="flex gap-2 items-center mt-1">
              <input
                className="rounded border px-2 py-1 text-white bg-dark-bg focus:bg-dark-bg-secondary border-dark-border placeholder-gray-400 w-48"
                value={username}
                onChange={e => setUsername(e.target.value)}
                minLength={3}
                maxLength={32}
                disabled={loading}
                placeholder="Enter username"
              />
              <button
                className="px-3 py-1 rounded bg-garden-600 text-white hover:bg-garden-500 disabled:opacity-50"
                onClick={handleSave}
                disabled={loading || !username || username === (user?.username || "")}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                className="px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-500"
                onClick={() => { setEditing(false); setUsername(user?.username || ""); }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center mt-1">
              <span className="text-lg">{user?.username || <span className="italic text-gray-400">(none)</span>}</span>
              <button
                className="px-2 py-1 rounded bg-garden-700 text-white hover:bg-garden-600 text-sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 