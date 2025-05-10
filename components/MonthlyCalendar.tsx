import React, { useState, useRef } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

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
  const [customNotes, setCustomNotes] = useState<{ [date: string]: string[] }>({});
  const [popoverFor, setPopoverFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const popoverInputRef = useRef<HTMLInputElement>(null);
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

  const { data: session } = useSession();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedGarden, setSelectedGarden] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);

  const popoverContainerRef = useRef<HTMLDivElement>(null);
  const [calendarNotes, setCalendarNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Fetch locations on popover open
  React.useEffect(() => {
    if (popoverFor && session?.user?.id && locations.length === 0) {
      fetch(`/api/locations?userId=${session.user.id}`)
        .then(res => res.json())
        .then(setLocations)
        .catch(() => setLocations([]));
    }
  }, [popoverFor, session, locations.length]);

  // Fetch notes for the current month
  React.useEffect(() => {
    if (!session?.user) return;
    setLoadingNotes(true);
    setNotesError(null);
    fetch(`/api/calendar-notes`)
      .then(res => res.json())
      .then(data => {
        setCalendarNotes(Array.isArray(data) ? data : []);
        setLoadingNotes(false);
      })
      .catch(() => {
        setNotesError('Failed to load notes');
        setLoadingNotes(false);
      });
  }, [month, session]);

  // Filtered dropdown options
  const gardens = locations.filter(loc => loc.type === "garden");
  const rooms = locations.filter(loc => loc.type === "room" && (!selectedGarden || loc.path[0] === gardens.find(g => g.id === selectedGarden)?.name));
  const zones = locations.filter(loc => loc.type === "zone" && (!selectedRoom || loc.path[1] === rooms.find(r => r.id === selectedRoom)?.name));

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (yearButtonRef.current && !yearButtonRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
      // Close popover if clicking outside the popover container
      if (popoverFor && popoverContainerRef.current && !popoverContainerRef.current.contains(e.target as Node)) {
        setPopoverFor(null);
        setNoteText("");
        setSelectedGarden("");
        setSelectedRoom("");
        setSelectedZone("");
        setIsPrivate(false);
      }
    }
    if (yearDropdownOpen || popoverFor) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [yearDropdownOpen, popoverFor]);

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
            onClick={() => {
              setPopoverFor(dateKey);
              setTimeout(() => popoverInputRef.current?.focus(), 50);
            }}
          >
            <Plus className="w-5 h-5" />
          </button>
          {/* Popover for adding a note */}
          {popoverFor === dateKey && (
            <div ref={popoverContainerRef} className="absolute z-50 top-10 right-2 bg-dark-bg-secondary border border-dark-border rounded shadow-lg p-2 flex flex-col gap-2 w-64">
              <input
                ref={popoverInputRef}
                type="text"
                className="w-full px-2 py-1 rounded bg-dark-bg-primary text-dark-text-primary border border-dark-border focus:outline-none"
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && noteText.trim()) {
                    handleAddNote();
                  } else if (e.key === "Escape") {
                    handleCancelNote();
                  }
                }}
              />
              {/* Garden/Room/Zone dropdowns */}
              <select
                className="w-full px-2 py-1 rounded bg-dark-bg-primary text-dark-text-primary border border-dark-border"
                value={selectedGarden}
                onChange={e => {
                  setSelectedGarden(e.target.value);
                  setSelectedRoom("");
                  setSelectedZone("");
                }}
              >
                <option value="">All Gardens</option>
                {gardens.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <select
                className="w-full px-2 py-1 rounded bg-dark-bg-primary text-dark-text-primary border border-dark-border"
                value={selectedRoom}
                onChange={e => {
                  setSelectedRoom(e.target.value);
                  setSelectedZone("");
                }}
                disabled={!selectedGarden}
              >
                <option value="">All Rooms</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select
                className="w-full px-2 py-1 rounded bg-dark-bg-primary text-dark-text-primary border border-dark-border"
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                disabled={!selectedRoom}
              >
                <option value="">All Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none group">
                <span className="relative inline-block w-5 h-5 align-middle">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="opacity-0 absolute w-5 h-5 cursor-pointer z-10"
                    tabIndex={0}
                  />
                  <span className={`block w-5 h-5 rounded bg-dark-bg-primary border border-dark-border transition-colors duration-150 ${isPrivate ? 'border-garden-400' : ''}`}></span>
                  {isPrivate && (
                    <span className="absolute left-0 top-0 w-5 h-5 flex items-center justify-center pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="3" y1="3" x2="13" y2="13" stroke="#22c55e" strokeWidth="2"/>
                        <line x1="13" y1="3" x2="3" y2="13" stroke="#22c55e" strokeWidth="2"/>
                      </svg>
                    </span>
                  )}
                </span>
                <span className="text-dark-text-secondary">Private (only you can see this note)</span>
              </label>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-2 py-1 rounded bg-garden-400 text-dark-bg-primary font-bold hover:bg-garden-500"
                  disabled={!noteText.trim()}
                  onClick={handleAddNote}
                >
                  Add
                </button>
                <button
                  className="px-2 py-1 rounded bg-dark-bg-primary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-secondary"
                  onClick={handleCancelNote}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
            {/* Custom note pills from backend */}
            {calendarNotes.filter(note => {
              return note.date === dateKey;
            }).map((note, idx) => (
              <div
                key={"note-" + note.id}
                className={`bg-dark-bg-secondary text-dark-text-primary rounded px-1 py-0.5 text-xs mt-1 truncate ${note.private ? 'border border-garden-400' : ''}`}
                title={note.note}
              >
                {note.note}
                {note.private && <span className="ml-1 text-garden-400">(Private)</span>}
              </div>
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

  async function handleAddNote() {
    if (!noteText.trim()) return;
    if (!session?.user) return;
    const payload = {
      date: popoverFor,
      note: noteText.trim(),
      gardenId: selectedGarden || undefined,
      roomId: selectedRoom || undefined,
      zoneId: selectedZone || undefined,
      private: isPrivate,
    };
    try {
      const res = await fetch('/api/calendar-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save note');
      const saved = await res.json();
      setCalendarNotes(prev => [...prev, saved]);
      setPopoverFor(null);
      setNoteText("");
      setSelectedGarden("");
      setSelectedRoom("");
      setSelectedZone("");
      setIsPrivate(false);
    } catch (err) {
      alert('Failed to save note');
    }
  }
  function handleCancelNote() {
    setPopoverFor(null);
    setNoteText("");
    setSelectedGarden("");
    setSelectedRoom("");
    setSelectedZone("");
    setIsPrivate(false);
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