'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateLogModal from '@/app/logs/components/CreateLogModal';
import { useSession } from 'next-auth/react';

interface AddLogButtonProps {
  zoneId: string;
  roomId: string;
  gardenId: string;
  plants: Array<{ id: string; name: string }>;
}

export default function AddLogButton({ zoneId, roomId, gardenId, plants }: AddLogButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Log
      </Button>

      <CreateLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={session.user.id}
        onSuccess={() => {
          setIsModalOpen(false);
          // Refresh the page to show new logs
          window.location.reload();
        }}
        initialValues={{
          gardenId,
          roomId,
          zoneId,
          selectedPlants: [] // Empty array means "all plants in zone"
        }}
      />
    </>
  );
} 