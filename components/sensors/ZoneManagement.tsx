'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Settings, 
  AlertTriangle, 
  Thermometer, 
  Droplets,
  Wifi,
  WifiOff,
  Battery,
  Clock
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description?: string;
  weatherAlertSource: 'WEATHER_API' | 'SENSORS' | 'BOTH';
  sensorAlertThresholds?: {
    temperature?: { min?: number; max?: number };
    humidity?: { min?: number; max?: number };
  };
  usePlantSpecificAlerts?: boolean;
  goveeDevices?: Array<{
    id: string;
    name: string;
    isOnline?: boolean;
    batteryLevel?: number;
    lastStateAt?: Date;
  }>;
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
  zoneId?: string;
  isOnline?: boolean;
  batteryLevel?: number;
}

interface ZoneManagementProps {
  userId: string;
}

export function ZoneManagement({ userId }: ZoneManagementProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [devices, setDevices] = useState<GoveeDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesRes, devicesRes] = await Promise.all([
        fetch('/api/sensors/zones'),
        fetch('/api/sensors/devices')
      ]);

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setZones(zonesData);
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData);
      }
    } catch (error) {
      console.error("Failed to fetch zone data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDevice = async () => {
    if (!selectedZone || !selectedDevice) return;
    
    setLinking(true);
    try {
      const response = await fetch('/api/sensors/link-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice, zoneId: selectedZone })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setSelectedDevice("");
        setSelectedZone("");
      } else {
        throw new Error('Failed to link device');
      }
    } catch (error) {
      console.error("Failed to link device:", error);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    try {
      const response = await fetch('/api/sensors/unlink-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        throw new Error('Failed to unlink device');
      }
    } catch (error) {
      console.error("Failed to unlink device:", error);
    }
  };

  const updateZoneSetting = async (zoneId: string, payload: any) => {
    try {
      const response = await fetch(`/api/sensors/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchData(); // Refresh all data
      } else {
        throw new Error('Failed to update zone setting');
      }
    } catch (error) {
      console.error("Failed to update zone setting:", error);
    }
  };

  const unlinkedDevices = devices.filter(device => !device.zoneId);

  if (loading) {
    return (
      <Card className="bg-[#23272b] border border-[#23282c]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-emerald-300">Loading zone data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Link Device to Zone */}
      <Card className="bg-[#23272b] border border-[#23282c]">
        <CardHeader>
          <CardTitle className="text-emerald-100 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Link Sensor to Zone
          </CardTitle>
          <CardDescription className="text-emerald-300/70">
            Connect your sensors to specific zones for targeted monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone-select" className="text-emerald-300">Select Zone</Label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
                className="bg-[#23272b] border-[#23282c] text-emerald-100"
              >
                <option value="" disabled>Select a zone...</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-select" className="text-emerald-300">Select Sensor</Label>
              <Select
                value={selectedDevice}
                onValueChange={setSelectedDevice}
                className="bg-[#23272b] border-[#23282c] text-emerald-100"
              >
                <option value="" disabled>Select a sensor...</option>
                {unlinkedDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.type})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleLinkDevice} 
            disabled={!selectedZone || !selectedDevice || linking}
            className="w-full bg-emerald-600 hover:bg-emerald-500"
          >
            {linking ? "Linking..." : "Link Sensor to Zone"}
          </Button>
        </CardContent>
      </Card>

      {/* Zone Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-emerald-100">Zone Settings</h3>
        {zones.filter(zone => (zone.goveeDevices?.length || 0) > 0).map((zone) => {
          const zoneDevices = zone.goveeDevices || [];
          return (
            <Card key={zone.id} className="bg-[#23272b] border border-[#23282c]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-emerald-100">
                  <span>{zone.name}</span>
                  <Badge variant={zone.weatherAlertSource === 'BOTH' ? 'default' : 'outline'} className="text-emerald-300 border-emerald-300">
                    {zone.weatherAlertSource.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weather Alert Source */}
                <div className="space-y-2">
                  <Label className="text-emerald-300">Weather Alert Source</Label>
                  <select
                    value={zone.weatherAlertSource}
                    onChange={(e) =>
                      updateZoneSetting(zone.id, { weatherAlertSource: e.target.value as 'WEATHER_API' | 'SENSORS' | 'BOTH' })
                    }
                    className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
                  >
                    <option value="WEATHER_API">Weather API Only</option>
                    <option value="SENSORS">Sensors Only</option>
                    <option value="BOTH">Both Weather API & Sensors</option>
                  </select>
                </div>
                
                {/* Use Plant Specific Alerts Toggle */}
                {(zone.weatherAlertSource === 'SENSORS' || zone.weatherAlertSource === 'BOTH') && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id={`plant-alerts-toggle-${zone.id}`}
                      checked={zone.usePlantSpecificAlerts}
                      onCheckedChange={(checked) => updateZoneSetting(zone.id, { usePlantSpecificAlerts: checked })}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-[#1a1b1e]"
                    />
                    <Label htmlFor={`plant-alerts-toggle-${zone.id}`} className="text-emerald-300/70">
                      Use Plant-Specific Alert Thresholds
                    </Label>
                  </div>
                )}

                {/* Linked Sensors */}
                {zoneDevices.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-emerald-300">Linked Sensors ({zoneDevices.length})</Label>
                    <div className="space-y-2">
                      {zoneDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 border border-[#23282c] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {device.isOnline ?? true ? (
                                <Wifi className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <WifiOff className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-emerald-100">{device.name}</p>
                              <p className="text-sm text-emerald-300/70">{device.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {device.batteryLevel !== undefined && (
                              <div className="flex items-center gap-1">
                                <Battery className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm text-emerald-300">{device.batteryLevel}%</span>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkDevice(device.id)}
                              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                            >
                              Unlink
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 