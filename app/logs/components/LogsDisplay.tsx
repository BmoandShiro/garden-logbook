'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Log, LogType } from '@prisma/client';
import { format } from 'date-fns';
import LogFilters from './LogFilters';
import LogsList from './LogsList';
import CreateLogModal from './CreateLogModal';

interface LogWithLocation extends Log {
  plant?: {
    name: string;
  };
  garden?: {
    name: string;
  };
  room?: {
    name: string;
  };
  zone?: {
    name: string;
  };
}

interface LogsDisplayProps {
  userId: string;
}

async function fetchLogs(userId: string, filters: any) {
  const queryParams = new URLSearchParams({
    userId,
    ...filters,
  });
  const response = await fetch(`/api/logs?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return response.json();
}

export default function LogsDisplay({ userId }: LogsDisplayProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  const { data: logs, isLoading, error, refetch } = useQuery<LogWithLocation[]>({
    queryKey: ['logs', userId, filters],
    queryFn: () => fetchLogs(userId, filters),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        Error loading logs. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark-text-primary">Log Entries</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-garden-600 hover:bg-garden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500"
        >
          Create Log
        </button>
      </div>
      <LogFilters filters={filters} onFilterChange={setFilters} />
      <LogsList logs={logs || []} onLogDeleted={refetch} />
      <CreateLogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userId={userId}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
} 