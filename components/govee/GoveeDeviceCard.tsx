import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoveeDevice, GoveeReading } from "@prisma/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GoveeDeviceCardProps {
  device: GoveeDevice & {
    readings: GoveeReading[];
  };
  onEdit?: (device: GoveeDevice) => void;
}

export function GoveeDeviceCard({ device, onEdit }: GoveeDeviceCardProps) {
  const latestReading = device.readings[device.readings.length - 1];
  const chartData = device.readings.map(reading => ({
    timestamp: new Date(reading.timestamp).toLocaleTimeString(),
    temperature: reading.temperature,
    humidity: reading.humidity,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{device.name}</span>
          {onEdit && (
            <button
              onClick={() => onEdit(device)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="text-2xl font-bold">
              {latestReading?.temperature.toFixed(1)}°C
            </p>
            {device.minTemp && device.maxTemp && (
              <p className="text-xs text-gray-400">
                Range: {device.minTemp}°C - {device.maxTemp}°C
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Humidity</p>
            <p className="text-2xl font-bold">
              {latestReading?.humidity.toFixed(1)}%
            </p>
            {device.minHumidity && device.maxHumidity && (
              <p className="text-xs text-gray-400">
                Range: {device.minHumidity}% - {device.maxHumidity}%
              </p>
            )}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="#8884d8"
                name="Temperature (°C)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                stroke="#82ca9d"
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {device.battery !== null && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Battery</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${device.battery}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 