'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Log, LogType } from '@prisma/client';
import { format } from 'date-fns';
import LogFilters from './LogFilters';
import LogsList from './LogsList';
import { groupLogs } from './LogsList';
import CreateLogModal from './CreateLogModal';
import UnitPreferences from './UnitPreferences';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useSearchParams } from 'next/navigation';

interface LogWithLocation {
  id: string;
  logDate: string | Date;
  type: LogType;
  stage?: string | null;
  notes?: string | null;
  plantId?: string | null;
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
  temperature?: number | null | undefined;
  temperatureUnit?: string | undefined;
  humidity?: number | null | undefined;
  waterAmount?: number | null | undefined;
  waterUnit?: string | undefined;
  height?: number | null | undefined;
  heightUnit?: string | undefined;
  width?: number | null | undefined;
  widthUnit?: string | undefined;
  healthRating?: number | null | undefined;
  data?: any;
  nutrientWaterTemperature?: number | null | undefined;
  nutrientWaterTemperatureUnit?: string | undefined;
  destinationGardenId?: string | null | undefined;
  destinationRoomId?: string | null | undefined;
  destinationZoneId?: string | null | undefined;
  user?: {
    id: string;
    username?: string | null;
    email?: string | null;
  };
}

interface LogsDisplayProps {
  userId: string;
}

