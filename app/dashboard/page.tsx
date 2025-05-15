import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CleanupOrphanedPlantsButton from '../components/CleanupOrphanedPlantsButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { OwnerOnly } from '@/components/OwnerOnly';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Fetch gardens where user is creator or member directly with Prisma
  const gardensList: any[] = await prisma.garden.findMany({
    where: {
      OR: [
        { creatorId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
              permissions: { has: 'VIEW' }
            }
          }
        }
      ]
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true }
      },
      members: true,
      rooms: true,
      _count: { select: { rooms: true, members: true } }
    }
  });

  // Count all plants in gardens the user is a member of or creator of, even if nested in zones/rooms
  const gardenIds = gardensList.map(g => g.id);
  const totalPlantCount = await prisma.plant.count({
    where: {
      zone: {
        room: {
          gardenId: { in: gardenIds }
        }
      }
    }
  });

  // Count unique species
  const uniqueSpecies = await prisma.plant.findMany({
    where: {
      zone: {
        room: {
          gardenId: { in: gardenIds }
        }
      }
    },
    distinct: ['species'],
    select: { species: true },
  });
  const totalSpecies = uniqueSpecies.length;

  // Count unique strains
  const uniqueStrains = await prisma.plant.findMany({
    where: {
      zone: {
        room: {
          gardenId: { in: gardenIds }
        }
      }
    },
    distinct: ['strainName'],
    select: { strainName: true },
  });
  const totalStrains = uniqueStrains.length;

  // Fetch current and forecasted weather alerts for all gardens
  const alertTypes = ['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'];
  let currentAlertCounts: Record<string, number> = {};
  let forecastedAlertCounts: Record<string, number> = {};
  alertTypes.forEach(type => {
    currentAlertCounts[type] = 0;
    forecastedAlertCounts[type] = 0;
  });
  let totalCurrentAlerts = 0;
  let totalForecastedAlerts = 0;

  // For affected counts
  let affectedGardensCurrent = new Set();
  let affectedRoomsCurrent = new Set();
  let affectedZonesCurrent = new Set();
  let affectedPlantsCurrent = new Set();
  let affectedGardensForecast = new Set();
  let affectedRoomsForecast = new Set();
  let affectedZonesForecast = new Set();
  let affectedPlantsForecast = new Set();

  // After fetching currentAlerts and forecastedAlerts for each garden, collect all their expiration times
  let currentAlertExpirations: Date[] = [];
  let forecastedAlertExpirations: Date[] = [];

  // Deduplication sets for unique plant+alertType pairs for the current user
  const uniqueCurrentPlantAlertPairs = new Set<string>();
  const uniqueForecastedPlantAlertPairs = new Set<string>();

  for (const gardenId of gardenIds) {
    // Current alerts for current user only
    const currentAlerts = await prisma.notification.findMany({
      where: {
        type: 'WEATHER_ALERT',
        meta: { path: ['gardenId'], equals: gardenId },
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }
      }
    });
    for (const alert of currentAlerts) {
      if (alert.meta?.alertTypes) {
        for (const t of alert.meta.alertTypes) {
          if (alertTypes.includes(t)) {
            const key = `${alert.meta.plantId}:${t}`;
            if (!uniqueCurrentPlantAlertPairs.has(key)) {
              uniqueCurrentPlantAlertPairs.add(key);
              currentAlertCounts[t]++;
              totalCurrentAlerts++;
            }
            // Collect affected entities
            if (alert.meta?.gardenId) affectedGardensCurrent.add(alert.meta.gardenId);
            if (alert.meta?.roomId) affectedRoomsCurrent.add(alert.meta.roomId);
            if (alert.meta?.zoneId) affectedZonesCurrent.add(alert.meta.zoneId);
            if (alert.meta?.plantId) affectedPlantsCurrent.add(alert.meta.plantId);
            // Collect expiration times
            currentAlertExpirations.push(new Date(new Date(alert.createdAt).getTime() + 4 * 60 * 60 * 1000));
          }
        }
      }
    }
    // Forecasted alerts for current user only
    const forecastedAlerts = await prisma.notification.findMany({
      where: {
        type: 'WEATHER_FORECAST_ALERT',
        meta: { path: ['gardenId'], equals: gardenId },
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }
      }
    });
    for (const alert of forecastedAlerts) {
      if (alert.meta?.alertTypes) {
        for (const t of alert.meta.alertTypes) {
          if (alertTypes.includes(t)) {
            const key = `${alert.meta.plantId}:${t}`;
            if (!uniqueForecastedPlantAlertPairs.has(key)) {
              uniqueForecastedPlantAlertPairs.add(key);
              forecastedAlertCounts[t]++;
              totalForecastedAlerts++;
            }
            // Collect affected entities
            if (alert.meta?.gardenId) affectedGardensForecast.add(alert.meta.gardenId);
            if (alert.meta?.roomId) affectedRoomsForecast.add(alert.meta.roomId);
            if (alert.meta?.zoneId) affectedZonesForecast.add(alert.meta.zoneId);
            if (alert.meta?.plantId) affectedPlantsForecast.add(alert.meta.plantId);
            // Collect expiration times
            forecastedAlertExpirations.push(new Date(new Date(alert.createdAt).getTime() + 4 * 60 * 60 * 1000));
          }
        }
      }
    }
  }

  // Calculate next expiration times
  const nextCurrentAlertExpiration = currentAlertExpirations.length > 0 ? new Date(Math.min(...currentAlertExpirations.map(d => d.getTime()))) : null;
  const nextForecastedAlertExpiration = forecastedAlertExpirations.length > 0 ? new Date(Math.min(...forecastedAlertExpirations.map(d => d.getTime()))) : null;

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-emerald-100">Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Main content area */}
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Quick Stats */}
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Total Plants</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-garden-400">{totalPlantCount}</p>
                <p className="mt-2 text-sm text-dark-text-secondary">Active plants in your gardens</p>
              </div>
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Total Species</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-garden-400">{totalSpecies}</p>
                <p className="mt-2 text-sm text-dark-text-secondary">Unique species in your gardens</p>
              </div>
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Total Strains</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-garden-400">{totalStrains}</p>
                <p className="mt-2 text-sm text-dark-text-secondary">Unique strains in your gardens</p>
              </div>
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Current Weather Alerts</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-red-400 cursor-help">{totalCurrentAlerts}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      {nextCurrentAlertExpiration ? (
                        <span>Next alert expires: {format(nextCurrentAlertExpiration, 'PPpp')}</span>
                      ) : (
                        <span>No active alerts</span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="mt-2 text-sm text-dark-text-secondary">
                  {alertTypes.map(type => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="capitalize">{type}:</span>
                      <span className="font-semibold text-red-300">{currentAlertCounts[type]}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-xs text-dark-text-secondary">
                    <span className="font-semibold">Gardens:</span> {affectedGardensCurrent.size} &nbsp;|
                    <span className="font-semibold">Rooms/Plots:</span> {affectedRoomsCurrent.size} &nbsp;|
                    <span className="font-semibold">Zones:</span> {affectedZonesCurrent.size} &nbsp;|
                    <span className="font-semibold">Plants:</span> {affectedPlantsCurrent.size}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Forecasted Weather Alerts</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-yellow-400 cursor-help">{totalForecastedAlerts}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      {nextForecastedAlertExpiration ? (
                        <span>Next alert expires: {format(nextForecastedAlertExpiration, 'PPpp')}</span>
                      ) : (
                        <span>No active alerts</span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="mt-2 text-sm text-dark-text-secondary">
                  {alertTypes.map(type => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="capitalize">{type}:</span>
                      <span className="font-semibold text-yellow-300">{forecastedAlertCounts[type]}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-xs text-dark-text-secondary">
                    <span className="font-semibold">Gardens:</span> {affectedGardensForecast.size} &nbsp;|
                    <span className="font-semibold">Rooms/Plots:</span> {affectedRoomsForecast.size} &nbsp;|
                    <span className="font-semibold">Zones:</span> {affectedZonesForecast.size} &nbsp;|
                    <span className="font-semibold">Plants:</span> {affectedPlantsForecast.size}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Your Gardens</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-garden-400">{gardensList.length}</p>
                <p className="mt-2 text-sm text-dark-text-secondary">Gardens you own or are a member of</p>
              </div>
              {/* Recent Activity */}
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Recent Activity</h3>
                <p className="mt-2 text-sm text-dark-text-secondary">No recent activity</p>
              </div>
              {/* Upcoming Tasks */}
              <div className="rounded-lg bg-dark-bg-secondary p-6 shadow-lg ring-1 ring-dark-border">
                <h3 className="text-base font-semibold leading-6 text-dark-text-primary">Upcoming Tasks</h3>
                <p className="mt-2 text-sm text-dark-text-secondary">No upcoming tasks</p>
              </div>
            </div>
            {/* Gardens List Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-emerald-100 mb-4">Your Gardens</h2>
              <div className="rounded-lg bg-dark-bg-secondary overflow-hidden shadow ring-1 ring-dark-border">
                <div className="p-6">
                  {gardensList.length > 0 ? (
                    <ul className="divide-y divide-dark-border">
                      {gardensList.map((garden: any) => (
                        <li key={garden.id} className="py-4 flex items-center justify-between">
                          <div>
                            <Link href={`/gardens/${garden.id}`} className="text-lg font-bold text-garden-400 hover:underline">
                              {garden.name}
                            </Link>
                            <div className="text-sm text-dark-text-secondary">{garden.description}</div>
                          </div>
                          <div className="flex gap-4 text-xs text-dark-text-secondary">
                            <span>Rooms: {garden._count?.rooms ?? 0}</span>
                            <span>Members: {garden._count?.members ?? 0}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-dark-text-secondary">No gardens yet</p>
                  )}
                </div>
              </div>
            </div>
            {/* Recent Plants Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-emerald-100 mb-4">Recent Plants</h2>
              <div className="rounded-lg bg-dark-bg-secondary overflow-hidden shadow ring-1 ring-dark-border">
                <div className="p-6">
                  {totalPlantCount > 0 ? (
                    <div className="space-y-4">
                      {/* Plants will be listed here in the client component */}
                      <p className="text-dark-text-secondary">Loading plants...</p>
                    </div>
                  ) : (
                    <p className="text-center text-dark-text-secondary">No plants added yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <OwnerOnly userEmail={session.user.email}>
                <CleanupOrphanedPlantsButton />
              </OwnerOnly>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 