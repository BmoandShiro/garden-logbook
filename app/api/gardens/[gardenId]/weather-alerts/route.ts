import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Find all plants in the garden
  const plants = await prisma.plant.findMany({
    where: { gardenId },
    select: { id: true, name: true }
  });
  const plantIds = plants.map((p: { id: string; name: string }) => p.id);
  if (plantIds.length === 0) {
    return NextResponse.json({ alerts: [] });
  }
  // Find all WEATHER_ALERT notifications for these plants in the last 12 hours
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const alerts = await prisma.notification.findMany({
    where: {
      type: 'WEATHER_ALERT',
      createdAt: { gte: twelveHoursAgo }
    },
    orderBy: { createdAt: 'desc' }
  });
  const filteredAlerts = alerts.filter((alert: any) =>
    plantIds.includes(alert.meta?.plantId)
  );
  return NextResponse.json({ alerts: filteredAlerts });
} 