import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createChangeLog, getEntityPath } from '@/lib/changeLogger';

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId, zoneId } = params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: {
        id: gardenId,
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
        id: zoneId,
        roomId: roomId
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

export async function PATCH(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: { createdBy: true, members: true },
    });
    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }
    const isCreator = garden.creatorId === session.user.id;
    const hasAccess = garden.members.some((member: { userId: string }) => member.userId === session.user.id);
    if (!isCreator && !hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const body = await request.json();
    const { name, description, type, dimensions } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    // Get the current zone to track changes
    const currentZone = await prisma.zone.findUnique({
      where: { id: params.zoneId },
    });

    if (!currentZone) {
      return NextResponse.json({ error: 'Zone not found.' }, { status: 404 });
    }

    // Track changes for logging
    const changes = [];
    if (currentZone.name !== name) changes.push({ field: 'name', oldValue: currentZone.name, newValue: name });
    if (currentZone.description !== (description ?? '')) changes.push({ field: 'description', oldValue: currentZone.description, newValue: description ?? '' });
    if (currentZone.type !== (type ?? '')) changes.push({ field: 'type', oldValue: currentZone.type, newValue: type ?? '' });
    if (currentZone.dimensions !== (dimensions ?? '')) changes.push({ field: 'dimensions', oldValue: currentZone.dimensions, newValue: dimensions ?? '' });

    const updated = await prisma.zone.update({
      where: { id: params.zoneId },
      data: {
        name,
        description: description ?? '',
        type: type ?? '',
        dimensions: dimensions ?? '',
      },
    });

    // Create change log if there were changes
    if (changes.length > 0) {
      try {
        const path = await getEntityPath('zone', params.zoneId);
        await createChangeLog({
          entityType: 'zone',
          entityId: params.zoneId,
          entityName: updated.name,
          changes,
          path,
          changedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            email: session.user.email || 'unknown@example.com',
          },
        });
      } catch (error) {
        console.error('Error creating change log:', error);
        // Don't fail the update if logging fails
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ZONE_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 