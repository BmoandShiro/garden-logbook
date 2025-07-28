"use client";

import { useState } from "react";
import LogsList, { groupLogs } from "@/app/logs/components/LogsList";
import { LogType } from "@/types/enums";

interface LogWithLocation {
  id: string;
  logDate: string | Date;
  type: LogType;
  notes?: string | null;
  plant?: { name: string };
  garden?: { name: string };
  room?: { name: string };
  zone?: { name: string };
  temperature?: number | null;
  temperatureUnit?: string;
  humidity?: number | null;
  waterAmount?: number | null;
  waterUnit?: string;
  height?: number | null;
  heightUnit?: string;
  width?: number | null;
  widthUnit?: string;
  healthRating?: number | null;
  data?: any;
  nutrientWaterTemperature?: number | null;
  nutrientWaterTemperatureUnit?: string;
  destinationGardenId?: string | null;
  destinationRoomId?: string | null;
  destinationZoneId?: string | null;
}

interface PlantLogsListWrapperProps {
  logs: LogWithLocation[];
}

export default function PlantLogsListWrapper({ logs: initialLogs }: PlantLogsListWrapperProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE_OPTIONS = [1, 2, 3, 5, 10, 25, 50];

  const handleLogDeleted = (deletedLogId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== deletedLogId));
  };

  // Group the logs first, then paginate the groups
  const groupedLogs = groupLogs(logs);
  const totalPages = groupedLogs.length ? Math.max(1, Math.ceil(groupedLogs.length / pageSize)) : 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGroups = groupedLogs.slice(startIndex, endIndex);
  
  // Flatten the paginated groups back to individual logs for LogsList
  const paginatedLogs = paginatedGroups.flat();

  return (
    <div className="space-y-4">
      <LogsList logs={paginatedLogs} onLogDeleted={handleLogDeleted} />
      {logs.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-text-secondary">Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1); // Reset to first page when changing page size
              }}
              className="rounded bg-dark-bg-primary text-dark-text-secondary border border-dark-border px-1 py-0.5 text-xs focus:outline-none appearance-none pr-8"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded text-xs bg-dark-bg-primary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-hover disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-xs text-dark-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-2 py-1 rounded text-xs bg-dark-bg-primary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-hover disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 