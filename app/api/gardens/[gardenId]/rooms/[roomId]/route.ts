import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// TODO: Update with correct path
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    // TODO: Uncomment when authOptions path is fixed
    // const session = await getServerSession(authOptions);
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the garden exists and the user has access to it
    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: {
        createdBy: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    // Check if user is the garden creator or a member
    const isCreator = garden.createdBy.id === session.user.id;
    const isMember = garden.members.some((member: { userId: string }) => member.userId === session.user.id);

    if (!isCreator && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the room exists and belongs to the garden
    const room = await prisma.room.findUnique({
      where: {
        id: params.roomId,
        gardenId: params.gardenId,
      },
    });

    if (!room) {
      return new NextResponse('Room not found', { status: 404 });
    }

    // Delete the room and all related records
    await prisma.room.delete({
      where: {
        id: params.roomId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting room:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 