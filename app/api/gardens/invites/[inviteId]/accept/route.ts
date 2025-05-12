import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/gardens/invites/[inviteId]/accept
export async function POST(request: Request, { params }: { params: { inviteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const invite = await prisma.gardenInvite.findUnique({
    where: { id: params.inviteId },
    include: { garden: true },
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
  // Add as member if not already
  const existingMember = await prisma.gardenMember.findUnique({
    where: {
      gardenId_userId: {
        gardenId: invite.gardenId,
        userId: session.user.id,
      },
    },
  });
  if (!existingMember) {
    await prisma.gardenMember.create({
      data: {
        gardenId: invite.gardenId,
        userId: session.user.id,
        permissions: ['VIEW', 'INVITE'],
        addedById: session.user.id,
      },
    });
  }
  await prisma.gardenInvite.update({
    where: { id: invite.id },
    data: { accepted: true },
  });
  return NextResponse.json({ success: true });
} 