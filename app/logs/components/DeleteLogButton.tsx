import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteLogButtonProps {
  logId: string;
  onSuccess: () => void;
}

export default function DeleteLogButton({ logId, onSuccess }: DeleteLogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/logs/${logId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete log');
      }

      toast.success('Log deleted successfully');
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete log');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100/10 transition-colors"
      >
        <TrashIcon className="h-5 w-5" />
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-dark-bg-secondary p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-dark-text-primary mb-4">
              Delete Log
            </Dialog.Title>

            <p className="text-dark-text-secondary mb-4">
              Are you sure you want to delete this log? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-dark-text-primary bg-dark-bg-primary hover:bg-dark-bg-hover rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-400"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 