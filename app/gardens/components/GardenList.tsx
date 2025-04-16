'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from "@prisma/client";
import DeleteButton from '../../components/DeleteButton';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ExtendedGarden {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  members: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }[];
  _count: {
    rooms: number;
    members: number;
  };
}

interface GardenListProps {
  gardens: ExtendedGarden[];
}

export function GardenList({ gardens }: GardenListProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleDelete = async (gardenId: string) => {
    try {
      const response = await fetch(`/api/gardens/${gardenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(errorText || `Failed to delete garden (${response.status})`);
      }

      toast.success('Garden deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting garden:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete garden');
    }
  };

  if (!gardens.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-emerald-100">No gardens yet</h3>
        <p className="mt-1 text-sm text-emerald-300/70">Get started by creating your first garden!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gardens.map((garden) => (
        <div
          key={garden.id}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-emerald-800 bg-emerald-900/30 shadow-sm transition-all hover:shadow-lg hover:border-emerald-600"
        >
          <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="p-2">
              {garden.isPrivate && (
                <span className="inline-flex items-center rounded-md bg-emerald-950/90 px-2 py-1 text-xs font-medium text-emerald-200">
                  Private
                </span>
              )}
              {session?.user?.id === garden.createdBy.id && (
                <DeleteButton
                  onDelete={() => handleDelete(garden.id)}
                  itemName="Garden"
                  small
                />
              )}
            </div>
          </div>
          <Link href={`/gardens/${garden.id}`} className="flex-grow">
            <div className="aspect-h-3 aspect-w-4 relative bg-emerald-950 sm:aspect-none sm:h-48">
              {garden.imageUrl ? (
                <img
                  src={garden.imageUrl}
                  alt={garden.name}
                  className="h-full w-full object-cover object-center sm:h-full sm:w-full group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-emerald-900 to-emerald-950 group-hover:from-emerald-800 group-hover:to-emerald-900 transition-colors" />
              )}
            </div>
            <div className="flex flex-1 flex-col space-y-2 p-4">
              <h3 className="text-sm font-medium text-emerald-100 group-hover:text-emerald-50">{garden.name}</h3>
              <p className="text-sm text-emerald-300/70 line-clamp-3">
                {garden.description}
              </p>
              <div className="flex flex-1 items-end justify-between">
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-emerald-300/70">
                      {garden._count.rooms} rooms
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-emerald-300/70">
                      {garden._count.members} members
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 