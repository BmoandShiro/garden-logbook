"use client";
import { useEffect, useState } from "react";

interface LogToggleButtonProps {
  gardenId: string;
}

export default function LogToggleButton({ gardenId }: LogToggleButtonProps) {
  const [showLogs, setShowLogs] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPref() {
      setLoading(true);
      try {
        const res = await fetch(`/api/gardens/${gardenId}/log-visibility`);
        const data = await res.json();
        setShowLogs(data.showLogs);
      } catch {
        setShowLogs(true); // default to ON
      } finally {
        setLoading(false);
      }
    }
    fetchPref();
  }, [gardenId]);

  async function toggle() {
    if (loading || showLogs === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gardens/${gardenId}/log-visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showLogs: !showLogs }),
      });
      const data = await res.json();
      setShowLogs(data.showLogs);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || showLogs === null}
      className={`ml-2 px-2 py-1 rounded text-xs font-semibold border border-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
        showLogs === false
          ? "text-red-500 border-red-500 bg-emerald-950 hover:bg-red-950"
          : "text-emerald-200 bg-emerald-950 hover:bg-emerald-800"
      }`}
      title={showLogs === false ? "Show logs from this garden in your calendar/logs: OFF" : "Show logs from this garden in your calendar/logs: ON"}
    >
      Log
    </button>
  );
} 