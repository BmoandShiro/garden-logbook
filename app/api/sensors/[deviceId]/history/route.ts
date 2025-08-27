import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateVPDFromFahrenheit } from '@/lib/vpdCalculator';

const schema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
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

    // Calculate VPD for any readings that don't have it stored
    const readingsWithVPD = readings.map((reading: any) => {
      if (reading.vpd === null && reading.temperature !== null && reading.humidity !== null) {
        return {
          ...reading,
          vpd: calculateVPDFromFahrenheit(reading.temperature, reading.humidity)
        };
      }
      return reading;
    });

    return NextResponse.json(readingsWithVPD);
  } catch (error) {
    console.error(`Error fetching sensor history for device ${deviceId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor history' },
      { status: 500 }
    );
  }
} 