import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  dimensions: z.string().optional(),
  equipment: z.array(
    z.object({
      name: z.string().min(1, 'Equipment name is required'),
      description: z.string().optional(),
    })
  ),
  cleaningSOPs: z.array(
    z.object({
      title: z.string().min(1, 'SOP title is required'),
      description: z.string().optional(),
      frequency: z.string(),
    })
  ),
  maintenanceTasks: z.array(
    z.object({
      title: z.string().min(1, 'Task title is required'),
      description: z.string().optional(),
      frequency: z.string(),
      nextDueDate: z.string().transform(str => new Date(str)),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: { gardenId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const garden = await prisma.garden.findUnique({
      where: {
        id: params.gardenId,
      },
      include: {
        createdBy: true,
        members: true,
      },
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    // Check if user has access to this garden
    const isCreator = garden.creatorId === session.user.id;
    const hasAccess = garden.members.some((member: { userId: string }) => member.userId === session.user.id);

    if (!isCreator && !hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const body = createRoomSchema.parse(json);

    const room = await prisma.room.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        dimensions: body.dimensions,
        garden: {
          connect: {
            id: params.gardenId,
          },
        },
        createdBy: {
          connect: {
            id: session.user.id
          }
        },
        equipment: {
          create: body.equipment.map((item) => ({
            name: item.name,
            description: item.description,
          })),
        },
        cleaningSOPs: {
          create: body.cleaningSOPs.map((sop) => ({
            title: sop.title,
            description: sop.description,
            frequency: sop.frequency,
          })),
        },
        maintenanceTasks: {
          create: body.maintenanceTasks.map((task) => ({
            title: task.title,
            description: task.description,
            frequency: task.frequency,
            nextDueDate: task.nextDueDate,
            completed: false,
          })),
        },
      },
      include: {
        equipment: true,
        cleaningSOPs: true,
        maintenanceTasks: true,
      },
    });

    return NextResponse.json(room);
  } catch (error: unknown) {
    console.error('[ROOMS_POST]', error);
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