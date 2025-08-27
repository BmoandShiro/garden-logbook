import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  completed: z.boolean(),
  lastCompletedDate: z.string().optional(), // ISO string
  notes: z.string().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; equipmentId: string; taskId: string }> }
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

    const json = await request.json();
    const body = updateTaskSchema.parse(json);

    // Fetch the task to get frequency and createdAt
    const originalTask = await prisma.maintenanceTask.findUnique({
      where: { id: params.taskId },
      select: { frequency: true, createdAt: true, equipmentId: true, title: true }
    });
    if (!originalTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Find the most recent log for this equipment/task
    const recentLog = await prisma.log.findFirst({
      where: {
        equipmentId: params.equipmentId,
        type: 'MAINTENANCE_TASK',
      },
      orderBy: { logDate: 'desc' }
    });

    // Determine the base date for nextDueDate
    let baseDate: Date;
    if (recentLog) {
      baseDate = new Date(recentLog.logDate);
    } else {
      baseDate = new Date(originalTask.createdAt);
    }
    // If user picked a date, use that as the base for nextDueDate and for the log
    if (body.lastCompletedDate) {
      baseDate = new Date(body.lastCompletedDate);
    }

    // Calculate next due date based on frequency
    const nextDueDate = calculateNextDueDate(baseDate, originalTask.frequency || 'Monthly');

    // Update maintenance task
    const task = await prisma.maintenanceTask.update({
      where: {
        id: params.taskId,
        equipmentId: params.equipmentId
      },
      data: {
        completed: body.completed,
        lastCompletedDate: body.completed ? baseDate : null,
        nextDueDate: body.completed ? nextDueDate : undefined
      }
    });

    // If marking as completed, create a log entry
    if (body.completed) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: params.equipmentId },
        select: { name: true, zoneId: true, roomId: true, gardenId: true }
      });
      console.log('[MAINTENANCE_TASK] Attempting to create log:', {
        notes: body.notes,
        equipmentId: params.equipmentId,
        zoneId: equipment?.zoneId,
        roomId: equipment?.roomId,
        gardenId: equipment?.gardenId,
        userId: session.user.id,
        logDate: baseDate
      });
      // Explicitly construct the log data object
      const logData = {
        type: 'MAINTENANCE_TASK',
        notes: body.notes || `Maintenance task "${task.title}" completed for equipment "${equipment?.name}"`,
        equipmentId: params.equipmentId,
        zoneId: equipment?.zoneId,
        roomId: equipment?.roomId,
        gardenId: equipment?.gardenId,
        userId: session.user.id,
        logDate: baseDate,
        stage: null,
        data: {}
      };
      console.log('[MAINTENANCE_TASK] Log data to be created:', logData);
      
      // Deep clone to prevent any accidental mutation
      const safeLogData = JSON.parse(JSON.stringify(logData));
      console.log('[MAINTENANCE_TASK] Safe log data (deep cloned):', safeLogData);
      console.log('[MAINTENANCE_TASK] Safe log data keys:', Object.keys(safeLogData));
      
      const createdLog = await prisma.log.create({
        data: safeLogData
      });
      console.log('[MAINTENANCE_TASK] Log created successfully:', createdLog.id);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[MAINTENANCE_TASK_PUT]', error);
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
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; equipmentId: string; taskId: string } }
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

    // Delete maintenance task
    await prisma.maintenanceTask.delete({
      where: {
        id: params.taskId,
        equipmentId: params.equipmentId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MAINTENANCE_TASK_DELETE]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next due date based on frequency
function calculateNextDueDate(lastCompletedDate: Date, frequency: string): Date {
  const nextDate = new Date(lastCompletedDate);
  
  switch (frequency) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  
  return nextDate;
} 