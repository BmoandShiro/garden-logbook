import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { LogType } from '@prisma/client';
import zipcodeToTimezone from 'zipcode-to-timezone';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Please sign in to view logs' }, { status: 401 });
  }

  if (!session.user?.id) {
    return NextResponse.json({ error: 'Invalid session. Please sign in again' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const location = searchParams.get('location');
    const gardenId = searchParams.get('gardenId');
    const roomId = searchParams.get('roomId');
    const zoneId = searchParams.get('zoneId');
    const plantId = searchParams.get('plantId');
    const keyword = searchParams.get('keyword');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user is requesting their own logs
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only view your own logs' }, { status: 401 });
    }

    // 1. Get all gardens where the user is a member or creator
    const gardens = await db.garden.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    const gardenIds = gardens.map(g => g.id);

    // 2. Get log visibility preferences for this user
    const prefs = await db.gardenLogVisibilityPreference.findMany({
      where: { userId },
    });
    const hiddenGardenIds = prefs.filter(p => !p.showLogs).map(p => p.gardenId);
    const visibleGardenIds = gardenIds.filter(id => !hiddenGardenIds.includes(id));

    // 3. Build the where clause based on filters and visible gardens
    const where: any = {
      gardenId: { in: visibleGardenIds },
    };

    if (type) {
      where.type = type as LogType;
    }

    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) {
        where.logDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.logDate.lte = new Date(endDate);
      }
    }

    if (location) {
      where.OR = [
        { garden: { name: { contains: location, mode: 'insensitive' } } },
        { room: { name: { contains: location, mode: 'insensitive' } } },
        { zone: { name: { contains: location, mode: 'insensitive' } } },
        { plant: { name: { contains: location, mode: 'insensitive' } } },
      ];
    }

    if (gardenId) {
      where.gardenId = gardenId;
    }
    if (roomId) {
      where.roomId = roomId;
    }
    if (zoneId) {
      where.zoneId = zoneId;
    }
    if (plantId) {
      where.plantId = plantId;
    }
    // Keyword search (notes, plant name, garden name, room name, zone name)
    if (keyword) {
      where.OR = [
        { notes: { contains: keyword, mode: 'insensitive' } },
        { plant: { name: { contains: keyword, mode: 'insensitive' } } },
        { garden: { name: { contains: keyword, mode: 'insensitive' } } },
        { room: { name: { contains: keyword, mode: 'insensitive' } } },
        { zone: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const logs = await db.log.findMany({
      where,
      select: {
        id: true,
        logDate: true,
        type: true,
        notes: true,
        plant: { select: { name: true, stage: true } },
        garden: { select: { name: true, timezone: true, zipcode: true } },
        room: { select: { name: true } },
        zone: { select: { name: true } },
        temperature: true,
        humidity: true,
        waterAmount: true,
        height: true,
        width: true,
        healthRating: true,
        data: true,
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 50,
    });

    // Add timezone to each log
    const logsWithTimezone = logs.map(log => {
      let timezone = log.garden?.timezone || null;
      if (!timezone && log.garden?.zipcode) {
        try {
          timezone = zipcodeToTimezone.lookup(log.garden.zipcode) || null;
        } catch (e) {
          timezone = null;
        }
      }
      return { ...log, timezone };
    });

    return NextResponse.json(logsWithTimezone);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user exists
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    console.log('Received data:', JSON.stringify(data, null, 2));
    const { datetime, selectedPlants, logType, ...rest } = data;

    // Parse the local datetime string and use it directly for logDate (undo UTC conversion)
    const logDate = new Date(datetime);
    console.log('Converted logDate (local):', logDate.toISOString());

    // Map form fields to schema fields
    const logData = {
      logDate,
      type: logType,
      stage: data.stage,
      notes: data.notes,
      imageUrls: data.imageUrls || [],
      plantId: selectedPlants?.[0], // Take the first selected plant
      userId: user.id,
      gardenId: data.gardenId,
      roomId: data.roomId,
      zoneId: data.zoneId,
      temperature: data.temperature,
      humidity: data.humidity,
      co2: data.co2,
      vpd: data.vpd,
      waterAmount: data.waterAmount,
      waterSource: data.waterSource,
      waterUnit: data.waterUnit,
      waterTemperature: data.waterTemperature,
      waterTemperatureUnit: data.waterTemperatureUnit,
      sourceWaterPh: data.sourceWaterPh,
      nutrientWaterPh: data.nutrientWaterPh,
      sourceWaterPpm: data.sourceWaterPpm,
      nutrientWaterPpm: data.nutrientWaterPpm,
      ppmScale: data.ppmScale,
      nutrientLine: data.nutrientLine,
      jacks321Used: data.jacks321Used || [],
      jacks321Unit: data.jacks321Unit,
      partAAmount: data.partAAmount,
      partBAmount: data.partBAmount,
      partCAmount: data.partCAmount,
      boosterAmount: data.boosterAmount,
      finishAmount: data.finishAmount,
      customNutrients: data.customNutrients,
      data: rest // Store any additional fields in the data JSON field
    };
    console.log('Attempting to create log with data:', JSON.stringify(logData, null, 2));

    const log = await db.log.create({
      data: logData,
      include: {
        plant: true
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating log:', error);

    // Type guard for Error objects
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Type guard for Prisma errors
    type PrismaError = {
      code: string;
      meta?: {
        target?: string[];
      };
    };

    const isPrismaError = (err: unknown): err is PrismaError => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };

    if (isPrismaError(error)) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);

      switch (error.code) {
        case 'P2002':
          return NextResponse.json({ 
            error: `Unique constraint violation on fields: ${error.meta?.target?.join(', ')}` 
          }, { status: 400 });
        case 'P2003':
          return NextResponse.json({ 
            error: `Foreign key constraint violation on fields: ${error.meta?.target?.join(', ')}` 
          }, { status: 400 });
        case 'P2025':
          return NextResponse.json({ 
            error: 'Record not found' 
          }, { status: 404 });
        default:
          return NextResponse.json({ 
            error: `Database error: ${error.code}` 
          }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: `Failed to create log: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 