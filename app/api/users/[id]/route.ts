import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { weatherNotificationPeriod: true }
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { weatherNotificationPeriod } = body;
  if (!['current', '24h', '3d', 'week', 'all'].includes(weatherNotificationPeriod)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }
  await prisma.user.update({
    where: { id },
    data: { weatherNotificationPeriod }
  });
  return NextResponse.json({ success: true });
} 