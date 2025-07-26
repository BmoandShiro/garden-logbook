import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createChangeLog, getEntityPath } from '@/lib/changeLogger';

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const params = await context.params;
  const { gardenId } = params;
  try {
    const session = await getServerSession(authOptions);
    console.log('Session data:', session?.user);

    if (!session?.user) {
      console.log('Unauthorized: No session found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the garden exists and if the user is the creator
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true }
    });

    console.log('Garden data:', garden);
    console.log('Comparing creatorId:', garden?.creatorId, 'with userId:', session.user.id);

    if (!garden) {
      console.log('Garden not found:', gardenId);
      return new NextResponse('Garden not found', { status: 404 });
    }

    if (garden.creatorId !== session.user.id) {
      console.log('Forbidden: User is not the creator');
      console.log('Garden creatorId:', garden.creatorId);
      console.log('Session user id:', session.user.id);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the garden - cascading deletes will handle related records
    await prisma.garden.delete({
      where: { id: gardenId },
    });

    console.log('Garden deleted successfully');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[GARDEN_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const params = await context.params;
  const { gardenId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true }
    });
    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }
    if (garden.creatorId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    const body = await request.json();
    const { name, description, imageUrl, isPrivate, zipcode } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    // Get the current garden to track changes
    const currentGarden = await prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!currentGarden) {
      return NextResponse.json({ error: 'Garden not found.' }, { status: 404 });
    }

    // Track changes for logging
    const changes = [];
    if (currentGarden.name !== name) changes.push({ field: 'name', oldValue: currentGarden.name, newValue: name });
    if (currentGarden.description !== (description ?? '')) changes.push({ field: 'description', oldValue: currentGarden.description, newValue: description ?? '' });
    if (currentGarden.imageUrl !== (imageUrl ?? '')) changes.push({ field: 'imageUrl', oldValue: currentGarden.imageUrl, newValue: imageUrl ?? '' });
    if (currentGarden.isPrivate !== (typeof isPrivate === 'boolean' ? isPrivate : true)) changes.push({ field: 'isPrivate', oldValue: currentGarden.isPrivate, newValue: typeof isPrivate === 'boolean' ? isPrivate : true });
    if (currentGarden.zipcode !== (zipcode ?? '')) changes.push({ field: 'zipcode', oldValue: currentGarden.zipcode, newValue: zipcode ?? '' });

    const updatedGarden = await prisma.garden.update({
      where: { id: gardenId },
      data: {
        name,
        description: description ?? '',
        imageUrl: imageUrl ?? '',
        isPrivate: typeof isPrivate === 'boolean' ? isPrivate : true,
        zipcode: zipcode ?? '',
      },
    });

    // Create change log if there were changes
    if (changes.length > 0) {
      try {
        const path = await getEntityPath('garden', gardenId);
        await createChangeLog({
          entityType: 'garden',
          entityId: gardenId,
          entityName: updatedGarden.name,
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

    return NextResponse.json(updatedGarden);
  } catch (error) {
    console.error('[GARDEN_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE_member(request: Request, context: { params: Promise<{ gardenId: string; memberId: string }> }) {
  const params = await context.params;
  const { gardenId, memberId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true },
    });
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }
    if (garden.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (memberId === garden.creatorId) {
      return NextResponse.json({ error: 'Cannot remove the garden creator' }, { status: 400 });
    }
    // Remove the member from the garden
    await prisma.garden.update({
      where: { id: gardenId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });
    await prisma.gardenMember.delete({
      where: {
        gardenId_userId: {
          gardenId: gardenId,
          userId: memberId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GARDEN_REMOVE_MEMBER]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET(request: Request, context: { params: { gardenId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { gardenId } = context.params;
  // Find all plants in the garden
  const plants = await prisma.plant.findMany({
    where: { gardenId },
    select: { id: true, name: true }
  });
  const plantIds = plants.map((p: { id: string; name: string }) => p.id);
  if (plantIds.length === 0) {
    return NextResponse.json({ alerts: [] });
  }
  // Find all WEATHER_ALERT notifications for these plants in the last 12 hours
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const alerts = await prisma.notification.findMany({
    where: {
      type: 'WEATHER_ALERT',
      meta: { path: ['plantId'], in: plantIds },
      createdAt: { gte: twelveHoursAgo }
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ alerts });
} 