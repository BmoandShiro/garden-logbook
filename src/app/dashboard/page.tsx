'use client';

import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/Navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plant, Log } from '@prisma/client';

// This would typically come from an API endpoint
async function fetchDashboardData(userId: string) {
  const response = await fetch(`/api/dashboard?userId=${userId}`);
  return response.json();
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', session?.user?.id],
    queryFn: () => fetchDashboardData(session?.user?.id as string),
    enabled: !!session?.user?.id,
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Please sign in to continue</h2>
              <Link
                href="/auth/signin"
                className="mt-4 inline-block rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Welcome back, {session.user.name || 'Gardener'}!
              </h2>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/plants/new"
                className="ml-3 inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Add New Plant
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Plants Overview */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Your Plants</h3>
                {isLoading ? (
                  <div className="mt-4 text-gray-500">Loading plants...</div>
                ) : data?.plants?.length > 0 ? (
                  <div className="mt-6 flow-root">
                    <ul role="list" className="-my-5 divide-y divide-gray-200">
                      {data.plants.map((plant: Plant) => (
                        <li key={plant.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {plant.imageUrl ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover"
                                  src={plant.imageUrl}
                                  alt={plant.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                  🌿
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                <Link href={`/plants/${plant.id}`} className="hover:underline">
                                  {plant.name}
                                </Link>
                              </p>
                              <p className="truncate text-sm text-gray-500">{plant.species || 'Unknown species'}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 text-gray-500">No plants added yet.</div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
                {isLoading ? (
                  <div className="mt-4 text-gray-500">Loading activity...</div>
                ) : data?.recentLogs?.length > 0 ? (
                  <div className="mt-6 flow-root">
                    <ul role="list" className="-mb-8">
                      {data.recentLogs.map((log: Log, index: number) => (
                        <li key={log.id}>
                          <div className="relative pb-8">
                            {index !== data.recentLogs.length - 1 && (
                              <span
                                className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex items-start space-x-3">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-white">
                                  {log.type === 'WATERING' && '💧'}
                                  {log.type === 'FERTILIZING' && '🌱'}
                                  {log.type === 'PRUNING' && '✂️'}
                                  {log.type === 'REPOTTING' && '🪴'}
                                  {log.type === 'PEST_DISEASE' && '🔍'}
                                  {log.type === 'MEASUREMENT' && '📏'}
                                  {log.type === 'GENERAL' && '📝'}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(log.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="mt-1 text-sm text-gray-700">
                                  <p>{log.notes || `${log.type.toLowerCase()} activity recorded`}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 text-gray-500">No recent activity.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 