'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateRoomButtonProps {
  gardenId: string;
}

interface Equipment {
  name: string;
  description: string;
}

interface CleaningSOP {
  title: string;
  description: string;
  frequency: string;
}

interface MaintenanceTask {
  title: string;
  description: string;
  frequency: string;
  nextDueDate: string;
}

export default function CreateRoomButton({ gardenId }: CreateRoomButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Room basic details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [dimensions, setDimensions] = useState('');
  
  // Equipment list
  const [equipment, setEquipment] = useState<Equipment[]>([{ name: '', description: '' }]);
  
  // Cleaning SOPs
  const [cleaningSOPs, setCleaningSOPs] = useState<CleaningSOP[]>([
    { title: '', description: '', frequency: 'daily' }
  ]);
  
  // Maintenance tasks
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    { 
      title: '', 
      description: '', 
      frequency: 'weekly',
      nextDueDate: new Date().toISOString().split('T')[0]
    }
  ]);

  const addEquipment = () => {
    setEquipment([...equipment, { name: '', description: '' }]);
  };

  const updateEquipment = (index: number, field: keyof Equipment, value: string) => {
    const newEquipment = [...equipment];
    newEquipment[index] = { ...newEquipment[index], [field]: value };
    setEquipment(newEquipment);
  };

  const addCleaningSOP = () => {
    setCleaningSOPs([...cleaningSOPs, { title: '', description: '', frequency: 'daily' }]);
  };

  const updateCleaningSOP = (index: number, field: keyof CleaningSOP, value: string) => {
    const newSOPs = [...cleaningSOPs];
    newSOPs[index] = { ...newSOPs[index], [field]: value };
    setCleaningSOPs(newSOPs);
  };

  const addMaintenanceTask = () => {
    setMaintenanceTasks([
      ...maintenanceTasks, 
      { 
        title: '', 
        description: '', 
        frequency: 'weekly',
        nextDueDate: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const updateMaintenanceTask = (index: number, field: keyof MaintenanceTask, value: string) => {
    const newTasks = [...maintenanceTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setMaintenanceTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/gardens/${gardenId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          type,
          dimensions,
          equipment: equipment.filter(e => e.name.trim() !== ''),
          cleaningSOPs: cleaningSOPs.filter(sop => sop.title.trim() !== ''),
          maintenanceTasks: maintenanceTasks.filter(task => task.title.trim() !== ''),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        let errorMessage = 'Failed to create room';
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(error);
          errorMessage = errorData.message || errorData.error || error;
          console.error('Room creation error:', errorData);
        } catch {
          // If parsing fails, use the raw error text
          console.error('Room creation error:', error);
          errorMessage = error;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setIsOpen(false);
      router.refresh();
      toast.success('Room created successfully');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Room / Plot
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-dark-bg-primary p-6 text-left align-middle shadow-xl transition-all border border-dark-border">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-dark-text-primary">
                    Create New Room / Plot
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    {/* Basic Details Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-garden-400">Basic Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm text-dark-text-secondary">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="type" className="block text-sm text-dark-text-secondary">
                            Type
                          </label>
                          <input
                            type="text"
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="mt-1 block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm text-dark-text-secondary">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="dimensions" className="block text-sm text-dark-text-secondary">
                          Dimensions
                        </label>
                        <input
                          type="text"
                          id="dimensions"
                          value={dimensions}
                          onChange={(e) => setDimensions(e.target.value)}
                          placeholder="e.g., 10ft x 12ft"
                          className="mt-1 block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                        />
                      </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-garden-400">Equipment</h4>
                        <button
                          type="button"
                          onClick={addEquipment}
                          className="text-sm text-garden-400 hover:text-garden-300"
                        >
                          + Add Equipment
                        </button>
                      </div>
                      {equipment.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                            placeholder="Equipment name"
                            className="block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateEquipment(index, 'description', e.target.value)}
                            placeholder="Equipment description"
                            className="block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Cleaning SOPs Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-garden-400">Cleaning SOPs</h4>
                        <button
                          type="button"
                          onClick={addCleaningSOP}
                          className="text-sm text-garden-400 hover:text-garden-300"
                        >
                          + Add SOP
                        </button>
                      </div>
                      {cleaningSOPs.map((sop, index) => (
                        <div key={index} className="space-y-2">
                          <input
                            type="text"
                            value={sop.title}
                            onChange={(e) => updateCleaningSOP(index, 'title', e.target.value)}
                            placeholder="SOP title"
                            className="block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          />
                          <textarea
                            value={sop.description}
                            onChange={(e) => updateCleaningSOP(index, 'description', e.target.value)}
                            placeholder="SOP description"
                            rows={2}
                            className="block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          />
                          <select
                            value={sop.frequency}
                            onChange={(e) => updateCleaningSOP(index, 'frequency', e.target.value)}
                            className="block w-full rounded-md bg-dark-bg-secondary border-dark-border text-dark-text-primary focus:border-garden-400 focus:ring-garden-400"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Maintenance Tasks Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-garden-400">Maintenance Tasks</h4>
                        <button
                          type="button"
                          onClick={addMaintenanceTask}
                          className="text-sm text-garden-400 hover:text-garden-300"
                        >
                          Add Task
                        </button>
                      </div>
                      {maintenanceTasks.map((task, index) => (
                        <div key={index} className="space-y-4 p-4 bg-dark-bg-secondary rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-dark-text-secondary">Title</label>
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateMaintenanceTask(index, 'title', e.target.value)}
                                className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-dark-text-secondary">Frequency</label>
                              <select
                                value={task.frequency}
                                onChange={(e) => updateMaintenanceTask(index, 'frequency', e.target.value)}
                                className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary"
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-dark-text-secondary">Description</label>
                            <textarea
                              value={task.description}
                              onChange={(e) => updateMaintenanceTask(index, 'description', e.target.value)}
                              rows={2}
                              className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-dark-text-secondary">Next Due Date</label>
                            <input
                              type="date"
                              value={task.nextDueDate}
                              onChange={(e) => updateMaintenanceTask(index, 'nextDueDate', e.target.value)}
                              className="mt-1 block w-full rounded-md bg-dark-bg-primary border-dark-border text-dark-text-primary"
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-md bg-dark-bg-secondary px-4 py-2 text-sm font-medium text-dark-text-secondary hover:bg-dark-bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-border focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-garden-400 px-4 py-2 text-sm font-bold text-dark-bg-primary hover:bg-garden-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-garden-400 focus-visible:ring-offset-2 disabled:bg-garden-800 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Room / Plot'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 