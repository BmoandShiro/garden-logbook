'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from "@prisma/client";
import DeleteButton from '../../components/DeleteButton';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [openModalGardenId, setOpenModalGardenId] = useState<string | null>(null);
  const [openInviteModalGardenId, setOpenInviteModalGardenId] = useState<string | null>(null);
  const [openEditModalGardenId, setOpenEditModalGardenId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', imageUrl: '', isPrivate: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showInviteFormGardenId, setShowInviteFormGardenId] = useState<string | null>(null);

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
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
            {garden.isPrivate && (
              <span className="inline-flex items-center rounded-md bg-emerald-950/90 px-2 py-1 text-xs font-medium text-emerald-200">
                Private
              </span>
            )}
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="Invite to Garden"
              onClick={() => setOpenInviteModalGardenId(garden.id)}
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="Garden Settings"
              onClick={() => setOpenModalGardenId(garden.id)}
            >
              <Settings className="h-5 w-5" />
            </button>
            {session?.user?.id === garden.createdBy.id && (
              <DeleteButton
                onDelete={() => handleDelete(garden.id)}
                itemName="Garden"
                small
              />
            )}
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
          {/* Settings Modal for this garden */}
          <Dialog open={openModalGardenId === garden.id} onOpenChange={(open) => setOpenModalGardenId(open ? garden.id : null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{garden.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  onClick={() => {
                    setEditFormData({
                      name: garden.name,
                      description: garden.description || '',
                      imageUrl: garden.imageUrl || '',
                      isPrivate: garden.isPrivate,
                    });
                    setOpenEditModalGardenId(garden.id);
                  }}
                >
                  Edit Garden
                </button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Invite Modal for this garden */}
          <Dialog open={openInviteModalGardenId === garden.id} onOpenChange={(open) => setOpenInviteModalGardenId(open ? garden.id : null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to {garden.name}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setInviteLoading(true);
                  setInviteError('');
                  setInviteSuccess(false);
                  try {
                    const res = await fetch('/api/gardens/invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gardenId: garden.id, email: inviteEmail }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setInviteSuccess(true);
                      setInviteEmail('');
                    } else {
                      setInviteError(data.error || 'Failed to send invite.');
                    }
                  } catch (err) {
                    setInviteError('Failed to send invite.');
                  } finally {
                    setInviteLoading(false);
                  }
                }}
                className="flex flex-col gap-2"
              >
                <label htmlFor="invite-email" className="text-sm font-medium text-dark-text-primary">Gmail address to invite:</label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="rounded-md border border-dark-border px-3 py-2 bg-dark-bg-primary text-white focus:ring-2 focus:ring-blue-400"
                  required
                  pattern="^[^@\s]+@gmail\.com$"
                  disabled={inviteLoading}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                    onClick={() => {
                      setOpenInviteModalGardenId(null);
                      setInviteEmail('');
                      setInviteError('');
                      setInviteSuccess(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    disabled={inviteLoading}
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
                {inviteError && <div className="text-red-500 text-sm mt-1">{inviteError}</div>}
                {inviteSuccess && <div className="text-green-500 text-sm mt-1">Invite sent!</div>}
              </form>
            </DialogContent>
          </Dialog>
          {/* Edit Modal for this garden */}
          <Dialog open={openEditModalGardenId === garden.id} onOpenChange={(open) => setOpenEditModalGardenId(open ? garden.id : null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Garden</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError(null);
                  try {
                    const response = await fetch(`/api/gardens/${garden.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editFormData),
                    });
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || 'Failed to update garden');
                    }
                    setOpenEditModalGardenId(null);
                    setOpenModalGardenId(null);
                    router.refresh();
                  } catch (error) {
                    setEditError(error instanceof Error ? error.message : 'Failed to update garden');
                  } finally {
                    setEditLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-dark-text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-dark-text-primary">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="edit-imageUrl" className="block text-sm font-medium text-dark-text-primary">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="edit-imageUrl"
                    value={editFormData.imageUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-isPrivate"
                    checked={editFormData.isPrivate}
                    onChange={(e) => setEditFormData({ ...editFormData, isPrivate: e.target.checked })}
                    className="h-4 w-4 rounded bg-dark-bg-primary border-dark-border text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="edit-isPrivate" className="ml-2 block text-sm text-dark-text-primary">
                    Make this garden private
                  </label>
                </div>
                {editError && <div className="text-red-500 text-sm mt-1">{editError}</div>}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenEditModalGardenId(null)}
                    className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ))}
    </div>
  );
} 