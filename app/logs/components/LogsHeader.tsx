'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import CreateLogModal from './CreateLogModal';
import { useRouter } from 'next/navigation';

interface LogsHeaderProps {
  userId: string;
}

export default function LogsHeader({ userId }: LogsHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleLogCreated = () => {
    router.refresh();
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-dark-text-primary">Logs</h1>
      <div className="flex gap-2">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-garden-600 text-white hover:bg-garden-700"
        >
          Create Log
        </Button>
        <CreateLogModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          userId={userId}
          onSuccess={handleLogCreated}
        />
      </div>
    </div>
  );
} 