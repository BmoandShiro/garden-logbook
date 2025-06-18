"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  RefreshCw
} from "lucide-react";
import { ApiKeySection } from "./components/ApiKeySection";
import { DeviceList } from "./components/DeviceList";
import { AlertSettings } from "./components/AlertSettings";
import ZoneSensorLink from "./components/ZoneSensorLink";
import SensorCharts from "./components/SensorCharts";

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
  model?: string;
  isActive: boolean;
  isOnline?: boolean;
  batteryLevel?: number;
  lastState: any;
  lastStateAt: Date | null;
  linkedEntity: any;
  zoneId?: string;
}

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

interface GoveeReading {
  id: string;
  deviceId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  battery?: number;
  source: string;
}

interface SensorDashboardProps {
  gardens: Garden[];
  devices: GoveeDevice[];
  userId: string;
  userEmail: string;
}

export function SensorDashboard({ gardens, devices: initialDevices, userId, userEmail }: SensorDashboardProps) {
  const [devices, setDevices] = useState<GoveeDevice[]>(initialDevices);
  const [zones, setZones] = useState<Zone[]>([]);
  const [readings, setReadings] = useState<GoveeReading[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch additional data on component mount
  useEffect(() => {
    fetchAdditionalData();
  }, []);

  const fetchAdditionalData = async () => {
    setLoading(true);
    try {
      const [zonesRes, readingsRes] = await Promise.all([
        fetch('/api/sensors/zones'),
        fetch('/api/sensors/readings')
      ]);

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setZones(zonesData);
      }

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      }
    } catch (error) {
      console.error("Failed to fetch additional sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAdditionalData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkDevice = async (deviceId: string, zoneId: string) => {
    try {
      const response = await fetch('/api/sensors/link-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, zoneId })
      });

      if (response.ok) {
        await fetchAdditionalData(); // Refresh data
      } else {
        throw new Error('Failed to link device');
      }
    } catch (error) {
      console.error("Failed to link device:", error);
      throw error;
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
        await fetchAdditionalData(); // Refresh data
      } else {
        throw new Error('Failed to unlink device');
      }
    } catch (error) {
      console.error("Failed to unlink device:", error);
      throw error;
    }
  };

  const handleUpdateZoneSettings = async (zoneId: string, settings: Partial<Zone>) => {
    try {
      const response = await fetch(`/api/sensors/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        await fetchAdditionalData(); // Refresh data
      } else {
        throw new Error('Failed to update zone settings');
      }
    } catch (error) {
      console.error("Failed to update zone settings:", error);
      throw error;
    }
  };

  const handleExportData = async (deviceId: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/sensors/export/${deviceId}?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sensor-data-${deviceId}-${format}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      throw error;
    }
  };

  const selectedDeviceData = selectedDevice ? devices.find(d => d.id === selectedDevice) : null;
  const selectedDeviceReadings = selectedDevice ? readings.filter(r => r.deviceId === selectedDevice) : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="zones">Zone Management</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <ApiKeySection userId={userId} />
          <DeviceList devices={devices as any} gardens={gardens} userId={userId} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sensor Dashboard</h2>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sensors</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {devices.filter(d => d.isOnline ?? true).length} online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linked to Zones</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {devices.filter(d => d.zoneId).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {devices.length} sensors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readings.length}</div>
                <p className="text-xs text-muted-foreground">
                  data points collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {zones.filter(z => z.weatherAlertSource !== 'WEATHER_API').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  using sensors
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {readings.slice(0, 5).map((reading) => {
                    const device = devices.find(d => d.id === reading.deviceId);
                    return (
                      <div key={reading.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{device?.name || 'Unknown Device'}</p>
                          <p className="text-sm text-muted-foreground">
                            {reading.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {reading.temperature !== undefined && (
                            <p className="text-sm">{reading.temperature.toFixed(1)}°C</p>
                          )}
                          {reading.humidity !== undefined && (
                            <p className="text-sm">{reading.humidity.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices.slice(0, 5).map((device) => (
                    <div key={device.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {device.isOnline ?? true ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.model || device.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {device.batteryLevel !== undefined && (
                          <p className="text-sm">{device.batteryLevel}%</p>
                        )}
                        {device.zoneId && (
                          <Badge variant="outline" className="text-xs">
                            Linked
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <ZoneSensorLink
            zones={zones}
            devices={devices}
            onLinkDevice={handleLinkDevice}
            onUnlinkDevice={handleUnlinkDevice}
            onUpdateZoneSettings={handleUpdateZoneSettings}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {selectedDeviceData ? (
            <SensorCharts
              device={selectedDeviceData}
              readings={selectedDeviceReadings}
              onRefresh={handleRefresh}
              onExportData={handleExportData}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Thermometer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Device</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a device from the Devices tab to view its charts and data
                  </p>
                  <Button onClick={() => {
                    const devicesTab = document.querySelector('[data-value="devices"]') as HTMLElement;
                    if (devicesTab) devicesTab.click();
                  }}>
                    Go to Devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <AlertSettings userId={userId} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-6">
            <p className="text-dark-text-secondary">Settings coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 