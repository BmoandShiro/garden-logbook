'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, Wrench, Trash, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EquipmentFormModal from './EquipmentFormModal';

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  description?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  maintenanceTasks: MaintenanceTask[];
}

interface MaintenanceTask {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  nextDueDate: string;
  lastCompletedDate?: string;
  completed: boolean;
}

interface EquipmentListProps {
  zoneId: string;
  roomId: string;
  gardenId: string;
  equipment: Equipment[];
}

export default function EquipmentList({ zoneId, roomId, gardenId, equipment }: EquipmentListProps) {
  const router = useRouter();
  const [deletingEquipmentId, setDeletingEquipmentId] = useState<string | null>(null);
  const [confirmDeleteEquipment, setConfirmDeleteEquipment] = useState<Equipment | null>(null);
  const [editModalEquipment, setEditModalEquipment] = useState<Equipment | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleDelete = async (equipmentId: string) => {
    try {
      setDeletingEquipmentId(equipmentId);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete equipment');
      }

      toast.success('Equipment deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting equipment');
    } finally {
      setDeletingEquipmentId(null);
      setConfirmDeleteEquipment(null);
    }
  };

  const getTaskStatus = (task: MaintenanceTask) => {
    const dueDate = new Date(task.nextDueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (task.completed) {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    } else if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'bg-red-500', text: `${Math.abs(daysUntilDue)} days overdue` };
    } else if (daysUntilDue <= 7) {
      return { status: 'due-soon', color: 'bg-yellow-500', text: `Due in ${daysUntilDue} days` };
    } else {
      return { status: 'upcoming', color: 'bg-blue-500', text: `Due in ${daysUntilDue} days` };
    }
  };

  const getOverdueTasks = (equipment: Equipment) => {
    return equipment.maintenanceTasks.filter(task => {
      const dueDate = new Date(task.nextDueDate);
      const now = new Date();
      return !task.completed && dueDate < now;
    });
  };

  const getDueSoonTasks = (equipment: Equipment) => {
    return equipment.maintenanceTasks.filter(task => {
      const dueDate = new Date(task.nextDueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return !task.completed && daysUntilDue >= 0 && daysUntilDue <= 7;
    });
  };

  const handleEdit = async (data: any) => {
    if (!editModalEquipment) return;
    setEditLoading(true);
    try {
      const payload = {
        ...data,
        installationDate: data.installationDate ? data.installationDate.toISOString() : undefined,
        maintenanceTasks: data.maintenanceTasks?.map((task: any) => ({
          ...task,
          nextDueDate: task.nextDueDate.toISOString(),
        })) || [],
      };
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/equipment/${editModalEquipment.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update equipment');
      }
      setEditModalEquipment(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update equipment');
    } finally {
      setEditLoading(false);
    }
  };

  if (equipment.length === 0) {
    return (
      <Card className="bg-dark-bg-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-emerald-100">Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-emerald-300/70 text-center py-8">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-emerald-300/50" />
            <p>No equipment added yet</p>
            <p className="text-sm">Add equipment to track maintenance tasks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {equipment.map((item) => {
          const overdueTasks = getOverdueTasks(item);
          const dueSoonTasks = getDueSoonTasks(item);
          
          return (
            <Card
              key={item.id}
              className="relative p-4 cursor-pointer border-0 bg-gradient-to-br from-yellow-900 to-yellow-950 hover:from-yellow-800 hover:to-yellow-900 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-yellow-100">{item.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-yellow-300/70">
                      <span className="font-medium text-yellow-200">Type:</span> {item.equipmentType}
                    </p>
                    {item.description && (
                      <p className="text-sm text-yellow-300/70">
                        <span className="font-medium text-yellow-200">Description:</span> {item.description}
                      </p>
                    )}
                    <p className="text-sm text-yellow-300/70">
                      Added by {item.createdBy.name || item.createdBy.email}
                    </p>
                    {item.maintenanceTasks.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {overdueTasks.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {overdueTasks.length} overdue
                          </Badge>
                        )}
                        {dueSoonTasks.length > 0 && overdueTasks.length === 0 && (
                          <Badge className="bg-yellow-600 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {dueSoonTasks.length} due soon
                          </Badge>
                        )}
                        <span className="text-xs text-yellow-300/50">
                          {item.maintenanceTasks.length} maintenance task{item.maintenanceTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-full p-2 text-yellow-300/70 hover:text-yellow-50 hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    title="Equipment Settings"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalEquipment(item);
                    }}
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-yellow-300/70 hover:text-yellow-50 hover:bg-transparent"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setConfirmDeleteEquipment(item);
                    }}
                    disabled={deletingEquipmentId === item.id}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteEquipment} onOpenChange={(open) => !open && setConfirmDeleteEquipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{confirmDeleteEquipment?.name}"? This action cannot be undone and will also delete all associated maintenance tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteEquipment(null)}
              disabled={deletingEquipmentId === confirmDeleteEquipment?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteEquipment && handleDelete(confirmDeleteEquipment.id)}
              disabled={deletingEquipmentId === confirmDeleteEquipment?.id}
            >
              {deletingEquipmentId === confirmDeleteEquipment?.id ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EquipmentFormModal
        open={!!editModalEquipment}
        onOpenChange={(open) => setEditModalEquipment(open ? editModalEquipment : null)}
        onSubmit={handleEdit}
        initialValues={editModalEquipment ? {
          name: editModalEquipment.name,
          equipmentType: editModalEquipment.equipmentType,
          description: editModalEquipment.description || '',
          notes: '',
          installationDate: undefined,
          maintenanceTasks: editModalEquipment.maintenanceTasks?.map((task) => ({
            title: task.title,
            actionType: (task as any).actionType || '',
            frequency: task.frequency,
            nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : new Date(),
            notes: (task as any).notes || '',
          })) || [],
        } : undefined}
        loading={editLoading}
        title="Edit Equipment"
        submitLabel="Save Changes"
      />
    </>
  );
} 