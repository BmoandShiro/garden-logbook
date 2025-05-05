"use client";

import { useState } from "react";
import LogsList from "@/app/logs/components/LogsList";

interface LogWithLocation {
  id: string;
  logDate: string | Date;
  type: string;
  notes?: string | null;
  plant?: { name: string };
  garden?: { name: string };
  room?: { name: string };
  zone?: { name: string };
  temperature?: number | null;
  temperatureUnit?: string;
  humidity?: number | null;
  waterAmount?: number | null;
  waterUnit?: string;
  height?: number | null;
  heightUnit?: string;
  width?: number | null;
  widthUnit?: string;
  healthRating?: number | null;
  data?: any;
  nutrientWaterTemperature?: number | null;
  nutrientWaterTemperatureUnit?: string;
  destinationGardenId?: string | null;
  destinationRoomId?: string | null;
  destinationZoneId?: string | null;
}

interface PlantLogsListWrapperProps {
  logs: LogWithLocation[];
}

export default function PlantLogsListWrapper({ logs: initialLogs }: PlantLogsListWrapperProps) {
  const [logs, setLogs] = useState(initialLogs);

  const handleLogDeleted = (deletedLogId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== deletedLogId));
  };

  return <LogsList logs={logs} onLogDeleted={handleLogDeleted} />;
} 