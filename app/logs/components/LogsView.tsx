'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Log, LogType, Stage, Plant } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Download, Upload, Filter, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface LogsViewProps {
  userId: string;
}

interface FilterState {
  search: string;
  logType: LogType | '';
  stage: Stage | '';
  dateRange: DateRange | undefined;
  plantId: string;
}

export default function LogsView({ userId }: LogsViewProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    logType: '',
    stage: '',
    dateRange: undefined,
    plantId: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchPlants();
  }, [userId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast.error('Error fetching logs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await fetch(`/api/plants?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch plants');
      const data = await response.json();
      setPlants(data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/logs/export?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to export logs');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garden-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Error exporting logs');
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/logs/import?userId=${userId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to import logs');
      
      toast.success('Logs imported successfully');
      fetchLogs();
    } catch (error) {
      toast.error('Error importing logs');
      console.error(error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         log.type.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = !filters.logType || log.type === filters.logType;
    const matchesStage = !filters.stage || log.stage === filters.stage;
    const matchesPlant = !filters.plantId || log.plantId === filters.plantId;
    const matchesDate = (!filters.dateRange?.from || new Date(log.date) >= filters.dateRange.from) &&
                       (!filters.dateRange?.to || new Date(log.date) <= filters.dateRange.to);
    
    return matchesSearch && matchesType && matchesStage && matchesPlant && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Upload className="h-4 w-4" />
              Import
            </label>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-dark-bg-secondary">
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1">Search</label>
            <Input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1">Log Type</label>
            <Select
              value={filters.logType}
              onChange={(e) => setFilters({ ...filters, logType: e.target.value as LogType | '' })}
            >
              <option value="">All Types</option>
              {Object.values(LogType).map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1">Growth Stage</label>
            <Select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value as Stage | '' })}
            >
              <option value="">All Stages</option>
              {Object.values(Stage).map((stage) => (
                <option key={stage} value={stage}>
                  {stage.toLowerCase()}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1">Plant</label>
            <Select
              value={filters.plantId}
              onChange={(e) => setFilters({ ...filters, plantId: e.target.value })}
            >
              <option value="">All Plants</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-emerald-100 mb-1">Date Range</label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(range) => setFilters({ ...filters, dateRange: range })}
            />
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Plant</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No logs found</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>{log.type.toLowerCase().replace('_', ' ')}</TableCell>
                  <TableCell>{log.stage.toLowerCase()}</TableCell>
                  <TableCell>{plants.find(p => p.id === log.plantId)?.name || 'Unknown'}</TableCell>
                  <TableCell>{log.notes || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/plants/${log.plantId}/logs/${log.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 