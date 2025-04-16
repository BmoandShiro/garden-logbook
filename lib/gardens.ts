import { prisma } from '@/lib/prisma';
import type { Garden, Room, MaintenanceTask, Equipment, CleaningSOP, User } from '@prisma/client';

export type ExtendedGarden = Garden & {
  rooms: (Room & {
    maintenanceTasks: MaintenanceTask[];
    equipment: Equipment[];
    cleaningSOPs: CleaningSOP[];
  })[];
  _count: {
    rooms: number;
    plants: number;
    members: number;
  };
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

export async function getGardenById(id: string): Promise<ExtendedGarden | null> {
  try {
    const garden = await prisma.garden.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            maintenanceTasks: true,
            equipment: true,
            cleaningSOPs: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            plants: true,
            members: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return garden;
  } catch (error) {
    console.error('Error fetching garden:', error);
    return null;
  }
} 