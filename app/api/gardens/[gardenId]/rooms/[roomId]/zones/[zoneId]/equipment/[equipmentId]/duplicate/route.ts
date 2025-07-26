import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; equipmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gardenId, roomId, zoneId, equipmentId } = params;

    // Verify the equipment exists and user has access
    const originalEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        maintenanceTasks: true,
        zone: {
          include: {
            room: {
              include: {
                garden: {
                  include: {
                    members: true,
                    createdBy: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!originalEquipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Check if user has access to the garden
    const garden = originalEquipment.zone.room.garden;
    const hasAccess = garden.createdBy.id === session.user.id || 
                     garden.members.some((member: any) => member.user.id === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the duplicated equipment
    const duplicatedEquipment = await prisma.equipment.create({
      data: {
        name: `${originalEquipment.name} (Copy)`,
        equipmentType: originalEquipment.equipmentType,
        description: originalEquipment.description,
        zoneId: zoneId,
        roomId: roomId,
        gardenId: gardenId,
        creatorId: session.user.id,
        maintenanceTasks: {
          create: originalEquipment.maintenanceTasks.map((task: any) => ({
            title: task.title,
            description: task.description,
            frequency: task.frequency,
            nextDueDate: task.nextDueDate,
            lastCompletedDate: task.lastCompletedDate,
            completed: false, // Reset completion status for duplicated tasks
            gardenId: gardenId,
            creatorId: session.user.id,
          })),
        },
      },
      include: {
        maintenanceTasks: true,
        createdBy: true,
      },
    });

    return NextResponse.json(duplicatedEquipment);
  } catch (error) {
    console.error('Error duplicating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate equipment' },
      { status: 500 }
    );
  }
} 