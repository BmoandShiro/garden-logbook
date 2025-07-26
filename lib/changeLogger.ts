import { prisma } from '@/lib/prisma';

export interface ChangeLogData {
  entityType: 'plant' | 'zone' | 'room' | 'equipment' | 'garden';
  entityId: string;
  entityName: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  path: string; // e.g., "Garden → Room → Zone → Plant"
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export async function createChangeLog(data: ChangeLogData) {
  try {
    // Format the changes for display
    const changeDetails = data.changes.map(change => {
      const fieldName = change.field.charAt(0).toUpperCase() + change.field.slice(1);
      return `${fieldName}: ${change.oldValue || 'empty'} → ${change.newValue || 'empty'}`;
    }).join(' • ');

    // Get the garden ID from the entity
    let gardenId: string | null = null;
    let roomId: string | null = null;
    let zoneId: string | null = null;
    try {
      switch (data.entityType) {
        case 'plant':
          const plant = await prisma.plant.findUnique({
            where: { id: data.entityId },
            select: { gardenId: true, roomId: true, zoneId: true }
          });
          gardenId = plant?.gardenId || null;
          roomId = plant?.roomId || null;
          zoneId = plant?.zoneId || null;
          break;
        case 'zone':
          const zone = await prisma.zone.findUnique({
            where: { id: data.entityId },
            include: { room: { select: { gardenId: true } } }
          });
          gardenId = zone?.room?.gardenId || null;
          roomId = zone?.roomId || null;
          zoneId = zone?.id || null;
          break;
        case 'room':
          const room = await prisma.room.findUnique({
            where: { id: data.entityId },
            select: { gardenId: true, id: true }
          });
          gardenId = room?.gardenId || null;
          roomId = room?.id || null; // Explicitly set roomId to ensure it's correct
          break;
        case 'equipment':
          const equipment = await prisma.equipment.findUnique({
            where: { id: data.entityId },
            include: { zone: { include: { room: { select: { gardenId: true } } } } }
          });
          gardenId = equipment?.zone?.room?.gardenId || null;
          roomId = equipment?.zone?.roomId || null;
          zoneId = equipment?.zoneId || null;
          break;
        case 'garden':
          const garden = await prisma.garden.findUnique({
            where: { id: data.entityId },
            select: { id: true }
          });
          gardenId = garden?.id || null;
          break;
      }
    } catch (error) {
      console.error('Error getting garden ID:', error);
    }

    // Create the log entry
    const log = await prisma.log.create({
      data: {
        type: 'CHANGE_LOG',
        stage: 'VEGETATIVE', // Default stage for change logs
        notes: `Changes made by ${data.changedBy.name}`,
        userId: data.changedBy.id,
        gardenId: gardenId,
        roomId: roomId,
        zoneId: zoneId,
        logDate: new Date(),
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          changes: data.changes,
          path: data.path,
          changedBy: data.changedBy,
          changeDetails: changeDetails,
        },
      },
    });

    return log;
  } catch (error) {
    console.error('Error creating change log:', error);
    throw error;
  }
}

// Helper function to get the path for an entity
export async function getEntityPath(entityType: string, entityId: string): Promise<string> {
  try {
    switch (entityType) {
      case 'plant':
        const plant = await prisma.plant.findUnique({
          where: { id: entityId },
          include: {
            zone: {
              include: {
                room: {
                  include: {
                    garden: true,
                  },
                },
              },
            },
          },
        });
        if (plant) {
          return `${plant.zone.room.garden.name} → ${plant.zone.room.name} → ${plant.zone.name} → ${plant.name}`;
        }
        break;

      case 'zone':
        const zone = await prisma.zone.findUnique({
          where: { id: entityId },
          include: {
            room: {
              include: {
                garden: true,
              },
            },
          },
        });
        if (zone) {
          return `${zone.room.garden.name} → ${zone.room.name} → ${zone.name}`;
        }
        break;

      case 'room':
        const room = await prisma.room.findUnique({
          where: { id: entityId },
          include: {
            garden: true,
          },
        });
        if (room) {
          return `${room.garden.name} → ${room.name}`;
        }
        break;

      case 'equipment':
        const equipment = await prisma.equipment.findUnique({
          where: { id: entityId },
          include: {
            zone: {
              include: {
                room: {
                  include: {
                    garden: true,
                  },
                },
              },
            },
          },
        });
        if (equipment) {
          return `${equipment.zone.room.garden.name} → ${equipment.zone.room.name} → ${equipment.zone.name} → ${equipment.name}`;
        }
        break;

      case 'garden':
        const garden = await prisma.garden.findUnique({
          where: { id: entityId },
        });
        if (garden) {
          return `${garden.name}`;
        }
        break;
    }
    return 'Unknown path';
  } catch (error) {
    console.error('Error getting entity path:', error);
    return 'Unknown path';
  }
} 