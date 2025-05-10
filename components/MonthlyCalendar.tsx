import React, { useState, useRef } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

function getLogColor(type: string) {
  switch (type) {
    case "WATERING":
      return "bg-blue-600";
    case "ENVIRONMENTAL":
      return "bg-cyan-600";
    case "LST":
      return "bg-lime-600";
    case "HST":
      return "bg-green-700";
    case "HARVEST":
      return "bg-green-600";
    case "DRYING":
      return "bg-yellow-600 text-black";
    case "PEST STRESS DISEASE":
      return "bg-red-600";
    case "TRANSPLANT":
      return "bg-indigo-600";
    case "TRANSFER":
      return "bg-indigo-500";
    case "GERMINATION":
      return "bg-emerald-600";
    case "CLONING":
      return "bg-purple-600";
    case "TREATMENT":
      return "bg-pink-600";
    case "EQUIPMENT":
      return "bg-amber-500 text-black";
    default:
      return "bg-dark-bg-primary text-dark-text-secondary";
  }
}

interface CalendarProps {
  month?: Date; // Defaults to current month if not provided
  logsByDate?: { [date: string]: { id: string; title: string; notes?: string; type?: string }[] };
}

export const MonthlyCalendar: React.FC<CalendarProps> = ({ month: initialMonth, logsByDate }) => {
  const [month, setMonth] = useState<Date>(initialMonth || new Date());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearButtonRef = useRef<HTMLButtonElement>(null);
  const today = new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Year dropdown logic
  const currentYear = month.getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (yearButtonRef.current && !yearButtonRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    }
    if (yearDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [yearDropdownOpen]);

  // Generate all days to display in the calendar grid
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, today);
      const dateKey = format(day, "yyyy-MM-dd");
      const logs = logsByDate?.[dateKey] || [];

      days.push(
        <div
          key={day.toString()}
          className={`
            relative flex flex-col items-stretch justify-start border border-dark-border
            min-h-[100px] min-w-[100px] sm:min-h-[120px] sm:min-w-[120px] p-2
            ${isCurrentMonth ? "bg-dark-bg-primary text-dark-text-primary" : "bg-dark-bg-secondary text-dark-text-secondary opacity-60"}
            ${isToday && isCurrentMonth ? "ring-2 ring-garden-400" : ""}
            transition-all
          `}
        >
          {/* Plus icon in the top-right, no background */}
          <button
            className="absolute top-2 right-2 p-0 m-0 w-6 h-6 flex items-center justify-center text-garden-400 hover:text-garden-500 focus:outline-none"
            aria-label="Add"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="font-bold text-lg mb-2 text-garden-400">{formattedDate}</div>
          <div className="w-full flex-1 flex flex-col gap-1">
            {logs.map((log) => (
              <Link
                key={log.id}
                href={`/logs/${log.id}`}
                className={`${getLogColor(log.type || "")} rounded px-1 py-0.5 text-xs truncate cursor-pointer hover:underline`}
                title={log.notes || log.title}
              >
                {log.title}
              </Link>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 w-full" key={day.toString() + "row"}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="p-2 rounded-full hover:bg-dark-bg-primary text-garden-400"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-4xl sm:text-6xl font-extrabold tracking-tight text-garden-400 uppercase">
            {format(month, "MMMM")}
          </div>
          <div className="relative ml-2">
            <button
              ref={yearButtonRef}
              onClick={() => setYearDropdownOpen((open) => !open)}
              className="flex items-center text-4xl sm:text-6xl font-extrabold tracking-tight uppercase text-garden-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-garden-400 px-2"
              aria-haspopup="listbox"
              aria-expanded={yearDropdownOpen}
              type="button"
            >
              {month.getFullYear()}
              <ChevronDown className="ml-1 w-6 h-6 text-garden-400" />
            </button>
            {yearDropdownOpen && (
              <div className="absolute left-0 z-50 mt-2 w-full max-h-60 overflow-y-auto rounded bg-dark-bg-primary border border-garden-400 shadow-lg">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setMonth(new Date(month.setFullYear(y)));
                      setYearDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-2xl sm:text-4xl font-extrabold uppercase ${
                      y === month.getFullYear()
                        ? "bg-garden-400 text-dark-bg-primary"
                        : "text-garden-400 hover:bg-dark-bg-secondary"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="p-2 rounded-full hover:bg-dark-bg-primary text-garden-400"
          aria-label="Next Month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-dark-text-secondary uppercase py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        {rows}
      </div>
    </div>
  );
};

export default MonthlyCalendar; 