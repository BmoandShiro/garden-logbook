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

// GET /api/gardens/[gardenId]/rooms/[roomId]/zones - List zones
export async function GET(
  req: Request,
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

    // Get zones for the room
    const zones = await prisma.zone.findMany({
      where: {
        roomId: params.roomId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('[ZONES_GET]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/gardens/[gardenId]/rooms/[roomId]/zones - Create a new zone
export async function POST(
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
            id: session.user.id
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
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

// DELETE /api/gardens/[gardenId]/rooms/[roomId]/zones/[zoneId] - Delete a zone
export async function DELETE(
  req: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: params.gardenId,
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    });

    if (!garden) {
      return NextResponse.json({ error: "Garden not found" }, { status: 404 });
    }

    // Delete the zone
    await prisma.zone.delete({
      where: {
        id: params.zoneId,
        roomId: params.roomId
      }
    });

    return NextResponse.json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting zone:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 