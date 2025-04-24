'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface CreateZoneButtonProps {
  gardenId: string;
  roomId: string;
}

enum Frequency {
  DAILY = "Daily",
  WEEKLY = "Weekly",
  BIWEEKLY = "Bi-weekly",
  MONTHLY = "Monthly",
  QUARTERLY = "Quarterly",
  SIXMONTHS = "6 Months",
  YEARLY = "Yearly"
}

interface MaintenanceTask {
  title: string;
  description: string;
  frequency: Frequency;
  nextDueDate: Date | undefined;
}

export default function CreateZoneButton({ gardenId, roomId }: CreateZoneButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          type,
          dimensions,
          maintenanceTasks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create zone');
      }

      toast.success('Zone created successfully');
      router.refresh();
      setIsOpen(false);
      setName('');
      setDescription('');
      setType('');
      setDimensions('');
      setMaintenanceTasks([]);
    } catch (error) {
      toast.error('Error creating zone');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaintenanceTask = () => {
    setMaintenanceTasks([
      ...maintenanceTasks,
      {
        title: '',
        description: '',
        frequency: Frequency.WEEKLY,
        nextDueDate: undefined,
      },
    ]);
  };

  const updateMaintenanceTask = (index: number, field: keyof MaintenanceTask, value: any) => {
    const updatedTasks = [...maintenanceTasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setMaintenanceTasks(updatedTasks);
  };

  const removeMaintenanceTask = (index: number) => {
    setMaintenanceTasks(maintenanceTasks.filter((_, i) => i !== index));
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Zone
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Zone</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter zone name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Enter zone description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={type}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setType(e.target.value)}
                placeholder="Enter zone type (e.g., Growing Area, Storage)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={dimensions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDimensions(e.target.value)}
                placeholder="Enter zone dimensions"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maintenance Tasks</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMaintenanceTask}
                  className="border-emerald-800 hover:bg-emerald-900/10"
                >
                  Add Task
                </Button>
              </div>

              {maintenanceTasks.map((task, index) => (
                <div key={index} className="space-y-4 p-4 border border-emerald-800 rounded-lg bg-emerald-900/10">
                  <div className="flex items-center justify-between">
                    <Label>Task {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMaintenanceTask(index)}
                      className="h-8 w-8 p-0 text-emerald-100 hover:text-emerald-200 hover:bg-emerald-900/20"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={task.title}
                      onChange={(e) => updateMaintenanceTask(index, 'title', e.target.value)}
                      placeholder="Enter task title"
                      className="border-emerald-800 bg-emerald-900/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={task.description}
                      onChange={(e) => updateMaintenanceTask(index, 'description', e.target.value)}
                      placeholder="Enter task description"
                      className="border-emerald-800 bg-emerald-900/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select
                      value={task.frequency}
                      onChange={(e) => updateMaintenanceTask(index, 'frequency', e.target.value as Frequency)}
                      className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-garden-500 focus:outline-none focus:ring-1 focus:ring-garden-500"
                    >
                      {Object.values(Frequency).map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Next Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-emerald-800 bg-emerald-900/10",
                            !task.nextDueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {task.nextDueDate ? format(task.nextDueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={task.nextDueDate}
                          onSelect={(date) => updateMaintenanceTask(index, 'nextDueDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="border-emerald-800 hover:bg-emerald-900/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
              >
                Create Zone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 