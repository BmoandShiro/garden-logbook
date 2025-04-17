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

    const garden = await prisma.garden.findUnique({
      where: {
        id: params.gardenId,
      },
      include: {
        createdBy: true,
        members: true,
      },
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    // Check if user has access to this garden
    const isCreator = garden.creatorId === session.user.id;
    const hasAccess = garden.members.some((member: { userId: string }) => member.userId === session.user.id);

    if (!isCreator && !hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete the zone
    await prisma.zone.delete({
      where: {
        id: params.zoneId,
        roomId: params.roomId
      }
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