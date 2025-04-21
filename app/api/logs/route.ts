import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
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

    const logs = await prisma.log.findMany({
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
        date: 'desc',
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
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Request body:', body);

    const {
      userId,
      type,
      stage,
      notes,
      temperature,
      humidity,
      waterAmount,
      healthRating,
      gardenId,
      roomId,
      zoneId,
      plantId,
      date,
    } = body;

    // Verify the user is creating their own log
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!type || !stage) {
      return NextResponse.json(
        { error: 'Type and stage are required' },
        { status: 400 }
      );
    }

    // Build the data object explicitly
    const data: any = {
      date: date ? new Date(date) : new Date(),
      type,
      stage,
      notes,
      temperature,
      humidity,
      waterAmount,
      healthRating,
      user: {
        connect: { id: userId }
      }
    };

    console.log('Initial data object:', data);

    // Only add relations if IDs are provided
    if (gardenId) {
      data.garden = { connect: { id: gardenId } };
      console.log('Added garden relation:', gardenId);
    }
    if (roomId) {
      data.room = { connect: { id: roomId } };
      console.log('Added room relation:', roomId);
    }
    if (zoneId) {
      data.zone = { connect: { id: zoneId } };
      console.log('Added zone relation:', zoneId);
    }

    // Connect to plant if provided
    if (plantId) {
      console.log('Checking plant ID:', plantId);
      const plant = await prisma.plant.findUnique({
        where: { id: plantId }
      });

      if (plant) {
        console.log('Found Plant:', plant.id);
        data.plant = { connect: { id: plantId } };
      } else {
        console.log('No plant found with ID:', plantId);
      }
    }

    console.log('Final data object:', data);

    // Create the log
    const log = await prisma.log.create({
      data,
      include: {
        garden: true,
        room: true,
        zone: true,
        plant: true,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Error creating log:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Handle Prisma errors more specifically
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A log with these details already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid garden, room, zone, or plant ID' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Required relation not found. Please check your selection.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create log: ${error.message}` },
      { status: 500 }
    );
  }
} 