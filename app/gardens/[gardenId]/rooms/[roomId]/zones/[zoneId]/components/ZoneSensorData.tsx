"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  AlertTriangle,
  RefreshCw
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

interface ZoneSensorDataProps {
  zoneId: string;
  devices: GoveeDevice[];
  weatherAlertSource: 'WEATHER_API' | 'SENSORS' | 'BOTH';
  sensorAlertThresholds?: {
    temperature?: { min?: number; max?: number };
    humidity?: { min?: number; max?: number };
  };
  usePlantSpecificAlerts: boolean;
}

function parseSensorData(capabilities: any[]): { 
  temperature?: number; 
  humidity?: number; 
} {
  let temperature, humidity;
  for (const cap of capabilities) {
    if (cap.instance === 'sensorTemperature') temperature = cap.state?.value;
    if (cap.instance === 'sensorHumidity') humidity = cap.state?.value;
  }
  return { temperature, humidity };
}

export default function ZoneSensorData({ 
  zoneId, 
  devices,
  weatherAlertSource, 
  sensorAlertThresholds,
  usePlantSpecificAlerts
}: ZoneSensorDataProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentSource, setCurrentSource] = useState(weatherAlertSource);
  const [thresholds, setThresholds] = useState(sensorAlertThresholds || {});
  const [usePlantAlerts, setUsePlantAlerts] = useState(usePlantSpecificAlerts);
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSensorData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/sensors/data');
        if (response.ok) {
          const data = await response.json();
          setSensorData(data);
        }
      } catch (error) {
        console.error("Failed to fetch live sensor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const updateZone = async (payload: any) => {
    try {
      const response = await fetch(`/api/sensors/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to update zone');
      }
    } catch (error) {
      console.error("Failed to update zone setting:", error);
      // Optionally, show an error toast to the user
    }
  };

  const handleWeatherSourceChange = async (source: 'WEATHER_API' | 'SENSORS' | 'BOTH') => {
    setCurrentSource(source);
    await updateZone({ weatherAlertSource: source });
  };

  const handleThresholdChange = (type: 'temperature' | 'humidity', field: 'min' | 'max', value: string) => {
    const newThresholds = {
      ...thresholds,
      [type]: {
        ...(thresholds[type] || {}),
        [field]: value === '' ? undefined : parseFloat(value)
      }
    };
    setThresholds(newThresholds);
    // Debounce this in a real app
    updateZone({ sensorAlertThresholds: newThresholds });
  };
  
  const handleUsePlantAlertsChange = async (checked: boolean) => {
    setUsePlantAlerts(checked);
    await updateZone({ usePlantSpecificAlerts: checked });
  };


  return (
    <div className="space-y-4">
      {/* Weather Alert Settings */}
      <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
        <h2 className="text-xl font-semibold mb-4 text-emerald-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Weather Alert Settings
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-emerald-300/70">Alert Source</Label>
            <select
              value={currentSource}
              onChange={(e) =>
                handleWeatherSourceChange(e.target.value as 'WEATHER_API' | 'SENSORS' | 'BOTH')
              }
              className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
            >
              <option value="WEATHER_API">Weather API Only</option>
              <option value="SENSORS">Sensors Only</option>
              <option value="BOTH">Both Weather API & Sensors</option>
            </select>
          </div>

          {(currentSource === 'SENSORS' || currentSource === 'BOTH') && (
            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2 font-semibold text-emerald-100">
                <Settings className="h-4 w-4" />
                Sensor Alert Thresholds
              </Label>

              <div className="flex items-center space-x-2">
                <Switch
                  id="plant-alerts-toggle"
                  checked={usePlantAlerts}
                  onCheckedChange={handleUsePlantAlertsChange}
                />
                <Label htmlFor="plant-alerts-toggle" className="text-emerald-300/70">
                  Use Plant-Specific Alert Thresholds
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-emerald-300/70">
                    <Thermometer className="h-4 w-4" />
                    Temperature (°C)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      disabled={usePlantAlerts}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm disabled:opacity-50"
                      value={thresholds.temperature?.min ?? ''}
                      onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      disabled={usePlantAlerts}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm disabled:opacity-50"
                      value={thresholds.temperature?.max ?? ''}
                      onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-emerald-300/70">
                    <Droplets className="h-4 w-4" />
                    Humidity (%)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      disabled={usePlantAlerts}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm disabled:opacity-50"
                      value={thresholds.humidity?.min ?? ''}
                      onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      disabled={usePlantAlerts}
                      className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm disabled:opacity-50"
                      value={thresholds.humidity?.max ?? ''}
                      onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Linked Sensors */}
      {devices.length > 0 && (
        <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-emerald-100 flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Linked Sensors ({devices.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  const liveData = sensorData[device.deviceId];
                  let parsed: { temperature?: number; humidity?: number } = {};
                  if (Array.isArray(liveData)) parsed = parseSensorData(liveData);
                  const lastTemp = parsed.temperature;
                  const lastHumidity = parsed.humidity;

                  return (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-dark-bg-tertiary border border-dark-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {device.isOnline ? (
                          <Wifi className="h-4 w-4 text-green-400" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium text-emerald-100">{device.name}</p>
                          <p className="text-sm text-emerald-300/70">{device.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                           {lastTemp !== undefined && (
                            <p className="text-sm text-emerald-100">{lastTemp.toFixed(1)}°F</p>
                          )}
                          {lastHumidity !== undefined && (
                            <p className="text-sm text-emerald-300/70">{lastHumidity.toFixed(1)}%</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-300/70">
                          <Battery className="h-4 w-4" />
                          <span>{device.batteryLevel ?? '--'}%</span>
                        </div>
                        <Badge variant={device.isActive ? 'default' : 'secondary'} className={device.isActive ? 'bg-green-600/20 text-green-300 border-green-500/30' : ''}>
                          {device.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}
    </div>
  );
} 