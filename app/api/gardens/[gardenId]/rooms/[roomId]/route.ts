import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createChangeLog, getEntityPath } from '@/lib/changeLogger';

type GardenWithMembers = Prisma.GardenGetPayload<{
  include: {
    members: {
      select: {
        userId: true;
        permissions: true;
      };
    };
  };
}>;

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string; roomId: string }> }) {
  const params = await context.params;
  const { gardenId, roomId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { 
            userId: true,
            permissions: true
          }
        }
      }
    }) as GardenWithMembers | null;

    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }

    const member = garden.members[0];
    if (!member || !member.permissions.includes('DELETE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room || room.gardenId !== gardenId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await prisma.room.delete({
      where: { id: roomId }
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { userId: true, permissions: true }
        }
      }
    }) as GardenWithMembers | null;
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }
    const member = garden.members[0];
    if (!member || !member.permissions.includes('EDIT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const room = await prisma.room.findUnique({ where: { id: params.roomId } });
    if (!room || room.gardenId !== params.gardenId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    const body = await request.json();
    const { name, description, type, dimensions } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    // Track changes for logging
    const changes = [];
    if (room.name !== name) changes.push({ field: 'name', oldValue: room.name, newValue: name });
    if (room.description !== (description ?? '')) changes.push({ field: 'description', oldValue: room.description, newValue: description ?? '' });
    if (room.type !== (type ?? '')) changes.push({ field: 'type', oldValue: room.type, newValue: type ?? '' });
    if (room.dimensions !== (dimensions ?? '')) changes.push({ field: 'dimensions', oldValue: room.dimensions, newValue: dimensions ?? '' });

    const updated = await prisma.room.update({
      where: { id: params.roomId },
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
        const path = await getEntityPath('room', params.roomId);
        await createChangeLog({
          entityType: 'room',
          entityId: params.roomId,
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
    console.error('[ROOM_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 