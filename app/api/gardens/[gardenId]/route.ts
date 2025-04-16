import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the garden exists and if the user is the creator
    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      select: { creatorId: true }
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    if (garden.creatorId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the garden - cascading deletes will handle related records
    await prisma.garden.delete({
      where: {
        id: params.gardenId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[GARDEN_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 