import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/gardens/invites/[inviteId]/decline
export async function POST(request: Request, context: { params: Promise<{ inviteId: string }> }) {
  const params = await context.params;
  const { inviteId } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const invite = await prisma.gardenInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (invite.accepted) {
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 400 });
  }
  await prisma.gardenInvite.delete({ where: { id: invite.id } });
  // Add info notification for decline
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: 'info',
      title: 'Invite Declined',
      message: `You declined an invite to the garden "${invite.gardenId}".`,
      link: `/gardens/${invite.gardenId}`,
    },
  });
  return NextResponse.json({ success: true });
} 