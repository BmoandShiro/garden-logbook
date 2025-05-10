'use client';

import { useState } from 'react';
import { Menu } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash, Trash2 } from 'lucide-react';

interface Garden {
  id: string;
  name: string;
  createdBy: {
    id: string;
  };
}

interface ManageGardensButtonProps {
  gardens: Garden[];
  userId: string;
}

export default function ManageGardensButton({ gardens, userId }: ManageGardensButtonProps) {
  const router = useRouter();
  const [selectedGarden, setSelectedGarden] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [gardenToDelete, setGardenToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (garden: Garden) => {
    setGardenToDelete({ id: garden.id, name: garden.name });
    setShowConfirmDialog(true);
  };

  const handleDelete = async () => {
    if (!gardenToDelete) return;

    try {
      const response = await fetch(`/api/gardens/${gardenToDelete.id}`, {
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
      setShowConfirmDialog(false);
      setGardenToDelete(null);
    } catch (error) {
      console.error('Error deleting garden:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete garden');
    }
  };

  const userOwnedGardens = gardens.filter(garden => garden.createdBy.id === userId);

  if (userOwnedGardens.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <Menu>
          <Menu.Button className="inline-flex items-center justify-center p-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 group">
            <Trash2 className="h-8 w-8 text-red-600 group-hover:text-red-700 transition-colors" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-emerald-900 ring-1 ring-black ring-opacity-5 divide-y divide-emerald-800 focus:outline-none z-50">
            <div className="py-1">
              {userOwnedGardens.map((garden) => (
                <Menu.Item key={garden.id}>
                  {({ active }) => (
                    <button
                      onClick={() => handleDeleteClick(garden)}
                      className={`${
                        active ? 'bg-emerald-800' : ''
                      } flex justify-between items-center w-full px-4 py-2 text-sm text-emerald-100`}
                    >
                      <span className="truncate">{garden.name}</span>
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Menu>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && gardenToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-emerald-900 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-emerald-100 mb-4">Delete Garden</h3>
            <p className="text-emerald-200 mb-6">
              Are you sure you want to delete &quot;{gardenToDelete.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setGardenToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-emerald-100 hover:text-white focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 