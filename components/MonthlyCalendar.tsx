import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { renderForecastedMessage } from '@/lib/renderForecastedMessage';
import LogDateField from '../app/logs/[id]/LogDateField';

const getLogColor = (type: string) => {
  const colors: Record<string, string> = {
    WATERING: 'bg-blue-500',
    ENVIRONMENTAL: 'bg-green-500',
    LST: 'bg-purple-500',
    HST: 'bg-orange-500',
    HARVEST: 'bg-yellow-500',
    DRYING: 'bg-red-500',
    PEST_STRESS_DISEASE: 'bg-red-600',
    PEST_DISEASE: 'bg-red-600',
    TRANSPLANT: 'bg-green-600',
    TRANSFER: 'bg-blue-600',
    GERMINATION: 'bg-green-400',
    CLONING: 'bg-purple-400',
    INSPECTION: 'bg-yellow-400',
    TREATMENT: 'bg-red-400',
    STRESS: 'bg-orange-400',
    EQUIPMENT: 'bg-gray-500',
    CUSTOM: 'bg-gray-400',
    FLUSHING: 'bg-blue-400',
    GENERAL: 'bg-gray-300',
    WEATHER_ALERT: 'bg-red-500',
    SENSOR_ALERT: 'bg-orange-500',
    CHANGE_LOG: 'bg-garden-500',
  };
  return colors[type] || 'bg-gray-400';
};

interface CalendarProps {
  month?: Date; // Defaults to current month if not provided
  logsByDate?: { [date: string]: { id: string; title: string; notes?: string; type?: string }[] };
  weatherAlertsByDate?: { [date: string]: any };
  monthChange?: (newMonth: Date) => void;
}

