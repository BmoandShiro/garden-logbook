import cron from 'node-cron';
import { processWeatherAlerts } from './weatherAlerts';

let isRunning = false;
let lastRun: Date | null = null;
let missedRuns = 0;
const SCHEDULED_HOURS = [0, 4, 8, 12, 16, 20];

// Function to process weather alerts
async function runWeatherCheck() {
  if (isRunning) {
    console.log('[CRON] Weather check already running, skipping this interval.');
    return;
  }
  isRunning = true;
  const now = new Date();
  console.log(`[CRON] Weather check started at ${now.toISOString()} UTC`);
  try {
    await processWeatherAlerts();
    lastRun = now;
    missedRuns = 0; // Reset missed runs counter on successful run
    console.log(`[CRON] Weather check completed at ${new Date().toISOString()} UTC`);
  } catch (err) {
    console.error('[CRON] Weather check failed:', err);
  } finally {
    isRunning = false;
  }
}

// Function to check if we missed a scheduled time
function checkMissedSchedule() {
  if (!lastRun) return true;
  
  const now = new Date();
  const lastRunHour = lastRun.getUTCHours();
  const currentHour = now.getUTCHours();
  
  // Find the next scheduled hour after the last run
  const lastRunIndex = SCHEDULED_HOURS.indexOf(lastRunHour);
  const nextScheduledHour = SCHEDULED_HOURS[(lastRunIndex + 1) % SCHEDULED_HOURS.length];
  
  // If we're past the next scheduled hour, we missed a run
  return currentHour > nextScheduledHour;
}

// Heartbeat: log every 10 minutes to show event loop is alive
setInterval(() => {
  console.log(`[HEARTBEAT] Event loop alive at ${new Date().toISOString()}`);
}, 10 * 60 * 1000);

// Catch unhandled promise rejections and uncaught exceptions
type AnyErr = any;
process.on('unhandledRejection', (reason: AnyErr, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err: AnyErr) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

// Primary schedule: specific times (0,4,8,12,16,20)
cron.schedule('0 0,4,8,12,16,20 * * *', async () => {
  console.log(`[CRON] Scheduled job triggered at ${new Date().toISOString()} UTC`);
  if (checkMissedSchedule()) {
    missedRuns++;
    console.log(`[CRON] Missed run detected. Count: ${missedRuns}`);
  }
  await runWeatherCheck();
});

// Fallback schedule: every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log(`[CRON] Fallback schedule triggered at ${new Date().toISOString()} UTC`);
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Only run fallback if:
  // 1. We're not at a scheduled time
  // 2. We've missed 2 consecutive runs
  if (!SCHEDULED_HOURS.includes(hour) && missedRuns >= 2) {
    console.log(`[CRON] Fallback triggered at ${now.toISOString()} UTC (hour: ${hour}, missed runs: ${missedRuns})`);
    await runWeatherCheck();
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