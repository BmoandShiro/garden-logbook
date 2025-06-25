import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  equipmentType: z.string(),
  description: z.string().optional(),
  installationDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  maintenanceTasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    actionType: z.string(),
    frequency: z.string(),
    nextDueDate: z.string(),
    notes: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params as required by Next.js
    const params = await context.params;

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

    // Get equipment
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: params.equipmentId,
        zoneId: params.zoneId,
        roomId: params.roomId,
        gardenId: params.gardenId
      },
      include: {
        maintenanceTasks: {
          orderBy: {
            nextDueDate: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        zone: { select: { name: true } },
        room: { select: { name: true } },
        garden: { select: { name: true } },
      }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('[EQUIPMENT_GET]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; equipmentId: string } }
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

    const json = await request.json();
    const body = updateEquipmentSchema.parse(json);

    // Fetch the original equipment with tasks
    const original = await prisma.equipment.findUnique({
      where: { id: params.equipmentId },
      include: { maintenanceTasks: true }
    });
    if (!original) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Prepare maintenanceTasks nested update
    const submittedTasks = Array.isArray(body.maintenanceTasks) ? body.maintenanceTasks : [];
    const originalTasks = original.maintenanceTasks;

    // Find tasks to update, create, and delete
    const updateTasks = submittedTasks.filter((t: any) => t.id).map((task: any) => ({
      where: { id: task.id },
      data: {
        title: task.title,
        frequency: task.frequency,
        nextDueDate: new Date(task.nextDueDate),
        notes: task.notes,
        description: task.description,
      }
    }));
    const createTasks = submittedTasks.filter((t: any) => !t.id).map((task: any) => ({
      title: task.title,
      frequency: task.frequency,
      nextDueDate: new Date(task.nextDueDate),
      notes: task.notes,
      description: task.description,
      completed: false,
      roomId: original.roomId,
      gardenId: original.gardenId,
      creatorId: original.creatorId
    }));
    const submittedIds = submittedTasks.filter((t: any) => t.id).map((t: any) => t.id);
    const deleteIds = originalTasks.filter((t: any) => !submittedIds.includes(t.id)).map((t: any) => t.id as string);

    // Build the maintenanceTasks update object only if needed
    const maintenanceTasksUpdate: any = {};
    if (updateTasks.length > 0) maintenanceTasksUpdate.update = updateTasks;
    if (createTasks.length > 0) maintenanceTasksUpdate.create = createTasks;
    if (deleteIds.length > 0) maintenanceTasksUpdate.deleteMany = deleteIds.map((id: string) => ({ id }));

    // Build the data object
    const data: any = {
      name: body.name,
      equipmentType: body.equipmentType,
      description: body.description,
    };
    if (
      maintenanceTasksUpdate.update ||
      maintenanceTasksUpdate.create ||
      maintenanceTasksUpdate.deleteMany
    ) {
      data.maintenanceTasks = maintenanceTasksUpdate;
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.equipmentId },
      data,
      include: {
        maintenanceTasks: true,
        createdBy: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('[EQUIPMENT_PUT]', error);
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

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; equipmentId: string } }
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

    // Delete equipment (this will cascade delete maintenance tasks)
    await prisma.equipment.delete({
      where: {
        id: params.equipmentId,
        zoneId: params.zoneId,
        roomId: params.roomId,
        gardenId: params.gardenId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EQUIPMENT_DELETE]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 