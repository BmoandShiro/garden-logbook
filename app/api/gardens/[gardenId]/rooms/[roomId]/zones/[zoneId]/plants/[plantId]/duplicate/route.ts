import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; plantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { gardenId, roomId, zoneId, plantId } = resolvedParams;

    // Check if user has access to the garden
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { userId: true, permissions: true }
        }
      }
    });

    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    const member = garden.members[0];
    if (!member || !member.permissions.includes('EDIT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the original plant
    const originalPlant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        garden: true,
        room: true,
        zone: true
      }
    });

    if (!originalPlant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    // Create a duplicate plant with all the same properties
    const duplicatedPlant = await prisma.plant.create({
      data: {
        name: `${originalPlant.name} (Copy)`,
        notes: originalPlant.notes,
        type: originalPlant.type,
        species: originalPlant.species,
        variety: originalPlant.variety,
        strainName: originalPlant.strainName,
        plantedDate: originalPlant.plantedDate,
        expectedHarvestDate: originalPlant.expectedHarvestDate,
        growingSeasonStart: originalPlant.growingSeasonStart,
        growingSeasonEnd: originalPlant.growingSeasonEnd,
        onlyTriggerAlertsDuringSeason: originalPlant.onlyTriggerAlertsDuringSeason,
        sensitivities: originalPlant.sensitivities,
        userId: session.user.id,
        gardenId: gardenId,
        roomId: roomId,
        zoneId: zoneId,
      },
    });

    return NextResponse.json(duplicatedPlant);
  } catch (error) {
    console.error('[PLANT_DUPLICATE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 