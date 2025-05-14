import cron from 'node-cron';
import { processWeatherAlerts } from './weatherAlerts';

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
console.log('[CRON] Weather check cron job scheduled. Last run:', isDate(lastRun) ? lastRun.toLocaleString() : 'Never');

// Run immediately on startup
(async () => {
  if (!isRunning) {
    isRunning = true;
    const now = new Date();
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
  }
})();

export function startWeatherAlertCron() {
  // Run every 4 hours for alerts
  cron.schedule('0 */4 * * *', async () => {
    if (isRunning) {
      console.log('[WEATHER_CRON] Previous job still running, skipping...');
      return;
    }

    try {
      isRunning = true;
      console.log('[WEATHER_CRON] Starting weather alert check...');
      await processWeatherAlerts();
      console.log('[WEATHER_CRON] Weather alert check completed successfully');
    } catch (error) {
      console.error('[WEATHER_CRON] Error checking weather alerts:', error);
    } finally {
      isRunning = false;
    }
  });

  // Run daily at 8 AM for "all clear" notifications
  cron.schedule('0 8 * * *', async () => {
    if (isRunning) {
      console.log('[WEATHER_CRON] Previous job still running, skipping daily check...');
      return;
    }

    try {
      isRunning = true;
      console.log('[WEATHER_CRON] Starting daily weather check...');
      await processWeatherAlerts();
      console.log('[WEATHER_CRON] Daily weather check completed successfully');
    } catch (error) {
      console.error('[WEATHER_CRON] Error in daily weather check:', error);
    } finally {
      isRunning = false;
    }
  });
} 