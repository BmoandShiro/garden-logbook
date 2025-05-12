import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/gardens/[gardenId]/members/[memberId]
export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; memberId: string }> }) {
  const params = await context.params;
  const { gardenId, memberId } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Check if the user is the garden creator
  const garden = await prisma.garden.findUnique({
    where: { id: gardenId },
    select: { creatorId: true },
  });
  if (!garden) {
    return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
  }
  if (garden.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Prevent removing the creator
  if (memberId === garden.creatorId) {
    return NextResponse.json({ error: 'Cannot remove the garden creator' }, { status: 400 });
  }
  // Remove the member
  await prisma.gardenMember.delete({
    where: {
      gardenId_userId: {
        gardenId: gardenId,
        userId: memberId,
      },
    },
  });
  return NextResponse.json({ success: true });
} 