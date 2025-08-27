'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Thermometer, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  MapPin,
  Activity
} from 'lucide-react';
import { GoveeDevice, GoveeReading, Zone } from '@prisma/client';

// Prisma's generated types don't include relations by default.
// We define more specific types for our data shapes.
type DeviceWithZone = GoveeDevice & {
  zone: { id: string; name: string } | null;
};

type ZoneWithDevices = Zone & {
  goveeDevices: {
    id: string;
    name: string;
    isOnline: boolean | null;
    batteryLevel: number | null;
    lastStateAt: Date | null;
  }[];
};

interface SensorDashboardProps {
  devices: DeviceWithZone[];
  zones: ZoneWithDevices[];
  readings: GoveeReading[];
  totalReadingsCount: number;
}

export function SensorDashboard({ devices, zones, readings, totalReadingsCount }: SensorDashboardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 5;

  // Pagination logic
  const totalPages = Math.ceil(readings.length / readingsPerPage);
  const paginatedReadings = readings.slice(
    (currentPage - 1) * readingsPerPage,
    currentPage * readingsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

    // Calculate statistics
    const totalSensors = devices.length;
    const onlineSensors = devices.filter(d => d.isOnline ?? true).length;
    const linkedSensors = devices.filter(d => d.zoneId).length;
    const activeZones = zones.length;
    const avgBattery = devices.filter(d => d.batteryLevel != null).length > 0
      ? Math.round(
          devices
            .filter(d => d.batteryLevel != null)
            .reduce((sum, d) => sum + (d.batteryLevel || 0), 0) /
            devices.filter(d => d.batteryLevel != null).length
        )
      : 0;
  
    // Get recent readings
    const recentReadings = readings.slice(0, 5);
  
    return (
      <div className="mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-emerald-100">Sensor Dashboard</h1>
            <p className="text-emerald-300/70 mt-2">Monitor your environmental sensors and zone status</p>
        </div>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
                <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-300">Total Sensors</CardTitle>
                        <Thermometer className="h-4 w-4 text-garden-500" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-emerald-100">{totalSensors}</div>
                        <p className="text-xs text-emerald-300/70">
                            {onlineSensors} online
                        </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-300">Linked to Zones</CardTitle>
                        <MapPin className="h-4 w-4 text-garden-500" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-emerald-100">{linkedSensors}</div>
                        <p className="text-xs text-emerald-300/70">
                            of {totalSensors} sensors
                        </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-300">Active Zones</CardTitle>
                        <Settings className="h-4 w-4 text-garden-500" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-emerald-100">{activeZones}</div>
                        <p className="text-xs text-emerald-300/70">
                            using sensors
                        </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-300">Total Readings</CardTitle>
                        <Activity className="h-4 w-4 text-garden-500" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-emerald-100">{totalReadingsCount}</div>
                        <p className="text-xs text-emerald-300/70">
                            data points
                        </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-300">Avg Battery</CardTitle>
                        <Battery className="h-4 w-4 text-garden-500" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold text-emerald-100">
                            {avgBattery}%
                        </div>
                        <p className="text-xs text-emerald-300/70">
                            across sensors
                        </p>
                        </CardContent>
                    </Card>
                    </div>

                    {/* Recent Activity and Zone Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Recent Activity */}
                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader>
                        <CardTitle className="text-emerald-100">Recent Sensor Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-4">
                            {paginatedReadings.length > 0 ? (
                            paginatedReadings.map((reading) => {
                                const device = devices.find(d => d.id === reading.deviceId);
                                return (
                                <div key={reading.id} className="flex items-center justify-between p-3 border border-[#23282c] rounded-lg">
                                    <div>
                                    <p className="font-medium text-emerald-100">{device?.name || 'Unknown Device'}</p>
                                    <p className="text-sm text-emerald-300/70">
                                        {new Date(reading.timestamp).toLocaleString()}
                                    </p>
                                    </div>
                                    <div className="text-right">
                                    {reading.temperature != null && (
                                        <p className="text-sm text-emerald-300">{reading.temperature.toFixed(1)}°F</p>
                                    )}
                                    {reading.humidity != null && (
                                        <p className="text-sm text-emerald-300">{reading.humidity.toFixed(1)}%</p>
                                    )}
                                    </div>
                                </div>
                                );
                            })
                            ) : (
                            <p className="text-emerald-300/70 text-center py-4">No recent sensor readings</p>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-4">
                            <Button
                                variant="dark-outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-emerald-300/70">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="dark-outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                            </div>
                        )}
                        </CardContent>
                    </Card>

                    {/* Zone Status */}
                    <Card className="bg-[#23272b] border border-[#23282c]">
                        <CardHeader>
                        <CardTitle className="text-emerald-100">Zone Sensor Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-4">
                            {zones.length > 0 ? (
                            zones.map((zone) => (
                                <div key={zone.id} className="p-3 border border-[#23282c] rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-emerald-100">{zone.name}</h4>
                                    {zone.weatherAlertSource && (
                                        <Badge variant="outline" className="text-emerald-300 border-emerald-300">
                                            {zone.weatherAlertSource.replace('_', ' ')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {zone.goveeDevices.map((device) => (
                                    <div key={device.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                        {device.isOnline ?? true ? (
                                            <Wifi className="h-3 w-3 text-garden-500" />
                                        ) : (
                                            <WifiOff className="h-3 w-3 text-red-400" />
                                        )}
                                        <span className="text-emerald-300">{device.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        {device.batteryLevel != null && (
                                            <span className="text-emerald-300/70">{device.batteryLevel}%</span>
                                        )}
                                        {device.lastStateAt && (
                                            <span className="text-emerald-300/70 text-xs">
                                            {new Date(device.lastStateAt).toLocaleTimeString()}
                                            </span>
                                        )}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                </div>
                            ))
                            ) : (
                            <p className="text-emerald-300/70 text-center py-4">No zones using sensors</p>
                            )}
                        </div>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  } 