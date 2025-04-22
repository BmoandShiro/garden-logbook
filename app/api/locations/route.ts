import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Plant } from '@prisma/client';

interface PlantInfo {
  id: string;
  name: string;
}

interface LocationNode {
  id: string;
  name: string;
  type: 'garden' | 'room' | 'zone' | 'plant';
  path: string[];
  plants: PlantInfo[];
  children: LocationNode[];
}

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

    // Format the response as a hierarchical structure
    const locations: LocationNode[] = [];

    for (const garden of gardens) {
      const gardenNode: LocationNode = {
        id: garden.id,
        name: garden.name,
        type: 'garden',
        path: [garden.name],
        plants: garden.plants.map((p: Plant): PlantInfo => ({ id: p.id, name: p.name })),
        children: []
      };

      // Add rooms as children of garden
      for (const room of garden.rooms) {
        const roomNode: LocationNode = {
          id: room.id,
          name: room.name,
          type: 'room',
          path: [garden.name, room.name],
          plants: room.plants.map((p: Plant): PlantInfo => ({ id: p.id, name: p.name })),
          children: []
        };

        // Add zones as children of room
        for (const zone of room.zones) {
          const zoneNode: LocationNode = {
            id: zone.id,
            name: zone.name,
            type: 'zone',
            path: [garden.name, room.name, zone.name],
            plants: zone.plants.map((p: Plant): PlantInfo => ({ id: p.id, name: p.name })),
            children: zone.plants.map((plant: Plant): LocationNode => ({
              id: plant.id,
              name: plant.name,
              type: 'plant',
              path: [garden.name, room.name, zone.name, plant.name],
              plants: [],
              children: []
            }))
          };
          roomNode.children.push(zoneNode);
        }

        // Add room's direct plants as children
        const roomPlantNodes = room.plants.map((plant: Plant): LocationNode => ({
          id: plant.id,
          name: plant.name,
          type: 'plant',
          path: [garden.name, room.name, plant.name],
          plants: [],
          children: []
        }));
        roomNode.children.push(...roomPlantNodes);

        gardenNode.children.push(roomNode);
      }

      // Add garden's direct plants as children
      const gardenPlantNodes = garden.plants.map((plant: Plant): LocationNode => ({
        id: plant.id,
        name: plant.name,
        type: 'plant',
        path: [garden.name, plant.name],
        plants: [],
        children: []
      }));
      gardenNode.children.push(...gardenPlantNodes);

      locations.push(gardenNode);
    }

    // Flatten the hierarchical structure for the frontend while preserving context
    const flattenedLocations = locations.flatMap(garden => [
      // Garden level
      {
        id: garden.id,
        name: garden.name,
        type: 'garden',
        path: garden.path,
        plants: garden.plants
      },
      // Room level
      ...garden.children.flatMap(room => [
        {
          id: room.id,
          name: room.name,
          type: 'room',
          path: room.path,
          plants: room.plants
        },
        // Zone level
        ...room.children.flatMap(zone => [
          {
            id: zone.id,
            name: zone.name,
            type: 'zone',
            path: zone.path,
            plants: zone.plants
          },
          // Plant level
          ...zone.children.map(plant => ({
            id: plant.id,
            name: plant.name,
            type: 'plant',
            path: plant.path,
            plants: []
          }))
        ])
      ])
    ]);

    return NextResponse.json(flattenedLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
} 