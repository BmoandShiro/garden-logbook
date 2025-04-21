import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LogType } from '@prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const logs = await prisma.log.findMany({
      where,
      include: {
        plant: {
          select: {
            name: true,
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
      take: 50, // Limit to 50 logs per page for now
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
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

    // Create the log with current date
    const log = await prisma.log.create({
      data: {
        date: new Date(),
        type,
        stage,
        notes,
        temperature,
        humidity,
        waterAmount,
        healthRating,
        user: {
          connect: { id: userId }
        },
        garden: gardenId ? { connect: { id: gardenId } } : undefined,
        room: roomId ? { connect: { id: roomId } } : undefined,
        zone: zoneId ? { connect: { id: zoneId } } : undefined,
        plant: plantId ? { connect: { id: plantId } } : undefined,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Error creating log:', error);
    
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

    return NextResponse.json(
      { error: error.message || 'Failed to create log' },
      { status: 500 }
    );
  }
} 