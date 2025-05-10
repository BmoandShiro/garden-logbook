"use client";

import MonthlyCalendar from "../../components/MonthlyCalendar";

export default function CalendarPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 bg-dark-bg-secondary">
      <MonthlyCalendar />
    </div>
  );
} 