import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session data:', session?.user);

    if (!session?.user) {
      console.log('Unauthorized: No session found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the garden exists and if the user is the creator
    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      select: { creatorId: true }
    });

    console.log('Garden data:', garden);
    console.log('Comparing creatorId:', garden?.creatorId, 'with userId:', session.user.id);

    if (!garden) {
      console.log('Garden not found:', params.gardenId);
      return new NextResponse('Garden not found', { status: 404 });
    }

    if (garden.creatorId !== session.user.id) {
      console.log('Forbidden: User is not the creator');
      console.log('Garden creatorId:', garden.creatorId);
      console.log('Session user id:', session.user.id);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the garden - cascading deletes will handle related records
    await prisma.garden.delete({
      where: {
        id: params.gardenId
      }
    });

    console.log('Garden deleted successfully');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[GARDEN_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 