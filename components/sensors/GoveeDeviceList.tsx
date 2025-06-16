import { GoveeDevice } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface GoveeDeviceListProps {
  devices: GoveeDevice[];
}

export function GoveeDeviceList({ devices }: GoveeDeviceListProps) {
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 