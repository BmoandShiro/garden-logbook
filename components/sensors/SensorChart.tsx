'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { GoveeReading } from '@prisma/client';
import { Button } from '../ui/button';
import { calculateVPD, formatVPD } from '@/lib/vpdCalculator';

interface SensorChartProps {
  deviceId: string;
}

async function fetchSensorHistory(deviceId: string, dateRange: DateRange | undefined): Promise<GoveeReading[]> {
  const params = new URLSearchParams();
  // Set default range if none is provided
  const from = dateRange?.from || new Date(new Date().setDate(new Date().getDate() - 7));
  const to = dateRange?.to || new Date();
  
  params.append('startDate', from.toISOString());
  params.append('endDate', to.toISOString());

  const response = await fetch(`/api/sensors/${deviceId}/history?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sensor history');
  }
  return response.json();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-dark-bg-secondary border border-dark-border rounded-lg shadow-lg">
        <p className="label text-dark-text-secondary">{`Time : ${label}`}</p>
        <p className="intro text-emerald-300">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export function SensorChart({ deviceId }: SensorChartProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const setDateRange = (days: number) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDate({ from, to: new Date() });
  };

  const { data: chartData, isLoading, error } = useQuery<GoveeReading[]>({
    queryKey: ['sensorHistory', deviceId, date],
    queryFn: () => fetchSensorHistory(deviceId, date),
    enabled: !!deviceId,
  });

  const formattedData = chartData?.map(reading => ({
    ...reading,
    timestamp: format(new Date(reading.timestamp), 'MM/dd HH:mm'),
    vpd: reading.temperature && reading.humidity 
      ? calculateVPD(reading.temperature, reading.humidity)
      : undefined
  }));

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;

  return (
    <div className="space-y-4 p-4 bg-dark-bg-secondary rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <DatePickerWithRange date={date} setDate={setDate} />
        <div className="flex items-center gap-2">
          <Button variant="dark-outline" size="sm" onClick={() => setDateRange(1)}>1D</Button>
          <Button variant="dark-outline" size="sm" onClick={() => setDateRange(7)}>7D</Button>
          <Button variant="dark-outline" size="sm" onClick={() => setDateRange(30)}>1M</Button>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-emerald-100">Temperature (°F)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
          <YAxis stroke="#888" domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" dot={false} />
           <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
        </LineChart>
      </ResponsiveContainer>

      <h3 className="text-lg font-semibold text-emerald-100">Humidity (%)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
          <YAxis stroke="#888" domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity" dot={false} />
           <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
        </LineChart>
      </ResponsiveContainer>

      <h3 className="text-lg font-semibold text-emerald-100">VPD (kPa)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
          <YAxis stroke="#888" domain={['dataMin - 0.1', 'dataMax + 0.1']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="vpd" stroke="#10b981" name="VPD" dot={false} />
           <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 