"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Calendar,
  Download,
  RefreshCw,
  Wind
} from "lucide-react";
import { calculateVPD, formatVPD, getVPDStatus } from "@/lib/vpdCalculator";
import { SensorChart } from "@/components/sensors/SensorChart";

interface GoveeReading {
  id: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  battery?: number;
  source: string;
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

interface SensorChartsProps {
  device: GoveeDevice;
  readings: GoveeReading[];
  onRefresh: () => Promise<void>;
  onExportData: (deviceId: string, format: 'csv' | 'json') => Promise<void>;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

export default function SensorCharts({
  device,
  readings,
  onRefresh,
  onExportData
}: SensorChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await onExportData(device.id, format);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  // Filter readings based on time range
  const getFilteredReadings = () => {
    const now = new Date();
    let cutoff: Date;

    switch (timeRange) {
      case '1h':
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        return readings;
      default:
        return readings;
    }

    return readings.filter(reading => reading.timestamp >= cutoff);
  };

  const filteredReadings = getFilteredReadings();

  // Calculate statistics
  const stats = {
    temperature: {
      current: readings[0]?.temperature,
      min: Math.min(...filteredReadings.filter(r => r.temperature !== undefined).map(r => r.temperature!)),
      max: Math.max(...filteredReadings.filter(r => r.temperature !== undefined).map(r => r.temperature!)),
      avg: filteredReadings.filter(r => r.temperature !== undefined).reduce((sum, r) => sum + r.temperature!, 0) / filteredReadings.filter(r => r.temperature !== undefined).length
    },
    humidity: {
      current: readings[0]?.humidity,
      min: Math.min(...filteredReadings.filter(r => r.humidity !== undefined).map(r => r.humidity!)),
      max: Math.max(...filteredReadings.filter(r => r.humidity !== undefined).map(r => r.humidity!)),
      avg: filteredReadings.filter(r => r.humidity !== undefined).reduce((sum, r) => sum + r.humidity!, 0) / filteredReadings.filter(r => r.humidity !== undefined).length
    },
    vpd: {
      current: readings[0]?.temperature && readings[0]?.humidity 
        ? calculateVPD(readings[0].temperature, readings[0].humidity)
        : undefined,
      min: Math.min(...filteredReadings.filter(r => r.temperature !== undefined && r.humidity !== undefined).map(r => calculateVPD(r.temperature!, r.humidity!))),
      max: Math.max(...filteredReadings.filter(r => r.temperature !== undefined && r.humidity !== undefined).map(r => calculateVPD(r.temperature!, r.humidity!))),
      avg: filteredReadings.filter(r => r.temperature !== undefined && r.humidity !== undefined).reduce((sum, r) => sum + calculateVPD(r.temperature!, r.humidity!), 0) / filteredReadings.filter(r => r.temperature !== undefined && r.humidity !== undefined).length
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {device.name}
                <Badge variant={device.isOnline ? "default" : "secondary"}>
                  {device.isOnline ? "Online" : "Offline"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {device.model || device.type} • {device.deviceId}
              </p>
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
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="6h">6 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-medium">
                  {stats.temperature.current !== undefined 
                    ? `${stats.temperature.current.toFixed(1)}°C` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average</span>
                <span className="font-medium">
                  {!isNaN(stats.temperature.avg) 
                    ? `${stats.temperature.avg.toFixed(1)}°C` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min</span>
                <span className="font-medium">
                  {!isNaN(stats.temperature.min) 
                    ? `${stats.temperature.min.toFixed(1)}°C` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max</span>
                <span className="font-medium">
                  {!isNaN(stats.temperature.max) 
                    ? `${stats.temperature.max.toFixed(1)}°C` 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Humidity Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-medium">
                  {stats.humidity.current !== undefined 
                    ? `${stats.humidity.current.toFixed(1)}%` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average</span>
                <span className="font-medium">
                  {!isNaN(stats.humidity.avg) 
                    ? `${stats.humidity.avg.toFixed(1)}%` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min</span>
                <span className="font-medium">
                  {!isNaN(stats.humidity.min) 
                    ? `${stats.humidity.min.toFixed(1)}%` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max</span>
                <span className="font-medium">
                  {!isNaN(stats.humidity.max) 
                    ? `${stats.humidity.max.toFixed(1)}%` 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VPD Stats */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              VPD
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-medium">
                  {stats.vpd.current !== undefined 
                    ? formatVPD(stats.vpd.current)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average</span>
                <span className="font-medium">
                  {!isNaN(stats.vpd.avg) 
                    ? formatVPD(stats.vpd.avg)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min</span>
                <span className="font-medium">
                  {!isNaN(stats.vpd.min) 
                    ? formatVPD(stats.vpd.min)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max</span>
                <span className="font-medium">
                  {!isNaN(stats.vpd.max) 
                    ? formatVPD(stats.vpd.max)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sensor Data Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart deviceId={device.id} />
        </CardContent>
      </Card>
      </div>

      {/* Recent Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Temperature</th>
                  <th className="text-left py-2">Humidity</th>
                  <th className="text-left py-2">VPD</th>
                  <th className="text-left py-2">Battery</th>
                  <th className="text-left py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredReadings.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="border-b">
                    <td className="py-2">
                      {reading.timestamp.toLocaleString()}
                    </td>
                    <td className="py-2">
                      {reading.temperature !== undefined 
                        ? `${reading.temperature.toFixed(1)}°C` 
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2">
                      {reading.humidity !== undefined 
                        ? `${reading.humidity.toFixed(1)}%` 
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2">
                      {reading.temperature !== undefined && reading.humidity !== undefined
                        ? formatVPD(calculateVPD(reading.temperature, reading.humidity))
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2">
                      {reading.battery !== undefined 
                        ? `${reading.battery}%` 
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-xs">
                        {reading.source}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 