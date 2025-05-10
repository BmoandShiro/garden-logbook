"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import MonthlyCalendar from "../../components/MonthlyCalendar";
import { format } from "date-fns";

async function fetchLogs(userId: string) {
  const response = await fetch(`/api/logs?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["calendar-logs", userId],
    queryFn: () => userId ? fetchLogs(userId) : Promise.resolve([]),
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 bg-dark-bg-secondary">
      <MonthlyCalendar logsByDate={logsByDate} />
      {isLoading && <div className="text-dark-text-secondary mt-4">Loading logs...</div>}
    </div>
  );
} 