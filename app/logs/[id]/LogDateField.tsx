'use client';
import { format, toZonedTime } from 'date-fns-tz';

export default function LogDateField({ date, timezone }: { date: string, timezone?: string }) {
  const utcString = format(new Date(date), 'yyyy-MM-dd HH:mm:ss') + ' UTC';
  let gardenString = null;
  if (timezone) {
    const zonedDate = toZonedTime(date, timezone);
    gardenString = format(zonedDate, 'yyyy-MM-dd hh:mm a zzz', { timeZone: timezone }) + ' (Garden Time)';
  }
  return (
    <div>
      <div><strong>UTC:</strong> {utcString}</div>
      {gardenString && <div><strong>Garden Time:</strong> {gardenString}</div>}
    </div>
  );
} 