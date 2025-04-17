'use client';

import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  dimensions: string | null;
  createdAt: Date;
  updatedAt: Date;
  roomId: string;
  creatorId: string;
  createdBy: User;
}

interface ZoneListProps {
  zones: Zone[];
  gardenId: string;
  roomId: string;
}

export default function ZoneList({ zones, gardenId, roomId }: ZoneListProps) {
  const router = useRouter();
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);

  const handleDelete = async (zoneId: string) => {
    try {
      setDeletingZoneId(zoneId);
      const response = await fetch(`/api/gardens/${gardenId}/rooms/${roomId}/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      toast.success('Zone deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Error deleting zone');
      console.error(error);
    } finally {
      setDeletingZoneId(null);
    }
  };

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 p-8 border rounded-lg bg-card">
        <p className="text-xl font-semibold mb-2">No zones yet</p>
        <p className="text-muted-foreground text-center">
          Create your first zone to start organizing your plants and equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {zones.map((zone) => (
        <Card
          key={zone.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/gardens/${gardenId}/rooms/${roomId}/zones/${zone.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{zone.name}</h3>
              {zone.description && (
                <p className="text-muted-foreground">{zone.description}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Created by {zone.createdBy.name || zone.createdBy.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete(zone.id);
              }}
              disabled={deletingZoneId === zone.id}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 