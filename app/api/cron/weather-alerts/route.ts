import { NextResponse } from 'next/server';
import { processWeatherAlerts } from '@/lib/weatherAlerts';

export async function GET(request: Request) {
  try {
    // Check for authorization (you might want to add a secret key)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Optional: Add a secret key for security
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[CRON] Starting weather alerts check...');
    
    await processWeatherAlerts();
    
    console.log('[CRON] Weather alerts check completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Weather alerts check completed' 
    });
  } catch (error) {
    console.error('[CRON] Error in weather alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check weather alerts' },
      { status: 500 }
    );
  }
} 