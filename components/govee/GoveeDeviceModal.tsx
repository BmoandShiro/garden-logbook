import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoveeDevice } from "@prisma/client";
import { useState } from "react";

interface GoveeDeviceModalProps {
  device: GoveeDevice;
  open: boolean;
  onClose: () => void;
  onSave: (device: Partial<GoveeDevice>) => Promise<void>;
}

export function GoveeDeviceModal({ device, open, onClose, onSave }: GoveeDeviceModalProps) {
  const [formData, setFormData] = useState({
    name: device.name,
    minTemp: device.minTemp?.toString() || '',
    maxTemp: device.maxTemp?.toString() || '',
    minHumidity: device.minHumidity?.toString() || '',
    maxHumidity: device.maxHumidity?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...device,
      name: formData.name,
      minTemp: formData.minTemp ? parseFloat(formData.minTemp) : null,
      maxTemp: formData.maxTemp ? parseFloat(formData.maxTemp) : null,
      minHumidity: formData.minHumidity ? parseFloat(formData.minHumidity) : null,
      maxHumidity: formData.maxHumidity ? parseFloat(formData.maxHumidity) : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Govee Device Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Device Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minTemp">Min Temperature (°C)</Label>
              <Input
                id="minTemp"
                type="number"
                step="0.1"
                value={formData.minTemp}
                onChange={(e) => setFormData({ ...formData, minTemp: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxTemp">Max Temperature (°C)</Label>
              <Input
                id="maxTemp"
                type="number"
                step="0.1"
                value={formData.maxTemp}
                onChange={(e) => setFormData({ ...formData, maxTemp: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minHumidity">Min Humidity (%)</Label>
              <Input
                id="minHumidity"
                type="number"
                step="0.1"
                value={formData.minHumidity}
                onChange={(e) => setFormData({ ...formData, minHumidity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxHumidity">Max Humidity (%)</Label>
              <Input
                id="maxHumidity"
                type="number"
                step="0.1"
                value={formData.maxHumidity}
                onChange={(e) => setFormData({ ...formData, maxHumidity: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 