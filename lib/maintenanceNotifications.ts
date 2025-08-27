import { prisma } from '@/lib/prisma';
import { addDays, isBefore, isAfter } from 'date-fns';

interface MaintenanceTask {
  id: string;
  title: string;
  frequency: string;
  nextDueDate: Date;
  completed: boolean;
  equipment: {
    id: string;
    name: string;
    garden: {
      id: string;
      name: string;
      members: Array<{
        userId: string;
        user: {
          id: string;
          email: string;
          name?: string;
        };
      }>;
    };
  };
}

export async function checkMaintenanceNotifications() {
  console.log('[MAINTENANCE_NOTIFICATIONS] Starting maintenance task notification check...');

  try {
    // Get all incomplete maintenance tasks due within the next 9 days
    const nineDaysFromNow = addDays(new Date(), 9);
    const now = new Date();

    const tasks = await prisma.maintenanceTask.findMany({
      where: {
        completed: false,
        nextDueDate: {
          gte: now,
          lte: nineDaysFromNow,
        },
      },
      include: {
        equipment: {
          include: {
            garden: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`[MAINTENANCE_NOTIFICATIONS] Found ${tasks.length} tasks due within 9 days`);

    for (const task of tasks) {
      const daysUntilDue = Math.ceil(
        (task.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we already sent a notification today for this task
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'MAINTENANCE_REMINDER',
          meta: {
            path: ['taskId'],
            equals: task.id,
          },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today at midnight
          },
        },
      });

      if (existingNotification) {
        console.log(`[MAINTENANCE_NOTIFICATIONS] Already sent notification today for task ${task.id}`);
        continue;
      }

      // Create notification message based on urgency
      let urgency = '';
      let title = '';
      
      if (daysUntilDue <= 0) {
        urgency = 'OVERDUE';
        title = `🚨 Maintenance Task Overdue: ${task.title}`;
      } else if (daysUntilDue <= 3) {
        urgency = 'URGENT';
        title = `⚠️ Maintenance Task Due Soon: ${task.title}`;
      } else {
        urgency = 'REMINDER';
        title = `📅 Maintenance Task Reminder: ${task.title}`;
      }

      const message = `${task.equipment.name} maintenance task "${task.title}" is due ${daysUntilDue <= 0 ? 'overdue' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}.`;

      // Send notifications to all garden members
      const notifications = task.equipment.garden.members.map((member: any) => ({
        userId: member.user.id,
        type: 'MAINTENANCE_REMINDER',
        title,
        message,
        link: `/gardens/${task.equipment.garden.id}/rooms/${task.equipment.roomId}/zones/${task.equipment.zoneId}/equipment/${task.equipment.id}`,
        meta: {
          taskId: task.id,
          equipmentId: task.equipment.id,
          gardenId: task.equipment.garden.id,
          daysUntilDue,
          urgency,
          dueDate: task.nextDueDate.toISOString(),
        },
      }));

      // Create notifications in batch
      await prisma.notification.createMany({
        data: notifications,
      });

      console.log(`[MAINTENANCE_NOTIFICATIONS] Sent ${notifications.length} notifications for task ${task.id} (${urgency})`);
    }

    console.log('[MAINTENANCE_NOTIFICATIONS] Maintenance notification check completed');
  } catch (error) {
    console.error('[MAINTENANCE_NOTIFICATIONS] Error checking maintenance notifications:', error);
  }
}

// Function to get all garden user IDs (helper function)
async function getAllGardenUserIds(gardenId: string): Promise<string[]> {
  const garden = await prisma.garden.findUnique({
    where: { id: gardenId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!garden) return [];

  return garden.members.map((member: any) => member.user.id);
} 