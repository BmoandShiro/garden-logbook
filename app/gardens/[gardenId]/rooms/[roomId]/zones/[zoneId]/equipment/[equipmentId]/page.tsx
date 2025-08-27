"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Trash } from 'lucide-react';
import LogsListWrapper from '@/app/logs/components/LogsListWrapper';
import { format } from 'date-fns';
import { LogType } from '@prisma/client';
import { Spinner } from '@/components/ui/spinner';

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  description?: string;
  createdAt: string;
  createdBy: { name?: string; email?: string };
  zone?: { name: string };
  room?: { name: string };
  garden?: { name: string };
  maintenanceTasks: any[];
}

interface LogWithLocation {
  id: string;
  logDate: string | Date;
  type: LogType;
  notes?: string | null;
  plant?: { name: string };
  garden?: { name: string; timezone?: string; zipcode?: string };
  room?: { name: string };
  zone?: { name: string };
  equipment?: { name: string };
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
  user?: {
    id: string;
    username?: string | null;
    email?: string | null;
  };
  timezone?: string;
}

export default function EquipmentPage({ params }: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; equipmentId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<LogWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [completeDate, setCompleteDate] = useState<Date>(new Date());
  const [completeNotes, setCompleteNotes] = useState<string>('');
  const [completing, setCompleting] = useState(false);

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const eqRes = await fetch(`/api/gardens/${unwrappedParams.gardenId}/rooms/${unwrappedParams.roomId}/zones/${unwrappedParams.zoneId}/equipment/${unwrappedParams.equipmentId}`);
      const eqData = await eqRes.json();
      setEquipment(eqData);
      const logRes = await fetch(`/api/gardens/${unwrappedParams.gardenId}/rooms/${unwrappedParams.roomId}/zones/${unwrappedParams.zoneId}/equipment/${unwrappedParams.equipmentId}/logs`);
      setLogs(logRes.ok ? await logRes.json() : []);
      setLoading(false);
    }
    fetchData();
  }, [unwrappedParams]);

  const handleComplete = async (taskId: string) => {
    setCompleting(true);
    
    // First, get the task details to pass to the log creation
    const task = equipment?.maintenanceTasks.find((t: any) => t.id === taskId);
    
    if (task) {
      // Call the new working maintenance logs endpoint
      await fetch('/api/maintenance-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          equipmentName: equipment?.name || '',
          equipmentId: unwrappedParams.equipmentId,
          gardenId: unwrappedParams.gardenId,
          roomId: unwrappedParams.roomId,
          zoneId: unwrappedParams.zoneId,
          notes: completeNotes,
          completedDate: completeDate.toISOString()
        })
      });
    }
    
    setCompleting(false);
    setCompleteTaskId(null);
    setCompleteNotes('');
    window.location.reload();
  };

  if (loading || !equipment) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <Spinner className="h-12 w-12" />
      <span className="mt-4 text-yellow-200">Loading...</span>
      <style jsx global>{`
        svg circle { fill: #facc15 !important; }
      `}</style>
    </div>
  );

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-yellow-100">{equipment.name}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Edit Equipment">
            <Settings className="h-5 w-5 text-yellow-400" />
          </Button>
          <Button variant="destructive" size="icon" title="Delete Equipment">
            <Trash className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 bg-dark-bg-secondary border-dark-border">
            <h2 className="text-xl font-semibold mb-2 text-yellow-100">Equipment Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium text-yellow-200">Type:</span> <span className="text-yellow-100">{equipment.equipmentType}</span></p>
              {equipment.description && (
                <p><span className="font-medium text-yellow-200">Description:</span> <span className="text-yellow-100">{equipment.description}</span></p>
              )}
              <p><span className="font-medium text-yellow-200">Zone:</span> <span className="text-yellow-100">{equipment.zone?.name || '-'}</span></p>
              <p><span className="font-medium text-yellow-200">Room:</span> <span className="text-yellow-100">{equipment.room?.name || '-'}</span></p>
              <p><span className="font-medium text-yellow-200">Garden:</span> <span className="text-yellow-100">{equipment.garden?.name || '-'}</span></p>
              <p><span className="font-medium text-yellow-200">Added By:</span> <span className="text-yellow-100">{equipment.createdBy?.name || equipment.createdBy?.email}</span></p>
              <p><span className="font-medium text-yellow-200">Created At:</span> <span className="text-yellow-100">{format(new Date(equipment.createdAt), 'PPP')}</span></p>
            </div>
          </Card>
          <Card className="p-4 bg-dark-bg-secondary border-dark-border">
            <h2 className="text-xl font-semibold mb-2 text-yellow-100">Maintenance Tasks</h2>
            {equipment.maintenanceTasks.length === 0 ? (
              <p className="text-yellow-300/70">No maintenance tasks for this equipment.</p>
            ) : (
              <ul className="space-y-2">
                {equipment.maintenanceTasks.map((task: any) => (
                  <li key={task.id} className="border border-dark-border rounded-lg p-3 bg-dark-bg-primary">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-yellow-100">{task.title}</span>
                        <span className="ml-2 text-xs text-yellow-300/70">({task.frequency})</span>
                      </div>
                      <Button
                        size="sm"
                        className="ml-2 px-2 py-1 rounded bg-yellow-600 text-white text-xs hover:bg-yellow-700"
                        onClick={() => {
                          setCompleteTaskId(task.id);
                          setCompleteDate(new Date());
                          setCompleteNotes('');
                        }}
                      >
                        Mark Completed
                      </Button>
                      <Dialog open={completeTaskId === task.id} onOpenChange={open => !open && setCompleteTaskId(null)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Completion Date</DialogTitle>
                          </DialogHeader>
                          <Calendar
                            mode="single"
                            selected={completeDate}
                            onSelect={date => date && setCompleteDate(date)}
                            initialFocus
                          />
                          <textarea
                            className="w-full mt-4 p-2 rounded bg-dark-bg-primary border border-dark-border text-yellow-100"
                            rows={3}
                            placeholder="Add notes (optional)"
                            value={completeNotes}
                            onChange={e => setCompleteNotes(e.target.value)}
                          />
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setCompleteTaskId(null)} disabled={completing}>Cancel</Button>
                            <Button onClick={() => handleComplete(task.id)} disabled={completing} className="bg-yellow-600 text-white">
                              {completing ? 'Saving...' : 'Confirm'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="text-xs text-yellow-300/70 mt-1">
                      Next Due: {format(new Date(task.nextDueDate), 'PPP')}
                    </div>
                    {task.description && (
                      <div className="text-xs text-yellow-300/70 mt-1">{task.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          {/* You can add more equipment-specific widgets here */}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-yellow-100 mb-4">Logs for this Equipment</h2>
        <LogsListWrapper logs={logs} />
      </div>
    </div>
  );
} 