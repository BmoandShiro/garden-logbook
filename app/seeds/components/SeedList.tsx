'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';

interface Seed {
  id: string;
  variety: string;
  strain: string;
  batch: string;
  breeder: string;
  quantity: number;
  dateAcquired: Date;
  dateHarvested: Date | null;
  feminized: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  createdBy: User;
}

interface SeedListProps {
  seeds: Seed[];
}

export default function SeedList({ seeds }: SeedListProps) {
  const router = useRouter();
  const [deletingSeedId, setDeletingSeedId] = useState<string | null>(null);

  const handleDelete = async (seedId: string) => {
    try {
      setDeletingSeedId(seedId);
      const response = await fetch(`/api/seeds/${seedId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete seed');
      }

      toast.success('Seed deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Error deleting seed');
      console.error(error);
    } finally {
      setDeletingSeedId(null);
    }
  };

  if (seeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 p-8 border border-dark-border rounded-lg bg-dark-bg-secondary">
        <p className="text-xl font-semibold mb-2 text-garden-400">No seeds yet</p>
        <p className="text-dark-text-secondary text-center">
          Add your first seed to start tracking your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {seeds.map((seed) => (
        <Card
          key={seed.id}
          className="relative p-4 cursor-pointer border-0 bg-gradient-to-br from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-100 group-hover:text-emerald-50">
                {seed.variety} - {seed.strain}
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-emerald-300/70">
                  Breeder: {seed.breeder}
                </p>
                <p className="text-sm text-emerald-300/70">
                  Batch: {seed.batch}
                </p>
                <p className="text-sm text-emerald-300/70">
                  Quantity: {seed.quantity}
                </p>
                <p className="text-sm text-emerald-300/70">
                  Acquired: {seed.dateAcquired.toLocaleDateString()}
                </p>
                {seed.dateHarvested && (
                  <p className="text-sm text-emerald-300/70">
                    Harvested: {seed.dateHarvested.toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-emerald-300/70">
                  Type: {seed.feminized ? 'Feminized' : 'Regular'}
                </p>
              </div>
              <p className="text-sm text-emerald-300/70">
                Added by {seed.createdBy.name || seed.createdBy.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-emerald-300/70 hover:text-emerald-50 hover:bg-transparent"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete(seed.id);
              }}
              disabled={deletingSeedId === seed.id}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 