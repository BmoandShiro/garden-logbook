import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { gardenId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: { id: params.gardenId },
      include: {
        members: true,
      },
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    // Check if user has access to the garden
    const hasAccess = garden.createdById === session.user.id || 
                     garden.members.some(member => member.id === session.user.id);
    
    if (!hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      dimensions,
      blueprintUrl,
      equipment,
      cleaningSOPs,
      maintenanceTasks,
    } = body;

    // Create room with all related data in a transaction
    const room = await prisma.$transaction(async (tx) => {
      // Create the room
      const room = await tx.room.create({
        data: {
          name,
          description,
          type,
          dimensions,
          blueprintUrl,
          gardenId: params.gardenId,
        },
      });

      // Create equipment
      if (equipment?.length > 0) {
        await tx.equipment.createMany({
          data: equipment.map((item: any) => ({
            ...item,
            roomId: room.id,
          })),
        });
      }

      // Create cleaning SOPs
      if (cleaningSOPs?.length > 0) {
        await tx.cleaningSOP.createMany({
          data: cleaningSOPs.map((sop: any) => ({
            ...sop,
            roomId: room.id,
          })),
        });
      }

      // Create maintenance tasks
      if (maintenanceTasks?.length > 0) {
        await tx.maintenanceTask.createMany({
          data: maintenanceTasks.map((task: any) => ({
            ...task,
            nextDueDate: new Date(task.nextDueDate),
            roomId: room.id,
          })),
        });
      }

      return room;
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('[ROOMS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 