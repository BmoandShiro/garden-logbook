import { prisma } from '@/lib/prisma';
import { getWeatherDataForZip } from '@/lib/weather';

interface Weather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number | null;
  conditions: string;
  hasFrostAlert: boolean;
  hasFloodAlert: boolean;
  daysWithoutRain: number;
}

interface Plant {
  id: string;
  userId: string;
  name: string;
  garden: {
    id: string;
    name: string;
    zipcode: string;
  };
  gardenId?: string;
  roomId?: string;
  zoneId?: string;
  sensitivities: {
    heat?: { enabled: boolean; threshold: number };
    frost?: { enabled: boolean; threshold: number };
    wind?: { enabled: boolean; threshold: number };
    drought?: { enabled: boolean; threshold: number };
    flood?: { enabled: boolean; threshold: number };
    heavyRain?: { enabled: boolean; threshold: number };
  } | null;
  stage?: string;
}

interface Garden {
  id: string;
  zipcode: string;
  name: string;
}

async function sendAllClearNotification(plant: Plant, garden: Plant['garden'], weather: Weather) {
  const weatherInfo = {
    temperature: `${weather.temperature}°F`,
    humidity: `${weather.humidity}%`,
    windSpeed: `${weather.windSpeed} mph`,
    precipitation: weather.precipitation ? `${weather.precipitation} inches` : 'None',
    conditions: weather.conditions
  };

  // Create a log entry for the plant
  const logMessage = `Daily Weather Check: All conditions within safe ranges.\n` +
    `• Current Conditions: ${weatherInfo.conditions}\n` +
    `• Temperature: ${weatherInfo.temperature}\n` +
    `• Humidity: ${weatherInfo.humidity}\n` +
    `• Wind Speed: ${weatherInfo.windSpeed}\n` +
    `• Precipitation: ${weatherInfo.precipitation}`;

  await prisma.log.create({
    data: {
      plantId: plant.id,
      type: 'WEATHER_CHECK',
      notes: logMessage,
      logDate: new Date(),
      meta: {
        weatherInfo,
        status: 'all_clear'
      }
    }
  });

  // Send a notification
  await prisma.notification.create({
    data: {
      userId: plant.userId,
      type: 'WEATHER_CHECK',
      title: `✅ Weather Check: ${plant.name} is doing well`,
      message: `Daily weather check for ${plant.name} in ${garden.name} (${garden.zipcode}):\n\n` +
        `• Current Conditions: ${weatherInfo.conditions}\n` +
        `• Temperature: ${weatherInfo.temperature}\n` +
        `• Humidity: ${weatherInfo.humidity}\n` +
        `• Wind Speed: ${weatherInfo.windSpeed}\n` +
        `• Precipitation: ${weatherInfo.precipitation}\n\n` +
        `All conditions are within safe ranges for your plant.`,
      link: `/gardens/${garden.id}/plants/${plant.id}`,
      meta: { 
        plantId: plant.id,
        date: new Date().toISOString().slice(0, 10),
        weatherInfo,
        status: 'all_clear'
      }
    }
  });
}

// Helper to get the user's weather notification period preference
async function getUserWeatherNotificationPeriod(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { weatherNotificationPeriod: true } });
  return user?.weatherNotificationPeriod || 'current';
}

// Helper to determine which forecast periods to check based on preference
function getForecastPeriodIndexes(periods: any[], preference: string): number[] {
  if (preference === 'current') return [0];
  if (preference === '24h') return periods.slice(0, 2).map((_, i) => i); // 2 periods = 24h
  if (preference === '3d') return periods.slice(0, 6).map((_, i) => i); // 6 periods = 3 days
  if (preference === 'week' || preference === 'all') return periods.map((_, i) => i);
  return [0];
}

