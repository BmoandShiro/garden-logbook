import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const EquipmentTypes = {
  RO_SYSTEM: 'RO System',
  HUMIDIFIER: 'Humidifier',
  DEHUMIDIFIER: 'Dehumidifier',
  AC_UNIT: 'AC Unit',
  DRAINAGE: 'Drainage',
  TENT_WALLS: 'Tent Walls',
  TRELLIS: 'Trellis',
  TANK_RESERVOIR: 'Tank Reservoir',
  SPRAYER: 'Sprayer',
  LIGHT_FIXTURE: 'Light Fixture',
  AIR_PUMP: 'Air Pump',
  AIR_STONE: 'Air Stone',
  UV_UNIT: 'UV Unit',
  PLUMBING_LINES: 'Plumbing Lines',
  OTHER: 'Other'
} as const;

const EquipmentActions = {
  CLEANED: 'Cleaned',
  CHANGED_FILTER: 'Changed Filter',
  CALIBRATED: 'Calibrated',
  REPAIRED: 'Repaired',
  RESET: 'Reset',
  LUBRICATED: 'Lubricated',
  UPGRADED: 'Upgraded',
  RELOCATED: 'Relocated',
  INSPECTED_ONLY: 'Inspected Only',
  EMPTIED: 'Emptied',
  FILLED: 'Filled',
  FLUSHED_LINES: 'Flushed Lines',
  TESTED: 'Tested',
  CHANGED_MANIFOLD: 'Changed Manifold',
  SANITIZED_PLUMBING: 'Sanitized Plumbing',
  VERIFIED_DRAIN_FLOW: 'Verified Drain Flow',
  NEW_ISSUE_FOUND: 'NEW ISSUE FOUND',
  REPLACED: 'Replaced',
  OTHER: 'Other'
} as const;

const Frequencies = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Every 3 Months',
  SEMI_ANNUALLY: 'Every 6 Months',
  ANNUALLY: 'Annually',
  CUSTOM: 'Custom'
} as const;

const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  equipmentType: z.enum(Object.values(EquipmentTypes) as [string, ...string[]]),
  installationDate: z.date().optional(),
  description: z.string().optional(),
  maintenanceTasks: z.array(z.object({
    title: z.string().min(1, 'Task title is required'),
    actionType: z.enum(Object.values(EquipmentActions) as [string, ...string[]]),
    frequency: z.enum(Object.values(Frequencies) as [string, ...string[]]),
    nextDueDate: z.date(),
    notes: z.string().optional()
  })).optional()
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

type MaintenanceTaskForm = {
  title: string;
  actionType: string;
  frequency: string;
  nextDueDate: Date;
  notes?: string;
};

interface EquipmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EquipmentFormValues) => Promise<void>;
  initialValues?: Partial<EquipmentFormValues>;
  loading?: boolean;
  title?: string;
  submitLabel?: string;
}

export default function EquipmentFormModal({ open, onOpenChange, onSubmit, initialValues, loading, title = 'Add Equipment', submitLabel = 'Add Equipment' }: EquipmentFormModalProps) {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTaskForm[]>(initialValues?.maintenanceTasks?.map(task => ({
    ...task,
    nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : new Date(),
  })) || []);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: initialValues?.name || '',
      equipmentType: (initialValues?.equipmentType as any) || Object.values(EquipmentTypes)[0],
      installationDate: initialValues?.installationDate ? new Date(initialValues.installationDate) : undefined,
      description: initialValues?.description || '',
      maintenanceTasks: initialValues?.maintenanceTasks || [],
    }
  });

  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name || '',
        equipmentType: (initialValues.equipmentType as any) || Object.values(EquipmentTypes)[0],
        installationDate: initialValues.installationDate ? new Date(initialValues.installationDate) : undefined,
        description: initialValues.description || '',
        maintenanceTasks: initialValues.maintenanceTasks || [],
      });
      setMaintenanceTasks(initialValues.maintenanceTasks?.map(task => ({
        ...task,
        nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : new Date(),
      })) || []);
    }
    // eslint-disable-next-line
  }, [open]);

  const handleAddTask = () => {
    setMaintenanceTasks([
      ...maintenanceTasks,
      {
        title: '',
        actionType: Object.values(EquipmentActions)[0],
        frequency: Object.values(Frequencies)[2],
        nextDueDate: new Date(),
      }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-dark-bg-primary text-white border border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => {
            await onSubmit({
              ...data,
              maintenanceTasks: maintenanceTasks.map(task => ({
                ...task,
                nextDueDate: task.nextDueDate,
              })),
            });
          })} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-text-primary">Equipment Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter equipment name" className="bg-dark-bg-primary text-dark-text-primary border-dark-border focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-text-primary">Equipment Type</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500">
                      {Object.entries(EquipmentTypes).map(([key, value]) => (
                        <option key={key} value={value}>{value}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="installationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-dark-text-primary">Installation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-dark-bg-primary border-dark-border text-dark-text-primary focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500",
                            !field.value && "text-dark-text-secondary"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-dark-bg-primary border-dark-border" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="bg-dark-bg-primary"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-text-primary">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any description about the equipment" className="bg-dark-bg-primary text-dark-text-primary border-dark-border focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-dark-text-primary">Maintenance Tasks</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTask} className="border-yellow-600 hover:bg-yellow-600/10 text-yellow-500">
                  Add Task
                </Button>
              </div>
              {maintenanceTasks.map((task, index) => (
                <div key={index} className="space-y-4 p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
                  <Input
                    placeholder="Task name"
                    value={task.title}
                    onChange={(e) => {
                      const newTasks = [...maintenanceTasks];
                      newTasks[index].title = e.target.value;
                      setMaintenanceTasks(newTasks);
                    }}
                    className="bg-dark-bg-primary text-dark-text-primary border-dark-border focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                  <select
                    value={task.actionType}
                    onChange={(e) => {
                      const newTasks = [...maintenanceTasks];
                      newTasks[index].actionType = e.target.value;
                      setMaintenanceTasks(newTasks);
                    }}
                    className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  >
                    {Object.entries(EquipmentActions).map(([key, value]) => (
                      <option key={key} value={value}>{value}</option>
                    ))}
                  </select>
                  <select
                    value={task.frequency}
                    onChange={(e) => {
                      const newTasks = [...maintenanceTasks];
                      newTasks[index].frequency = e.target.value;
                      setMaintenanceTasks(newTasks);
                    }}
                    className="w-full rounded-md border border-dark-border bg-dark-bg-primary px-3 py-2 text-sm text-dark-text-primary focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  >
                    {Object.entries(Frequencies).map(([key, value]) => (
                      <option key={key} value={value}>{value}</option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Task notes (optional)"
                    value={task.notes}
                    onChange={(e) => {
                      const newTasks = [...maintenanceTasks];
                      newTasks[index].notes = e.target.value;
                      setMaintenanceTasks(newTasks);
                    }}
                    className="bg-dark-bg-primary text-dark-text-primary border-dark-border focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-dark-border hover:bg-dark-bg-secondary text-dark-text-primary">
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white" disabled={loading}>
                {loading ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 