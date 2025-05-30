import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import zipcodeToTimezone from 'zipcode-to-timezone';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const log = await db.log.findUnique({
      where: { id: params.id },
      include: {
        plant: true,
        garden: true,
        room: true,
        zone: true,
      },
    });
    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    let timezone = log.garden?.timezone || null;
    if (!timezone && log.garden?.zipcode) {
      try {
        timezone = zipcodeToTimezone.lookup(log.garden.zipcode) || null;
      } catch (e) {
        timezone = null;
      }
    }
    return NextResponse.json({ ...log, timezone });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  try {
    const deleted = await db.log.delete({
      where: { id: id },
    });
    if (!deleted) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
} 