export async function processWeatherAlerts() {
  console.log('[WEATHER_ALERTS] Starting weather alert processing...');
  
  const plants = await prisma.plant.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
      garden: { select: { id: true, name: true, zipcode: true } },
      gardenId: true,
      roomId: true,
      zoneId: true,
      sensitivities: true,
      stage: true
    }
  });

  console.log(`[WEATHER_ALERTS] Found ${plants.length} plants to check`);

  // Group plants by garden to track overall status and alerts
  const gardenStatus = new Map<string, {
    hasAlerts: boolean;
    alertCount: number;
    lastChecked: Date;
    alerts: Array<{
      plantId: string;
      plantName: string;
      alertType: string;
      weatherInfo: any;
      timestamp: string;
    }>;
  }>();

  for (const plant of plants) {
    // Debug log for plant and garden
    console.log('[PLANT DEBUG]', {
      id: plant.id,
      name: plant.name,
      gardenId: plant.gardenId,
      garden: plant.garden
    });
    const garden = plant.garden;
    const sensitivities = plant.sensitivities;
    if (!garden || !garden.zipcode) {
      console.log(`[WEATHER_ALERTS] Skipping plant ${plant.id} - no garden or zipcode`);
      continue;
    }
    if (!sensitivities) {
      console.log(`[WEATHER_ALERTS] Skipping plant ${plant.id} - no sensitivities configured`);
      continue;
    }

    try {
      // Fetch user notification preference
      const notificationPeriod = await getUserWeatherNotificationPeriod(plant.userId);
      // Fetch full forecast
      const { lat, lon } = await getLatLonForZip(garden.zipcode);
      const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
      const data = await response.json();
      if (!data.properties || !data.properties.forecast) {
        throw new Error(`No forecast found for zipcode ${garden.zipcode} (lat/lon: ${lat},${lon}). Response: ${JSON.stringify(data)}`);
      }
      const forecastUrl = data.properties.forecast;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      const periods = forecastData.properties.periods;
      const periodIndexes = getForecastPeriodIndexes(periods, notificationPeriod);

      let hasAlerts = false;
      let triggeredType: string | null = null;
      let triggeredWeatherInfo: any = null;

      for (const idx of periodIndexes) {
        const period = periods[idx];
        // Map to Weather interface
        const weather: Weather = {
          temperature: period.temperature,
          humidity: period.relativeHumidity?.value || 0,
          windSpeed: parseInt(period.windSpeed.split(' ')[0]) || 0,
          precipitation: period.probabilityOfPrecipitation?.value || null,
          conditions: period.shortForecast,
          hasFrostAlert: period.temperature <= 32,
          hasFloodAlert: period.probabilityOfPrecipitation?.value > 70,
          daysWithoutRain: 0 // Not available in forecast
        };
        // Only log and send current/active alerts for the first period
        if (idx === 0) {
          // Check each sensitivity type (current/active)
          if (sensitivities.heat?.enabled && weather.temperature >= sensitivities.heat.threshold) {
            await maybeSendOrUpdateAlert(plant, garden, 'heat', weather, weather.temperature);
            hasAlerts = true;
            triggeredType = 'heat';
            triggeredWeatherInfo = weather;
          }
          if (sensitivities.frost?.enabled && weather.hasFrostAlert && isTodayInFrostWindow(plant)) {
            await maybeSendOrUpdateAlert(plant, garden, 'frost', weather, 1);
            hasAlerts = true;
            triggeredType = 'frost';
            triggeredWeatherInfo = weather;
          }
          if (sensitivities.wind?.enabled && weather.windSpeed >= sensitivities.wind.threshold) {
            await maybeSendOrUpdateAlert(plant, garden, 'wind', weather, weather.windSpeed);
            hasAlerts = true;
            triggeredType = 'wind';
            triggeredWeatherInfo = weather;
          }
          if (sensitivities.drought?.enabled && weather.daysWithoutRain >= sensitivities.drought.threshold) {
            await maybeSendOrUpdateAlert(plant, garden, 'drought', weather, weather.daysWithoutRain);
            hasAlerts = true;
            triggeredType = 'drought';
            triggeredWeatherInfo = weather;
          }
          if (sensitivities.flood?.enabled && weather.hasFloodAlert) {
            await maybeSendOrUpdateAlert(plant, garden, 'flood', weather, 1);
            hasAlerts = true;
            triggeredType = 'flood';
            triggeredWeatherInfo = weather;
          }
          if (sensitivities.heavyRain?.enabled && weather.precipitation && weather.precipitation >= sensitivities.heavyRain.threshold) {
            await maybeSendOrUpdateAlert(plant, garden, 'heavyRain', weather, weather.precipitation);
            hasAlerts = true;
            triggeredType = 'heavyRain';
            triggeredWeatherInfo = weather;
          }
        } else {
          // For future periods, only send deduplicated forecast notifications
          // Check each sensitivity type
          const alertTypes: { type: string; triggered: boolean; severity: number }[] = [];
          if (sensitivities.heat?.enabled && weather.temperature >= sensitivities.heat.threshold) {
            alertTypes.push({ type: 'heat', triggered: true, severity: weather.temperature });
          }
          if (sensitivities.frost?.enabled && weather.hasFrostAlert) {
            alertTypes.push({ type: 'frost', triggered: true, severity: 1 });
          }
          if (sensitivities.wind?.enabled && weather.windSpeed >= sensitivities.wind.threshold) {
            alertTypes.push({ type: 'wind', triggered: true, severity: weather.windSpeed });
          }
          if (sensitivities.drought?.enabled && weather.daysWithoutRain >= sensitivities.drought.threshold) {
            alertTypes.push({ type: 'drought', triggered: true, severity: weather.daysWithoutRain });
          }
          if (sensitivities.flood?.enabled && weather.hasFloodAlert) {
            alertTypes.push({ type: 'flood', triggered: true, severity: 1 });
          }
          if (sensitivities.heavyRain?.enabled && weather.precipitation && weather.precipitation >= sensitivities.heavyRain.threshold) {
            alertTypes.push({ type: 'heavyRain', triggered: true, severity: weather.precipitation });
          }
          for (const alert of alertTypes) {
            // Deduplicate: check if a notification for this plant, type, and period start time already exists
            const periodStart = period.startTime;
            const existing = await prisma.notification.findFirst({
              where: {
                userId: plant.userId,
                type: 'WEATHER_FORECAST_ALERT',
                meta: {
                  path: ['plantId'], equals: plant.id
                },
                createdAt: { gte: new Date(periodStart) },
                message: { contains: alert.type }
              },
              orderBy: { createdAt: 'desc' }
            });
            if (!existing) {
              await prisma.notification.create({
                data: {
                  userId: plant.userId,
                  type: 'WEATHER_FORECAST_ALERT',
                  title: `⏳ Forecasted Weather Alert: ${alert.type} for ${plant.name}`,
                  message: `Forecasted weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plant.name}:

` +
                    `• Alert Type: ${alert.type}
` +
                    `• Forecasted For: ${period.name} (${period.startTime})
` +
                    `• Conditions: ${weather.conditions}
` +
                    `• Temperature: ${weather.temperature}°F
` +
                    `• Humidity: ${weather.humidity}%
` +
                    `• Wind Speed: ${weather.windSpeed} mph
` +
                    `• Precipitation: ${weather.precipitation ?? 'N/A'}

` +
                    `Please prepare in advance to protect your plant.`,
                  link: `/gardens/${garden.id}/plants/${plant.id}`,
                  meta: {
                    plantId: plant.id,
                    alertType: alert.type,
                    forecastPeriod: period.name,
                    forecastStart: period.startTime,
                    severity: alert.severity,
                    weatherInfo: weather
                  }
                }
              });
            }
          }
        }
      }

      // Update garden status and alerts (for current period only)
      const currentStatus = gardenStatus.get(garden.id) || {
        hasAlerts: false,
        alertCount: 0,
        lastChecked: new Date(),
        alerts: []
      };
      if (hasAlerts && triggeredType) {
        currentStatus.hasAlerts = true;
        currentStatus.alertCount++;
        currentStatus.lastChecked = new Date();
        currentStatus.alerts.push({
          plantId: plant.id,
          plantName: plant.name,
          alertType: triggeredType,
          weatherInfo: triggeredWeatherInfo,
          timestamp: new Date().toISOString()
        });
      }
      gardenStatus.set(garden.id, currentStatus);

    } catch (error) {
      console.error(`[WEATHER_ALERTS] Error checking weather alerts for plant ${plant.id}:`, error);
    }
  }

  // Update garden status in the database
  for (const [gardenId, status] of gardenStatus) {
    await prisma.garden.update({
      where: { id: gardenId },
      data: {
        weatherStatus: {
          hasAlerts: status.hasAlerts,
          alertCount: status.alertCount,
          lastChecked: status.lastChecked,
          alerts: status.alerts
        }
      }
    });
  }

  console.log('[WEATHER_ALERTS] Weather alert processing completed');
}

