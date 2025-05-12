import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Delete plants whose zone, room, or garden no longer exists
  const deleted = await prisma.plant.deleteMany({
    where: {
      OR: [
        { zone: null },
        { zone: { room: null } },
        { zone: { room: { garden: null } } },
      ]
    }
  });
  return NextResponse.json({ success: true, deletedCount: deleted.count });
} 