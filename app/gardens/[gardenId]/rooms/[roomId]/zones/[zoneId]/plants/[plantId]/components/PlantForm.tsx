"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export interface PlantFormValues {
  name: string;
  strainName?: string;
  species: string;
  variety?: string;
  plantedDate?: string;
  expectedHarvestDate?: string;
  notes?: string;
  growingSeasonStart?: string;
  growingSeasonEnd?: string;
  onlyTriggerAlertsDuringSeason?: boolean;
  sensitivities?: any;
}

export default function PlantForm({
  initialValues,
  onSubmit,
  onCancel,
  submitButtonLabel = 'Save',
  isSubmitting = false,
}: {
  initialValues: PlantFormValues;
  onSubmit: (values: PlantFormValues) => void;
  onCancel: () => void;
  submitButtonLabel?: string;
  isSubmitting?: boolean;
}) {
  const [form, setForm] = useState<PlantFormValues>({
    ...initialValues,
    onlyTriggerAlertsDuringSeason: initialValues.onlyTriggerAlertsDuringSeason ?? false,
    sensitivities: initialValues.sensitivities ?? {
      heat: { enabled: false, threshold: '', unit: 'F' },
      frost: { enabled: false, windows: [] },
      drought: { enabled: false, days: '' },
      wind: { enabled: false, threshold: '' },
      flood: { enabled: false },
      heavyRain: { enabled: false, threshold: '', unit: 'in' },
    },
  });

  // Helper for updating nested sensitivities
  const updateSensitivity = (type: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      sensitivities: {
        ...prev.sensitivities,
        [type]: { ...prev.sensitivities[type], ...value },
      },
    }));
  };

  // Frost window management
  const addFrostWindow = () => {
    updateSensitivity('frost', {
      windows: [
        ...(form.sensitivities.frost.windows || []),
        { label: '', start: '', end: '', repeat: false },
      ],
    });
  };
  const updateFrostWindow = (idx: number, value: any) => {
    const windows = [...(form.sensitivities.frost.windows || [])];
    windows[idx] = { ...windows[idx], ...value };
    updateSensitivity('frost', { windows });
  };
  const removeFrostWindow = (idx: number) => {
    const windows = [...(form.sensitivities.frost.windows || [])];
    windows.splice(idx, 1);
    updateSensitivity('frost', { windows });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter plant name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="strainName">Strain</Label>
        <Input
          id="strainName"
          name="strainName"
          value={form.strainName || ''}
          onChange={handleChange}
          placeholder="Enter strain name (e.g. Mandarin Cookie R3 #01)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="species">Species</Label>
        <Input
          id="species"
          name="species"
          value={form.species}
          onChange={handleChange}
          placeholder="Enter plant species"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="variety">Variety (optional)</Label>
        <Input
          id="variety"
          name="variety"
          value={form.variety || ''}
          onChange={handleChange}
          placeholder="Enter plant variety"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plantedDate">Planting Date (optional)</Label>
        <Input
          id="plantedDate"
          name="plantedDate"
          type="date"
          value={form.plantedDate || ''}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expectedHarvestDate">Expected Harvest Date (optional)</Label>
        <Input
          id="expectedHarvestDate"
          name="expectedHarvestDate"
          type="date"
          value={form.expectedHarvestDate || ''}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={form.notes || ''}
          onChange={handleChange}
          placeholder="Enter any notes about the plant"
        />
      </div>
      {/* Growing Season Controls */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-emerald-200 mb-2">🌱 Growing Season Control</h3>
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="growingSeasonStart">Growing Season Start</Label>
            <Input
              id="growingSeasonStart"
              name="growingSeasonStart"
              type="date"
              value={form.growingSeasonStart || ''}
              onChange={handleChange}
              className="bg-emerald-950 border-emerald-800 text-emerald-100 focus:ring-emerald-600"
            />
          </div>
          <div>
            <Label htmlFor="growingSeasonEnd">Growing Season End</Label>
            <Input
              id="growingSeasonEnd"
              name="growingSeasonEnd"
              type="date"
              value={form.growingSeasonEnd || ''}
              onChange={handleChange}
              className="bg-emerald-950 border-emerald-800 text-emerald-100 focus:ring-emerald-600"
            />
          </div>
          <div className="flex flex-col justify-end">
            <Label className="mb-1">Alerts Only During Season</Label>
            <Switch
              checked={form.onlyTriggerAlertsDuringSeason}
              onCheckedChange={(checked) => setForm(f => ({ ...f, onlyTriggerAlertsDuringSeason: checked }))}
              className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
            />
          </div>
        </div>
      </div>
      {/* Sensitivities Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-emerald-200 mb-2">🌦️ Weather Sensitivities</h3>
        {/* Heat Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.heat.enabled}
            onCheckedChange={checked => updateSensitivity('heat', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Heat Sensitive</Label>
          {form.sensitivities.heat.enabled && (
            <>
              <Input
                type="number"
                min="0"
                name="heatThreshold"
                value={form.sensitivities.heat.threshold}
                onChange={e => updateSensitivity('heat', { threshold: e.target.value })}
                placeholder="Temp threshold"
                className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 placeholder-emerald-400 focus:ring-emerald-600"
              />
              <select
                value={form.sensitivities.heat.unit}
                onChange={e => updateSensitivity('heat', { unit: e.target.value })}
                className="ml-1 px-1 py-0.5 rounded border bg-emerald-950 border-emerald-800 text-emerald-100 w-20"
              >
                <option value="F">°F</option>
                <option value="C">°C</option>
              </select>
            </>
          )}
        </div>
        {/* Frost Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.frost.enabled}
            onCheckedChange={checked => updateSensitivity('frost', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Frost Sensitive</Label>
          {form.sensitivities.frost.enabled && (
            <Button type="button" size="sm" onClick={addFrostWindow} className="ml-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-100">+ Add Window</Button>
          )}
        </div>
        {form.sensitivities.frost.enabled && (form.sensitivities.frost.windows || []).map((window: any, idx: number) => (
          <div key={idx} className="flex gap-2 items-end mb-2 ml-8">
            <Input
              placeholder="Label"
              value={window.label}
              onChange={e => updateFrostWindow(idx, { label: e.target.value })}
              className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 placeholder-emerald-400 focus:ring-emerald-600"
            />
            <Input
              type="date"
              value={window.start}
              onChange={e => updateFrostWindow(idx, { start: e.target.value })}
              className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 focus:ring-emerald-600"
            />
            <Input
              type="date"
              value={window.end}
              onChange={e => updateFrostWindow(idx, { end: e.target.value })}
              className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 focus:ring-emerald-600"
            />
            <Label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={window.repeat}
                onChange={e => updateFrostWindow(idx, { repeat: e.target.checked })}
                className="accent-emerald-700"
              />
              Repeat Annually
            </Label>
            <Button type="button" size="icon" variant="ghost" onClick={() => removeFrostWindow(idx)} className="text-emerald-200 hover:bg-emerald-900">×</Button>
          </div>
        ))}
        {/* Drought Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.drought.enabled}
            onCheckedChange={checked => updateSensitivity('drought', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Drought Sensitive</Label>
          {form.sensitivities.drought.enabled && (
            <Input
              type="number"
              min="1"
              value={form.sensitivities.drought.days}
              onChange={e => updateSensitivity('drought', { days: e.target.value })}
              placeholder="No rain for ___ days"
              className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 placeholder-emerald-400 focus:ring-emerald-600"
            />
          )}
        </div>
        {/* Wind Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.wind.enabled}
            onCheckedChange={checked => updateSensitivity('wind', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Wind Sensitive</Label>
          {form.sensitivities.wind.enabled && (
            <Input
              type="number"
              min="0"
              value={form.sensitivities.wind.threshold}
              onChange={e => updateSensitivity('wind', { threshold: e.target.value })}
              placeholder="Wind speed (mph)"
              className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 placeholder-emerald-400 focus:ring-emerald-600"
            />
          )}
        </div>
        {/* Flood Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.flood.enabled}
            onCheckedChange={checked => updateSensitivity('flood', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Flood Sensitive</Label>
          <span className="text-xs text-emerald-300">(Triggers on official flood warnings for ZIP)</span>
        </div>
        {/* Heavy Rain Sensitivity */}
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={form.sensitivities.heavyRain.enabled}
            onCheckedChange={checked => updateSensitivity('heavyRain', { enabled: checked })}
            className="data-[state=checked]:bg-emerald-900 data-[state=unchecked]:bg-dark-bg-secondary border-emerald-800"
          />
          <Label className="mr-2">Heavy Rain Sensitive</Label>
          {form.sensitivities.heavyRain.enabled && (
            <>
              <Input
                type="number"
                min="0"
                value={form.sensitivities.heavyRain.threshold}
                onChange={e => updateSensitivity('heavyRain', { threshold: e.target.value })}
                placeholder="Rain threshold"
                className="w-full max-w-xs bg-emerald-950 border-emerald-800 text-emerald-100 placeholder-emerald-400 focus:ring-emerald-600"
              />
              <select
                value={form.sensitivities.heavyRain.unit}
                onChange={e => updateSensitivity('heavyRain', { unit: e.target.value })}
                className="ml-1 px-1 py-0.5 rounded border bg-emerald-950 border-emerald-800 text-emerald-100 w-20"
              >
                <option value="in">in</option>
                <option value="mm">mm</option>
              </select>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          {isSubmitting ? 'Saving...' : submitButtonLabel}
        </Button>
      </div>
    </form>
  );
} 