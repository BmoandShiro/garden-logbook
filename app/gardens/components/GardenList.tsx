'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from "@prisma/client";
import DeleteButton from '../../components/DeleteButton';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Settings, MoreVertical, ChevronDown, ChevronUp, Cloud, CloudSun, CloudLightning } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LogsListWrapper from '@/app/logs/components/LogsListWrapper';
import LogToggleButton from './LogToggleButton';

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
    user?: User;
  }[];
  _count: {
    rooms: number;
    members: number;
  };
  gardenInvites?: { id: string; email: string }[];
  zipcode?: string;
  weatherStatus?: {
    hasAlerts: boolean;
    alertCount: number;
    lastChecked: Date;
  };
}

interface GardenListProps {
  gardens: ExtendedGarden[];
  logsByGardenId: Record<string, any[]>;
}

export function GardenList({ gardens, logsByGardenId }: GardenListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [openModalGardenId, setOpenModalGardenId] = useState<string | null>(null);
  const [openInviteModalGardenId, setOpenInviteModalGardenId] = useState<string | null>(null);
  const [openEditModalGardenId, setOpenEditModalGardenId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', imageUrl: '', isPrivate: true, zipcode: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showInviteFormGardenId, setShowInviteFormGardenId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    gardens.forEach(g => { initial[g.id] = true; });
    return initial;
  });
  const [openManageMembersGardenId, setOpenManageMembersGardenId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string } | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [cancelInviteLoading, setCancelInviteLoading] = useState<string | null>(null);
  const [cancelInviteError, setCancelInviteError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, any[]>>({});
  const [alertsLoading, setAlertsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    gardens.forEach(garden => {
      setAlertsLoading(a => ({ ...a, [garden.id]: true }));
      fetch(`/api/gardens/${garden.id}/weather-alerts`)
        .then(res => res.json())
        .then(data => {
          setActiveAlerts(a => ({ ...a, [garden.id]: data.alerts || [] }));
        })
        .catch(() => {
          setActiveAlerts(a => ({ ...a, [garden.id]: [] }));
        })
        .finally(() => {
          setAlertsLoading(a => ({ ...a, [garden.id]: false }));
        });
    });
  }, [gardens]);

  useEffect(() => {
    if (openEditModalGardenId) {
      const garden = gardens.find(g => g.id === openEditModalGardenId);
      if (garden) {
        setEditFormData({
          name: garden.name || '',
          description: garden.description || '',
          imageUrl: garden.imageUrl || '',
          isPrivate: garden.isPrivate,
          zipcode: garden.zipcode || '',
        });
      }
    }
  }, [openEditModalGardenId, gardens]);

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
      {gardens.map((garden) => {
        const alerts = activeAlerts[garden.id] || [];
        // Deduplicate alerts for the current user by (plantId, alertType)
        const userId = session?.user?.id;
        const userAlerts = userId ? alerts.filter((alert: any) => alert.userId === userId) : alerts;
        const uniquePlantAlertPairs = new Set<string>();
        userAlerts.forEach((alert: any) => {
          const plantId = alert.meta?.plantId;
          const alertTypes = alert.meta?.alertTypes || [];
          alertTypes.forEach((type: string) => {
            if (plantId && type) {
              uniquePlantAlertPairs.add(`${plantId}:${type}`);
            }
          });
        });
        const alertCount = uniquePlantAlertPairs.size;
        return (
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
              {/* Weather status cloud icon */}
              <span
                title={alertsLoading[garden.id]
                  ? 'Checking weather alerts...'
                  : alertCount > 0
                    ? `${alertCount} weather alert${alertCount === 1 ? '' : 's'}`
                    : 'All conditions safe'}
                className="inline-flex items-center justify-center"
              >
                {alertsLoading[garden.id]
                  ? <Cloud className="w-5 h-5 text-gray-400 animate-pulse" />
                  : alertCount > 0
                    ? <CloudLightning className="w-5 h-5 text-red-500" />
                    : <CloudSun className="w-5 h-5 text-green-400" />}
              </span>
              {/* Gear/settings button for garden */}
              <button
                className="inline-flex items-center justify-center rounded-full p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                title="Garden Settings"
                onClick={() => setOpenModalGardenId(garden.id)}
              >
                <Settings className="h-5 w-5" />
              </button>
              {/* Kebab (3 vertical dots) button for edit modal */}
              <button
                className="inline-flex items-center justify-center rounded-full p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                title="Edit Garden"
                onClick={() => setOpenEditModalGardenId(garden.id)}
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <LogToggleButton gardenId={garden.id} />
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
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-emerald-100 group-hover:text-emerald-50">{garden.name}</h3>
                  {alertCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${alertCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        title={alertCount > 0
                          ? `${alertCount} weather alert${alertCount === 1 ? '' : 's'}`
                          : 'All conditions safe'}
                      />
                      <span className="text-xs text-emerald-300/70">
                        {alertCount > 0
                          ? `${alertCount} alert${alertCount === 1 ? '' : 's'}`
                          : 'All clear'}
                      </span>
                    </div>
                  )}
                </div>
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
            <Dialog open={openModalGardenId === garden.id} onOpenChange={(open: boolean) => setOpenModalGardenId(open ? garden.id : null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{garden.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <button
                    className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-4 py-2 rounded-md font-medium"
                    onClick={() => {
                      setEditFormData({
                        name: garden.name,
                        description: garden.description || '',
                        imageUrl: garden.imageUrl || '',
                        isPrivate: garden.isPrivate,
                        zipcode: garden.zipcode || '',
                      });
                      setOpenEditModalGardenId(garden.id);
                    }}
                  >
                    Edit Garden
                  </button>
                  <button
                    className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-4 py-2 rounded-md font-medium"
                    onClick={() => setOpenManageMembersGardenId(garden.id)}
                  >
                    Manage Garden Members
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Invite Modal for this garden */}
            <Dialog open={openInviteModalGardenId === garden.id} onOpenChange={(open: boolean) => setOpenInviteModalGardenId(open ? garden.id : null)}>
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
                  <label htmlFor="invite-email" className="text-sm font-medium text-dark-text-primary">Email address to invite:</label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="rounded-md border border-dark-border px-3 py-2 bg-dark-bg-primary text-white focus:ring-2 focus:ring-blue-400"
                    required
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
            <Dialog open={openEditModalGardenId === garden.id} onOpenChange={(open: boolean) => setOpenEditModalGardenId(open ? garden.id : null)}>
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
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
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
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
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
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-zipcode" className="block text-sm font-medium text-dark-text-primary">
                      US Zipcode
                    </label>
                    <input
                      type="text"
                      id="edit-zipcode"
                      value={editFormData.zipcode}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d{0,5}$/.test(value)) {
                          setEditFormData({ ...editFormData, zipcode: value });
                        }
                      }}
                      maxLength={5}
                      pattern="\d{5}"
                      className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="e.g. 90210"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isPrivate"
                      checked={editFormData.isPrivate}
                      onChange={(e) => setEditFormData({ ...editFormData, isPrivate: e.target.checked })}
                      className="h-4 w-4 rounded bg-dark-bg-primary border-dark-border text-emerald-600 focus:ring-emerald-500"
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
                      className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {/* Recent Logs for this garden */}
            {logsByGardenId[garden.id] && logsByGardenId[garden.id].length > 0 && (
              <div className="p-4 border-t border-emerald-800 bg-dark-bg-secondary">
                <button
                  className="flex items-center w-full text-left text-sm font-semibold text-emerald-100 mb-2 focus:outline-none"
                  onClick={() => setExpandedLogs(prev => ({ ...prev, [garden.id]: !prev[garden.id] }))}
                  aria-expanded={expandedLogs[garden.id]}
                  aria-controls={`logs-list-${garden.id}`}
                >
                  <span className="flex-1">Recent Logs</span>
                  {expandedLogs[garden.id] ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </button>
                {expandedLogs[garden.id] && (
                  <div id={`logs-list-${garden.id}`}> <LogsListWrapper logs={logsByGardenId[garden.id]} /> </div>
                )}
              </div>
            )}
            {/* Manage Members Modal for this garden */}
            <Dialog open={openManageMembersGardenId === garden.id} onOpenChange={(open: boolean) => setOpenManageMembersGardenId(open ? garden.id : null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Members of {garden.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  {/* Invite Member Form */}
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
                    className="flex flex-col gap-2 mb-4"
                  >
                    <label htmlFor="invite-email" className="text-sm font-medium text-dark-text-primary">Invite by email:</label>
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="rounded-md border border-dark-border px-3 py-2 bg-dark-bg-primary text-white focus:ring-2 focus:ring-emerald-400"
                      required
                      disabled={inviteLoading}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={inviteLoading}
                      >
                        {inviteLoading ? 'Inviting...' : 'Send Invite'}
                      </button>
                    </div>
                    {inviteError && <div className="text-red-500 text-sm mt-1">{inviteError}</div>}
                    {inviteSuccess && <div className="text-green-500 text-sm mt-1">Invite sent!</div>}
                  </form>
                  {/* Members List */}
                  {garden.members.length === 0 ? (
                    <div className="text-emerald-300/70">No members in this garden.</div>
                  ) : (
                    <ul className="divide-y divide-emerald-800">
                      {garden.members.map((member) => {
                        const user = member.user || member;
                        return (
                          <li key={user.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <img src={user.image} alt={user.name || user.email || 'Member'} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 text-sm font-bold">
                                  {user.name?.[0] || user.email?.[0] || '?'}
                                </div>
                              )}
                              <div>
                                <div className="text-emerald-100 font-medium">{user.name || user.email || 'Unknown member'}</div>
                                {user.email && user.name && (
                                  <div className="text-emerald-300/70 text-xs">{user.email}</div>
                                )}
                              </div>
                            </div>
                            {user.id !== (garden.createdBy.id || '') && (
                              <button
                                className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                                disabled={removeLoading === user.id}
                                onClick={() => setConfirmRemove({ memberId: user.id, memberName: user.name || user.email || 'this member' })}
                              >
                                {removeLoading === user.id ? 'Removing...' : 'Remove'}
                              </button>
                            )}
                            {user.id === (garden.createdBy.id || '') && (
                              <span className="text-xs text-emerald-400 ml-2">Creator</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {removeError && <div className="text-red-500 text-sm mt-2">{removeError}</div>}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover"
                      onClick={() => setOpenManageMembersGardenId(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
                {/* Pending Invites Dropdown */}
                {garden.gardenInvites && garden.gardenInvites.length > 0 && (
                  <div className="mb-2">
                    <button
                      className="text-blue-400 hover:underline text-sm mb-1"
                      onClick={() => setShowInvites((v) => !v)}
                    >
                      {showInvites ? 'Hide' : 'Show'} Pending Invites ({garden.gardenInvites.length})
                    </button>
                    {showInvites && (
                      <ul className="bg-dark-bg-secondary border border-dark-border rounded-md p-2 mt-1 divide-y divide-dark-border">
                        {garden.gardenInvites.map((invite: any) => (
                          <li key={invite.id} className="flex items-center justify-between py-1">
                            <span className="text-emerald-200 text-sm">{invite.email}</span>
                            <div className="flex flex-col items-end">
                              <button
                                className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                disabled={cancelInviteLoading === invite.id}
                                onClick={async () => {
                                  setCancelInviteLoading(invite.id);
                                  setCancelInviteError(null);
                                  try {
                                    const res = await fetch(`/api/gardens/${garden.id}/invites/${invite.id}`, { method: 'DELETE' });
                                    if (!res.ok) {
                                      const data = await res.json();
                                      throw new Error(data.error || 'Failed to cancel invite');
                                    }
                                    toast.success('Invite cancelled');
                                    router.refresh();
                                  } catch (err) {
                                    setCancelInviteError(err instanceof Error ? err.message : 'Failed to cancel invite');
                                    toast.error(err instanceof Error ? err.message : 'Failed to cancel invite');
                                  } finally {
                                    setCancelInviteLoading(null);
                                  }
                                }}
                              >
                                {cancelInviteLoading === invite.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                              {cancelInviteError && cancelInviteLoading === null && (
                                <div className="text-red-500 text-xs mt-1">{cancelInviteError}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {/* Confirm Remove Dialog */}
                {confirmRemove && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-emerald-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                      <h3 className="text-lg font-medium text-emerald-100 mb-4">Remove Member</h3>
                      <p className="text-emerald-200 mb-6">Are you sure you want to remove <span className="font-bold">{confirmRemove.memberName}</span> from this garden?</p>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-4 py-2 text-sm font-medium text-emerald-100 hover:text-white focus:outline-none"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            setRemoveLoading(confirmRemove.memberId);
                            setRemoveError(null);
                            try {
                              const res = await fetch(`/api/gardens/${garden.id}/members/${confirmRemove.memberId}`, {
                                method: 'DELETE',
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                throw new Error(data.error || 'Failed to remove member');
                              }
                              setConfirmRemove(null);
                              setOpenManageMembersGardenId(null);
                              router.refresh();
                              toast.success('Member removed successfully');
                            } catch (err) {
                              setRemoveError(err instanceof Error ? err.message : 'Failed to remove member');
                            } finally {
                              setRemoveLoading(null);
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          disabled={removeLoading === confirmRemove.memberId}
                        >
                          {removeLoading === confirmRemove.memberId ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        );
      })}
    </div>
  );
} 