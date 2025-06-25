'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import EquipmentFormModal from './EquipmentFormModal';

interface CreateEquipmentButtonProps {
  gardenId: string;
  roomId: string;
  zoneId: string;
}

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

type EquipmentType = typeof EquipmentTypes[keyof typeof EquipmentTypes];
type EquipmentAction = typeof EquipmentActions[keyof typeof EquipmentActions];
type Frequency = typeof Frequencies[keyof typeof Frequencies];

const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  equipmentType: z.enum(Object.values(EquipmentTypes) as [string, ...string[]]),
  installationDate: z.date().optional(),
  notes: z.string().optional(),
  maintenanceTasks: z.array(z.object({
    title: z.string().min(1, 'Task title is required'),
    actionType: z.enum(Object.values(EquipmentActions) as [string, ...string[]]),
    frequency: z.enum(Object.values(Frequencies) as [string, ...string[]]),
    nextDueDate: z.date(),
    notes: z.string().optional()
  })).optional()
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export default function CreateEquipmentButton({ gardenId, roomId, zoneId }: CreateEquipmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        installationDate: data.installationDate ? data.installationDate.toISOString() : undefined,
        maintenanceTasks: data.maintenanceTasks?.map((task: any) => ({
          ...task,
          nextDueDate: task.nextDueDate.toISOString(),
        })) || [],
      };
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create equipment');
      }
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white">
        <Plus className="h-4 w-4 mr-2" />
        Add Equipment
      </Button>
      <EquipmentFormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleSubmit}
        loading={loading}
        title="Add Equipment"
        submitLabel="Add Equipment"
      />
    </>
  );
} 