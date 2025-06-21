'use client';

import { useState, useEffect } from 'react';
import { GoveeDevice } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, RefreshCw, Info, Battery, Clock, MapPin, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SensorChart } from './SensorChart';

interface GoveeDeviceListProps {
  devices: GoveeDevice[];
}

function parseSensorData(capabilities: any[]): { 
  temperature?: number; 
  humidity?: number; 
  online?: boolean;
  battery?: number;
  lastUpdate?: string;
} {
  let temperature, humidity, online, battery, lastUpdate;
  for (const cap of capabilities) {
    if (cap.instance === 'sensorTemperature') temperature = cap.state?.value;
    if (cap.instance === 'sensorHumidity') humidity = cap.state?.value;
    if (cap.instance === 'online') online = cap.state?.value;
    if (cap.instance === 'battery') battery = cap.state?.value;
    if (cap.instance === 'lastUpdate') lastUpdate = cap.state?.value;
  }
  return { temperature, humidity, online, battery, lastUpdate };
}

export function GoveeDeviceList({ devices: initialDevices }: GoveeDeviceListProps) {
  const [devices, setDevices] = useState<GoveeDevice[]>(initialDevices);
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any | null>(null);
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});

  const toggleChart = (deviceId: string) => {
    setExpandedCharts(prev => ({ ...prev, [deviceId]: !prev[deviceId] }));
  };

  const fetchSensorData = async (deviceList: GoveeDevice[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sensors/data');
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      const data = await response.json();
      setSensorData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData(devices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const response = await fetch('/api/sensors/discover', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to discover devices');
      }
      const data = await response.json();
      setDevices(data.devices);
      fetchSensorData(data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDiscovering(false);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-emerald-400';
    if (level > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return '🔋';
    if (level > 50) return '🔋';
    if (level > 20) return '🔋';
    return '🔋';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button onClick={handleDiscover} disabled={discovering} variant="dark-outline">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" style={{ display: discovering ? 'inline' : 'none' }} />
          {discovering ? 'Discovering...' : 'Discover Devices'}
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <h5 className="font-medium">Error</h5>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center text-gray-500">
          No devices found. Add your Govee API key in the Settings tab to discover your devices.
        </div>
      ) : (
        devices.map((device) => {
          const data = sensorData[device.deviceId];
          let parsed: { temperature?: number; humidity?: number; online?: boolean; battery?: number; lastUpdate?: string } = {};
          if (Array.isArray(data?.currentState)) parsed = parseSensorData(data.currentState);
          
          return (
            <Collapsible key={device.id} open={expandedCharts[device.id]} onOpenChange={() => toggleChart(device.id)}>
              <Card className="bg-[#23272b] border border-[#23282c] text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-emerald-400 text-xl font-bold">{device.name}</CardTitle>
                      <CardDescription className="text-gray-400">Device ID: {device.deviceId}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.linkedEntity && (
                        <Badge variant="outline" className="text-emerald-300 border-emerald-300">
                          <MapPin className="h-3 w-3 mr-1" />
                          {typeof device.linkedEntity === 'object' && device.linkedEntity !== null && 'name' in device.linkedEntity 
                            ? (device.linkedEntity as any).name 
                            : 'Linked'}
                        </Badge>
                      )}
                      <Button variant="dark-outline" onClick={(e) => { e.stopPropagation(); setModalData(data?.currentState); }}>
                        <Info className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="dark-outline">
                          <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${expandedCharts[device.id] ? 'rotate-180' : ''}`} />
                          View History
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status and Health Indicators */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {parsed.online !== false ? (
                        <Wifi className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold text-emerald-300">
                        {parsed.online !== false ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    
                    {/* Battery Level */}
                    {parsed.battery !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Battery className={`h-4 w-4 ${getBatteryColor(parsed.battery)}`} />
                        <span className={`text-sm font-medium ${getBatteryColor(parsed.battery)}`}>
                          {parsed.battery}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last Reading Time */}
                  {device.lastStateAt && (
                    <div className="flex items-center space-x-2 mb-4 text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Last reading: {new Date(device.lastStateAt).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Sensor Readings */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs">Temperature</span>
                      <span className="text-2xl font-bold text-emerald-300">
                        {parsed.temperature !== undefined ? `${parsed.temperature}°F` : '--'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs">Humidity</span>
                      <span className="text-2xl font-bold text-emerald-300">
                        {parsed.humidity !== undefined ? `${parsed.humidity}%` : '--'}
                      </span>
                    </div>

                    {/* 24h High/Low */}
                    <div className="text-center text-xs text-gray-400">
                      <p>24h High: <span className="font-medium text-emerald-300">{data?.history?.tempHigh24h?.toFixed(1) ?? '--'}°F</span></p>
                      <p>24h Low: <span className="font-medium text-emerald-300">{data?.history?.tempLow24h?.toFixed(1) ?? '--'}°F</span></p>
                    </div>
                     <div className="text-center text-xs text-gray-400">
                      <p>24h High: <span className="font-medium text-emerald-300">{data?.history?.humidityHigh24h?.toFixed(1) ?? '--'}%</span></p>
                      <p>24h Low: <span className="font-medium text-emerald-300">{data?.history?.humidityLow24h?.toFixed(1) ?? '--'}%</span></p>
                    </div>
                  </div>

                  {/* Device Status */}
                  <div className="mt-4 pt-4 border-t border-[#23282c]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Device Status:</span>
                      <Badge variant={device.isActive ? "success" : "destructive"} className="text-xs">
                        {device.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CollapsibleContent>
                  <SensorChart deviceId={device.id} />
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })
      )}
      {/* Modal for raw data */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#23282c] p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">Raw Sensor Data</h3>
            <pre className="bg-[#181c1f] text-gray-200 p-4 rounded overflow-x-auto max-h-96">
              {JSON.stringify(modalData, null, 2)}
            </pre>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setModalData(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 