import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  Wifi, 
  WifiOff,
  Settings,
  MapPin,
  Clock,
  Activity
} from 'lucide-react';

export default async function SensorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch sensor data
  const [devices, zones, readings] = await Promise.all([
    prisma.goveeDevice.findMany({
      where: { userId: session.user.id },
      include: {
        zone: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.zone.findMany({
      where: {
        creatorId: session.user.id,
        weatherAlertSource: { not: 'WEATHER_API' }
      },
      include: {
        goveeDevices: {
          select: {
            id: true,
            name: true,
            isOnline: true,
            batteryLevel: true,
            lastStateAt: true
          }
        }
      }
    }),
    prisma.goveeReading.findMany({
      where: {
        device: {
          userId: session.user.id
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })
  ]);

  // Calculate statistics
  const totalSensors = devices.length;
  const onlineSensors = devices.filter(d => d.isOnline ?? true).length;
  const linkedSensors = devices.filter(d => d.zoneId).length;
  const activeZones = zones.length;
  const totalReadings = readings.length;

  // Get recent readings
  const recentReadings = readings.slice(0, 5);

  return (
    <div className="container mx-auto py-6">
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
                  <Thermometer className="h-4 w-4 text-emerald-400" />
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
                  <MapPin className="h-4 w-4 text-emerald-400" />
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
                  <Settings className="h-4 w-4 text-emerald-400" />
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
                  <Activity className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-100">{totalReadings}</div>
                  <p className="text-xs text-emerald-300/70">
                    data points
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#23272b] border border-[#23282c]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-300">Avg Battery</CardTitle>
                  <Battery className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-100">
                    {devices.filter(d => d.batteryLevel !== undefined).length > 0 
                      ? Math.round(devices.filter(d => d.batteryLevel !== undefined).reduce((sum, d) => sum + (d.batteryLevel || 0), 0) / devices.filter(d => d.batteryLevel !== undefined).length)
                      : '--'
                    }%
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
                    {recentReadings.length > 0 ? (
                      recentReadings.map((reading) => {
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
                              {reading.temperature !== undefined && (
                                <p className="text-sm text-emerald-300">{reading.temperature.toFixed(1)}°C</p>
                              )}
                              {reading.humidity !== undefined && (
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
                            <Badge variant="outline" className="text-emerald-300 border-emerald-300">
                              {zone.weatherAlertSource.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {zone.goveeDevices.map((device) => (
                              <div key={device.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {device.isOnline ?? true ? (
                                    <Wifi className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <WifiOff className="h-3 w-3 text-red-400" />
                                  )}
                                  <span className="text-emerald-300">{device.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {device.batteryLevel !== undefined && (
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