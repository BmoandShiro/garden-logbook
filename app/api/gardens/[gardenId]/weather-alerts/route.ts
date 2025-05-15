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
  // Find all WEATHER_ALERT notifications for these plants in the last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const alerts = await prisma.notification.findMany({
    where: {
      type: 'WEATHER_ALERT',
      createdAt: { gte: fourHoursAgo }
    },
    orderBy: { createdAt: 'desc' }
  });
  const filteredAlerts = alerts.filter((alert: any) =>
    plantIds.includes(alert.meta?.plantId)
  );

  // Server-side debug for BMOs Garden
  if (gardenId === "cmajtujtf000jsbcraxvtoelb") {
    console.log("BMOs Garden API raw alerts:", filteredAlerts);
    const allTypes = filteredAlerts.flatMap((a: any) => a.meta?.alertTypes || []);
    console.log("BMOs Garden API all alert types:", allTypes);
  }

  return NextResponse.json({ alerts: filteredAlerts });
} 