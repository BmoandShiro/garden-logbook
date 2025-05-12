import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get the current user's log visibility preference for this garden
export async function GET(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pref = await prisma.gardenLogVisibilityPreference.findUnique({
    where: {
      userId_gardenId: {
        userId: session.user.id,
        gardenId,
      },
    },
  });
  return NextResponse.json({ showLogs: pref?.showLogs ?? true });
}

// POST: Set the current user's log visibility preference for this garden
export async function POST(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { showLogs } = await request.json();
  const pref = await prisma.gardenLogVisibilityPreference.upsert({
    where: {
      userId_gardenId: {
        userId: session.user.id,
        gardenId,
      },
    },
    update: { showLogs },
    create: {
      userId: session.user.id,
      gardenId,
      showLogs,
    },
  });
  return NextResponse.json({ showLogs: pref.showLogs });
} 