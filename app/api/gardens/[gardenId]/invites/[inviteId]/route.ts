import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/gardens/[gardenId]/invites/[inviteId]
export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; inviteId: string }> }) {
  const params = await context.params;
  const { gardenId, inviteId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check if the user is the garden creator
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true }
    });
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }
    if (garden.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Delete the invite
    await prisma.gardenInvite.delete({
      where: { id: inviteId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GARDEN_INVITE_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 