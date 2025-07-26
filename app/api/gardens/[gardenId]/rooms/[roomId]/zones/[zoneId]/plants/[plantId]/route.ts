import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createChangeLog, getEntityPath } from '@/lib/changeLogger';

export async function DELETE(
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

    // Get the plant before deleting it for change logging
    const plant = await prisma.plant.findUnique({
      where: { id: params.plantId },
      include: {
        garden: { select: { name: true } },
        room: { select: { name: true } },
        zone: { select: { name: true } },
      }
    });

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    // Create change log for deletion
    try {
      const path = await getEntityPath('plant', params.plantId);
      await createChangeLog({
        entityType: 'plant',
        entityId: params.plantId,
        entityName: plant.name,
        changes: [{ field: 'status', oldValue: 'active', newValue: 'deleted' }],
        path,
        changedBy: {
          id: session.user.id,
          name: session.user.name || 'Unknown User',
          email: session.user.email || 'unknown@example.com',
        },
      });
    } catch (error) {
      console.error('Error creating deletion change log:', error);
      // Don't fail the deletion if logging fails
    }

    // Delete the plant
    await prisma.plant.delete({
      where: {
        id: params.plantId,
        zoneId: params.zoneId,
        roomId: params.roomId,
        gardenId: params.gardenId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PLANT_DELETE]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; plantId: string }> }) {
  const params = await context.params;
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

    // Track changes for logging
    const changes = [];
    if (plant.name !== name) changes.push({ field: 'name', oldValue: plant.name, newValue: name });
    if (plant.notes !== (notes ?? '')) changes.push({ field: 'notes', oldValue: plant.notes, newValue: notes ?? '' });
    if (plant.species !== species) changes.push({ field: 'species', oldValue: plant.species, newValue: species });
    if (plant.variety !== variety) changes.push({ field: 'variety', oldValue: plant.variety, newValue: variety });
    if (plant.strainName !== strainName) changes.push({ field: 'strainName', oldValue: plant.strainName, newValue: strainName });
    if (plant.growingSeasonStart !== growingSeasonStart) changes.push({ field: 'growingSeasonStart', oldValue: plant.growingSeasonStart, newValue: growingSeasonStart });
    if (plant.growingSeasonEnd !== growingSeasonEnd) changes.push({ field: 'growingSeasonEnd', oldValue: plant.growingSeasonEnd, newValue: growingSeasonEnd });
    if (plant.onlyTriggerAlertsDuringSeason !== (typeof onlyTriggerAlertsDuringSeason === 'boolean' ? onlyTriggerAlertsDuringSeason : false)) {
      changes.push({ field: 'onlyTriggerAlertsDuringSeason', oldValue: plant.onlyTriggerAlertsDuringSeason, newValue: onlyTriggerAlertsDuringSeason });
    }
    if (JSON.stringify(plant.sensitivities) !== JSON.stringify(sensitivities)) {
      changes.push({ field: 'sensitivities', oldValue: plant.sensitivities, newValue: sensitivities });
    }

    console.log('Changes detected:', changes.length, changes);

    const updateData: any = {
      name,
      notes: notes ?? '',
      growingSeasonStart: growingSeasonStart || null,
      growingSeasonEnd: growingSeasonEnd || null,
      onlyTriggerAlertsDuringSeason: typeof onlyTriggerAlertsDuringSeason === 'boolean' ? onlyTriggerAlertsDuringSeason : false,
      sensitivities: sensitivities || null,
      species: species || undefined,
      variety: variety || undefined,
      strainName: strainName || undefined,
      startDate: plantedDate ? new Date(plantedDate) : undefined,
      harvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
      gardenId: params.gardenId,
      roomId: params.roomId,
    };
    if (type === 'REGULAR' || type === 'ZONE_PLANT') {
      updateData.type = type;
    }
    const updated = await prisma.plant.update({
      where: { id: params.plantId },
      data: updateData,
    });

    // Create change log if there were changes
    if (changes.length > 0) {
      try {
        console.log('Creating change log for plant:', params.plantId);
        const path = await getEntityPath('plant', params.plantId);
        console.log('Entity path:', path);
        await createChangeLog({
          entityType: 'plant',
          entityId: params.plantId,
          entityName: updated.name,
          changes,
          path,
          changedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            email: session.user.email || 'unknown@example.com',
          },
        });
        console.log('Change log created successfully');
      } catch (error) {
        console.error('Error creating change log:', error);
        // Don't fail the update if logging fails
      }
    } else {
      console.log('No changes detected, skipping change log');
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PLANT_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 