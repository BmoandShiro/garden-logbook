import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type GardenWithMembers = Prisma.GardenGetPayload<{
  include: {
    members: {
      select: {
        userId: true;
        permissions: true;
      };
    };
  };
}>;

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { 
            userId: true,
            permissions: true
          }
        }
      }
    }) as GardenWithMembers | null;

    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    const member = garden.members[0];
    if (!member || !member.permissions.includes('DELETE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const room = await prisma.room.findUnique({
      where: { id: params.roomId }
    });

    if (!room || room.gardenId !== params.gardenId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await prisma.room.delete({
      where: { id: params.roomId }
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
} 