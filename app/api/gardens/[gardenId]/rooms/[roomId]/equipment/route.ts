import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  equipmentType: z.string(),
  description: z.string().optional(),
  installationDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  maintenanceTasks: z.array(z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    frequency: z.string(),
    nextDueDate: z.string()
  })).optional()
});

export async function POST(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: params.gardenId,
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    });

    if (!garden) {
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }

    // Check if room exists and belongs to the garden
    const room = await prisma.room.findFirst({
      where: {
        id: params.roomId,
        gardenId: params.gardenId
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 });
    }

    const json = await request.json();
    const body = createEquipmentSchema.parse(json);

    // Create equipment and its maintenance tasks
    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        description: body.description,
        room: {
          connect: {
            id: params.roomId
          }
        },
        createdBy: {
          connect: {
            id: session.user.id
          }
        },
        maintenanceTasks: body.maintenanceTasks ? {
          create: body.maintenanceTasks.map(task => ({
            title: task.title,
            description: task.description,
            frequency: task.frequency,
            nextDueDate: new Date(task.nextDueDate),
            completed: false,
            createdBy: {
              connect: {
                id: session.user.id
              }
            },
            room: {
              connect: {
                id: params.roomId
              }
            }
          }))
        } : undefined
      },
      include: {
        maintenanceTasks: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('[EQUIPMENT_POST]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 