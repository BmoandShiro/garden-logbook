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

    // Fetch all gardens and their hierarchy
    const gardens = await prisma.garden.findMany({
      where: {
        creatorId: userId,
      },
      include: {
        rooms: {
          include: {
            zones: {
              include: {
                plants: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data into a flat list of locations with their full paths
    const locations = [];

    for (const garden of gardens) {
      // Add garden
      locations.push({
        id: garden.id,
        name: garden.name,
        type: 'garden',
        path: [garden.name],
      });

      for (const room of garden.rooms) {
        // Add room
        locations.push({
          id: room.id,
          name: room.name,
          type: 'room',
          path: [garden.name, room.name],
        });

        for (const zone of room.zones) {
          // Add zone
          locations.push({
            id: zone.id,
            name: zone.name,
            type: 'zone',
            path: [garden.name, room.name, zone.name],
          });

          for (const plant of zone.plants) {
            // Add plant
            locations.push({
              id: plant.id,
              name: plant.name,
              type: 'plant',
              path: [garden.name, room.name, zone.name, plant.name],
            });
          }
        }
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