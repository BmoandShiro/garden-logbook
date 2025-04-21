'use client';

import { LogType } from '@prisma/client';

interface LogFiltersProps {
  filters: {
    type: string;
    startDate: string;
    endDate: string;
    location: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function LogFilters({ filters, onFilterChange }: LogFiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-dark-bg-secondary rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Log Type Filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-dark-text-primary mb-1">
            Log Type
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="">All Types</option>
            {Object.values(LogType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-dark-text-primary mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-dark-text-primary mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          />
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-dark-text-primary mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Search location..."
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
} 