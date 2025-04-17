import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ZoneList from './components/ZoneList';
import CreateZoneButton from './components/CreateZoneButton';
import { Prisma } from '@prisma/client';

interface PageProps {
  params: {
    gardenId: string;
    roomId: string;
  };
}

export default async function RoomPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth');
  }

  const room = await prisma.room.findUnique({
    where: {
      id: params.roomId,
    },
    include: {
      garden: {
        include: {
          members: {
            include: {
              user: true
            }
          },
          createdBy: true
        }
      },
      zones: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      equipment: {
        include: {
          room: true
        }
      },
      cleaningSOPs: {
        include: {
          createdBy: true
        }
      },
      maintenanceTasks: {
        include: {
          createdBy: true
        }
      },
      createdBy: true
    }
  });

  if (!room) {
    redirect('/gardens');
  }

  // Check if user has access to this room's garden
  const isCreator = room.garden.creatorId === session.user.id;
  const isMember = room.garden.members.some((member: Record<string, any>) => member.userId === session.user.id);

  if (!isCreator && !isMember) {
    redirect('/gardens');
  }

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-garden-400">{room.name}</h1>
        <CreateZoneButton roomId={params.roomId} gardenId={params.gardenId} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-garden-400">Room Details</h2>
            <p className="text-dark-text-secondary">{room.description}</p>
            {room.type && (
              <p className="mt-2">
                <span className="font-medium text-dark-text-primary">Type:</span>{' '}
                <span className="text-dark-text-secondary">{room.type}</span>
              </p>
            )}
            {room.dimensions && (
              <p className="mt-2">
                <span className="font-medium text-dark-text-primary">Dimensions:</span>{' '}
                <span className="text-dark-text-secondary">{room.dimensions}</span>
              </p>
            )}
          </div>

          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-garden-400">Equipment</h2>
            {room.equipment.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {room.equipment.map((item: Record<string, any>) => (
                  <li key={item.id}>
                    <span className="font-medium text-dark-text-primary">{item.name}</span>
                    {item.description && (
                      <p className="ml-4 text-sm text-dark-text-secondary">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dark-text-secondary">No equipment listed</p>
            )}
          </div>

          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-garden-400">Cleaning SOPs</h2>
            {room.cleaningSOPs.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {room.cleaningSOPs.map((sop: Record<string, any>) => (
                  <li key={sop.id}>
                    <span className="font-medium text-dark-text-primary">{sop.title}</span>
                    <p className="ml-4 text-sm text-dark-text-secondary">{sop.description}</p>
                    <p className="ml-4 text-sm text-dark-text-secondary">Frequency: {sop.frequency}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dark-text-secondary">No cleaning SOPs listed</p>
            )}
          </div>

          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-garden-400">Maintenance Tasks</h2>
            {room.maintenanceTasks.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {room.maintenanceTasks.map((task: Record<string, any>) => (
                  <li key={task.id}>
                    <span className="font-medium text-dark-text-primary">{task.title}</span>
                    <p className="ml-4 text-sm text-dark-text-secondary">{task.description}</p>
                    <p className="ml-4 text-sm text-dark-text-secondary">
                      Frequency: {task.frequency}
                      <br />
                      Next due: {new Date(task.nextDueDate).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-dark-text-secondary">No maintenance tasks listed</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <ZoneList zones={room.zones} gardenId={params.gardenId} roomId={params.roomId} />
        </div>
      </div>
    </div>
  );
} 