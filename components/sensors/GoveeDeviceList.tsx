'use client';

import { useState, useEffect } from 'react';
import { GoveeDevice } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface GoveeDeviceListProps {
  devices: GoveeDevice[];
}

export function GoveeDeviceList({ devices }: GoveeDeviceListProps) {
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
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

    fetchSensorData();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading sensor data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <h5 className="font-medium">Error</h5>
        </div>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No devices found. Add your Govee API key in the Settings tab to discover your devices.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <Card key={device.id}>
          <CardHeader>
            <CardTitle>{device.name}</CardTitle>
            <CardDescription>Device ID: {device.deviceId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {device.isActive ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span>{device.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <Button variant="outline">View Details</Button>
            </div>
            {sensorData[device.deviceId] && (
              <div className="mt-4">
                <h6 className="font-medium">Sensor Data</h6>
                <pre className="mt-2 p-2 bg-gray-100 rounded">
                  {JSON.stringify(sensorData[device.deviceId], null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 