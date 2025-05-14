import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import PlantLogsListWrapper from './components/PlantLogsListWrapper';
import EditPlantModal from './components/EditPlantModal';
import { Plant } from '@prisma/client';

interface PageProps {
  params: {
    gardenId: string;
    roomId: string;
    zoneId: string;
    plantId: string;
  };
}

export default async function PlantPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth');
  }

  const plant = await prisma.plant.findUnique({
    where: {
      id: params.plantId,
    },
    include: {
      zone: {
        include: {
          room: {
            include: {
              garden: {
                select: {
                  id: true,
                  creatorId: true,
                  members: {
                    select: { userId: true }
                  }
                }
              },
            },
          },
        },
      },
      user: true
    }
  });

  if (!plant) {
    redirect('/gardens');
  }

  // Check if user has access to this garden
  const isCreator = plant.zone.room.garden.creatorId === session.user.id;
  const isMember = plant.zone.room.garden.members.some(
    (member: Record<string, any>) => member.userId === session.user.id
  );

  if (!isCreator && !isMember) {
    redirect('/gardens');
  }

  // Calculate days since planting if plantedDate exists
  const daysSincePlanting = plant.plantedDate
    ? Math.floor((new Date().getTime() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate days until expected harvest if both dates exist
  const daysUntilHarvest = plant.expectedHarvestDate && plant.plantedDate
    ? Math.floor((new Date(plant.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Fetch logs for this plant
  const logs = await prisma.log.findMany({
    where: { plantId: params.plantId },
    orderBy: { logDate: 'desc' },
    include: {
      plant: { select: { name: true } },
      garden: { select: { name: true } },
      room: { select: { name: true } },
      zone: { select: { name: true } },
    },
  });

  // Log the plant object for debugging
  console.log('Plant object:', plant);

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-100">{plant.name}</h1>
          <p className="text-emerald-300/70">{plant.strainName || plant.species || 'Unknown'}{plant.variety ? ` (${plant.variety})` : ''}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Plant Details Card */}
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-4 text-emerald-100">Plant Details</h2>
            
            {/* Defensive check for nested objects before rendering EditPlantModal */}
            {isCreator && plant.zone && plant.zone.room && plant.zone.room.garden && (
              <EditPlantModal 
                plant={plant}
                gardenId={plant.zone.room.garden.id}
                roomId={plant.zone.room.id}
                zoneId={plant.zone.id}
                plantId={plant.id}
              />
            )}

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-emerald-100">Strain</p>
                <p className="text-emerald-300/70">{plant.strainName || plant.species || 'Unknown'}</p>
              </div>

              {plant.variety && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">Variety</p>
                  <p className="text-emerald-300/70">{plant.variety}</p>
                </div>
              )}

              {plant.plantedDate && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">Planted Date</p>
                  <p className="text-emerald-300/70">
                    {format(new Date(plant.plantedDate), 'PPP')}
                  </p>
                </div>
              )}

              {plant.expectedHarvestDate && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">Expected Harvest</p>
                  <p className="text-emerald-300/70">
                    {format(new Date(plant.expectedHarvestDate), 'PPP')}
                  </p>
                </div>
              )}

              {plant.notes && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">Notes</p>
                  <p className="text-emerald-300/70 whitespace-pre-wrap">{plant.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-emerald-100">Added By</p>
                <p className="text-emerald-300/70">
                  {plant.user.name || plant.user.email}
                </p>
              </div>

              {/* Growing Season Control */}
              {(plant.growingSeasonStart || plant.growingSeasonEnd) && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">🌱 Growing Season</p>
                  <p className="text-emerald-300/70">
                    {plant.growingSeasonStart && `Start: ${plant.growingSeasonStart}`}<br />
                    {plant.growingSeasonEnd && `End: ${plant.growingSeasonEnd}`}<br />
                    {plant.onlyTriggerAlertsDuringSeason && <span>Alerts only during season</span>}
                  </p>
                </div>
              )}

              {/* Weather Sensitivities */}
              {plant.sensitivities && (
                <div>
                  <p className="text-sm font-medium text-emerald-100">🌦️ Weather Sensitivities</p>
                  <div className="text-emerald-300/70 space-y-1">
                    {Object.entries(plant.sensitivities).map(([key, value]) => {
                      const v = value as any;
                      return v.enabled && (
                        <div key={key}>
                          <span className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>{' '}
                          {v.threshold && <>Threshold: {v.threshold} {v.unit || ''} </>}
                          {key === 'drought' && v.days && <>No rain for {v.days} days </>}
                          {key === 'wind' && v.threshold && <>Wind speed: {v.threshold} {v.unit || ''} </>}
                          {key === 'frost' && v.windows && v.windows.length > 0 && (
                            <div>
                              {v.windows.map((w: any, i: number) => (
                                <div key={i}>
                                  {w.label && <span>{w.label}: </span>}
                                  {w.start} - {w.end} {w.repeat && '(repeats)'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Growth Statistics Card */}
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-4 text-emerald-100">Growth Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              {daysSincePlanting !== null && (
                <div>
                  <p className="text-sm text-emerald-300/70">Days Since Planting</p>
                  <p className="text-2xl font-semibold text-emerald-100">{daysSincePlanting}</p>
                </div>
              )}
              
              {daysUntilHarvest !== null && (
                <div>
                  <p className="text-sm text-emerald-300/70">Days Until Harvest</p>
                  <p className="text-2xl font-semibold text-emerald-100">{daysUntilHarvest}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Info Card */}
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-4 text-emerald-100">Location</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-emerald-100">Garden</p>
                <p className="text-emerald-300/70">{plant.zone.room.garden.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100">Room</p>
                <p className="text-emerald-300/70">{plant.zone.room.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100">Zone</p>
                <p className="text-emerald-300/70">{plant.zone.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Placeholder for future features */}
          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-emerald-100">Growth Timeline</h2>
            <p className="text-emerald-300/70">
              Growth tracking and timeline features coming soon...
            </p>
          </div>

          <div className="p-4 border border-dark-border rounded-lg bg-dark-bg-secondary">
            <h2 className="text-xl font-semibold mb-2 text-emerald-100">Care Schedule</h2>
            <p className="text-emerald-300/70">
              Plant care scheduling and reminders coming soon...
            </p>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-emerald-100 mb-4">Logs for this Plant</h2>
        <PlantLogsListWrapper logs={logs} />
      </div>
    </div>
  );
} 