'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Garden, User } from '@prisma/client';

interface ExtendedGarden extends Garden {
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  _count: {
    rooms: number;
    members: number;
  };
}

interface GardenListProps {
  gardens: ExtendedGarden[];
}

export default function GardenList({ gardens }: GardenListProps) {
  if (!gardens.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-dark-text-primary">No gardens yet</h3>
        <p className="mt-1 text-sm text-dark-text-secondary">Get started by creating your first garden!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gardens.map((garden) => (
        <Link
          key={garden.id}
          href={`/gardens/${garden.id}`}
          className="block bg-dark-bg-secondary rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ring-1 ring-dark-border"
        >
          <div className="relative h-48 rounded-t-lg bg-dark-bg-primary overflow-hidden">
            {garden.imageUrl ? (
              <Image
                src={garden.imageUrl}
                alt={garden.name}
                fill
                className="object-cover rounded-t-lg"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-garden-900/50 to-garden-600/50">
                <svg
                  className="h-16 w-16 text-garden-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-dark-text-primary">{garden.name}</h3>
              {garden.isPrivate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-dark-bg-primary text-dark-text-secondary border border-dark-border">
                  Private
                </span>
              )}
            </div>

            {garden.description && (
              <p className="mt-1 text-sm text-dark-text-secondary line-clamp-2">{garden.description}</p>
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-dark-text-secondary">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {garden._count.rooms} {garden._count.rooms === 1 ? 'Room' : 'Rooms'}
                </span>
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {garden._count.members} {garden._count.members === 1 ? 'Member' : 'Members'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 