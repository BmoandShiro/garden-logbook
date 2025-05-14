import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processWeatherAlerts } from '@/lib/weatherAlerts';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[WEATHER_TEST] Manually triggering weather alerts...');
    await processWeatherAlerts();
    console.log('[WEATHER_TEST] Weather alerts completed successfully');
    return NextResponse.json({ success: true, message: 'Weather alerts processed successfully' });
  } catch (error) {
    console.error('[WEATHER_TEST] Error processing weather alerts:', error);
    return NextResponse.json({ error: 'Failed to process weather alerts' }, { status: 500 });
  }
} 