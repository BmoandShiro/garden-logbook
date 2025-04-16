'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateRoomButtonProps {
  gardenId: string;
}

export default function CreateRoomButton({ gardenId }: CreateRoomButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    dimensions: '',
    blueprintUrl: '',
    equipment: [] as { name: string; description: string }[],
    cleaningSOPs: [] as { title: string; description: string; frequency: string }[],
    maintenanceTasks: [] as { title: string; description: string; frequency: string; nextDueDate: string }[],
  });

  const roomTemplates = [
    {
      id: 'watering',
      name: 'Watering Room',
      description: 'Standard setup for water treatment and storage',
      defaultEquipment: [
        { name: 'RO System', description: 'Reverse osmosis water filtration system' },
        { name: 'Storage Tanks', description: 'Clean water storage tanks' },
      ],
      defaultSOPs: [
        {
          title: 'RO System Cleaning',
          description: 'Clean and sanitize RO system components',
          frequency: 'monthly',
        },
        {
          title: 'Tank Sanitization',
          description: 'Clean and sanitize water storage tanks',
          frequency: 'quarterly',
        },
      ],
      defaultMaintenance: [
        {
          title: 'Replace RO Filters',
          description: 'Replace all filters in the RO system',
          frequency: 'semi-annual',
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          title: 'RO Membrane Replacement',
          description: 'Replace the RO membrane',
          frequency: 'annual',
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ],
    },
    // Add more templates here
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = roomTemplates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        type: template.name,
        equipment: [...template.defaultEquipment],
        cleaningSOPs: [...template.defaultSOPs],
        maintenanceTasks: [...template.defaultMaintenance],
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/gardens/${gardenId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-garden-600 hover:bg-garden-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Create Room
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-bg-secondary rounded-lg p-6 max-w-2xl w-full ring-1 ring-dark-border shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-dark-text-primary">Create New Room</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-dark-text-primary mb-2">
                    Room Template (Optional)
                  </label>
                  <select
                    id="template"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                  >
                    <option value="">Select a template</option>
                    {roomTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-text-primary mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-dark-text-primary mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-dark-text-primary mb-2">
                    Room Type
                  </label>
                  <input
                    type="text"
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                  />
                </div>

                <div>
                  <label htmlFor="dimensions" className="block text-sm font-medium text-dark-text-primary mb-2">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                    placeholder="e.g., 20ft x 15ft"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="blueprint" className="block text-sm font-medium text-dark-text-primary mb-2">
                  Blueprint URL
                </label>
                <input
                  type="url"
                  id="blueprint"
                  value={formData.blueprintUrl}
                  onChange={(e) => setFormData({ ...formData, blueprintUrl: e.target.value })}
                  className="w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary shadow-sm focus:border-garden-500 focus:ring-garden-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-dark-text-secondary bg-dark-bg-primary border border-dark-border rounded-md hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-garden-600 border border-transparent rounded-md hover:bg-garden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 