import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  dimensions: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: {
        id: params.roomId,
      },
      include: {
        garden: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!room) {
      return new NextResponse('Room not found', { status: 404 });
    }

    // Check if user has access to this room's garden
    const isCreator = room.garden.creatorId === session.user.id;
    const isMember = room.garden.members.some((member: { userId: string }) => member.userId === session.user.id);

    if (!isCreator && !isMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const body = createZoneSchema.parse(json);

    const zone = await prisma.zone.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        dimensions: body.dimensions,
        room: {
          connect: {
            id: params.roomId,
          },
        },
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
      },
      include: {
        createdBy: true,
      },
    });

    return NextResponse.json(zone);
  } catch (error: unknown) {
    console.error('[ZONES_POST]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 