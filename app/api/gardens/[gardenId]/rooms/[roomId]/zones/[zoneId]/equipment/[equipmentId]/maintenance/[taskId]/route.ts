import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  completed: z.boolean(),
  lastCompletedDate: z.string().optional(),
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
      select: { frequency: true, createdAt: true, equipmentId: true, equipment: { select: { name: true, zoneId: true, roomId: true, gardenId: true } } }
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

    // Fetch the equipment to get zone, room, and garden IDs
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.equipmentId },
      select: { name: true, zoneId: true, roomId: true, gardenId: true }
    });
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // If marking as completed, create a log entry using the new dedicated endpoint
    if (body.completed) {
      // Call the dedicated maintenance log creation endpoint
      const logResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/maintenance-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          taskTitle: task.title,
          equipmentName: equipment.name,
          equipmentId: params.equipmentId,
          gardenId: equipment.gardenId,
          roomId: equipment.roomId,
          zoneId: equipment.zoneId,
          notes: body.notes,
          completedDate: baseDate.toISOString()
        })
      });

      if (!logResponse.ok) {
        console.error('[MAINTENANCE_TASK] Failed to create log:', await logResponse.text());
      }
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
    case 'Every 3 Months':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Every 6 Months':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'Annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  
  return nextDate;
} 