'use client';

import { useState } from 'react';
import { LogType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Define enums that aren't in Prisma client
enum ScheduleFrequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIANNUAL = 'BIANNUAL',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  RATING = 'RATING',
  MEASUREMENT = 'MEASUREMENT',
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  COUNTER = 'COUNTER',
  TIMER = 'TIMER',
  MEDIA = 'MEDIA',
  LOCATION = 'LOCATION',
}

interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options: string[];
  validation: Record<string, unknown>;
}

interface ScheduleConfig {
  frequency: ScheduleFrequency;
  interval: number;
  times: string[];
  daysOfWeek: number[];
}

interface FormData {
  name: string;
  description: string;
  type: LogType;
  icon: string;
  color: string;
  fields: Field[];
  scheduleConfig: ScheduleConfig;
  reminders: boolean;
  reminderBefore: number;
  isPublic: boolean;
}

interface TemplateFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
}

export function TemplateForm({ initialData, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || LogType.GENERAL,
    icon: initialData?.icon || 'clipboard',
    color: initialData?.color || '#4CAF50',
    fields: initialData?.fields || [],
    scheduleConfig: initialData?.scheduleConfig || {
      frequency: ScheduleFrequency.DAILY,
      interval: 1,
      times: ['09:00'],
      daysOfWeek: [],
    },
    reminders: initialData?.reminders || false,
    reminderBefore: initialData?.reminderBefore || 30,
    isPublic: initialData?.isPublic || false,
  });

  const [showSchedule, setShowSchedule] = useState(false);

  const addField = () => {
    const newField: Field = {
      id: crypto.randomUUID(),
      type: FieldType.TEXT,
      label: '',
      required: false,
      options: [],
      validation: {},
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const handleFieldChange = (fieldId: string, key: keyof Field, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, [key]: value } : field
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <Input
          label="Template Name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
        <Select
          label="Log Type"
          value={formData.type}
          onChange={value => setFormData(prev => ({ ...prev, type: value as LogType }))}
          options={Object.values(LogType).map(type => ({
            label: type.toLowerCase().replace('_', ' '),
            value: type,
          }))}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Fields</h3>
        {formData.fields.map(field => (
          <div key={field.id} className="space-y-2 p-4 border rounded-lg">
            <Input
              label="Field Label"
              value={field.label}
              onChange={e => handleFieldChange(field.id, 'label', e.target.value)}
              required
            />
            <Select
              label="Field Type"
              value={field.type}
              onChange={value => handleFieldChange(field.id, 'type', value as FieldType)}
              options={Object.values(FieldType).map(type => ({
                label: type.toLowerCase().replace('_', ' '),
                value: type,
              }))}
            />
            <Switch
              label="Required"
              checked={field.required}
              onCheckedChange={checked => handleFieldChange(field.id, 'required', checked)}
            />
          </div>
        ))}
        <Button type="button" onClick={addField}>Add Field</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Schedule Configuration</h3>
        <Select
          label="Frequency"
          value={formData.scheduleConfig.frequency}
          onChange={value => setFormData(prev => ({
            ...prev,
            scheduleConfig: {
              ...prev.scheduleConfig,
              frequency: value as ScheduleFrequency,
            },
          }))}
          options={Object.values(ScheduleFrequency).map(freq => ({
            label: freq.toLowerCase().replace('_', ' '),
            value: freq,
          }))}
        />
        <Input
          type="number"
          label="Interval"
          value={formData.scheduleConfig.interval}
          onChange={e => setFormData(prev => ({
            ...prev,
            scheduleConfig: {
              ...prev.scheduleConfig,
              interval: parseInt(e.target.value) || 1,
            },
          }))}
          min={1}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Template Settings</h3>
        <Switch
          label="Enable Reminders"
          checked={formData.reminders}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, reminders: checked }))}
        />
        {formData.reminders && (
          <Input
            type="number"
            label="Reminder Before (minutes)"
            value={formData.reminderBefore}
            onChange={e => setFormData(prev => ({
              ...prev,
              reminderBefore: parseInt(e.target.value) || 30,
            }))}
            min={1}
          />
        )}
        <Switch
          label="Make Public"
          checked={formData.isPublic}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, isPublic: checked }))}
        />
      </div>

      <Button type="submit">Save Template</Button>
    </form>
  );
} 