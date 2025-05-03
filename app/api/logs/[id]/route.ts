import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
  }
} 