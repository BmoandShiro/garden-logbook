"use client";
import { useState } from 'react';

export default function CleanupOrphanedPlantsButton() {
  const [isCleaning, setIsCleaning] = useState(false);

  async function handleCleanup() {
    if (!confirm('Are you sure you want to clean up orphaned plants? This cannot be undone.')) return;
    setIsCleaning(true);
    await fetch('/api/plants/cleanup-orphaned', { method: 'POST' });
    window.location.reload();
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={isCleaning}
      className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
    >
      {isCleaning ? 'Cleaning...' : 'Clean Up Orphaned Plants'}
    </button>
  );
} 