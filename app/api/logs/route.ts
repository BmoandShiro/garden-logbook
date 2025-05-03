import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { LogType } from '@prisma/client';

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

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user is requesting their own logs
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only view your own logs' }, { status: 401 });
    }

    // Build the where clause based on filters
    const where: any = {
      userId,
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

    console.log('Fetching logs with query:', where);

    const logs = await db.log.findMany({
      where,
      include: {
        plant: {
          select: {
            name: true,
            stage: true,
          },
        },
        garden: {
          select: {
            name: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
        zone: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 50,
    });

    console.log(`Found ${logs.length} logs`);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    
    // Handle Prisma-specific errors
    if (error.code) {
      switch (error.code) {
        case 'P2002':
          return NextResponse.json({ error: 'Database constraint violation' }, { status: 400 });
        case 'P2025':
          return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        default:
          return NextResponse.json(
            { error: `Database error: ${error.message || 'Unknown error'}` },
            { status: 500 }
          );
      }
    }

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
    const { date, time, selectedPlants, logType, ...rest } = data;

    // Convert date and time to DateTime
    const logDate = new Date(`${date}T${time}`);
    console.log('Converted logDate:', logDate);

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