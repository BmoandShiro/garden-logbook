'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { GoveeReading } from '@prisma/client';

interface SensorChartProps {
  deviceId: string;
}

async function fetchSensorHistory(deviceId: string, dateRange: DateRange | undefined): Promise<GoveeReading[]> {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('startDate', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('endDate', dateRange.to.toISOString());
  }
  const response = await fetch(`/api/sensors/${deviceId}/history?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sensor history');
  }
  return response.json();
}

export function SensorChart({ deviceId }: SensorChartProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const { data: chartData, isLoading, error } = useQuery<GoveeReading[]>({
    queryKey: ['sensorHistory', deviceId, date],
    queryFn: () => fetchSensorHistory(deviceId, date),
    enabled: !!deviceId,
  });

  const formattedData = chartData?.map(reading => ({
    ...reading,
    timestamp: format(new Date(reading.timestamp), 'MM/dd HH:mm'),
  }));

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;

  return (
    <div className="space-y-4 p-4 bg-dark-bg-tertiary rounded-lg">
      <DatePickerWithRange date={date} setDate={setDate} />
      
      <h3 className="text-lg font-semibold text-emerald-100">Temperature (°F)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <h3 className="text-lg font-semibold text-emerald-100">Humidity (%)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} />
          <Legend />
          <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 