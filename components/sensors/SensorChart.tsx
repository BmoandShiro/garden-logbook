'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceArea, BrushProps } from 'recharts';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { GoveeReading } from '@prisma/client';
import { Button } from '../ui/button';
import { calculateVPD, formatVPD } from '@/lib/vpdCalculator';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

// Custom number input component with emerald arrows
const CustomNumberInput = ({ 
  placeholder, 
  onChange, 
  className = "" 
}: { 
  placeholder: string; 
  onChange: (value: number) => void; 
  className?: string;
}) => {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (newValue !== '') {
      onChange(parseFloat(newValue));
    }
  };

  const handleIncrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + 1;
    setValue(newValue.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - 1;
    setValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        type="number"
        step="0.1"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full px-2 py-1 text-xs bg-dark-bg-primary border border-dark-border rounded focus:border-garden-500 focus:ring-1 focus:ring-garden-500 focus:outline-none pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-button]:appearance-none"
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleIncrement}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pt-2"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={handleDecrement}
          className="flex items-center justify-center text-garden-500 hover:text-emerald-300 p-1 pb-2"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export function SensorChart({ deviceId }: SensorChartProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  // Y-axis range states for each chart
  const [tempRange, setTempRange] = useState<[number, number] | null>(null);
  const [humidityRange, setHumidityRange] = useState<[number, number] | null>(null);
  const [vpdRange, setVpdRange] = useState<[number, number] | null>(null);

  const setDateRange = (days: number) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDate({ from, to: new Date() });
  };

  const handleTempBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== brushData.endIndex) {
      const values = formattedData
        ?.slice(brushData.startIndex, brushData.endIndex + 1)
        .map((item: any) => item.temperature)
        .filter((val: any) => val !== null && val !== undefined);
      
      if (values && values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        setTempRange([min, max]);
      }
    } else {
      setTempRange(null);
    }
  };

  const handleHumidityBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== brushData.endIndex) {
      const values = formattedData
        ?.slice(brushData.startIndex, brushData.endIndex + 1)
        .map((item: any) => item.humidity)
        .filter((val: any) => val !== null && val !== undefined);
      
      if (values && values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        setHumidityRange([min, max]);
      }
    } else {
      setHumidityRange(null);
    }
  };

  const handleVpdBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== brushData.endIndex) {
      const values = formattedData
        ?.slice(brushData.startIndex, brushData.endIndex + 1)
        .map((item: any) => item.vpd)
        .filter((val: any) => val !== null && val !== undefined);
      
      if (values && values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        setVpdRange([min, max]);
      }
    } else {
      setVpdRange(null);
    }
  };

  const { data: chartData, isLoading, error } = useQuery<GoveeReading[]>({
    queryKey: ['sensorHistory', deviceId, date],
    queryFn: () => fetchSensorHistory(deviceId, date),
    enabled: !!deviceId,
  });

  const formattedData = chartData?.map((reading: any) => ({
    ...reading,
    timestamp: format(new Date(reading.timestamp), 'MM/dd HH:mm'),
    // Use stored VPD value if available, otherwise calculate it
    vpd: reading.vpd !== null ? reading.vpd : (reading.temperature && reading.humidity 
      ? calculateVPD(reading.temperature, reading.humidity)
      : undefined)
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
      <div className="flex items-start gap-2">
        <div className="w-32 flex-shrink-0 space-y-2">
          <div className="text-xs text-dark-text-secondary">Y-Axis Range</div>
          <CustomNumberInput
            placeholder="Max"
            onChange={(value) => {
              const min = tempRange ? tempRange[0] : Math.min(...formattedData?.map((d: any) => d.temperature) || [0]);
              setTempRange([min, value]);
            }}
          />
          <CustomNumberInput
            placeholder="Min"
            onChange={(value) => {
              const max = tempRange ? tempRange[1] : Math.max(...formattedData?.map((d: any) => d.temperature) || [0]);
              setTempRange([value, max]);
            }}
          />
          {tempRange && (
            <button
              onClick={() => setTempRange(null)}
              className="w-full text-xs text-red-400 hover:text-red-300"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
              <YAxis 
                stroke="#888" 
                domain={tempRange || ['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" dot={false} />
              <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
              <Brush dataKey="temperature" height={30} stroke="#ef4444" fill="#1a1b1e" onChange={handleTempBrushChange} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-emerald-100">Humidity (%)</h3>
      <div className="flex items-start gap-2">
        <div className="w-32 flex-shrink-0 space-y-2">
          <div className="text-xs text-dark-text-secondary">Y-Axis Range</div>
          <CustomNumberInput
            placeholder="Max"
            onChange={(value) => {
              const min = humidityRange ? humidityRange[0] : Math.min(...formattedData?.map((d: any) => d.humidity) || [0]);
              setHumidityRange([min, value]);
            }}
          />
          <CustomNumberInput
            placeholder="Min"
            onChange={(value) => {
              const max = humidityRange ? humidityRange[1] : Math.max(...formattedData?.map((d: any) => d.humidity) || [0]);
              setHumidityRange([value, max]);
            }}
          />
          {humidityRange && (
            <button
              onClick={() => setHumidityRange(null)}
              className="w-full text-xs text-red-400 hover:text-red-300"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
              <YAxis 
                stroke="#888" 
                domain={humidityRange || [0, 100]}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity" dot={false} />
              <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
              <Brush dataKey="humidity" height={30} stroke="#3b82f6" fill="#1a1b1e" onChange={handleHumidityBrushChange} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-emerald-100">VPD (kPa)</h3>
      <div className="flex items-start gap-2">
        <div className="w-32 flex-shrink-0 space-y-2">
          <div className="text-xs text-dark-text-secondary">Y-Axis Range</div>
          <CustomNumberInput
            placeholder="Max"
            onChange={(value) => {
              const min = vpdRange ? vpdRange[0] : Math.min(...formattedData?.map((d: any) => d.vpd) || [0]);
              setVpdRange([min, value]);
            }}
          />
          <CustomNumberInput
            placeholder="Min"
            onChange={(value) => {
              const max = vpdRange ? vpdRange[1] : Math.max(...formattedData?.map((d: any) => d.vpd) || [0]);
              setVpdRange([value, max]);
            }}
          />
          {vpdRange && (
            <button
              onClick={() => setVpdRange(null)}
              className="w-full text-xs text-red-400 hover:text-red-300"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="timestamp" stroke="#888" minTickGap={80} />
              <YAxis 
                stroke="#888" 
                domain={vpdRange || [0, 4]}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="vpd" stroke="#10b981" name="VPD" dot={false} />
              <Brush dataKey="timestamp" height={30} stroke="#888" fill="#1a1b1e" />
              <Brush dataKey="vpd" height={30} stroke="#10b981" fill="#1a1b1e" onChange={handleVpdBrushChange} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 