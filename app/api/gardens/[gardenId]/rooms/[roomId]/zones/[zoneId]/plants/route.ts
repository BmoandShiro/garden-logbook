import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received plant creation request:', {
      body,
      params,
      userId: session.user.id
    });

    const { name, species, variety, plantedDate, expectedHarvestDate, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
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
      console.error('Garden access denied:', {
        gardenId: params.gardenId,
        userId: session.user.id
      });
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }

    // Check if zone exists and belongs to the garden
    const zone = await prisma.zone.findFirst({
      where: {
        id: params.zoneId,
        room: {
          gardenId: params.gardenId
        }
      }
    });

    if (!zone) {
      console.error('Zone not found:', {
        zoneId: params.zoneId,
        gardenId: params.gardenId
      });
      return NextResponse.json({ error: 'Zone not found or access denied' }, { status: 404 });
    }

    try {
      const plant = await prisma.zonePlant.create({
        data: {
          name,
          notes: notes || null,
          strain: species || null,
          type: variety || null,
          zone: {
            connect: {
              id: params.zoneId
            }
          },
          createdBy: {
            connect: {
              id: session.user.id
            }
          }
        },
        include: {
          zone: true,
          createdBy: true
        }
      });

      console.log('Successfully created plant:', plant);
      return NextResponse.json(plant);
    } catch (error) {
      console.error('[PLANTS_POST] Error creating plant:', error);
      return NextResponse.json({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[PLANTS_POST] Error creating plant:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; plantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
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
      return new NextResponse('Garden not found or access denied', { status: 404 });
    }

    // Check if plant exists and belongs to the zone
    const plant = await prisma.zonePlant.findFirst({
      where: {
        id: params.plantId,
        zoneId: params.zoneId,
        zone: {
          room: {
            gardenId: params.gardenId
          }
        }
      }
    });

    if (!plant) {
      return new NextResponse('Plant not found or access denied', { status: 404 });
    }

    await prisma.zonePlant.delete({
      where: {
        id: params.plantId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PLANTS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// GET /api/gardens/[gardenId]/rooms/[roomId]/zones/[zoneId]/plants - List plants for a zone
export async function GET(
  request: Request,
  { params }: { params: { gardenId: string, roomId: string, zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: { members: true },
    });
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }
    const isCreator = garden.creatorId === session.user.id;
    const hasAccess = garden.members.some((member: { userId: string }) => member.userId === session.user.id);
    if (!isCreator && !hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plants = await prisma.zonePlant.findMany({
      where: { zoneId: params.zoneId },
      select: { id: true, name: true },
    });
    return NextResponse.json(plants ?? []);
  } catch (error) {
    console.error('[PLANTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 