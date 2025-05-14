import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId, zoneId } = params;
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

    const { name, strainName, species, variety, plantedDate, expectedHarvestDate, notes, type, growingSeasonStart, growingSeasonEnd, onlyTriggerAlertsDuringSeason, sensitivities } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: gardenId,
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
        gardenId: gardenId,
        userId: session.user.id
      });
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }

    // Check if zone exists and belongs to the garden
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        room: {
          gardenId: gardenId
        }
      }
    });

    if (!zone) {
      console.error('Zone not found:', {
        zoneId: zoneId,
        gardenId: gardenId
      });
      return NextResponse.json({ error: 'Zone not found or access denied' }, { status: 404 });
    }

    try {
      const plant = await prisma.plant.create({
        data: {
          name,
          strainName: strainName || null,
          species,
          variety: variety || null,
          notes: notes || null,
          zoneId: zoneId,
          userId: session.user.id,
          strainId: null,
          type: type || 'ZONE_PLANT',
          startDate: plantedDate ? new Date(plantedDate) : undefined,
          harvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
          growingSeasonStart: growingSeasonStart || null,
          growingSeasonEnd: growingSeasonEnd || null,
          onlyTriggerAlertsDuringSeason: typeof onlyTriggerAlertsDuringSeason === 'boolean' ? onlyTriggerAlertsDuringSeason : false,
          sensitivities: sensitivities || null,
        },
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

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; plantId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId, zoneId, plantId } = params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: gardenId,
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
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        zoneId: zoneId,
        zone: {
          room: {
            gardenId: gardenId
          }
        }
      }
    });

    if (!plant) {
      return new NextResponse('Plant not found or access denied', { status: 404 });
    }

    await prisma.plant.delete({
      where: { id: plantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PLANTS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// GET /api/gardens/[gardenId]/rooms/[roomId]/zones/[zoneId]/plants - List plants for a zone
export async function GET(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId, zoneId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
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

    const plants = await prisma.plant.findMany({
      where: { zoneId: zoneId },
      select: { id: true, name: true },
    });
    return NextResponse.json(plants ?? []);
  } catch (error) {
    console.error('[PLANTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; plantId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId, zoneId, plantId } = params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: gardenId,
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
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }

    // Check if plant exists and belongs to the zone
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        zoneId: zoneId,
        zone: {
          room: {
            gardenId: gardenId
          }
        }
      }
    });

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: { name, description },
    });
    return NextResponse.json(updatedPlant);
  } catch (error) {
    console.error('[PLANTS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 