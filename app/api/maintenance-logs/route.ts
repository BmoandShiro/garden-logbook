import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Stage } from '@prisma/client';

const createMaintenanceLogSchema = z.object({
  taskTitle: z.string(),
  equipmentName: z.string(),
  equipmentId: z.string(),
  gardenId: z.string(),
  roomId: z.string(),
  zoneId: z.string(),
  notes: z.string().optional(),
  completedDate: z.string(), // ISO string
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const body = createMaintenanceLogSchema.parse(json);

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: body.gardenId,
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

    // Create the maintenance log using the exact same pattern as weather alerts
    const log = await prisma.log.create({
      data: {
        type: 'MAINTENANCE_TASK',
        notes: body.notes || `Maintenance task "${body.taskTitle}" completed for equipment "${body.equipmentName}"`,
        logDate: new Date(body.completedDate),
        user: { connect: { id: session.user.id } },
        equipment: { connect: { id: body.equipmentId } },
        garden: { connect: { id: body.gardenId } },
        room: { connect: { id: body.roomId } },
        zone: { connect: { id: body.zoneId } },
        stage: Stage.VEGETATIVE,
        data: {}
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('[MAINTENANCE_LOG_CREATE]', error);
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