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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user ID:', session.user.id);
    
    // Verify the user exists
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.error('User not found in database:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const data = await request.json();
    console.log('Request data:', data);
    
    // Convert date and time to a proper DateTime
    const [year, month, day] = data.date.split('-').map(Number);
    const [hours, minutes] = data.time.split(':').map(Number);
    const dateTime = new Date(year, month - 1, day, hours, minutes);

    // Create the log with the proper field names
    const log = await db.log.create({
      data: {
        logDate: dateTime,
        type: data.type,
        stage: data.stage,
        notes: data.notes,
        temperature: data.temperature,
        humidity: data.humidity,
        waterAmount: data.waterAmount,
        waterTemp: data.waterTemperature,
        waterPh: data.waterPh,
        runoffPh: data.runoffPh,
        waterPpm: data.waterPpm,
        runoffPpm: data.runoffPpm,
        partAPpm: data.partAPpm,
        partBPpm: data.partBPpm,
        partCPpm: data.partCPpm,
        boosterPpm: data.boosterPpm,
        finishPpm: data.finishPpm,
        healthRating: data.healthRating,
        userId: session.user.id,
        garden: data.garden,
        room: data.room,
        zone: data.zone,
        plant: data.plant,
      },
      include: {
        garden: true,
        room: true,
        zone: true,
        plant: true
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { error: `Failed to create log: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 