export async function checkWeatherAlerts() {
  const plants = await prisma.plant.findMany({
    include: {
      garden: true
    }
  });

  for (const plant of plants) {
    const garden = plant.garden;
    const sensitivities = plant.sensitivities;
    if (!sensitivities) continue;

    try {
      const weather = await fetchWeatherData(garden.zipcode);

      // Check each sensitivity type
      if (sensitivities.heat?.enabled && weather.temperature >= sensitivities.heat.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'heat', weather, weather.temperature);
      }
      if (sensitivities.frost?.enabled && weather.hasFrostAlert && isTodayInFrostWindow(plant)) {
        await maybeSendOrUpdateAlert(plant, garden, 'frost', weather, 1); // 1 = frost present
      }
      if (sensitivities.wind?.enabled && weather.windSpeed >= sensitivities.wind.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'wind', weather, weather.windSpeed);
      }
      if (sensitivities.drought?.enabled && weather.daysWithoutRain >= sensitivities.drought.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'drought', weather, weather.daysWithoutRain);
      }
      if (sensitivities.flood?.enabled && weather.hasFloodAlert) {
        await maybeSendOrUpdateAlert(plant, garden, 'flood', weather, 1); // 1 = flood present
      }
      if (sensitivities.heavyRain?.enabled && weather.precipitation && weather.precipitation >= sensitivities.heavyRain.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'heavyRain', weather, weather.precipitation);
      }
    } catch (error) {
      console.error(`Error checking weather alerts for plant ${plant.id}:`, error);
    }
  }
}

