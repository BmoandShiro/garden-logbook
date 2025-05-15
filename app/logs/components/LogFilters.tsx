'use client';

import { useState, useEffect } from 'react';
import { LogType } from '@prisma/client';

interface LogFiltersProps {
  filters: {
    type?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
    gardenId?: string;
    roomId?: string;
    zoneId?: string;
    plantId?: string;
  };
  onFilterChange: (filters: any) => void;
  gardens: Array<{ id: string; name: string }>;
  rooms: Array<{ id: string; name: string; gardenId: string }>;
  zones: Array<{ id: string; name: string; roomId: string }>;
  plants: Array<{ id: string; name: string; zoneId: string }>;
}

export default function LogFilters({ filters, onFilterChange, gardens = [], rooms = [], zones = [], plants = [] }: LogFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword || '');

  // Filter rooms/zones/plants based on parent selection
  const filteredRooms = filters.gardenId ? rooms.filter(r => r.gardenId === filters.gardenId) : rooms;
  const filteredZones = filters.roomId ? zones.filter(z => z.roomId === filters.roomId) : zones;
  const filteredPlants = filters.zoneId ? plants.filter(p => p.zoneId === filters.zoneId) : plants;

  const handleChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange({ ...filters, keyword });
    }
  };

  return (
    <div className="bg-dark-bg-secondary rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Keyword Search */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-dark-text-primary mb-1">
            Search
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder="Search logs, notes, location, etc..."
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          />
        </div>
        {/* Log Type Filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-dark-text-primary mb-1">
            Log Type
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={e => handleChange('type', e.target.value)}
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
            onChange={e => handleChange('startDate', e.target.value)}
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
            onChange={e => handleChange('endDate', e.target.value)}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          />
        </div>
        {/* Garden Dropdown */}
        <div>
          <label htmlFor="gardenId" className="block text-sm font-medium text-dark-text-primary mb-1">
            Garden
          </label>
          <select
            id="gardenId"
            value={filters.gardenId || ''}
            onChange={e => handleChange('gardenId', e.target.value)}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="">All Gardens</option>
            {gardens.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        {/* Room Dropdown */}
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-dark-text-primary mb-1">
            Room/Plot
          </label>
          <select
            id="roomId"
            value={filters.roomId || ''}
            onChange={e => handleChange('roomId', e.target.value)}
            disabled={!filters.gardenId}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="">All Rooms/Plots</option>
            {filteredRooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        {/* Zone Dropdown */}
        <div>
          <label htmlFor="zoneId" className="block text-sm font-medium text-dark-text-primary mb-1">
            Zone
          </label>
          <select
            id="zoneId"
            value={filters.zoneId || ''}
            onChange={e => handleChange('zoneId', e.target.value)}
            disabled={!filters.roomId}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="">All Zones</option>
            {filteredZones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        {/* Plant Dropdown */}
        <div>
          <label htmlFor="plantId" className="block text-sm font-medium text-dark-text-primary mb-1">
            Plant
          </label>
          <select
            id="plantId"
            value={filters.plantId || ''}
            onChange={e => handleChange('plantId', e.target.value)}
            disabled={!filters.zoneId}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            <option value="">All Plants</option>
            {filteredPlants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 