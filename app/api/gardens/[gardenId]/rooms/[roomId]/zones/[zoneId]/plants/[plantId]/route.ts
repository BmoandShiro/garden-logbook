import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; plantId: string }> }) {
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

    await prisma.plant.delete({
      where: { id: plantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PLANTS_DELETE] Error deleting plant:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; plantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }
    // Check if plant exists and belongs to the zone
    const plant = await prisma.plant.findFirst({
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
      return NextResponse.json({ error: 'Plant not found or access denied' }, { status: 404 });
    }
    const body = await request.json();
    const { name, notes, type, growingSeasonStart, growingSeasonEnd, onlyTriggerAlertsDuringSeason, sensitivities, species, variety, strainName, plantedDate, expectedHarvestDate } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    const updated = await prisma.plant.update({
      where: { id: params.plantId },
      data: {
        name,
        notes: notes ?? '',
        type: type ?? '',
        growingSeasonStart: growingSeasonStart || null,
        growingSeasonEnd: growingSeasonEnd || null,
        onlyTriggerAlertsDuringSeason: typeof onlyTriggerAlertsDuringSeason === 'boolean' ? onlyTriggerAlertsDuringSeason : false,
        sensitivities: sensitivities || null,
        species: species || undefined,
        variety: variety || undefined,
        strainName: strainName || undefined,
        startDate: plantedDate ? new Date(plantedDate) : undefined,
        harvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PLANT_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 