async function fetchLogs(userId: string, filters: any) {
  let { startDate, endDate, ...rest } = filters;
  // If startDate and endDate are the same, set endDate to end of that day
  if (startDate && endDate && startDate === endDate) {
    // Format as YYYY-MM-DDT23:59:59 for the query
    endDate = startDate + 'T23:59:59';
    startDate = startDate + 'T00:00:00';
  }
  const queryParams = new URLSearchParams({
    userId,
    ...rest,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { preferences, updateUnitPreference } = useUserPreferences();
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    location: '',
    gardenId: '',
    roomId: '',
    zoneId: '',
    plantId: '',
  });
  const importInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  // Add state for gardens, rooms, zones, plants
  const [gardens, setGardens] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [zones, setZones] = useState([]);
  const [plants, setPlants] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const PAGE_SIZE_OPTIONS = [1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000];

  // On mount, initialize filters from query params if present
  useEffect(() => {
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    if (startDate || endDate) {
      setFilters((prev) => ({
        ...prev,
        startDate,
        endDate,
      }));
    }
  }, [searchParams]);

  // Fetch gardens on mount
  useEffect(() => {
    async function fetchGardens() {
      const res = await fetch('/api/gardens');
      if (res.ok) {
        const data = await res.json();
        setGardens(data.map((g: any) => ({ id: g.id, name: g.name })));
      }
    }
    fetchGardens();
  }, []);

  // Fetch rooms when gardenId changes
  useEffect(() => {
    if (!filters.gardenId) {
      setRooms([]);
      setZones([]);
      setPlants([]);
      setFilters(f => ({ ...f, roomId: '', zoneId: '', plantId: '' }));
      return;
    }
    async function fetchRooms() {
      const res = await fetch(`/api/gardens/${filters.gardenId}/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.map((r: any) => ({ id: r.id, name: r.name, gardenId: filters.gardenId })));
      }
    }
    fetchRooms();
    setZones([]);
    setPlants([]);
    setFilters(f => ({ ...f, roomId: '', zoneId: '', plantId: '' }));
  }, [filters.gardenId]);

  // Fetch zones when roomId changes
  useEffect(() => {
    if (!filters.gardenId || !filters.roomId) {
      setZones([]);
      setPlants([]);
      setFilters(f => ({ ...f, zoneId: '', plantId: '' }));
      return;
    }
    async function fetchZones() {
      const res = await fetch(`/api/gardens/${filters.gardenId}/rooms/${filters.roomId}/zones`);
      if (res.ok) {
        const data = await res.json();
        setZones(data.map((z: any) => ({ id: z.id, name: z.name, roomId: filters.roomId })));
      }
    }
    fetchZones();
    setPlants([]);
    setFilters(f => ({ ...f, zoneId: '', plantId: '' }));
  }, [filters.gardenId, filters.roomId]);

  // Fetch plants when zoneId changes
  useEffect(() => {
    if (!filters.gardenId || !filters.roomId || !filters.zoneId) {
      setPlants([]);
      setFilters(f => ({ ...f, plantId: '' }));
      return;
    }
    async function fetchPlants() {
      const res = await fetch(`/api/gardens/${filters.gardenId}/rooms/${filters.roomId}/zones/${filters.zoneId}/plants`);
      if (res.ok) {
        const data = await res.json();
        setPlants(data.map((p: any) => ({ id: p.id, name: p.name, zoneId: filters.zoneId })));
      }
    }
    fetchPlants();
    setFilters(f => ({ ...f, plantId: '' }));
  }, [filters.gardenId, filters.roomId, filters.zoneId]);

  const { data: logs, isLoading, error, refetch } = useQuery<LogWithLocation[]>({
    queryKey: ['logs', userId, filters],
    queryFn: () => fetchLogs(userId, filters),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Group the logs first, then paginate the groups
  const groupedLogs = logs ? groupLogs(logs) : [];
  const totalPages = groupedLogs.length ? Math.max(1, Math.ceil(groupedLogs.length / pageSize)) : 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGroups = groupedLogs.slice(startIndex, endIndex);
  
  // Flatten the paginated groups back to individual logs for LogsList
  const paginatedLogs = paginatedGroups.flat();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">
          <h2 className="text-xl font-semibold text-emerald-100 text-center sm:text-left">Log Entries</h2>
        </div>
        <div className="w-full max-w-md sm:max-w-none sm:w-auto sm:flex-1 sm:justify-end sm:flex">
          <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPreferencesOpen(true)}
              className="text-dark-text-secondary hover:text-dark-text-primary w-full h-12 sm:w-12 sm:h-12 sm:aspect-square bg-black flex items-center justify-center rounded-lg"
              title="Unit Preferences"
            >
              <Settings className="h-6 w-6" />
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/api/export';
              }}
              className="bg-yellow-600 text-white hover:bg-yellow-700 w-full h-12 sm:w-auto sm:h-12 rounded-lg"
            >
              Export
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.zip"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('/api/import', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Import successful!');
                      window.location.reload();
                    } else {
                      alert(data.error || 'Import failed.');
                    }
                  } catch (err) {
                    alert('Import failed.');
                  }
                }
              }}
            />
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 w-full h-12 sm:w-auto sm:h-12 rounded-lg"
              onClick={() => importInputRef.current?.click()}
            >
              Import
            </Button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center text-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-garden-600 hover:bg-garden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500 w-full h-12 sm:w-auto sm:h-12 mt-2 sm:mt-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      <LogFilters filters={filters} onFilterChange={setFilters} gardens={gardens} rooms={rooms} zones={zones} plants={plants} />
      <LogsList logs={paginatedLogs} onLogDeleted={() => refetch()} />
      {/* Pagination Controls */}
      {logs && logs.length > 0 && (
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
          <div className="mt-6 flex justify-end">
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete All Logs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete All Logs</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-red-500">This will permanently delete <b>all logs</b> for your account. This action cannot be undone.</p>
          <p className="mb-2">Type <b>DELETE ALL</b> to confirm:</p>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-4 bg-dark-bg-primary text-white border-dark-border focus:ring-2 focus:ring-garden-400"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE ALL"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmText !== 'DELETE ALL'}
              onClick={async () => {
                const res = await fetch('/api/logs/delete-all', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                });
                if (res.ok) {
                  setIsDeleteDialogOpen(false);
                  setIsPreferencesOpen(false);
                  setDeleteConfirmText('');
                  window.location.reload();
                } else {
                  alert('Failed to delete logs.');
                }
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 