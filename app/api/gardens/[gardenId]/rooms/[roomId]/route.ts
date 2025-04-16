import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: {
        id: params.gardenId,
      },
      include: {
        members: true,
      },
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    // Check if user has access to this garden
    const isCreator = garden.createdBy.id === session.user.id;
    const isMember = garden.members.some((member) => member.userId === session.user.id);

    if (!isCreator && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete the room and all its related data (this will cascade delete equipment, SOPs, and tasks)
    await prisma.room.delete({
      where: {
        id: params.roomId,
        gardenId: params.gardenId, // Ensure the room belongs to the garden
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ROOM_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 