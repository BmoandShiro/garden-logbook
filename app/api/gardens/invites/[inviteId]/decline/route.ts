import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/gardens/invites/[inviteId]/decline
export async function POST(request: Request, { params }: { params: { inviteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const invite = await prisma.gardenInvite.findUnique({
    where: { id: params.inviteId },
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
  return NextResponse.json({ success: true });
} 