import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - fetch notifications for the current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const unread = url.searchParams.get('unread');
  const where: any = { userId: session.user.id };
  if (unread === 'true') where.read = false;
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ notifications });
}

// PATCH /api/notifications - mark notifications as read
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { ids } = await request.json(); // ids: string[]
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
  }
  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { read: true },
  });
  return NextResponse.json({ success: true });
} 