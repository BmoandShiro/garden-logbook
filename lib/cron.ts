import cron from 'node-cron';
import { processWeatherAlerts } from './weatherAlerts.ts';

let isRunning = false;

// Log the last run time
let lastRun: Date | null = null;

// Schedule the job to run at 0, 4, 8, 12, 16, and 20 hours
cron.schedule('0 0,4,8,12,16,20 * * *', async () => {
  if (isRunning) {
    console.log('[CRON] Weather check already running, skipping this interval.');
    return;
  }
  isRunning = true;
  const now = new Date();
  console.log(`[CRON] Weather check started at ${now.toLocaleString()}`);
  try {
    await processWeatherAlerts();
    lastRun = now;
    console.log(`[CRON] Weather check completed at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('[CRON] Weather check failed:', err);
  } finally {
    isRunning = false;
  }
});

// Optionally, log the last run time on startup
function isDate(val: Date | null): val is Date {
  return val instanceof Date && !isNaN(val.getTime());
}
console.log('[CRON] Weather check cron job scheduled. Last run:', isDate(lastRun) ? (lastRun as Date).toLocaleString() : 'Never');

// On startup, run a weather check ONLY if lastRun is null or >4h ago
(async () => {
  if (!isRunning) {
    const now = new Date();
    if (!isDate(lastRun) || (now.getTime() - (lastRun as Date).getTime()) > 4 * 60 * 60 * 1000) {
      isRunning = true;
      console.log(`[CRON] Weather check (startup) started at ${now.toLocaleString()}`);
      try {
        await processWeatherAlerts();
        lastRun = now;
        console.log(`[CRON] Weather check (startup) completed at ${new Date().toLocaleString()}`);
      } catch (err) {
        console.error('[CRON] Weather check (startup) failed:', err);
      } finally {
        isRunning = false;
      }
    } else {
      console.log('[CRON] Startup weather check skipped: last run was less than 4 hours ago.');
    }
  }
})();

export function startWeatherAlertCron() {
  // No-op: scheduling is handled above for consistency
} 