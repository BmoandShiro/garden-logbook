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
    unit?: string;
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

  // Send a notification to all garden members
  const userIds = await getAllGardenUserIds(garden.id, plant.userId);
  await Promise.all(userIds.map(userId =>
    prisma.notification.create({
      data: {
        userId,
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
    })
  ));
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

// Utility to get all userIds for a garden (members + creator)
async function getAllGardenUserIds(gardenId: string, plantUserId: string): Promise<string[]> {
  const members = await prisma.gardenMember.findMany({
    where: { gardenId },
    select: { userId: true }
  });
  const userIds = members.map((m: { userId: string }) => m.userId);
  if (plantUserId && !userIds.includes(plantUserId)) userIds.push(plantUserId);
  return userIds;
}

function formatPrecipitation(value: number | null | undefined, unit: string) {
  if (value == null) return 'None';
  if (unit === 'mm') {
    const mm = (typeof value === 'string' ? parseFloat(value) : value) * 25.4;
    return `${mm.toFixed(1)} mm`;
  }
  return `${value} in`;
}

function getHeavyRainUnit(sensitivities: any): string {
  return sensitivities && sensitivities.heavyRain && typeof sensitivities.heavyRain.unit === 'string'
    ? sensitivities.heavyRain.unit
    : 'in';
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
      const notificationPeriod = await getUserWeatherNotificationPeriod(plant.userId);
      const { lat, lon } = await getLatLonForZip(garden.zipcode);
      const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
      const data = await response.json();
      if (!data.properties || !data.properties.forecast) continue;
      const forecastUrl = data.properties.forecast;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      const periods = forecastData.properties.periods;
      const periodIndexes = getForecastPeriodIndexes(periods, notificationPeriod);

      let hasAlerts = false;
      let triggeredType: string | null = null;
      let triggeredWeatherInfo: any = null;

      // --- Group forecasted alerts by type ---
      const forecastedAlerts: Record<string, Array<{ period: any, weather: Weather, severity: number }>> = {};

      // --- Group current alerts by type ---
      const currentAlerts: Record<string, { weather: Weather, severity: number }> = {};

      for (const idx of periodIndexes) {
        const period = periods[idx];
        const weather: Weather = {
          temperature: period.temperature,
          humidity: period.relativeHumidity?.value || 0,
          windSpeed: parseInt(period.windSpeed.split(' ')[0]) || 0,
          precipitation: period.probabilityOfPrecipitation?.value || null,
          conditions: period.shortForecast,
          hasFrostAlert: period.temperature <= 32,
          hasFloodAlert: period.probabilityOfPrecipitation?.value > 70,
          daysWithoutRain: 0
        };
        if (idx === 0) {
          // Populate currentAlerts for the current period
          if (sensitivities.heat?.enabled && weather.temperature >= sensitivities.heat.threshold) {
            currentAlerts['heat'] = { weather, severity: weather.temperature };
          }
          if (sensitivities.frost?.enabled && weather.hasFrostAlert) {
            currentAlerts['frost'] = { weather, severity: 1 };
          }
          if (sensitivities.wind?.enabled && weather.windSpeed >= sensitivities.wind.threshold) {
            currentAlerts['wind'] = { weather, severity: weather.windSpeed };
          }
          if (sensitivities.drought?.enabled && weather.daysWithoutRain >= sensitivities.drought.threshold) {
            currentAlerts['drought'] = { weather, severity: weather.daysWithoutRain };
          }
          if (sensitivities.flood?.enabled && weather.hasFloodAlert) {
            currentAlerts['flood'] = { weather, severity: 1 };
          }
          if (sensitivities.heavyRain?.enabled && weather.precipitation && weather.precipitation >= sensitivities.heavyRain.threshold) {
            currentAlerts['heavyRain'] = { weather, severity: weather.precipitation };
          }
        } else {
          // --- Group forecasted alerts for future periods ---
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
            if (!forecastedAlerts[alert.type]) forecastedAlerts[alert.type] = [];
            forecastedAlerts[alert.type].push({ period, weather, severity: alert.severity });
          }
        }
      }

      // Fetch room and zone names if IDs are present
      let roomName = plant.roomId || 'Room/Plot';
      let zoneName = plant.zoneId || 'Zone';
      if (plant.roomId) {
        const room = await prisma.room.findUnique({ where: { id: plant.roomId }, select: { name: true } });
        if (room?.name) roomName = room.name;
      }
      if (plant.zoneId) {
        const zone = await prisma.zone.findUnique({ where: { id: plant.zoneId }, select: { name: true } });
        if (zone?.name) zoneName = zone.name;
      }

      // --- After looping, send grouped forecasted alert notification if any ---
      const allAlertTypes = ['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'];
      const alertTypes = Object.keys(forecastedAlerts);
      if (alertTypes.length > 0) {
        // Build grouped message
        let message = `Forecasted weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plant.name} in ${roomName}, ${zoneName}:
\n`;
        for (const type of allAlertTypes) {
          message += `• ${type.charAt(0).toUpperCase() + type.slice(1)}:`;
          if (forecastedAlerts[type] && forecastedAlerts[type].length > 0) {
            message += '\n';
            for (const entry of forecastedAlerts[type]) {
              message += `    - ${entry.period.name} (${entry.period.startTime}): `;
              if (type === 'heat') message += `${entry.weather.temperature}°F`;
              else if (type === 'wind') message += `${entry.weather.windSpeed} mph`;
              else if (type === 'heavyRain') message += `${formatPrecipitation(entry.weather.precipitation, getHeavyRainUnit(sensitivities))} precipitation`;
              else if (type === 'frost') message += `${entry.weather.temperature}°F`;
              else if (type === 'flood') message += `${formatPrecipitation(entry.weather.precipitation, getHeavyRainUnit(sensitivities))} precipitation`;
              else if (type === 'drought') message += `${entry.weather.daysWithoutRain} days`;
              else message += `${entry.severity}`;
              message += '\n';
            }
          } else {
            message += ' None\n';
          }
        }
        message += '\nPlease prepare in advance to protect your plant.';

        // Deduplicate: check if a grouped notification for this plant and forecast window already exists
        const existing = await prisma.notification.findFirst({
          where: {
            userId: plant.userId,
            type: 'WEATHER_FORECAST_ALERT',
            meta: { path: ['plantId'], equals: plant.id },
            createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // last 4 hours
          },
          orderBy: { createdAt: 'desc' }
        });
        const userIds = await getAllGardenUserIds(garden.id, plant.userId);
        if (!existing) {
          await Promise.all(userIds.map(userId =>
            prisma.notification.create({
              data: {
                userId,
                type: 'WEATHER_FORECAST_ALERT',
                title: `⏳ Forecasted Weather Alerts for ${plant.name}`,
                message,
                link: `/gardens/${garden.id}/plants/${plant.id}`,
                meta: {
                  plantId: plant.id,
                  plantName: plant.name,
                  gardenId: plant.gardenId,
                  gardenName: garden.name,
                  roomId: plant.roomId,
                  roomName,
                  zoneId: plant.zoneId,
                  zoneName,
                  alertTypes,
                  forecastedAlerts,
                  forecastWindow: notificationPeriod
                }
              }
            })
          ));
        }
      }

      // --- After looping, send grouped current alert notification if any ---
      const currentAlertTypes = Object.keys(currentAlerts);
      if (currentAlertTypes.length > 0) {
        // Build grouped message
        let message = `Current weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plant.name} in ${roomName}, ${zoneName}:
\n`;
        for (const type of allAlertTypes) {
          message += `• ${type.charAt(0).toUpperCase() + type.slice(1)}:`;
          if (currentAlerts[type]) {
            message += ' ';
            if (type === 'heat') message += `${currentAlerts[type].weather.temperature}°F`;
            else if (type === 'wind') message += `${currentAlerts[type].weather.windSpeed} mph`;
            else if (type === 'heavyRain') message += `${formatPrecipitation(currentAlerts[type].weather.precipitation, getHeavyRainUnit(sensitivities))} precipitation`;
            else if (type === 'frost') message += `${currentAlerts[type].weather.temperature}°F`;
            else if (type === 'flood') message += `${formatPrecipitation(currentAlerts[type].weather.precipitation, getHeavyRainUnit(sensitivities))} precipitation`;
            else if (type === 'drought') message += `${currentAlerts[type].weather.daysWithoutRain} days`;
            else message += `${currentAlerts[type].severity}`;
            message += '\n';
          } else {
            message += ' None\n';
          }
        }
        message += '\nPlease take necessary precautions to protect your plant.';

        // Log the active alert for the plant, but prevent duplicates in the last 4 hours
        const dedupWindow = new Date(Date.now() - (3 * 60 + 50) * 60 * 1000); // 3 hours 50 minutes
        const existingLog = await prisma.log.findFirst({
          where: {
            plantId: plant.id,
            type: 'WEATHER_ALERT',
            notes: message,
            logDate: { gte: dedupWindow }
          }
        });
        if (!existingLog) {
          await prisma.log.create({
            data: {
              plantId: plant.id,
              userId: plant.userId,
              gardenId: plant.garden?.id ?? plant.gardenId ?? null,
              roomId: plant.roomId ?? null,
              zoneId: plant.zoneId ?? null,
              type: 'WEATHER_ALERT',
              stage: plant.stage ?? 'VEGETATIVE',
              notes: message,
              logDate: new Date(),
              data: {
                alertTypes: currentAlertTypes,
                currentAlerts,
                weatherInfo: triggeredWeatherInfo,
                severity: Math.max(...Object.values(currentAlerts).map(a => a.severity ?? 1)),
              }
            }
          });
        } else {
          console.log(`[WEATHER_ALERTS] Skipping duplicate WEATHER_ALERT log for plant ${plant.id} in last 4 hours.`);
        }

        // Deduplicate: check if a grouped notification for this plant already exists in the last 4 hours
        const existing = await prisma.notification.findFirst({
          where: {
            userId: plant.userId,
            type: 'WEATHER_ALERT',
            meta: { path: ['plantId'], equals: plant.id },
            createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (!existing) {
          const userIds = await getAllGardenUserIds(garden.id, plant.userId);
          await Promise.all(userIds.map(userId =>
            prisma.notification.create({
              data: {
                userId,
                type: 'WEATHER_ALERT',
                title: `⚠️ Current Weather Alerts for ${plant.name}`,
                message,
                link: `/gardens/${garden.id}/plants/${plant.id}`,
                meta: {
                  plantId: plant.id,
                  plantName: plant.name,
                  gardenId: plant.gardenId,
                  gardenName: garden.name,
                  roomId: plant.roomId,
                  roomName,
                  zoneId: plant.zoneId,
                  zoneName,
                  alertTypes: currentAlertTypes,
                  currentAlerts,
                  date: new Date().toISOString().slice(0, 10)
                }
              }
            })
          ));
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
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);

  // Format weather data for display
  const weatherInfo = {
    temperature: `${weather.temperature}°F`,
    humidity: `${weather.humidity}%`,
    windSpeed: `${weather.windSpeed} mph`,
    precipitation: formatPrecipitation(weather.precipitation, getHeavyRainUnit(plant.sensitivities)),
    conditions: weather.conditions
  };

  // Fetch room and zone names if IDs are present
  let roomName = plant.roomId || 'Room/Plot';
  let zoneName = plant.zoneId || 'Zone';
  if (plant.roomId) {
    const room = await prisma.room.findUnique({ where: { id: plant.roomId }, select: { name: true } });
    if (room?.name) roomName = room.name;
  }
  if (plant.zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: plant.zoneId }, select: { name: true } });
    if (zone?.name) zoneName = zone.name;
  }

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
      type: 'WEATHER_ALERT',
      notes: logMessage,
      logDate: new Date(),
      data: {
        alertType: type,
        weatherInfo,
        severity,
      }
    }
  });
}