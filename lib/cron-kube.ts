import { processWeatherAlerts } from './weatherAlerts';

async function main() {
  try {
    console.log('[CRON-KUBE] Weather check started');
    await processWeatherAlerts();
    console.log('[CRON-KUBE] Weather check completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[CRON-KUBE] Weather check failed:', err);
    process.exit(1);
  }
}

main(); 