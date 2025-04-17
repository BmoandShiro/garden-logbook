import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PlantList from './components/PlantList';
import CreatePlantButton from './components/CreatePlantButton';

interface PageProps {
  params: {
    gardenId: string;
    roomId: string;
    zoneId: string;
  };
}

export default async function ZonePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth');
  }

  const zone = await prisma.zone.findUnique({
    where: {
      id: params.zoneId,
    },
    include: {
      room: {
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
          }
        }
      },
      plants: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      createdBy: true
    }
  });

  if (!zone) {
    redirect('/gardens');
  }

  // Check if user has access to this zone's garden
  const isCreator = zone.room.garden.creatorId === session.user.id;
  const isMember = zone.room.garden.members.some((member: Record<string, any>) => member.userId === session.user.id);

  if (!isCreator && !isMember) {
    redirect('/gardens');
  }

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-100">{zone.name}</h1>
        <CreatePlantButton zoneId={params.zoneId} roomId={params.roomId} gardenId={params.gardenId} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-emerald-100">Zone Details</h2>
            <p className="text-emerald-300/70">{zone.description}</p>
            {zone.type && (
              <p className="mt-2">
                <span className="font-medium text-emerald-100">Type:</span>{' '}
                <span className="text-emerald-300/70">{zone.type}</span>
              </p>
            )}
            {zone.dimensions && (
              <p className="mt-2">
                <span className="font-medium text-emerald-100">Dimensions:</span>{' '}
                <span className="text-emerald-300/70">{zone.dimensions}</span>
              </p>
            )}
          </div>

          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-emerald-100">Zone Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-emerald-300/70">Total Plants</p>
                <p className="text-2xl font-semibold text-emerald-100">{zone.plants.length}</p>
              </div>
              {/* Add more statistics as needed */}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <PlantList 
            plants={zone.plants} 
            gardenId={params.gardenId} 
            roomId={params.roomId} 
            zoneId={params.zoneId} 
          />
        </div>
      </div>
    </div>
  );
} 