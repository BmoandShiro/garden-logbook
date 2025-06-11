// @ts-expect-error: no types for zipcode-to-timezone
import zipcodeToTimezone from 'zipcode-to-timezone';
import { prisma } from '../lib/prisma';
import { getWeatherDataForZip } from '../lib/weather';
import { Stage, LogType, Prisma } from '@prisma/client';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

interface Weather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number | null;
  conditions: string;
  hasFrostAlert: boolean;
  hasFloodAlert: boolean;
  daysWithoutRain: number;
  precipitationIn?: number;
  precipitationMm?: number;
  [key: string]: any;
}

interface PlantSensitivities {
  heat?: { enabled: boolean; threshold: number };
  frost?: { enabled: boolean; threshold: number };
  wind?: { enabled: boolean; threshold: number };
  drought?: { enabled: boolean; threshold: number; days?: number };
  flood?: { enabled: boolean; threshold: number };
  heavyRain?: { enabled: boolean; threshold: number; unit?: string };
  unit?: string;
  [key: string]: any;
}

interface Plant {
  id: string;
  userId: string;
  name: string;
  garden: {
    id: string;
    name: string;
    zipcode: string | null;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    creatorId: string;
    isPrivate: boolean;
    imageUrl: string | null;
    weatherStatus: Prisma.JsonValue;
    timezone: string | null;
  } | null;
  gardenId?: string | null;
  roomId?: string | null;
  zoneId?: string | null;
  sensitivities: Prisma.JsonValue;
  stage?: Stage;
}

interface Garden {
  id: string;
  zipcode: string;
  name: string;
  timezone: string | null;
}

