import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  const { deviceId } = params;
  const { searchParams } = new URL(request.url);

  const validation = schema.safeParse(Object.fromEntries(searchParams));

  if (!validation.success) {
    return NextResponse.json(validation.error.errors, { status: 400 });
  }
  
  const { startDate, endDate } = validation.data;

  try {
    const readings = await prisma.goveeReading.findMany({
      where: {
        deviceId: deviceId,
        timestamp: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error(`Error fetching sensor history for device ${deviceId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor history' },
      { status: 500 }
    );
  }
} 