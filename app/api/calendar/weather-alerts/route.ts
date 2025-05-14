import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/calendar/weather-alerts?month=YYYY-MM
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // e.g. '2025-05'
  if (!month) {
    return NextResponse.json({ error: 'Missing month parameter' }, { status: 400 });
  }
  // Calculate start and end of month
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0, 23, 59, 59, 999);

  // Fetch all weather alert notifications for the user in this month
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      type: { in: ['WEATHER_ALERT', 'WEATHER_FORECAST_ALERT'] },
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date (YYYY-MM-DD)
  const byDay: Record<string, any> = {};
  for (const n of notifications) {
    const day = n.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) {
      byDay[day] = {
        date: day,
        alertTypes: {}, // { heat: 3, wind: 2, ... }
        totalAlerts: 0,
        gardens: new Set(),
        rooms: new Set(),
        zones: new Set(),
        plants: new Set(),
        details: [], // for tooltip/modal
      };
    }
    // Count alert types
    if (n.meta?.alertTypes) {
      for (const t of n.meta.alertTypes) {
        byDay[day].alertTypes[t] = (byDay[day].alertTypes[t] || 0) + 1;
        byDay[day].totalAlerts++;
      }
    }
    // Collect affected entities
    if (n.meta?.gardenId) byDay[day].gardens.add(n.meta.gardenId);
    if (n.meta?.roomId) byDay[day].rooms.add(n.meta.roomId);
    if (n.meta?.zoneId) byDay[day].zones.add(n.meta.zoneId);
    if (n.meta?.plantId) byDay[day].plants.add(n.meta.plantId);
    // Add to details for tooltip/modal
    byDay[day].details.push({
      type: n.type,
      alertTypes: n.meta?.alertTypes || [],
      plantName: n.meta?.plantName,
      plantId: n.meta?.plantId,
      gardenName: n.meta?.gardenName,
      gardenId: n.meta?.gardenId,
      roomName: n.meta?.roomName,
      roomId: n.meta?.roomId,
      zoneName: n.meta?.zoneName,
      zoneId: n.meta?.zoneId,
      createdAt: n.createdAt,
      message: n.message,
    });
  }
  // Convert sets to counts and arrays
  const result = Object.values(byDay).map((d: any) => ({
    ...d,
    gardens: Array.from(d.gardens),
    rooms: Array.from(d.rooms),
    zones: Array.from(d.zones),
    plants: Array.from(d.plants),
    gardensCount: d.gardens.size,
    roomsCount: d.rooms.size,
    zonesCount: d.zones.size,
    plantsCount: d.plants.size,
  }));
  return NextResponse.json(result);
} 