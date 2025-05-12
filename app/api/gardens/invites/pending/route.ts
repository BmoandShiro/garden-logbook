import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/gardens/invites/pending
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const invites = await prisma.gardenInvite.findMany({
    where: {
      email: session.user.email,
      accepted: false,
    },
    include: {
      garden: { select: { id: true, name: true } },
    },
    orderBy: { invitedAt: 'desc' },
  });
  return NextResponse.json({ invites });
} 