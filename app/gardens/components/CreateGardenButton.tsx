'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function CreateGardenButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true,
    imageUrl: '',
    zipcode: '',
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gardens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          router.push('/auth/signin');
          return;
        }
        throw new Error(data.error || 'Failed to create garden');
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating garden:', error);
      setError(error instanceof Error ? error.message : 'Failed to create garden');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create Garden
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-bg-secondary rounded-lg p-6 max-w-md w-full ring-1 ring-dark-border shadow-xl z-50">
            <h2 className="text-2xl font-bold mb-4 text-dark-text-primary">Create New Garden</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-dark-text-primary">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-dark-text-primary">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="zipcode" className="block text-sm font-medium text-dark-text-primary">
                    US Zipcode
                  </label>
                  <input
                    type="text"
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d{0,5}$/.test(value)) {
                        setFormData({ ...formData, zipcode: value });
                      }
                    }}
                    maxLength={5}
                    pattern="\d{5}"
                    className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. 90210"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="h-4 w-4 rounded bg-dark-bg-primary border-dark-border text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPrivate" className="ml-2 block text-sm text-dark-text-primary">
                    Make this garden private
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Garden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 