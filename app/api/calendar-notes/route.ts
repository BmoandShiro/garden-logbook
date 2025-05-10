import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Create a new calendar note
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { date, note, gardenId, roomId, zoneId, private: isPrivate } = await request.json();
  if (!date || !note) {
    return NextResponse.json({ error: 'Date and note are required' }, { status: 400 });
  }
  try {
    const created = await prisma.calendarNote.create({
      data: {
        date: new Date(date),
        note,
        userId: session.user.id,
        gardenId: gardenId || undefined,
        roomId: roomId || undefined,
        zoneId: zoneId || undefined,
        private: !!isPrivate,
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error('[CALENDAR_NOTE_POST]', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// GET: Fetch notes for the current user and context
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // optional, ISO string
  const gardenId = searchParams.get('gardenId');
  const roomId = searchParams.get('roomId');
  const zoneId = searchParams.get('zoneId');

  // Only show:
  // - private notes created by the user
  // - non-private notes for the selected context
  try {
    const where: any = {
      OR: [
        { private: true, userId: session.user.id },
        { private: false },
      ],
    };
    if (date) {
      // Find notes for the same day
      const day = new Date(date);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      where.date = { gte: day, lt: nextDay };
    }
    if (gardenId) where.gardenId = gardenId;
    if (roomId) where.roomId = roomId;
    if (zoneId) where.zoneId = zoneId;
    const notes = await prisma.calendarNote.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('[CALENDAR_NOTE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
} 