import cron from 'node-cron';
import { processWeatherAlerts } from './weatherAlerts';

let isRunning = false;

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

  // Run immediately on startup
  (async () => {
    try {
      console.log('[WEATHER_CRON] Running initial weather check...');
      await processWeatherAlerts();
      console.log('[WEATHER_CRON] Initial weather check completed successfully');
    } catch (error) {
      console.error('[WEATHER_CRON] Error in initial weather check:', error);
    }
  })();
} 