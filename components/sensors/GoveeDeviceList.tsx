'use client';

import { useState, useEffect } from 'react';
import { GoveeDevice } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';

interface GoveeDeviceListProps {
  devices: GoveeDevice[];
}

function parseSensorData(capabilities: any[]): { temperature?: number; humidity?: number; online?: boolean } {
  let temperature, humidity, online;
  for (const cap of capabilities) {
    if (cap.instance === 'sensorTemperature') temperature = cap.state?.value;
    if (cap.instance === 'sensorHumidity') humidity = cap.state?.value;
    if (cap.instance === 'online') online = cap.state?.value;
  }
  return { temperature, humidity, online };
}

export function GoveeDeviceList({ devices: initialDevices }: GoveeDeviceListProps) {
  const [devices, setDevices] = useState<GoveeDevice[]>(initialDevices);
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button onClick={handleDiscover} disabled={discovering} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" style={{ display: discovering ? 'inline' : 'none' }} />
          {discovering ? 'Discovering...' : 'Discover Devices'}
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading sensor data...</div>
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
          let parsed: { temperature?: number; humidity?: number; online?: boolean } = {};
          if (Array.isArray(data)) parsed = parseSensorData(data);
          return (
            <Card key={device.id} className="bg-[#181c1f] border border-[#23282c] text-white">
              <CardHeader>
                <CardTitle className="text-emerald-400 text-xl font-bold">{device.name}</CardTitle>
                <CardDescription className="text-gray-400">Device ID: {device.deviceId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {parsed.online !== false ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold text-emerald-300">
                      {parsed.online !== false ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <Button variant="outline" onClick={() => setModalData(data)}>
                    <Info className="h-4 w-4 mr-1" /> View Details
                  </Button>
                </div>
                <div className="flex space-x-8 mt-2">
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
                </div>
              </CardContent>
            </Card>
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