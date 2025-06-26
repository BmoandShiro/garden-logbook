import { NextResponse } from 'next/server';
import { fetchAndStoreSensorData } from '@/lib/sensorData';

export async function GET(request: Request) {
  try {
    // Check for authorization (you might want to add a secret key)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Optional: Add a secret key for security
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[CRON] Starting sensor data fetch...');
    
    await fetchAndStoreSensorData();
    
    console.log('[CRON] Sensor data fetch completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sensor data fetch completed' 
    });
  } catch (error) {
    console.error('[CRON] Error in sensor data fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
} 