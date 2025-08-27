'use client';
import { format, toZonedTime, formatInTimeZone } from 'date-fns-tz';

export default function LogDateField({ date, timezone }: { date: string, timezone?: string }) {
  let utcString = 'Invalid date';
  let gardenString = null;
  const d = new Date(date);
  if (date && !isNaN(d.getTime())) {
    utcString = formatInTimeZone(d, 'UTC', 'yyyy-MM-dd HH:mm:ss') + ' UTC';
    if (timezone) {
      const zonedDate = toZonedTime(d, timezone);
      gardenString = format(zonedDate, 'yyyy-MM-dd hh:mm a zzz', { timeZone: timezone });
    }
  }
  return (
    <div className="text-right">
      <div className="text-sm text-dark-text-secondary">{utcString}</div>
      {gardenString && (
        <div className="text-sm text-dark-text-secondary">
          <span className="text-emerald-300 block sm:inline">Garden local time: </span>
          <span className="block sm:inline">{gardenString}</span>
        </div>
      )}
    </div>
  );
} 