interface NotificationMeta {
  plantId: string;
  plantName: string;
  gardenId: string | null;
  gardenName: string;
  roomId: string | null;
  roomName: string;
  zoneId: string | null;
  zoneName: string;
  alertTypes: string[];
  currentAlerts: Record<string, { weather: Weather; severity: number }>;
  date: string;
  logId?: string;
  timezone?: string;
  [key: string]: any;
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

function getHeavyRainUnit(sensitivities: Prisma.JsonValue): string {
  if (!sensitivities || typeof sensitivities !== 'object') return 'in';
  const typedSensitivities = sensitivities as PlantSensitivities;
  return typedSensitivities?.heavyRain?.unit || 'in';
}

// Helper to get the timezone for a garden, falling back to zipcode
function getGardenTimezone(garden: { timezone?: string | null; zipcode?: string | null }): string | null {
  if (garden.timezone) return garden.timezone;
  if (garden.zipcode) {
    try {
      return zipcodeToTimezone.lookup(garden.zipcode) || null;
    } catch {
      return null;
    }
  }
  return null;
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
    try {
      const plantWithGarden = plant as Plant;
      if (!plantWithGarden.garden?.zipcode) {
        console.log(`[WEATHER_ALERTS] Skipping plant ${plantWithGarden.name} - no zipcode`);
        continue;
      }

      const weather = await fetchWeatherData(plantWithGarden.garden.zipcode);
      const sensitivities = plantWithGarden.sensitivities as PlantSensitivities | null;

      if (!sensitivities) {
        console.log(`[WEATHER_ALERTS] Skipping plant ${plantWithGarden.name} - no sensitivities`);
        continue;
      }

      // Process alerts based on sensitivities
      if (sensitivities.heat?.enabled && weather.temperature > sensitivities.heat.threshold) {
        // await maybeSendOrUpdateAlert(
        //   plantWithGarden,
        //   plantWithGarden.garden,
        //   'heat',
        //   weather,
        //   Math.min(5, Math.floor((weather.temperature - sensitivities.heat.threshold) / 5))
        // );
      }

      // Debug log for plant and garden
      console.log('[PLANT DEBUG]', {
        id: plantWithGarden.id,
        name: plantWithGarden.name,
        gardenId: plantWithGarden.gardenId,
        garden: plantWithGarden.garden
      });
      const garden = plantWithGarden.garden;
      const sensitivitiesTyped = sensitivities as PlantSensitivities | undefined;
      if (!garden || !garden.zipcode) {
        console.log(`[WEATHER_ALERTS] Skipping plant ${plantWithGarden.id} - no garden or zipcode`);
        continue;
      }
      if (!sensitivitiesTyped) {
        console.log(`[WEATHER_ALERTS] Skipping plant ${plantWithGarden.id} - no sensitivities configured`);
        continue;
      }

      const notificationPeriod = await getUserWeatherNotificationPeriod(plantWithGarden.userId);
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

      // Fetch NWS alerts for this location
      const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
      const alertsData = await alertsResponse.json();
      const activeAlerts = alertsData.features || [];
      const floodAlertActive = activeAlerts.some((alert: any) => {
        const event = alert.properties?.event || '';
        return (
          event.includes('Flood Warning') ||
          event.includes('Flood Advisory') ||
          event.includes('Flash Flood Warning')
        );
      });

      // --- Open-Meteo: Fetch daily precipitation for drought and heavy rain ---
      let daysWithoutRain = 0;
      let observedPrecip24h = null;
      try {
        // Get today and 7 days ago in YYYY-MM-DD
        const now = new Date();
        const endDate = now.toISOString().slice(0, 10);
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        // Fetch both daily and hourly precipitation
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&hourly=precipitation&timezone=auto`;
        const meteoRes = await fetch(openMeteoUrl);
        const meteoData = await meteoRes.json();
        let precipArr = [];
        if (meteoData.daily && Array.isArray(meteoData.daily.precipitation_sum)) {
          precipArr = meteoData.daily.precipitation_sum;
        } else if (typeof meteoData.daily?.precipitation_sum === 'string') {
          precipArr = meteoData.daily.precipitation_sum.split(',').map(Number);
        }
        // Open-Meteo returns mm, convert to inches and round to two decimals
        const precipInchesArr = precipArr.map((mm: number) => Math.round((mm / 25.4) * 100) / 100);
        // Drought: count consecutive days with < 0.01 inch
        daysWithoutRain = 0;
        for (let i = precipInchesArr.length - 1; i >= 0; i--) {
          if (precipInchesArr[i] < 0.01) {
            daysWithoutRain++;
          } else {
            break;
          }
        }
        // --- Rolling 24h precipitation for heavy rain (current only) ---
        if (meteoData.hourly && Array.isArray(meteoData.hourly.precipitation)) {
          const hourlyPrecip = meteoData.hourly.precipitation;
          // Get the last 24 values (most recent 24 hours)
          const last24 = hourlyPrecip.slice(-24);
          const sumMm = last24.reduce((a: number, b: number) => a + b, 0);
          observedPrecip24h = Math.round((sumMm / 25.4) * 100) / 100; // inches, rounded to 2 decimals
        } else {
          // Fallback to most recent daily value if hourly not available
          if (precipInchesArr.length > 0) {
            observedPrecip24h = precipInchesArr[precipInchesArr.length - 1];
          }
        }
        console.log(`[DEBUG][OpenMeteo] Daily precip (in) for ${plantWithGarden.name} (${garden.zipcode}):`, precipInchesArr);
        console.log(`[DEBUG][OpenMeteo] Days without rain:`, daysWithoutRain);
        console.log(`[DEBUG][OpenMeteo] Rolling 24h precip (in):`, observedPrecip24h);
      } catch (err) {
        console.warn('[WEATHER_ALERTS] Could not fetch Open-Meteo daily/hourly precip:', err);
      }

      // --- Group forecasted alerts by type ---
      const forecastedAlerts: Record<string, Array<{ period: any, weather: Weather, severity: number }>> = {};

      // --- Group current alerts by type ---
      const currentAlerts: Record<string, { weather: Weather, severity: number }> = {};

      for (const idx of periodIndexes) {
        const period = periods[idx];
        // Use rain amount if available, fallback to 0
        let rainAmount = 0;
        if (period.quantitativePrecipitation) {
          rainAmount = period.quantitativePrecipitation.in || period.quantitativePrecipitation.mm * 0.0393701 || 0;
        } else if (period.probabilityOfPrecipitation?.value && period.probabilityOfPrecipitation.value > 0) {
          rainAmount = 0;
        }
        const weather: Weather = {
          temperature: period.temperature,
          humidity: period.relativeHumidity?.value || 0,
          windSpeed: parseInt(period.windSpeed.split(' ')[0]) || 0,
          precipitation: rainAmount,
          conditions: period.shortForecast,
          hasFrostAlert: period.temperature <= 32,
          hasFloodAlert: floodAlertActive,
          daysWithoutRain,
        };
        if (idx === 0) {
          // Populate currentAlerts for the current period
          const heat = (sensitivitiesTyped as PlantSensitivities).heat;
          if (heat && heat.enabled && heat.threshold !== undefined && weather.temperature >= heat.threshold) {
            currentAlerts['heat'] = { weather, severity: weather.temperature };
          }
          const frost = (sensitivitiesTyped as PlantSensitivities).frost;
          if (frost && frost.enabled && weather.hasFrostAlert) {
            currentAlerts['frost'] = { weather, severity: 1 };
          }
          const wind = (sensitivitiesTyped as PlantSensitivities).wind;
          if (wind && wind.enabled && wind.threshold !== undefined && weather.windSpeed >= wind.threshold) {
            currentAlerts['wind'] = { weather, severity: weather.windSpeed };
          }
          const drought = (sensitivitiesTyped as PlantSensitivities).drought;
          if (drought && drought.enabled) {
            const droughtThreshold = drought.threshold ?? drought.days;
            if (droughtThreshold !== undefined && weather.daysWithoutRain >= droughtThreshold) {
              currentAlerts['drought'] = { weather, severity: weather.daysWithoutRain };
            }
          }
          const flood = (sensitivitiesTyped as PlantSensitivities).flood;
          if (flood && flood.enabled && weather.hasFloodAlert) {
            currentAlerts['flood'] = { weather, severity: 1 };
          }
          // Use observed precipitation for current heavy rain alert
          const heavyRain = (sensitivitiesTyped as PlantSensitivities).heavyRain;
          if (heavyRain && heavyRain.enabled && heavyRain.threshold !== undefined && observedPrecip24h != null && observedPrecip24h >= heavyRain.threshold) {
            // Clone weather object but override precipitation with observed value
            currentAlerts['heavyRain'] = { weather: { ...weather, precipitation: observedPrecip24h }, severity: observedPrecip24h };
          }
        } else {
          // --- Group forecasted alerts for future periods ---
          let droughtForecastCounter = daysWithoutRain;
          let droughtBroken = false;
          for (let i = 1; i < periods.length; i++) {
            const period = periods[i];
            // Get forecasted precipitation in inches and mm
            let precipIn = 0;
            let precipMm = 0;
            if (period.quantitativePrecipitation) {
              if (typeof period.quantitativePrecipitation.in === 'number') {
                precipIn = period.quantitativePrecipitation.in;
                precipMm = Math.round(precipIn * 25.4 * 100) / 100;
              } else if (typeof period.quantitativePrecipitation.mm === 'number') {
                precipMm = period.quantitativePrecipitation.mm;
                precipIn = Math.round((precipMm / 25.4) * 100) / 100;
              }
            }
            // --- Drought ---
            if (!droughtBroken && precipIn < 0.01 && precipMm < 0.254) {
              droughtForecastCounter++;
              if (!forecastedAlerts['drought']) forecastedAlerts['drought'] = [];
              forecastedAlerts['drought'].push({
                period,
                weather: {
                  ...weather,
                  precipitation: sensitivitiesTyped?.heavyRain?.unit === 'mm' ? precipMm : precipIn,
                  precipitationIn: precipIn,
                  precipitationMm: precipMm,
                  daysWithoutRain: droughtForecastCounter
                },
                severity: droughtForecastCounter
              });
            } else {
              droughtBroken = true;
            }
            // --- Heat ---
            const heat = (sensitivitiesTyped as PlantSensitivities).heat;
            if (heat && heat.enabled && heat.threshold !== undefined && period.temperature >= heat.threshold) {
              if (!forecastedAlerts['heat']) forecastedAlerts['heat'] = [];
              forecastedAlerts['heat'].push({
                period,
                weather: {
                  ...weather,
                  temperature: period.temperature,
                },
                severity: period.temperature
              });
            }
            // --- Frost ---
            const frost = (sensitivitiesTyped as PlantSensitivities).frost;
            if (frost && frost.enabled && period.temperature <= 32) {
              if (!forecastedAlerts['frost']) forecastedAlerts['frost'] = [];
              forecastedAlerts['frost'].push({
                period,
                weather: {
                  ...weather,
                  temperature: period.temperature,
                },
                severity: 1
              });
            }
            // --- Wind ---
            const wind = (sensitivitiesTyped as PlantSensitivities).wind;
            const windSpeed = parseInt(period.windSpeed.split(' ')[0]) || 0;
            if (wind && wind.enabled && wind.threshold !== undefined && windSpeed >= wind.threshold) {
              if (!forecastedAlerts['wind']) forecastedAlerts['wind'] = [];
              forecastedAlerts['wind'].push({
                period,
                weather: {
                  ...weather,
                  windSpeed,
                },
                severity: windSpeed
              });
            }
            // --- Heavy Rain ---
            // Use threshold from sensitivities
            const heavyRain = (sensitivitiesTyped as PlantSensitivities).heavyRain;
            if (heavyRain && heavyRain.enabled && heavyRain.threshold !== undefined) {
              const heavyRainThreshold = heavyRain.threshold;
              const heavyRainUnit = getHeavyRainUnit(sensitivitiesTyped);
              const precipValue = heavyRainUnit === 'mm' ? precipMm : precipIn;
              if (precipValue >= heavyRainThreshold) {
                if (!forecastedAlerts['heavyRain']) forecastedAlerts['heavyRain'] = [];
                forecastedAlerts['heavyRain'].push({
                  period,
                  weather: {
                    ...weather,
                    precipitation: precipValue,
                    precipitationIn: precipIn,
                    precipitationMm: precipMm,
                  },
                  severity: precipValue
                });
              }
            }
          }
        }
      }

      // Fetch room and zone names if IDs are present
      let roomName = plantWithGarden.roomId || 'Room/Plot';
      let zoneName = plantWithGarden.zoneId || 'Zone';
      if (plantWithGarden.roomId) {
        const room = await prisma.room.findUnique({ where: { id: plantWithGarden.roomId }, select: { name: true } });
        if (room?.name) roomName = room.name;
      }
      if (plantWithGarden.zoneId) {
        const zone = await prisma.zone.findUnique({ where: { id: plantWithGarden.zoneId }, select: { name: true } });
        if (zone?.name) zoneName = zone.name;
      }

      // Dedupe forecasted alerts: only one per calendar day per type (most severe)
      function dedupeForecastedAlertsByDay(alerts: Array<{ period: any, weather: any, severity: number }>) {
        const seen: Record<string, { period: any, weather: any, severity: number }> = {};
        for (const alert of alerts) {
          // Use the date part only (YYYY-MM-DD)
          const date = new Date(alert.period.startTime).toISOString().slice(0, 10);
          if (!seen[date] || alert.severity > seen[date].severity) {
            seen[date] = alert;
          }
        }
        return Object.values(seen);
      }
      for (const type of Object.keys(forecastedAlerts)) {
        forecastedAlerts[type] = dedupeForecastedAlertsByDay(forecastedAlerts[type]);
      }

      // --- After looping, send grouped forecasted alert notification if any ---
      const allAlertTypes = ['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'];
      const alertTypes = Object.keys(forecastedAlerts);
      if (alertTypes.length > 0) {
        // Build grouped message
        let message = `Forecasted weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plantWithGarden.name} in ${roomName}, ${zoneName}:
\n`;
        for (const type of allAlertTypes) {
          // Skip flood for forecasted alerts
          if (type === 'flood') continue;
          // Skip drought if there's no current drought alert
          if (type === 'drought' && !currentAlerts['drought']) continue;
          message += `• ${type.charAt(0).toUpperCase() + type.slice(1)}:`;
          if (forecastedAlerts[type] && forecastedAlerts[type].length > 0) {
            message += '\n';
            if (type === 'drought') {
              const droughtPeriods = forecastedAlerts['drought'];
              const allZero = droughtPeriods.every(e => (e.weather.precipitationMm ?? 0) === 0);
              if (allZero) {
                message += `    No rain expected for the next ${droughtPeriods.length} periods.\n`;
              } else {
                for (const entry of droughtPeriods) {
                  const chance = entry.period.probabilityOfPrecipitation?.value;
                  message += `    - ${entry.period.name} (${entry.period.startTime}): ${entry.weather.daysWithoutRain} days without rain, Chance of Rain: ${typeof chance === 'number' ? chance + '%' : 'N/A'}\n`;
                }
              }
            } else {
              for (const entry of forecastedAlerts[type]) {
                message += `    - ${entry.period.name} (${entry.period.startTime}): `;
                if (type === 'heat') message += `${entry.weather.temperature}°F`;
                else if (type === 'wind') message += `${entry.weather.windSpeed} mph`;
                else if (type === 'heavyRain') message += `${formatPrecipitation(entry.weather.precipitation, getHeavyRainUnit(sensitivitiesTyped))} precipitation`;
                else if (type === 'frost') message += `${entry.weather.temperature}°F`;
                else message += `${entry.severity}`;
                message += '\n';
              }
            }
          } else {
            message += ' None\n';
          }
        }
        message += '\nPlease prepare in advance to protect your plant.';

        // Deduplicate: check if a grouped notification for this plant and forecast window already exists
        const existing = await prisma.notification.findFirst({
          where: {
            userId: plantWithGarden.userId,
            type: 'WEATHER_FORECAST_ALERT',
            meta: { path: ['plantId'], equals: plantWithGarden.id },
            createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // last 4 hours
          },
          orderBy: { createdAt: 'desc' }
        });
        if (garden && garden.zipcode) {
          const userIds = await getAllGardenUserIds(garden.id, plantWithGarden.userId);
          if (!existing) {
            await Promise.all(userIds.map(userId =>
              prisma.notification.create({
                data: {
                  userId,
                  type: 'WEATHER_FORECAST_ALERT',
                  title: `⏳ Forecasted Weather Alerts for ${plantWithGarden.name}`,
                  message,
                  link: `/gardens/${garden.id}/plants/${plantWithGarden.id}`,
                  meta: {
                    plantId: plantWithGarden.id,
                    plantName: plantWithGarden.name,
                    gardenId: plantWithGarden.gardenId,
                    gardenName: garden.name,
                    roomId: plantWithGarden.roomId,
                    roomName,
                    zoneId: plantWithGarden.zoneId,
                    zoneName,
                    alertTypes,
                    forecastedAlerts,
                    forecastWindow: notificationPeriod,
                    timezone: getGardenTimezone(garden),
                  }
                }
              })
            ));
          }
        }
      }

      // --- After looping, send grouped current alert notification if any ---
      const currentAlertTypes = Object.keys(currentAlerts);
      if (currentAlertTypes.length > 0) {
        // Build grouped message
        let message = `Current weather conditions in ${garden.name} (${garden.zipcode}) may affect ${plantWithGarden.name} in ${roomName}, ${zoneName}:
\n`;
        for (const type of allAlertTypes) {
          message += `• ${type.charAt(0).toUpperCase() + type.slice(1)}:`;
          if (currentAlerts[type]) {
            message += ' ';
            if (type === 'heat') message += `${currentAlerts[type].weather.temperature}°F`;
            else if (type === 'wind') message += `${currentAlerts[type].weather.windSpeed} mph`;
            else if (type === 'heavyRain') message += `${formatPrecipitation(currentAlerts[type].weather.precipitation, getHeavyRainUnit(sensitivitiesTyped))} precipitation`;
            else if (type === 'frost') message += `${currentAlerts[type].weather.temperature}°F`;
            else if (type === 'flood') message += `${formatPrecipitation(currentAlerts[type].weather.precipitation, getHeavyRainUnit(sensitivitiesTyped))} precipitation`;
            else if (type === 'drought') message += `${currentAlerts[type].weather.daysWithoutRain} days`;
            else message += `${currentAlerts[type].severity}`;
            message += '\n';
          } else {
            message += ' None\n';
          }
        }
        message += '\nPlease take necessary precautions to protect your plant.';

        // Backend calculation for 'since last log' for heavy rain
        let sinceLastLogMsg = '';
        if (currentAlertTypes.includes('heavyRain') && typeof currentAlerts['heavyRain'].weather.precipitation === 'number') {
          const prevLog = await prisma.log.findFirst({
            where: {
              plantId: plantWithGarden.id,
              type: LogType.WEATHER_ALERT,
              notes: { contains: 'HeavyRain' },
            },
            orderBy: { logDate: 'desc' },
          });
          if (prevLog) {
            const prevMatch = prevLog.notes.match(/HeavyRain: ([\d.]+) in/);
            const currVal = currentAlerts['heavyRain'].weather.precipitation;
            if (prevMatch) {
              const prevVal = parseFloat(prevMatch[1]);
              const diff = currVal - prevVal;
              if (diff > 0) {
                sinceLastLogMsg = `+${diff.toFixed(2)} in since last log`;
              } else {
                sinceLastLogMsg = 'No new precipitation since last log';
              }
            }
          }
        }

        if (sinceLastLogMsg) {
          message += `\n(Daily Total) ${sinceLastLogMsg}`;
        }

        // Create a log entry for the plant
        const weatherInfo = {
          temperature: `${weather.temperature}°F`,
          humidity: `${weather.humidity}%`,
          windSpeed: `${weather.windSpeed} mph`,
          precipitation: formatPrecipitation(weather.precipitation, getHeavyRainUnit(sensitivitiesTyped)),
          conditions: weather.conditions
        };
        const createdLog = await prisma.log.create({
          data: {
            plantId: plantWithGarden.id,
            userId: plantWithGarden.userId,
            gardenId: plantWithGarden.gardenId,
            roomId: plantWithGarden.roomId || undefined,
            zoneId: plantWithGarden.zoneId || undefined,
            type: LogType.WEATHER_ALERT,
            notes: message,
            logDate: new Date(),
            stage: plantWithGarden.stage || Stage.VEGETATIVE,
            data: {
              weatherInfo,
              severity: currentAlerts[currentAlertTypes[0]].severity,
              type: currentAlertTypes[0],
              weather: currentAlerts[currentAlertTypes[0]].weather
            }
          }
        });

        // Deduplicate: check if a grouped notification for this plant already exists in the last 3 hours
        const existing = await prisma.notification.findFirst({
          where: {
            userId: plantWithGarden.userId,
            type: 'WEATHER_ALERT',
            meta: { path: ['plantId'], equals: plantWithGarden.id },
            createdAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } // last 3 hours
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!existing) {
          if (garden && garden.zipcode) {
            const userIds = await getAllGardenUserIds(garden.id, plantWithGarden.userId);
            await Promise.all(userIds.map(userId =>
              prisma.notification.create({
                data: {
                  userId,
                  type: 'WEATHER_ALERT',
                  title: `⚠️ Current Weather Alerts for ${plantWithGarden.name}`,
                  message: message,
                  link: `/logs/${createdLog.id}`,
                  meta: {
                    plantId: plantWithGarden.id,
                    plantName: plantWithGarden.name,
                    gardenId: plantWithGarden.gardenId,
                    gardenName: garden.name,
                    roomId: plantWithGarden.roomId,
                    roomName,
                    zoneId: plantWithGarden.zoneId,
                    zoneName,
                    alertTypes: currentAlertTypes,
                    currentAlerts,
                    date: new Date().toISOString().slice(0, 10),
                    logId: createdLog.id,
                    timezone: getGardenTimezone(garden),
                  } as NotificationMeta
                }
              })
            ));
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
          plantId: plantWithGarden.id,
          plantName: plantWithGarden.name,
          alertType: triggeredType,
          weatherInfo: triggeredWeatherInfo,
          timestamp: new Date().toISOString()
        });
      }
      gardenStatus.set(garden.id, currentStatus);

    } catch (error) {
      console.error(`[WEATHER_ALERTS] Error processing plant ${plant.name}:`, error);
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
    const sensitivitiesTyped = plant.sensitivities as PlantSensitivities | undefined;
    if (!sensitivitiesTyped || !garden || !garden.zipcode) continue;

    // At this point, we know garden is not null
    const nonNullGarden = garden as NonNullable<typeof garden>;

    try {
      const weather = await fetchWeatherData(nonNullGarden.zipcode!);

      // Check each sensitivity type
      const heat = (sensitivitiesTyped as PlantSensitivities).heat;
      if (heat && heat.enabled && heat.threshold !== undefined && weather.temperature >= heat.threshold) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'heat', weather, weather.temperature);
      }
      const frost = (sensitivitiesTyped as PlantSensitivities).frost;
      if (frost && frost.enabled && weather.hasFrostAlert && isTodayInFrostWindow(plant)) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'frost', weather, 1);
      }
      const wind = (sensitivitiesTyped as PlantSensitivities).wind;
      if (wind && wind.enabled && wind.threshold !== undefined && weather.windSpeed >= wind.threshold) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'wind', weather, weather.windSpeed);
      }
      const drought = (sensitivitiesTyped as PlantSensitivities).drought;
      if (drought && drought.enabled && (drought.threshold !== undefined) && weather.daysWithoutRain >= drought.threshold) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'drought', weather, weather.daysWithoutRain);
      }
      const flood = (sensitivitiesTyped as PlantSensitivities).flood;
      if (flood && flood.enabled && weather.hasFloodAlert) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'flood', weather, 1);
      }
      const heavyRain = (sensitivitiesTyped as PlantSensitivities).heavyRain;
      if (heavyRain && heavyRain.enabled && heavyRain.threshold !== undefined && weather.precipitation && weather.precipitation >= heavyRain.threshold) {
        // await maybeSendOrUpdateAlert(plant, nonNullGarden, 'heavyRain', weather, weather.precipitation);
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
  const today = now.toISOString().slice(0, 10);

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

  // Build detailed message for all alert types
  const allAlertTypes = ['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'];
  let message = `Current weather conditions in ${garden?.name} (${garden?.zipcode}) may affect ${plant.name} in ${roomName}, ${zoneName}:
\n`;
  for (const alertType of allAlertTypes) {
    message += `• ${alertType.charAt(0).toUpperCase() + alertType.slice(1)}:`;
    if (alertType === type) {
      if (alertType === 'heat') message += ` ${weather.temperature}°F`;
      else if (alertType === 'wind') message += ` ${weather.windSpeed} mph`;
      else if (alertType === 'heavyRain') message += ` ${formatPrecipitation(weather.precipitation, getHeavyRainUnit(plant.sensitivities))}`;
      else if (alertType === 'frost') message += ` ${weather.temperature}°F`;
      else if (alertType === 'flood') message += ` ${formatPrecipitation(weather.precipitation, getHeavyRainUnit(plant.sensitivities))}`;
      else if (alertType === 'drought') message += ` ${weather.daysWithoutRain} days`;
      else message += ` ${severity}`;
    } else {
      message += ' None';
    }
    message += '\n';
  }

  // Backend calculation for 'since last log' for heavy rain
  let sinceLastLogMsg = '';
  if (type === 'heavyRain' && typeof weather.precipitation === 'number') {
    const prevLog = await prisma.log.findFirst({
      where: {
        plantId: plant.id,
        type: LogType.WEATHER_ALERT,
        notes: { contains: 'HeavyRain' },
      },
      orderBy: { logDate: 'desc' },
    });
    if (prevLog) {
      const prevMatch = prevLog.notes.match(/HeavyRain: ([\d.]+) in/);
      const currVal = weather.precipitation;
      if (prevMatch) {
        const prevVal = parseFloat(prevMatch[1]);
        const diff = currVal - prevVal;
        if (diff > 0) {
          sinceLastLogMsg = `+${diff.toFixed(2)} in since last log`;
        } else {
          sinceLastLogMsg = 'No new precipitation since last log';
        }
      }
    }
  }

  message += '\nPlease take necessary precautions to protect your plant.';
  if (sinceLastLogMsg) {
    message += `\n(Daily Total) ${sinceLastLogMsg}`;
  }

  // Create a log entry for the plant
  const weatherInfo = {
    temperature: `${weather.temperature}°F`,
    humidity: `${weather.humidity}%`,
    windSpeed: `${weather.windSpeed} mph`,
    precipitation: formatPrecipitation(weather.precipitation, getHeavyRainUnit(plant.sensitivities)),
    conditions: weather.conditions
  };
  const createdLog = await prisma.log.create({
    data: {
      plantId: plant.id,
      userId: plant.userId,
      gardenId: plant.gardenId,
      roomId: plant.roomId || undefined,
      zoneId: plant.zoneId || undefined,
      type: LogType.WEATHER_ALERT,
      notes: message,
      logDate: new Date(),
      stage: plant.stage || Stage.VEGETATIVE,
      data: {
        weatherInfo,
        severity,
        type,
        weather
      }
    }
  });

  // Deduplicate: check if a grouped notification for this plant already exists in the last 3 hours
  const existing = await prisma.notification.findFirst({
    where: {
      userId: plant.userId,
      type: 'WEATHER_ALERT',
      meta: { path: ['plantId'], equals: plant.id },
      createdAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!existing) {
    if (garden && garden.zipcode) {
      const userIds = await getAllGardenUserIds(garden.id, plant.userId);
      await Promise.all(userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: 'WEATHER_ALERT',
            title: `⚠️ Current Weather Alerts for ${plant.name}`,
            message: message,
            link: `/logs/${createdLog.id}`,
            meta: {
              plantId: plant.id,
              plantName: plant.name,
              gardenId: plant.gardenId,
              gardenName: garden.name,
              roomId: plant.roomId,
              roomName,
              zoneId: plant.zoneId,
              zoneName,
              alertTypes: [type],
              currentAlerts: {
                [type]: {
                  weather,
                  severity
                }
              },
              date: today,
              logId: createdLog.id,
              timezone: getGardenTimezone(garden),
            } as NotificationMeta
          }
        })
      ));
    }
  }
}