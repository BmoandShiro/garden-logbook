import axios from 'axios';

// NOAA API Response Types
interface NOAAPointsResponse {
  properties: {
    forecast: string;
  };
}

interface NOAAPeriod {
  temperature: number;
  windSpeed: string;
  shortForecast: string;
}

interface NOAAPeriodsResponse {
  properties: {
    periods: NOAAPeriod[];
  };
}

interface NOAAAlert {
  properties: {
    event: string;
  };
}

interface NOAAAlertsResponse {
  features: NOAAAlert[];
}

export async function getWeatherDataForZip(zip: string) {
  // Fetch current conditions and forecast from NWS API
  const response = await axios.get<NOAAPointsResponse>(`https://api.weather.gov/points/${zip}`);
  const forecastUrl = response.data.properties.forecast;
  const forecastResponse = await axios.get<NOAAPeriodsResponse>(forecastUrl);
  const forecast = forecastResponse.data.properties.periods[0]; // Current day forecast

  // Fetch active alerts for the ZIP
  const alertsResponse = await axios.get<NOAAAlertsResponse>(`https://api.weather.gov/alerts/active?zone=${zip}`);
  const alerts = alertsResponse.data.features;

  // Determine if there are frost or flood alerts
  const hasFrostAlert = alerts.some(alert => 
    alert.properties.event === 'Frost Advisory' || 
    alert.properties.event === 'Freeze Warning'
  );
  const hasFloodAlert = alerts.some(alert => 
    alert.properties.event === 'Flood Warning'
  );

  // For simplicity, assume days without rain is 0 if forecast shows rain, otherwise 1
  const daysWithoutRain = forecast.shortForecast.toLowerCase().includes('rain') ? 0 : 1;

  return {
    highTemp: forecast.temperature,
    windSpeed: forecast.windSpeed.split(' ')[0], // Extract numeric value
    rainAmount: forecast.shortForecast.toLowerCase().includes('rain') ? 0.1 : 0, // Simplified
    hasFrostAlert,
    hasFloodAlert,
    daysWithoutRain
  };
} 