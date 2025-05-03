"use client";
import React from 'react';

export default function LogRawDataToggle({ log }: { log: any }) {
  const [showRaw, setShowRaw] = React.useState(false);
  return (
    <div className="mb-6">
      <button
        className="px-4 py-2 rounded bg-garden-500 text-white hover:bg-garden-600 transition"
        onClick={() => setShowRaw((v) => !v)}
      >
        {showRaw ? 'Hide Raw Data' : 'Show Raw Data'}
      </button>
      {showRaw && (
        <div className="bg-dark-bg-primary rounded-lg shadow p-6 mt-4">
          <h2 className="text-lg font-semibold mb-2 text-garden-400">All Log Data</h2>
          <pre className="text-dark-text-primary text-sm overflow-x-auto">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 