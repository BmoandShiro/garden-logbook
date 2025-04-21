'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Log, LogType } from '@prisma/client';
import { format } from 'date-fns';
import LogFilters from './LogFilters';
import LogsList from './LogsList';
import CreateLogModal from './CreateLogModal';
import UnitPreferences from './UnitPreferences';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

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
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to fetch logs');
  }
  return response.json();
}

export default function LogsDisplay({ userId }: LogsDisplayProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const { preferences, updateUnitPreference } = useUserPreferences();
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  const { data: logs, isLoading, error, refetch } = useQuery<LogWithLocation[]>({
    queryKey: ['logs', userId, filters],
    queryFn: () => fetchLogs(userId, filters),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
    refetchOnWindowFocus: true,
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-center">
          {error instanceof Error ? error.message : 'Error loading logs. Please try again later.'}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium text-white bg-garden-600 hover:bg-garden-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-400"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark-text-primary">Log Entries</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPreferencesOpen(true)}
            className="text-dark-text-secondary hover:text-dark-text-primary"
            title="Unit Preferences"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-garden-600 hover:bg-garden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500"
          >
            Create Log
          </button>
        </div>
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

      <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unit Preferences</DialogTitle>
          </DialogHeader>
          <UnitPreferences
            preferences={preferences.units}
            onChange={(newPreferences) => {
              Object.entries(newPreferences).forEach(([unit, value]) => {
                updateUnitPreference(unit as any, value as any);
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 