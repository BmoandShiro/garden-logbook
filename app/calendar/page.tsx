"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import MonthlyCalendar from "../../components/MonthlyCalendar";
import { format } from "date-fns";
import { useState } from "react";

async function fetchLogs(userId: string) {
  const response = await fetch(`/api/logs?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}

async function fetchWeatherAlerts(month: string) {
  const response = await fetch(`/api/calendar/weather-alerts?month=${month}`);
  if (!response.ok) throw new Error("Failed to fetch weather alerts");
  return response.json();
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["calendar-logs", userId],
    queryFn: () => userId ? fetchLogs(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  // Fetch weather alerts for the current month
  const { data: weatherAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["calendar-weather-alerts", calendarMonth, userId],
    queryFn: () => userId ? fetchWeatherAlerts(calendarMonth) : Promise.resolve([]),
    enabled: !!userId,
  });

  // Group logs by date string
  const logsByDate = (logs || []).reduce((acc: any, log: any) => {
    const dateKey = format(new Date(log.logDate), "yyyy-MM-dd");
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push({
      id: log.id,
      title: log.type || "Log",
      notes: log.notes,
      type: log.type,
    });
    return acc;
  }, {});

  // Map weather alerts by date for easy lookup
  const weatherAlertsByDate = (weatherAlerts || []).reduce((acc: any, alert: any) => {
    acc[alert.date] = alert;
    return acc;
  }, {});

  // Handler to update month (for MonthlyCalendar navigation)
  function handleMonthChange(newMonth: Date) {
    setCalendarMonth(`${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 bg-dark-bg-secondary">
      <MonthlyCalendar
        logsByDate={logsByDate}
        weatherAlertsByDate={weatherAlertsByDate}
        monthChange={handleMonthChange}
      />
      {isLoading && <div className="text-dark-text-secondary mt-4">Loading logs...</div>}
      {loadingAlerts && <div className="text-dark-text-secondary mt-4">Loading weather alerts...</div>}
    </div>
  );
} 