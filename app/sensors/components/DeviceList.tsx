"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Garden {
  id: string;
  name: string;
  description: string | null;
  plants: { id: string; name: string; }[];
  rooms: { id: string; name: string; }[];
  zones: { id: string; name: string; }[];
}

interface GoveeDevice {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  isActive: boolean;
  lastState: any;
  lastStateAt: Date | null;
  linkedEntity: any;
}

interface DeviceListProps {
  devices: GoveeDevice[];
  gardens: Garden[];
  userId: string;
}

export function DeviceList({ devices, gardens, userId }: DeviceListProps) {
  const handleLinkDevice = async (deviceId: string, entityType: string, entityId: string) => {
    try {
      const response = await fetch(`/api/sensors/devices/${deviceId}/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to link device");
      }

      toast.success("Device linked successfully");
    } catch (error) {
      toast.error("Failed to link device");
      console.error(error);
    }
  };

  if (devices.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-dark-text-secondary">No devices found. Add your Govee API key to discover devices.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {devices.map((device) => (
        <Card key={device.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{device.name}</CardTitle>
                <CardDescription>{device.type}</CardDescription>
              </div>
              <Badge variant={device.isActive ? "default" : "destructive"}>
                {device.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Readings</h4>
                {device.lastState ? (
                  <div className="grid grid-cols-2 gap-2">
                    {device.lastState.temperature && (
                      <div>
                        <span className="text-sm text-dark-text-secondary">Temperature:</span>
                        <span className="ml-2">{device.lastState.temperature}°C</span>
                      </div>
                    )}
                    {device.lastState.humidity && (
                      <div>
                        <span className="text-sm text-dark-text-secondary">Humidity:</span>
                        <span className="ml-2">{device.lastState.humidity}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-dark-text-secondary">No readings available</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Link to</h4>
                <Select
                  onValueChange={(value) => {
                    const [type, id] = value.split(":");
                    handleLinkDevice(device.id, type, id);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>Select location...</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {gardens.map((garden) => (
                      <SelectItem key={`garden:${garden.id}`} value={`garden:${garden.id}`}>
                        Garden: {garden.name}
                      </SelectItem>
                    ))}
                    {gardens.flatMap((garden) =>
                      garden.rooms.map((room) => (
                        <SelectItem key={`room:${room.id}`} value={`room:${room.id}`}>
                          Room: {room.name}
                        </SelectItem>
                      ))
                    )}
                    {gardens.flatMap((garden) =>
                      garden.zones.map((zone) => (
                        <SelectItem key={`zone:${zone.id}`} value={`zone:${zone.id}`}>
                          Zone: {zone.name}
                        </SelectItem>
                      ))
                    )}
                    {gardens.flatMap((garden) =>
                      garden.plants.map((plant) => (
                        <SelectItem key={`plant:${plant.id}`} value={`plant:${plant.id}`}>
                          Plant: {plant.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {device.linkedEntity && (
                <div className="text-sm text-dark-text-secondary">
                  Currently linked to: {device.linkedEntity.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 