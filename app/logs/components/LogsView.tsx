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
import { Download, Upload, Filter, Plus } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { AddLogButton } from '@/components/ui/add-log-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LogsViewProps {
  userId: string;
}

interface FilterState {
  search: string;
  logType: LogType | '';
  stage: Stage | '';
  dateRange: DateRange | null | undefined;
  plantId: string;
}

export default function LogsView({ userId }: LogsViewProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [showAddLogDialog, setShowAddLogDialog] = useState(false);
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
      <h1 className="text-2xl font-semibold text-emerald-100">Logs</h1>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          Show Filters
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
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
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </label>
        </div>

        <Dialog open={showAddLogDialog} onOpenChange={setShowAddLogDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm bg-[#064E3B] hover:bg-[#065F46] text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Log Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Plant</label>
                <Select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                >
                  <option value="">Choose a plant</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedPlantId && (
                <AddLogButton
                  plantId={selectedPlantId}
                  variant="outline"
                  className="w-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Log Type</label>
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
            <label className="block text-sm font-medium mb-1">Growth Stage</label>
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
            <label className="block text-sm font-medium mb-1">Plant</label>
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
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(range) => setFilters({ ...filters, dateRange: range })}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
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