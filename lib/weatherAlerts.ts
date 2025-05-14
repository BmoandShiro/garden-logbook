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
  sensitivities: {
    heat?: { enabled: boolean; threshold: number };
    frost?: { enabled: boolean; threshold: number };
    wind?: { enabled: boolean; threshold: number };
    drought?: { enabled: boolean; threshold: number };
    flood?: { enabled: boolean; threshold: number };
    heavyRain?: { enabled: boolean; threshold: number };
  } | null;
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

export async function processWeatherAlerts() {
  console.log('[WEATHER_ALERTS] Starting weather alert processing...');
  
  const plants = await prisma.plant.findMany({
    include: {
      garden: true,
      sensitivities: true
    }
  });

  console.log(`[WEATHER_ALERTS] Found ${plants.length} plants to check`);

  // Group plants by garden to track overall status
  const gardenStatus = new Map<string, { hasAlerts: boolean; alertCount: number }>();

  for (const plant of plants) {
    const garden = plant.garden;
    const sensitivities = plant.sensitivities;
    if (!sensitivities) {
      console.log(`[WEATHER_ALERTS] Skipping plant ${plant.id} - no sensitivities configured`);
      continue;
    }

    try {
      console.log(`[WEATHER_ALERTS] Fetching weather data for plant ${plant.id} in ${garden.zipcode}`);
      const weather = await fetchWeatherData(garden.zipcode);
      console.log(`[WEATHER_ALERTS] Weather data received for ${garden.zipcode}:`, weather);

      let hasAlerts = false;

      // Check each sensitivity type
      if (sensitivities.heat?.enabled && weather.temperature >= sensitivities.heat.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'heat', weather, weather.temperature);
        hasAlerts = true;
      }
      if (sensitivities.frost?.enabled && weather.hasFrostAlert && isTodayInFrostWindow(plant)) {
        await maybeSendOrUpdateAlert(plant, garden, 'frost', weather, 1);
        hasAlerts = true;
      }
      if (sensitivities.wind?.enabled && weather.windSpeed >= sensitivities.wind.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'wind', weather, weather.windSpeed);
        hasAlerts = true;
      }
      if (sensitivities.drought?.enabled && weather.daysWithoutRain >= sensitivities.drought.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'drought', weather, weather.daysWithoutRain);
        hasAlerts = true;
      }
      if (sensitivities.flood?.enabled && weather.hasFloodAlert) {
        await maybeSendOrUpdateAlert(plant, garden, 'flood', weather, 1);
        hasAlerts = true;
      }
      if (sensitivities.heavyRain?.enabled && weather.precipitation && weather.precipitation >= sensitivities.heavyRain.threshold) {
        await maybeSendOrUpdateAlert(plant, garden, 'heavyRain', weather, weather.precipitation);
        hasAlerts = true;
      }

      // Update garden status
      const currentStatus = gardenStatus.get(garden.id) || { hasAlerts: false, alertCount: 0 };
      if (hasAlerts) {
        currentStatus.hasAlerts = true;
        currentStatus.alertCount++;
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
          lastChecked: new Date()
        }
      }
    });
  }

  console.log('[WEATHER_ALERTS] Weather alert processing completed');
}

export async function checkWeatherAlerts() {
  const plants = await prisma.plant.findMany({
    include: {
      garden: true,
      sensitivities: true
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

async function fetchWeatherData(zipcode: string): Promise<Weather> {
  try {
    const response = await fetch(`https://api.weather.gov/points/${zipcode}`);
    const data = await response.json();
    
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
    console.error('Error fetching weather data:', error);
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
      type: 'WEATHER_ALERT',
      notes: logMessage,
      logDate: now,
      meta: {
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