import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CleanupOrphanedPlantsButton from '../components/CleanupOrphanedPlantsButton';

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
                <p className="mt-2 text-sm text-dark-text-secondary">Active plants in your garden</p>
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
              <CleanupOrphanedPlantsButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 