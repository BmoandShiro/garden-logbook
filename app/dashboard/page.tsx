import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const totalPlantCount = await prisma.plant.count({
    where: {
      userId: session.user.id
    }
  });

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-dark-text-primary">Dashboard</h1>
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

            {/* Recent Plants Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-dark-text-primary mb-4">Recent Plants</h2>
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
          </div>
        </div>
      </main>
    </div>
  );
} 