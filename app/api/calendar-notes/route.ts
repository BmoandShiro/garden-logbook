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
        date, // string YYYY-MM-DD
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
  const date = searchParams.get('date'); // optional, YYYY-MM-DD
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
      where.date = date;
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

// DELETE: Delete a calendar note by id
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
  }
  try {
    // Only allow the creator to delete
    const note = await prisma.calendarNote.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    if (note.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.calendarNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR_NOTE_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
} 