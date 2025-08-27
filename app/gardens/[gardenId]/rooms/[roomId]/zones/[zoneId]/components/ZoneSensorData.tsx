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
  RefreshCw,
  Wind,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { calculateVPDFromFahrenheit, formatVPD, getVPDStatus } from "@/lib/vpdCalculator";

// Custom number input component with emerald chevrons
const CustomNumberInput = ({ 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  step = "0.1"
}: {
  placeholder: string;
  value: string | number;
  onChange: (value: number) => void;
  disabled?: boolean;
  step?: string;
}) => {
  const handleIncrement = () => {
    const currentValue = parseFloat(value.toString()) || 0;
    const stepValue = parseFloat(step);
    onChange(currentValue + stepValue);
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value.toString()) || 0;
    const stepValue = parseFloat(step);
    onChange(currentValue - stepValue);
  };

  return (
    <div className="relative group">
      <input
        type="number"
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-button]:appearance-none pr-8"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleIncrement}
          disabled={disabled}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pt-2 disabled:opacity-50"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={handleDecrement}
          disabled={disabled}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pb-2 disabled:opacity-50"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

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
    vpd?: { min?: number; max?: number };
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

  const handleThresholdChange = (type: 'temperature' | 'humidity' | 'vpd', field: 'min' | 'max', value: string) => {
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
                  className="data-[state=checked]:bg-garden-500 data-[state=unchecked]:bg-[#1a1b1e]"
                />
                <Label htmlFor="plant-alerts-toggle" className="text-emerald-300/70">
                  Use Plant-Specific Alert Thresholds
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-emerald-300/70 whitespace-nowrap">
                    <Thermometer className="h-4 w-4" />
                    Temperature (°C)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomNumberInput
                      placeholder="Min"
                      value={thresholds.temperature?.min ?? ''}
                      onChange={(value) => handleThresholdChange('temperature', 'min', value.toString())}
                      disabled={usePlantAlerts}
                      step="0.1"
                    />
                    <CustomNumberInput
                      placeholder="Max"
                      value={thresholds.temperature?.max ?? ''}
                      onChange={(value) => handleThresholdChange('temperature', 'max', value.toString())}
                      disabled={usePlantAlerts}
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-emerald-300/70 whitespace-nowrap">
                    <Droplets className="h-4 w-4" />
                    Humidity (%)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomNumberInput
                      placeholder="Min"
                      value={thresholds.humidity?.min ?? ''}
                      onChange={(value) => handleThresholdChange('humidity', 'min', value.toString())}
                      disabled={usePlantAlerts}
                      step="1"
                    />
                    <CustomNumberInput
                      placeholder="Max"
                      value={thresholds.humidity?.max ?? ''}
                      onChange={(value) => handleThresholdChange('humidity', 'max', value.toString())}
                      disabled={usePlantAlerts}
                      step="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-emerald-300/70 whitespace-nowrap">
                    <Wind className="h-4 w-4" />
                    VPD (kPa)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomNumberInput
                      placeholder="Min"
                      value={thresholds.vpd?.min ?? ''}
                      onChange={(value) => handleThresholdChange('vpd', 'min', value.toString())}
                      disabled={usePlantAlerts}
                      step="0.01"
                    />
                    <CustomNumberInput
                      placeholder="Max"
                      value={thresholds.vpd?.max ?? ''}
                      onChange={(value) => handleThresholdChange('vpd', 'max', value.toString())}
                      disabled={usePlantAlerts}
                      step="0.01"
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
            <div className="space-y-4">
                {devices.map((device) => {
                const data = sensorData[device.deviceId];
                let parsed: { temperature?: number; humidity?: number; online?: boolean; battery?: number; } = {};
                if (data?.currentState) {
                  for (const cap of data.currentState) {
                    if (cap.instance === 'sensorTemperature') parsed.temperature = cap.state?.value;
                    if (cap.instance === 'sensorHumidity') parsed.humidity = cap.state?.value;
                    if (cap.instance === 'online') parsed.online = cap.state?.value;
                    if (cap.instance === 'battery') parsed.battery = cap.state?.value;
                  }
                }

                  return (
                  <div key={device.id} className="p-3 border border-[#23282c] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {parsed.online !== false ? (
                          <Wifi className="h-4 w-4 text-garden-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-semibold text-emerald-100">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {parsed.battery != null && (
                          <Badge variant="outline" className="text-xs">
                            <Battery className="h-3 w-3 mr-1" />
                            {parsed.battery}%
                          </Badge>
                        )}
                        <Badge variant={device.isActive ? "success" : "destructive"} className="text-xs">
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2 mt-4 pl-6">
                      <div className="flex flex-col">
                        <span className="text-emerald-300">
                          {parsed.temperature?.toFixed(1) ?? '--'}°F
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-emerald-300">
                          {parsed.humidity?.toFixed(1) ?? '--'}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-emerald-300">
                          {parsed.temperature && parsed.humidity 
                            ? formatVPD(calculateVPDFromFahrenheit(parsed.temperature, parsed.humidity))
                            : '--'
                          }
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>High: <span className="font-medium text-emerald-300/80">{data?.history?.tempHigh24h?.toFixed(1) ?? '--'}°F</span></p>
                        <p>Low: <span className="font-medium text-emerald-300/80">{data?.history?.tempLow24h?.toFixed(1) ?? '--'}°F</span></p>
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>High: <span className="font-medium text-emerald-300/80">{data?.history?.humidityHigh24h?.toFixed(1) ?? '--'}%</span></p>
                        <p>Low: <span className="font-medium text-emerald-300/80">{data?.history?.humidityLow24h?.toFixed(1) ?? '--'}%</span></p>
                      </div>
                               <div className="text-xs text-gray-400">
           <p>High: <span className="font-medium text-emerald-300/80">{data?.history?.vpdHigh24h?.toFixed(2) ?? '--'}</span></p>
           <p>Low: <span className="font-medium text-emerald-300/80">{data?.history?.vpdLow24h?.toFixed(2) ?? '--'}</span></p>
         </div>
                    </div>
                  </div>
                  );
                })}
              </div>
        </div>
      )}
    </div>
  );
} 