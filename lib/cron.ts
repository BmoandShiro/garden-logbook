import cron from 'node-cron';
import { processWeatherAlerts } from './weatherAlerts';
import { checkMaintenanceNotifications } from './maintenanceNotifications';
import { fetchAndStoreSensorData } from './sensorData';

// Global state tracking
let weatherCheckRunning = false;
let maintenanceCheckRunning = false;
let sensorDataRunning = false;

// Function to process weather alerts
async function runWeatherCheck() {
  if (weatherCheckRunning) {
    console.log('[CRON] Weather check already running, skipping this interval.');
    return;
  }
  weatherCheckRunning = true;
  const now = new Date();
  console.log(`[CRON] Weather check started at ${now.toISOString()} UTC`);
  try {
    await processWeatherAlerts();
    console.log(`[CRON] Weather check completed at ${new Date().toISOString()} UTC`);
  } catch (err) {
    console.error('[CRON] Weather check failed:', err);
  } finally {
    weatherCheckRunning = false;
  }
}

// Function to process maintenance notifications
async function runMaintenanceCheck() {
  if (maintenanceCheckRunning) {
    console.log('[CRON] Maintenance check already running, skipping this interval.');
    return;
  }
  maintenanceCheckRunning = true;
  const now = new Date();
  console.log(`[CRON] Maintenance notifications check started at ${now.toISOString()} UTC`);
  try {
    await checkMaintenanceNotifications();
    console.log(`[CRON] Maintenance notifications check completed at ${new Date().toISOString()} UTC`);
  } catch (err) {
    console.error('[CRON] Maintenance notifications check failed:', err);
  } finally {
    maintenanceCheckRunning = false;
  }
}

// Function to fetch and store sensor data
async function runSensorDataFetch() {
  if (sensorDataRunning) {
    console.log('[CRON] Sensor data fetch already running, skipping this interval.');
    return;
  }
  sensorDataRunning = true;
  const now = new Date();
  console.log(`[CRON] Sensor data fetch started at ${now.toISOString()} UTC`);
  try {
    await fetchAndStoreSensorData();
    console.log(`[CRON] Sensor data fetch completed at ${new Date().toISOString()} UTC`);
  } catch (err) {
    console.error('[CRON] Sensor data fetch failed:', err);
  } finally {
    sensorDataRunning = false;
  }
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

// ===== CRON SCHEDULES =====

// Weather alerts: Every 4 hours (0, 4, 8, 12, 16, 20 UTC)
cron.schedule('0 0,4,8,12,16,20 * * *', async () => {
  console.log(`[CRON] Scheduled weather job triggered at ${new Date().toISOString()} UTC`);
  await runWeatherCheck();
});

// Maintenance notifications: Daily at 9 AM UTC
cron.schedule('0 9 * * *', async () => {
  console.log(`[CRON] Daily maintenance notifications job triggered at ${new Date().toISOString()} UTC`);
  await runMaintenanceCheck();
});

// Sensor data fetching: Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log(`[CRON] Sensor data fetch job triggered at ${new Date().toISOString()} UTC`);
  await runSensorDataFetch();
});

// ===== STARTUP CHECKS =====

// On startup, run all checks if they haven't been run recently
(async () => {
  console.log('[CRON] Starting initial checks...');
  
  // Always run maintenance notifications on startup (they're idempotent)
  console.log(`[CRON] Maintenance notifications (startup) started at ${new Date().toLocaleString()}`);
  try {
    await checkMaintenanceNotifications();
    console.log(`[CRON] Maintenance notifications (startup) completed at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('[CRON] Maintenance notifications (startup) failed:', err);
  }
  
  // Run weather check on startup (will be skipped if already running)
  console.log(`[CRON] Weather check (startup) started at ${new Date().toLocaleString()}`);
  try {
    await processWeatherAlerts();
    console.log(`[CRON] Weather check (startup) completed at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('[CRON] Weather check (startup) failed:', err);
  }
  
  // Run sensor data fetch on startup
  console.log(`[CRON] Sensor data fetch (startup) started at ${new Date().toLocaleString()}`);
  try {
    await fetchAndStoreSensorData();
    console.log(`[CRON] Sensor data fetch (startup) completed at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('[CRON] Sensor data fetch (startup) failed:', err);
  }
  
  console.log('[CRON] All startup checks completed');
})();

console.log('[CRON] All cron jobs scheduled successfully:');
console.log('  - Weather alerts: Every 4 hours (0, 4, 8, 12, 16, 20 UTC)');
console.log('  - Maintenance notifications: Daily at 9 AM UTC');
console.log('  - Sensor data fetching: Every 15 minutes');

export function startWeatherAlertCron() {
  // No-op: scheduling is handled above for consistency
} 