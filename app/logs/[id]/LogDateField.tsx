'use client';
import { format, toZonedTime } from 'date-fns-tz';

export default function LogDateField({ date, timezone }: { date: string, timezone?: string }) {
  let utcString = 'Invalid date';
  let gardenString = null;
  const d = new Date(date);
  if (date && !isNaN(d.getTime())) {
    utcString = format(d, 'yyyy-MM-dd HH:mm:ss') + ' UTC';
    if (timezone) {
      const zonedDate = toZonedTime(d, timezone);
      gardenString = format(zonedDate, 'yyyy-MM-dd hh:mm a zzz', { timeZone: timezone });
    }
  }
  return (
    <div>
      <div>{utcString}</div>
      {gardenString && <div><span className="text-emerald-300">Garden local time:</span> {gardenString}</div>}
    </div>
  );
} 