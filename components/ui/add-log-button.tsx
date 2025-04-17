'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { LogEntryForm } from '@/components/logs/LogEntryForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddLogButtonProps {
  plantId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  strains?: Array<{ id: string; name: string }>;
}

export function AddLogButton({ 
  plantId, 
  variant = 'default',
  size = 'default',
  className,
  strains = []
}: AddLogButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, plantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create log');
      }

      toast.success('Log entry created successfully');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating log:', error);
      toast.error('Failed to create log entry');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn(
          "bg-[#0D9488] hover:bg-[#0F766E] text-white",
          className
        )}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Log
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Log Entry</DialogTitle>
          </DialogHeader>
          <LogEntryForm
            plantId={plantId}
            onSubmit={handleSubmit}
            strains={strains}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 