// Helper to get lat/lon from zipcode using OpenStreetMap Nominatim
async function getLatLonForZip(zipcode: string): Promise<{ lat: number, lon: number }> {
  // 1. Check DB cache first
  const cached = await prisma.weatherCheck.findUnique({ where: { zip: zipcode } });
  if (cached) {
    // Update lastChecked
    await prisma.weatherCheck.update({
      where: { zip: zipcode },
      data: { lastChecked: new Date() }
    });
    return { lat: cached.lat, lon: cached.lon };
  }
  // 2. If not cached, fetch from Nominatim
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=us&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'garden-logbook/1.0 (your-email@example.com)'
    }
  });
  if (res.status === 429) {
    throw new Error('Nominatim geocoding rate limit reached (HTTP 429). Try again later.');
  }
  if (!res.ok) {
    throw new Error(`Geocoding failed for zipcode ${zipcode}: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.length) throw new Error(`No lat/lon found for zipcode ${zipcode}`);
  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  // 3. Store in DB for future use
  await prisma.weatherCheck.create({
    data: {
      zip: zipcode,
      lat,
      lon,
      lastChecked: new Date(),
      data: data[0] // Store full geocode result for reference
    }
  });
  return { lat, lon };
}

async function fetchWeatherData(zipcode: string): Promise<Weather> {
  try {
    // Convert zipcode to lat/lon
    const { lat, lon } = await getLatLonForZip(zipcode);
    // Use lat/lon for NWS API
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    const data = await response.json();
    // Check for forecast property
    if (!data.properties || !data.properties.forecast) {
      throw new Error(`No forecast found for zipcode ${zipcode} (lat/lon: ${lat},${lon}). Response: ${JSON.stringify(data)}`);
    }
    // Get the forecast URL from the response
    const forecastUrl = data.properties.forecast;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    // Get the current conditions
    const currentConditions = forecastData.properties.periods[0];
    // Map the API response to our Weather interface
    return {
      temperature: currentConditions.temperature,
      humidity: currentConditions.relativeHumidity?.value || 0,
      windSpeed: parseInt(currentConditions.windSpeed.split(' ')[0]) || 0,
      precipitation: currentConditions.probabilityOfPrecipitation?.value || null,
      conditions: currentConditions.shortForecast,
      hasFrostAlert: currentConditions.temperature <= 32,
      hasFloodAlert: currentConditions.probabilityOfPrecipitation?.value > 70,
      daysWithoutRain: 0 // This would need to be calculated based on historical data
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Nominatim geocoding rate limit')) {
      console.warn('[WEATHER_ALERTS] Geocoding rate limit hit. Skipping weather check for now.');
    } else {
      console.error('Error fetching weather data:', error);
    }
    throw error;
  }
}

function isTodayInSeason(start: string, end: string) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const startParts = start.split('-').map(Number);
  const endParts = end.split('-').map(Number);
  const startMonth = startParts[0];
  const startDay = startParts[1];
  const endMonth = endParts[0];
  const endDay = endParts[1];

  if (startMonth <= endMonth) {
    return (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) &&
           (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay));
  } else {
    return (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) ||
           (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay));
  }
}

function isTodayInFrostWindow(plant: Plant): boolean {
  // TODO: Implement frost window check based on plant's growing season
  return true;
}

async function maybeSendOrUpdateAlert(
  plant: Plant,
  garden: Plant['garden'],
  type: string,
  weather: Weather,
  severity: number
) {
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);

  // Format weather data for display
  const weatherInfo = {
    temperature: `${weather.temperature}°F`,
    humidity: `${weather.humidity}%`,
    windSpeed: `${weather.windSpeed} mph`,
    precipitation: weather.precipitation ? `${weather.precipitation} inches` : 'None',
    conditions: weather.conditions
  };

  // Create a log entry for the plant
  const logMessage = `Weather Alert: ${type} conditions detected.\n` +
    `• Current Conditions: ${weatherInfo.conditions}\n` +
    `• Temperature: ${weatherInfo.temperature}\n` +
    `• Humidity: ${weatherInfo.humidity}\n` +
    `• Wind Speed: ${weatherInfo.windSpeed}\n` +
    `• Precipitation: ${weatherInfo.precipitation}`;

  await prisma.log.create({
    data: {
      plantId: plant.id,
      userId: plant.userId,
      gardenId: plant.garden?.id ?? plant.gardenId ?? null,
      roomId: plant.roomId ?? null,
      zoneId: plant.zoneId ?? null,
      type: 'WEATHER_ALERT',
      stage: plant.stage ?? 'VEGETATIVE',
      notes: logMessage,
      logDate: now,
      data: {
        alertType: type,
        severity,
        weatherInfo
      }
    }
  });

  // Find the most recent notification for this plant+type in the last 12 hours
  const existing = await prisma.notification.findFirst({
    where: {
      userId: plant.userId,
      type: 'WEATHER_ALERT',
      meta: { path: ['plantId'], equals: plant.id },
      createdAt: { gte: twelveHoursAgo },
      message: { contains: type }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existing) {
    // If the new severity is worse, update the notification
    const prevSeverity = existing.meta?.severity ?? null;
    if (prevSeverity !== null && severity > prevSeverity) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: {
          title: `⚠️ Weather Alert: ${type} for ${plant.name} (Severity Increased)`,
          message: `The weather conditions for ${plant.name} in ${garden.name} (${garden.zipcode}) have worsened:\n\n` +
            `• Alert Type: ${type}\n` +
            `• Current Conditions: ${weatherInfo.conditions}\n` +
            `• Temperature: ${weatherInfo.temperature}\n` +
            `• Humidity: ${weatherInfo.humidity}\n` +
            `• Wind Speed: ${weatherInfo.windSpeed}\n` +
            `• Precipitation: ${weatherInfo.precipitation}\n\n` +
            `Please take necessary precautions to protect your plant.`,
          meta: { 
            ...existing.meta, 
            severity, 
            updatedAt: now,
            weatherInfo
          }
        }
      });
    }
    // Otherwise, do not send a new notification
    return;
  }

  // No recent notification, send a new one
  await prisma.notification.create({
    data: {
      userId: plant.userId,
      type: 'WEATHER_ALERT',
      title: `⚠️ Weather Alert: ${type} for ${plant.name}`,
      message: `Weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plant.name}:\n\n` +
        `• Alert Type: ${type}\n` +
        `• Current Conditions: ${weatherInfo.conditions}\n` +
        `• Temperature: ${weatherInfo.temperature}\n` +
        `• Humidity: ${weatherInfo.humidity}\n` +
        `• Wind Speed: ${weatherInfo.windSpeed}\n` +
        `• Precipitation: ${weatherInfo.precipitation}\n\n` +
        `Please take necessary precautions to protect your plant.`,
      link: `/gardens/${garden.id}/plants/${plant.id}`,
      meta: { 
        plantId: plant.id, 
        alertType: type, 
        date: today, 
        severity,
        weatherInfo
      }
    }
  });
} 