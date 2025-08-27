#!/usr/bin/env ts-node

import { checkMaintenanceNotifications } from '../lib/maintenanceNotifications';

async function main() {
  console.log('🔧 Checking maintenance notifications...');
  
  try {
    await checkMaintenanceNotifications();
    console.log('✅ Maintenance notifications check completed');
  } catch (error) {
    console.error('❌ Error checking maintenance notifications:', error);
    process.exit(1);
  }
}

main(); 