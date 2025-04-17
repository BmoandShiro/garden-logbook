import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const zone = await prisma.zone.findUnique({
      where: {
        id: params.zoneId,
      },
      include: {
        room: {
          include: {
            garden: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!zone) {
      return new NextResponse('Zone not found', { status: 404 });
    }

    // Check if user has access to this zone's garden
    const isCreator = zone.room.garden.creatorId === session.user.id;
    const isMember = zone.room.garden.members.some((member: { userId: string }) => member.userId === session.user.id);

    if (!isCreator && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.zone.delete({
      where: {
        id: params.zoneId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error('[ZONES_DELETE]', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 