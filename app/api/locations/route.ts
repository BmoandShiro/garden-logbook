import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user is requesting their own data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all gardens for the user (both owned and member of)
    const gardens = await prisma.garden.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        rooms: {
          include: {
            zones: {
              include: {
                plants: true
              }
            },
            plants: true
          }
        },
        plants: true
      }
    });

    // Format the response to include path information
    const locations = [];

    for (const garden of gardens) {
      // Add garden
      locations.push({
        id: garden.id,
        name: garden.name,
        type: 'garden',
        path: [garden.name],
        plants: garden.plants
      });

      // Add rooms
      for (const room of garden.rooms) {
        locations.push({
          id: room.id,
          name: room.name,
          type: 'room',
          path: [garden.name, room.name],
          plants: room.plants
        });

        // Add zones
        for (const zone of room.zones) {
          locations.push({
            id: zone.id,
            name: zone.name,
            type: 'zone',
            path: [garden.name, room.name, zone.name],
            plants: zone.plants
          });

          // Add plants in zones
          for (const plant of zone.plants) {
            locations.push({
              id: plant.id,
              name: plant.name,
              type: 'plant',
              path: [garden.name, room.name, zone.name, plant.name],
              plants: []
            });
          }
        }

        // Add plants in rooms
        for (const plant of room.plants) {
          locations.push({
            id: plant.id,
            name: plant.name,
            type: 'plant',
            path: [garden.name, room.name, plant.name],
            plants: []
          });
        }
      }

      // Add plants in gardens
      for (const plant of garden.plants) {
        locations.push({
          id: plant.id,
          name: plant.name,
          type: 'plant',
          path: [garden.name, plant.name],
          plants: []
        });
      }
    }

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
} 