export const MonthlyCalendar: React.FC<CalendarProps> = ({ month: initialMonth, logsByDate, weatherAlertsByDate = {}, monthChange }) => {
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
  const minYear = 2000;
  const maxYear = 2100;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

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
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalDetails, setAlertModalDetails] = useState<any[]>([]);
  const [alertModalDate, setAlertModalDate] = useState<string>("");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: Date, logs: any[], alerts: any } | null>(null);
  const [expandedDropdowns, setExpandedDropdowns] = useState<{ [dateKey: string]: { [type: string]: boolean } }>({});

  // Helper function to group logs by type
  const groupLogsByType = (logs: any[]) => {
    const grouped = logs.reduce((acc: any, log: any) => {
      const type = log.type || 'OTHER';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(log);
      return acc;
    }, {});
    
    return grouped;
  };

  // Helper function to toggle dropdown
  const toggleDropdown = (dateKey: string, type: string) => {
    setExpandedDropdowns(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [type]: !prev[dateKey]?.[type]
      }
    }));
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setExpandedDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  for (let week = 0; week < Math.ceil(totalDays / 7); week++) {
    let days = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = week * 7 + i;
      if (dayIndex >= totalDays) break;
      const dayCopy = addDays(startDate, dayIndex);
      const formattedDate = format(dayCopy, dateFormat);
      const isCurrentMonth = isSameMonth(dayCopy, monthStart);
      const isToday = isSameDay(dayCopy, today);
      const dateKey = format(dayCopy, "yyyy-MM-dd");
      const logs = logsByDate?.[dateKey] || [];
      const weatherAlert = weatherAlertsByDate[dateKey];

      days.push(
        <div
          key={dayCopy.toString()}
          className={
            `
            relative flex flex-col items-stretch justify-start border border-dark-border
            min-h-[60px] min-w-[44px] sm:min-h-[120px] sm:min-w-[120px] p-1 sm:p-2
            ${isCurrentMonth ? "bg-dark-bg-primary text-dark-text-primary" : "bg-dark-bg-secondary text-dark-text-secondary opacity-60"}
            ${isToday && isCurrentMonth ? "ring-2 ring-garden-400" : ""}
            transition-all
          `
          }
          onClick={isMobile ? () => {
            setSelectedDayDetails({ date: dayCopy, logs, alerts: weatherAlert });
          } : undefined}
          style={{ cursor: isMobile ? 'pointer' : undefined }}
        >
          <span className="font-bold text-base sm:text-lg mb-1 text-garden-400 w-fit">{formattedDate}</span>
          {isMobile ? (
            <div className="flex flex-row flex-wrap gap-1 items-center min-h-[18px]">
              {/* Show up to 3 colored dots/icons for logs/alerts, then +N */}
              {logs.slice(0, 3).map((log, idx) => (
                <span key={log.id || idx} className={`w-3 h-3 rounded-full ${getLogColor(log.type || '')}`} title={log.type || ''}></span>
              ))}
              {weatherAlert && weatherAlert.details && weatherAlert.details.length > 0 && (
                <span className="w-3 h-3 rounded-full bg-red-500" title="Weather Alert"></span>
              )}
              {logs.length + (weatherAlert && weatherAlert.details ? 1 : 0) > 3 && (
                <span className="text-xs text-dark-text-secondary">+{logs.length + (weatherAlert && weatherAlert.details ? 1 : 0) - 3}</span>
              )}
            </div>
          ) : (
            <>
              {/* Weather alert badge - moved below day number */}
              {weatherAlert && weatherAlert.details && weatherAlert.details.length > 0 && (
                <div className="mt-1 flex flex-col gap-0.5 z-10">
                  {/* Group alerts by gardenName and count affected plants */}
                  {Object.entries(
                    weatherAlert.details.reduce((acc: any, d: any) => {
                      const garden = d.gardenName || 'Unknown Garden';
                      if (!acc[garden]) acc[garden] = { plantNames: new Set(), roomNames: new Set(), zoneNames: new Set(), gardenId: d.gardenId };
                      if (d.plantName) acc[garden].plantNames.add(d.plantName);
                      if (d.roomName) acc[garden].roomNames.add(d.roomName);
                      if (d.zoneName) acc[garden].zoneNames.add(d.zoneName);
                      return acc;
                    }, {})
                  ).map(([gardenName, info]: any) => (
                    <div key={gardenName} className="flex items-center gap-2 flex-wrap text-xs whitespace-nowrap overflow-hidden text-ellipsis mb-2">
                      <button
                        className="font-bold text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 px-0 bg-transparent border-none cursor-pointer"
                        title="View weather alert details"
                        style={{ minWidth: 0 }}
                        onClick={() => {
                          setAlertModalDetails(weatherAlert.details.filter((d: any) => (d.gardenName || 'Unknown Garden') === gardenName));
                          setAlertModalDate(dateKey);
                          setAlertModalOpen(true);
                        }}
                      >
                        wAlert
                      </button>
                      <Link
                        href={`/gardens/${info.gardenId}`}
                        className="font-semibold text-emerald-200 hover:underline focus:outline-none focus:ring-2 focus:ring-garden-500"
                        title={`Go to ${gardenName}`}
                      >
                        {gardenName}
                      </Link>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-semibold text-garden-500 ml-1 cursor-pointer">{info.roomNames.size} room/plot{info.roomNames.size !== 1 ? 's' : ''}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(() => {
                              const items = weatherAlert.details
                                .filter((d: any) => (d.gardenName || 'Unknown Garden') === gardenName)
                                .reduce((acc: any[], d: any) => {
                                  if (d.roomId && d.roomName) acc.push({ id: d.roomId, name: d.roomName, gardenId: d.gardenId });
                                  return acc;
                                }, []);
                              const uniqueRooms = Array.from(new Map(items.map((room: any) => [room.id, room])).values());
                              if (uniqueRooms.length === 0) {
                                return (
                                  <span>
                                    No rooms/plots found.<br />
                                    <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(weatherAlert.details, null, 2)}</pre>
                                  </span>
                                );
                              }
                              return uniqueRooms.map((room: any, idx: number, arr: any[]) =>
                                room.id && room.gardenId ? (
                                  <Link key={room.id} href={`/gardens/${room.gardenId}/rooms/${room.id}`} className="underline text-emerald-300 hover:text-emerald-200 mr-1">{room.name}{idx < arr.length - 1 ? ', ' : ''}</Link>
                                ) : (
                                  <span key={room.name + idx}>{room.name}{idx < arr.length - 1 ? ', ' : ''}</span>
                                )
                              );
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-semibold text-emerald-300 ml-1 cursor-pointer">{info.zoneNames.size} zone{info.zoneNames.size !== 1 ? 's' : ''}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(() => {
                              const items = weatherAlert.details
                                .filter((d: any) => (d.gardenName || 'Unknown Garden') === gardenName)
                                .reduce((acc: any[], d: any) => {
                                  if (d.zoneId && d.zoneName && d.roomId && d.gardenId) acc.push({ id: d.zoneId, name: d.zoneName, roomId: d.roomId, gardenId: d.gardenId });
                                  return acc;
                                }, []);
                              const uniqueZones = Array.from(new Map(items.map((zone: any) => [zone.id, zone])).values());
                              if (uniqueZones.length === 0) {
                                return (
                                  <span>
                                    No zones found.<br />
                                    <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(weatherAlert.details, null, 2)}</pre>
                                  </span>
                                );
                              }
                              return uniqueZones.map((zone: any, idx: number, arr: any[]) =>
                                zone.id && zone.gardenId && zone.roomId ? (
                                  <Link key={zone.id} href={`/gardens/${zone.gardenId}/rooms/${zone.roomId}/zones/${zone.id}`} className="underline text-garden-500 hover:text-emerald-200 mr-1">{zone.name}{idx < arr.length - 1 ? ', ' : ''}</Link>
                                ) : (
                                  <span key={zone.name + idx}>{zone.name}{idx < arr.length - 1 ? ', ' : ''}</span>
                                )
                              );
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-semibold text-garden-500 ml-1 cursor-pointer">{info.plantNames.size} plant{info.plantNames.size !== 1 ? 's' : ''}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(() => {
                              const items = weatherAlert.details
                                .filter((d: any) => (d.gardenName || 'Unknown Garden') === gardenName)
                                .reduce((acc: any[], d: any) => {
                                  if (d.plantId && d.plantName && d.zoneId && d.roomId && d.gardenId) acc.push({ id: d.plantId, name: d.plantName, zoneId: d.zoneId, roomId: d.roomId, gardenId: d.gardenId });
                                  return acc;
                                }, []);
                              const uniquePlants = Array.from(new Map(items.map((plant: any) => [plant.id, plant])).values());
                              if (uniquePlants.length === 0) {
                                return (
                                  <span>
                                    No plants found.<br />
                                    <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(weatherAlert.details, null, 2)}</pre>
                                  </span>
                                );
                              }
                              return uniquePlants.map((plant: any, idx: number, arr: any[]) =>
                                plant.id && plant.gardenId && plant.roomId && plant.zoneId ? (
                                  <Link key={plant.id} href={`/gardens/${plant.gardenId}/rooms/${plant.roomId}/zones/${plant.zoneId}/plants/${plant.id}`} className="underline text-lime-400 hover:text-lime-200 mr-1">{plant.name}{idx < arr.length - 1 ? ', ' : ''}</Link>
                                ) : (
                                  <span key={plant.name + idx}>{plant.name}{idx < arr.length - 1 ? ', ' : ''}</span>
                                )
                              );
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              )}
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
              <div className="w-full flex-1 flex flex-col gap-1">
                {(() => {
                  const filteredLogs = logs.filter((log) => log.title !== 'WEATHER_ALERT');
                  const groupedLogs = groupLogsByType(filteredLogs);
                  
                  return Object.entries(groupedLogs).map(([type, typeLogs]) => {
                    const logs = typeLogs as any[];
                    const isExpanded = expandedDropdowns[dateKey]?.[type] || false;
                    const logCount = logs.length;
                    
                    return (
                      <div key={type} className="relative dropdown-container">
                        <button
                          onClick={() => toggleDropdown(dateKey, type)}
                          className={`w-full text-left px-1 py-0.5 text-xs rounded flex items-center justify-between ${getLogColor(type)} hover:opacity-80 transition-opacity`}
                          title={`${type} (${logCount} ${logCount === 1 ? 'entry' : 'entries'})`}
                        >
                          <span className="truncate">{type}</span>
                          <span className="ml-1 text-xs opacity-75">({logCount})</span>
                          <ChevronDown 
                            className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                        
                        {isExpanded && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dark-bg-secondary border border-dark-border rounded shadow-lg p-2 max-h-32 overflow-y-auto">
                            {logs.map((log, idx) => (
                              <Link
                                key={log.id || idx}
                                href={`/logs/${log.id}`}
                                className="block text-xs py-1 px-2 rounded hover:bg-dark-bg-primary transition-colors mb-1 last:mb-0"
                                title={log.notes || log.title}
                              >
                                <div className="font-medium text-dark-text-primary truncate">
                                  {log.notes || log.title || 'Log entry'}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
                {/* Custom note pills from backend */}
                {calendarNotes.filter(note => {
                  return note.date === dateKey;
                }).map((note, idx) => (
                  <div
                    key={"note-" + note.id}
                    className={`relative bg-dark-bg-secondary text-dark-text-primary rounded px-1 py-0.5 text-xs mt-1 truncate flex items-center ${note.private ? 'border border-garden-400' : ''}`}
                    title={note.note}
                  >
                    <span className="flex-1 truncate">{note.note}{note.private && <span className="ml-1 text-garden-400">(Private)</span>}</span>
                    <button
                      className="ml-2 p-0.5 rounded hover:bg-dark-bg-primary text-garden-400 hover:text-red-500 focus:outline-none"
                      aria-label="Delete note"
                      onClick={() => openDeleteModal(note)}
                      tabIndex={0}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="2"/>
                        <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    rows.push(
      <div className="grid grid-cols-7 w-full" key={week + "row"}>
        {days}
      </div>
    );
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

  function openDeleteModal(note: any) {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  }
  function closeDeleteModal() {
    setNoteToDelete(null);
    setShowDeleteModal(false);
  }
  async function handleDeleteNote() {
    if (!noteToDelete) return;
    try {
      const res = await fetch(`/api/calendar-notes?id=${noteToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      setCalendarNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
      closeDeleteModal();
    } catch (err) {
      alert('Failed to delete note');
    }
  }

  useEffect(() => {
    // Debug: log the current month whenever it changes
    console.log('[MonthlyCalendar] Current month:', month.toISOString());
  }, [month]);

  return (
    <div className="w-full max-w-6xl mx-auto overflow-x-hidden">
      <div className="text-center mb-4 flex items-center justify-center gap-2 sm:gap-4 w-full max-w-full px-1 sm:px-0">
        <button
          onClick={() => {
            const prevMonth = subMonths(month, 1);
            setMonth(prevMonth);
            monthChange?.(prevMonth);
          }}
          className="p-2 rounded-full hover:bg-dark-bg-primary text-garden-400 flex-shrink-0"
          aria-label="Previous Month"
          style={{ minWidth: 36, minHeight: 36 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center w-full min-w-0">
          <div className="text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-garden-400 uppercase truncate">
            {format(month, "MMMM")}
          </div>
          <div className="relative ml-1 sm:ml-2">
            <button
              ref={yearButtonRef}
              onClick={() => setYearDropdownOpen((open) => !open)}
              className="flex items-center text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight uppercase text-garden-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-garden-400 px-2"
              aria-haspopup="listbox"
              aria-expanded={yearDropdownOpen}
              type="button"
              style={{ minWidth: 60 }}
            >
              {month.getFullYear()}
              <ChevronDown className="ml-1 w-6 h-6 text-garden-400" />
            </button>
            {yearDropdownOpen && (
              <div
                className="absolute left-0 z-50 mt-2 w-full max-h-60 overflow-y-auto rounded bg-dark-bg-primary border border-garden-400 shadow-lg year-dropdown-scroll"
                onMouseDown={e => e.preventDefault()}
              >
                {years.map((y) => (
                  <button
                    key={y}
                    onPointerDown={e => e.preventDefault()}
                    onClick={() => {
                      console.log('[MonthlyCalendar] Year selected:', y);
                      const newMonth = new Date(y, month.getMonth(), 1);
                      setMonth(newMonth);
                      monthChange?.(newMonth);
                      setYearDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-xl sm:text-2xl md:text-4xl font-extrabold uppercase ${
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
          onClick={() => {
            const nextMonth = addMonths(month, 1);
            setMonth(nextMonth);
            monthChange?.(nextMonth);
          }}
          className="p-2 rounded-full hover:bg-dark-bg-primary text-garden-400 flex-shrink-0"
          aria-label="Next Month"
          style={{ minWidth: 36, minHeight: 36 }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2 w-full max-w-full overflow-x-hidden">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-dark-text-secondary uppercase py-2 text-xs sm:text-base md:text-lg truncate"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 w-full max-w-full overflow-x-hidden">
        {rows}
      </div>
      {/* Delete confirmation modal */}
      {showDeleteModal && noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-dark-bg-primary border border-dark-border rounded-lg shadow-lg p-6 min-w-[300px]">
            <div className="mb-4 text-lg text-dark-text-primary font-bold">Delete Note</div>
            <div className="mb-6 text-dark-text-secondary">Are you sure you want to delete this note?</div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-dark-bg-secondary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-primary"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                onClick={handleDeleteNote}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Weather Alert Modal */}
      <Dialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
        <DialogContent className="max-w-xl bg-dark-bg-secondary text-dark-text-primary">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-bold text-lg flex items-center gap-2">
              Weather Alerts for {alertModalDate}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 mt-2">
            {/* Group modal details by garden */}
            {alertModalDetails.length === 0 ? (
              <div className="text-dark-text-secondary">No details available.</div>
            ) : (
              Object.entries(
                alertModalDetails.reduce((acc: any, d: any) => {
                  const garden = d.gardenName || 'Unknown Garden';
                  if (!acc[garden]) acc[garden] = [];
                  acc[garden].push(d);
                  return acc;
                }, {})
              ).map(([gardenName, details]: any) => (
                <div key={gardenName} className="rounded bg-dark-bg-primary border border-red-700 p-3 text-xs mb-2">
                  <div className="font-bold text-red-500 mb-1 flex items-center gap-2">
                    <span>wAlert</span>
                    <span className="text-emerald-200">{gardenName}</span>
                    <span className="font-semibold text-garden-500 ml-1">{Array.from(new Set(details.map((d: any) => d.plantName))).length} plants</span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Plants:</span> <span className="text-garden-500">{Array.from(new Set(details.map((d: any) => d.plantName))).join(", ")}</span>
                  </div>
                  {details.map((d: any, idx: number) => (
                    <div key={idx} className="mb-2 border-b border-red-900 pb-2 last:border-b-0 last:pb-0">
                      <div className="font-bold text-red-200 mb-1">{d.type}{d.alertTypes?.length ? `: ${d.alertTypes.join(", ")}` : ""}</div>
                      {d.roomName && <div><span className="font-semibold">Room:</span> {d.roomName}</div>}
                      {d.zoneName && <div><span className="font-semibold">Zone:</span> {d.zoneName}</div>}
                      {d.plantName && <div><span className="font-semibold">Plant:</span> <span className="text-garden-500">{d.plantName}</span></div>}
                      {d.createdAt && <div><span className="font-semibold">Time:</span> <LogDateField date={d.createdAt} timezone={d.timezone} /></div>}
                      {d.message && <div className="mt-2 whitespace-pre-line">{renderForecastedMessage(d.message)}</div>}
                      {d.alertTypes && d.alertTypes.length > 0 && (
                        <div className="mt-2">
                          <span className="font-semibold">Alert Types:</span> {d.alertTypes.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Mobile: Modal for day details */}
      {isMobile && selectedDayDetails && (
        <Dialog open={!!selectedDayDetails} onOpenChange={() => setSelectedDayDetails(null)}>
          <DialogContent className="max-w-md bg-dark-bg-secondary text-dark-text-primary">
            <DialogHeader>
              <DialogTitle className="text-garden-400 font-bold text-lg flex items-center gap-2">
                {format(selectedDayDetails.date, 'PPP')}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-4 mt-2">
              {selectedDayDetails.logs.length === 0 && (!selectedDayDetails.alerts || !selectedDayDetails.alerts.details || selectedDayDetails.alerts.details.length === 0) ? (
                <div className="text-dark-text-secondary">No logs or alerts for this day.</div>
              ) : (
                <>
                  {(() => {
                    const filteredLogs = selectedDayDetails.logs.filter((log: any) => log.title !== 'WEATHER_ALERT');
                    const groupedLogs = groupLogsByType(filteredLogs);
                    
                    return Object.entries(groupedLogs).map(([type, typeLogs]) => {
                      const logs = typeLogs as any[];
                      const isExpanded = expandedDropdowns[format(selectedDayDetails.date, "yyyy-MM-dd")]?.[type] || false;
                      const logCount = logs.length;
                      
                      return (
                        <div key={type} className="space-y-2 dropdown-container">
                          <button
                            onClick={() => toggleDropdown(format(selectedDayDetails.date, "yyyy-MM-dd"), type)}
                            className="w-full text-left p-2 rounded bg-dark-bg-primary border border-dark-border hover:bg-dark-bg-hover transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${getLogColor(type)}`}></span>
                              <span className="font-bold">{type}</span>
                              <span className="text-sm text-dark-text-secondary">({logCount})</span>
                            </div>
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                          
                          {isExpanded && (
                            <div className="ml-4 space-y-2">
                              {logs.map((log, idx) => (
                                <Link key={log.id || idx} href={`/logs/${log.id}`} className="block rounded bg-dark-bg-secondary border border-dark-border p-2 text-xs hover:bg-dark-bg-hover transition-colors">
                                  <div className="text-sm">{log.notes || log.title || 'Log entry'}</div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {selectedDayDetails.alerts && selectedDayDetails.alerts.details && selectedDayDetails.alerts.details.length > 0 && (
                    selectedDayDetails.alerts.details.map((alert: any, idx: number) => (
                      <Link key={alert.id || idx} href={alert.plantId && alert.gardenId ? `/gardens/${alert.gardenId}/plants/${alert.plantId}` : '#'} className="block rounded bg-dark-bg-primary border border-red-700 p-2 text-xs mb-2 hover:bg-dark-bg-hover transition-colors">
                        <div className="font-bold text-red-500 mb-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                          <span>Weather Alert</span>
                        </div>
                        <div className="text-sm">{alert.message ? alert.message.slice(0, 120) + (alert.message.length > 120 ? '…' : '') : 'Alert details'}</div>
                      </Link>
                    ))
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Add responsive CSS for mobile calendar */}
      <style jsx global>{`
        @media (max-width: 600px) {
          .calendar-day-cell {
            min-width: 44px !important;
            min-height: 60px !important;
            padding: 2px !important;
          }
          .calendar-day-cell .font-bold {
            font-size: 1rem !important;
            margin-bottom: 2px !important;
          }
          .calendar-day-cell .flex-row {
            min-height: 18px !important;
          }
          .year-dropdown-scroll {
            font-size: 1.2rem !important;
          }
        }
        .year-dropdown-scroll::-webkit-scrollbar {
          width: 8px;
          background: #181c1f;
        }
        .year-dropdown-scroll::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 6px;
        }
        .year-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
        .year-dropdown-scroll {
          scrollbar-width: thin;
          scrollbar-color: #22c55e #181c1f;
        }
      `}</style>
    </div>
  );
};

export default MonthlyCalendar;