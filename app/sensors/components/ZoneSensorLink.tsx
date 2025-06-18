"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  AlertTriangle
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  description?: string;
  weatherAlertSource: 'WEATHER_API' | 'SENSORS' | 'BOTH';
  sensorAlertThresholds?: {
    temperature?: { min?: number; max?: number };
    humidity?: { min?: number; max?: number };
  };
}

interface GoveeDevice {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  model?: string;
  isActive: boolean;
  isOnline: boolean;
  batteryLevel?: number;
  lastState?: any;
  lastStateAt?: Date;
  zoneId?: string;
}

interface ZoneSensorLinkProps {
  zones: Zone[];
  devices: GoveeDevice[];
  onLinkDevice: (deviceId: string, zoneId: string) => Promise<void>;
  onUnlinkDevice: (deviceId: string) => Promise<void>;
  onUpdateZoneSettings: (zoneId: string, settings: Partial<Zone>) => Promise<void>;
}

export default function ZoneSensorLink({
  zones,
  devices,
  onLinkDevice,
  onUnlinkDevice,
  onUpdateZoneSettings
}: ZoneSensorLinkProps) {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const unlinkedDevices = devices.filter(device => !device.zoneId);
  const linkedDevices = devices.filter(device => device.zoneId);

  const handleLinkDevice = async () => {
    if (!selectedZone || !selectedDevice) return;
    
    setLoading(true);
    try {
      await onLinkDevice(selectedDevice, selectedZone);
      setSelectedDevice("");
      setSelectedZone("");
    } catch (error) {
      console.error("Failed to link device:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    setLoading(true);
    try {
      await onUnlinkDevice(deviceId);
    } catch (error) {
      console.error("Failed to unlink device:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeatherSourceChange = async (zoneId: string, source: 'WEATHER_API' | 'SENSORS' | 'BOTH') => {
    try {
      await onUpdateZoneSettings(zoneId, { weatherAlertSource: source });
    } catch (error) {
      console.error("Failed to update weather source:", error);
    }
  };

  const handleThresholdChange = async (zoneId: string, type: 'temperature' | 'humidity', field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const currentThresholds = zone.sensorAlertThresholds || {};
    const newThresholds = {
      ...currentThresholds,
      [type]: {
        ...currentThresholds[type],
        [field]: numValue
      }
    };

    try {
      await onUpdateZoneSettings(zoneId, { sensorAlertThresholds: newThresholds });
    } catch (error) {
      console.error("Failed to update thresholds:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Link New Device */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Link Sensor to Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone-select">Select Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="bg-[#23272b] border-[#23282c] text-emerald-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#23272b] border-[#23282c]">
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id} className="text-emerald-100">
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-select">Select Sensor</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger className="bg-[#23272b] border-[#23282c] text-emerald-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#23272b] border-[#23282c]">
                  {unlinkedDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id} className="text-emerald-100">
                      {device.name} ({device.model || device.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleLinkDevice} 
            disabled={!selectedZone || !selectedDevice || loading}
            className="w-full"
          >
            {loading ? "Linking..." : "Link Sensor to Zone"}
          </Button>
        </CardContent>
      </Card>

      {/* Zone Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Zone Settings</h3>
        {zones.map((zone) => {
          const zoneDevices = linkedDevices.filter(device => device.zoneId === zone.id);
          
          return (
            <Card key={zone.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{zone.name}</span>
                  <Badge variant={zone.weatherAlertSource === 'BOTH' ? 'default' : 'secondary'}>
                    {zone.weatherAlertSource.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weather Alert Source */}
                <div className="space-y-2">
                  <Label>Weather Alert Source</Label>
                  <Select 
                    value={zone.weatherAlertSource} 
                    onValueChange={(value) => 
                      handleWeatherSourceChange(zone.id, value as 'WEATHER_API' | 'SENSORS' | 'BOTH')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEATHER_API">Weather API Only</SelectItem>
                      <SelectItem value="SENSORS">Sensors Only</SelectItem>
                      <SelectItem value="BOTH">Both Weather API & Sensors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sensor Alert Thresholds */}
                {(zone.weatherAlertSource === 'SENSORS' || zone.weatherAlertSource === 'BOTH') && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Sensor Alert Thresholds
                    </Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          Temperature (°C)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={zone.sensorAlertThresholds?.temperature?.min || ''}
                            onChange={(e) => handleThresholdChange(zone.id, 'temperature', 'min', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={zone.sensorAlertThresholds?.temperature?.max || ''}
                            onChange={(e) => handleThresholdChange(zone.id, 'temperature', 'max', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Droplets className="h-4 w-4" />
                          Humidity (%)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={zone.sensorAlertThresholds?.humidity?.min || ''}
                            onChange={(e) => handleThresholdChange(zone.id, 'humidity', 'min', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={zone.sensorAlertThresholds?.humidity?.max || ''}
                            onChange={(e) => handleThresholdChange(zone.id, 'humidity', 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linked Sensors */}
                {zoneDevices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Linked Sensors ({zoneDevices.length})</Label>
                    <div className="space-y-2">
                      {zoneDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {device.isOnline ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                              ) : (
                                <WifiOff className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.model || device.type}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {device.batteryLevel !== undefined && (
                              <div className="flex items-center gap-1">
                                <Battery className="h-4 w-4" />
                                <span className="text-sm">{device.batteryLevel}%</span>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkDevice(device.id)}
                              disabled={loading}
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