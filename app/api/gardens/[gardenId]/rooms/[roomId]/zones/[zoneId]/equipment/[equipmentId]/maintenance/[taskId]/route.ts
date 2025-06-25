import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  completed: z.boolean(),
  lastCompletedDate: z.string().optional(),
});

export async function PUT(
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

    const json = await request.json();
    const body = updateTaskSchema.parse(json);

    // Update maintenance task
    const task = await prisma.maintenanceTask.update({
      where: {
        id: params.taskId,
        equipmentId: params.equipmentId
      },
      data: {
        completed: body.completed,
        lastCompletedDate: body.completed ? new Date() : null,
        nextDueDate: body.completed ? calculateNextDueDate(new Date(), 'Monthly') : undefined // You might want to make this dynamic
      }
    });

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