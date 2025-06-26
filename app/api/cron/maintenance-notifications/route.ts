import { NextResponse } from 'next/server';
import { checkMaintenanceNotifications } from '@/lib/maintenanceNotifications';

export async function GET(request: Request) {
  try {
    // Check for authorization (you might want to add a secret key)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Optional: Add a secret key for security
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[CRON] Starting maintenance notifications check...');
    
    await checkMaintenanceNotifications();
    
    console.log('[CRON] Maintenance notifications check completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Maintenance notifications check completed' 
    });
  } catch (error) {
    console.error('[CRON] Error in maintenance notifications:', error);
    return NextResponse.json(
      { error: 'Failed to check maintenance notifications' },
      { status: 500 }
    );
  }
} 