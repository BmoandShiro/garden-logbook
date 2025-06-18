"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  AlertTriangle,
  RefreshCw,
  TrendingUp
} from "lucide-react";

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
}

interface GoveeReading {
  id: string;
  deviceId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  battery?: number;
  source: string;
}

interface ZoneSensorDataProps {
  zoneId: string;
  weatherAlertSource: 'WEATHER_API' | 'SENSORS' | 'BOTH';
  sensorAlertThresholds?: {
    temperature?: { min?: number; max?: number };
    humidity?: { min?: number; max?: number };
  };
}

export default function ZoneSensorData({ 
  zoneId, 
  weatherAlertSource, 
  sensorAlertThresholds 
}: ZoneSensorDataProps) {
  const [devices, setDevices] = useState<GoveeDevice[]>([]);
  const [readings, setReadings] = useState<GoveeReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSource, setCurrentSource] = useState(weatherAlertSource);
  const [thresholds, setThresholds] = useState(sensorAlertThresholds || {});

  useEffect(() => {
    fetchZoneData();
  }, [zoneId]);

  const fetchZoneData = async () => {
    setLoading(true);
    try {
      const [devicesRes, readingsRes] = await Promise.all([
        fetch(`/api/sensors/devices?zoneId=${zoneId}`),
        fetch(`/api/sensors/readings?zoneId=${zoneId}&hours=24`)
      ]);

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData);
      }

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      }
    } catch (error) {
      console.error("Failed to fetch zone sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchZoneData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleWeatherSourceChange = async (source: 'WEATHER_API' | 'SENSORS' | 'BOTH') => {
    try {
      const response = await fetch(`/api/sensors/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherAlertSource: source })
      });

      if (response.ok) {
        setCurrentSource(source);
      }
    } catch (error) {
      console.error("Failed to update weather source:", error);
    }
  };

  const handleThresholdChange = async (type: 'temperature' | 'humidity', field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const newThresholds = {
      ...thresholds,
      [type]: {
        ...thresholds[type],
        [field]: numValue
      }
    };

    try {
      const response = await fetch(`/api/sensors/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorAlertThresholds: newThresholds })
      });

      if (response.ok) {
        setThresholds(newThresholds);
      }
    } catch (error) {
      console.error("Failed to update thresholds:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestReadings = devices.map(device => {
    const deviceReadings = readings.filter(r => r.deviceId === device.id);
    return {
      device,
      latest: deviceReadings[0]
    };
  });

  return (
    <div className="space-y-4">
      {/* Weather Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Weather Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Alert Source</Label>
            <Select 
              value={currentSource} 
              onValueChange={(value) => 
                handleWeatherSourceChange(value as 'WEATHER_API' | 'SENSORS' | 'BOTH')
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

          {(currentSource === 'SENSORS' || currentSource === 'BOTH') && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
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
                      value={thresholds.temperature?.min || ''}
                      onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={thresholds.temperature?.max || ''}
                      onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
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
                      value={thresholds.humidity?.min || ''}
                      onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={thresholds.humidity?.max || ''}
                      onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Sensors */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Linked Sensors ({devices.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestReadings.map(({ device, latest }) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                  
                  <div className="flex items-center gap-4">
                    {latest && (
                      <div className="flex items-center gap-4">
                        {latest.temperature !== undefined && (
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {latest.temperature.toFixed(1)}°C
                            </span>
                          </div>
                        )}
                        {latest.humidity !== undefined && (
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {latest.humidity.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {device.batteryLevel !== undefined && (
                      <div className="flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        <span className="text-sm">{device.batteryLevel}%</span>
                      </div>
                    )}
                    
                    <Badge variant={device.isActive ? "default" : "secondary"}>
                      {device.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {readings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.max(...readings.filter(r => r.temperature !== undefined).map(r => r.temperature!)).toFixed(1)}°C
                </p>
                <p className="text-sm text-muted-foreground">Max Temp</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.min(...readings.filter(r => r.temperature !== undefined).map(r => r.temperature!)).toFixed(1)}°C
                </p>
                <p className="text-sm text-muted-foreground">Min Temp</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.max(...readings.filter(r => r.humidity !== undefined).map(r => r.humidity!)).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Max Humidity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.min(...readings.filter(r => r.humidity !== undefined).map(r => r.humidity!)).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Min Humidity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 