/**
 * VPD (Vapor Pressure Deficit) Calculator
 * 
 * VPD is a crucial metric for plant health that combines temperature and humidity.
 * It represents the difference between the amount of moisture in the air and how much moisture the air can hold.
 * 
 * Optimal VPD ranges:
 * - 0.4-0.8 kPa: Seedling stage
 * - 0.8-1.2 kPa: Vegetative stage  
 * - 1.0-1.6 kPa: Flowering stage
 */

/**
 * Calculate VPD from temperature (°C) and humidity (%)
 * @param temperature Temperature in Celsius
 * @param humidity Humidity percentage (0-100)
 * @returns VPD in kPa (kilopascals)
 */
export function calculateVPD(temperature: number, humidity: number): number {
  if (temperature === undefined || humidity === undefined) {
    return NaN;
  }

  // Calculate saturation vapor pressure (SVP) using Magnus formula
  // SVP = 6.112 * exp((17.67 * T) / (T + 243.5)) - result in hPa
  const svp_hPa = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
  
  // Convert hPa to kPa
  const svp_kPa = svp_hPa / 10;
  
  // Calculate actual vapor pressure (AVP) in kPa
  const avp_kPa = (humidity / 100) * svp_kPa;
  
  // Calculate VPD (difference between SVP and AVP) in kPa
  const vpd = svp_kPa - avp_kPa;
  
  return vpd;
}

/**
 * Get VPD status based on optimal ranges
 * @param vpd VPD value in kPa
 * @param stage Plant growth stage (optional)
 * @returns Status object with category and message
 */
export function getVPDStatus(vpd: number, stage?: 'seedling' | 'vegetative' | 'flowering'): {
  category: 'optimal' | 'low' | 'high' | 'critical';
  message: string;
  color: string;
} {
  if (isNaN(vpd)) {
    return {
      category: 'critical',
      message: 'Invalid data',
      color: 'text-red-500'
    };
  }

  let optimalRange: [number, number];
  
  switch (stage) {
    case 'seedling':
      optimalRange = [0.4, 0.8];
      break;
    case 'vegetative':
      optimalRange = [0.8, 1.2];
      break;
    case 'flowering':
      optimalRange = [1.0, 1.6];
      break;
    default:
      // General optimal range
      optimalRange = [0.8, 1.2];
  }

  const [min, max] = optimalRange;

  if (vpd >= min && vpd <= max) {
    return {
      category: 'optimal',
      message: 'Optimal',
      color: 'text-emerald-500'
    };
  } else if (vpd < min) {
    return {
      category: 'low',
      message: 'Too low',
      color: 'text-blue-500'
    };
  } else if (vpd > max * 1.5) {
    return {
      category: 'critical',
      message: 'Critical high',
      color: 'text-red-500'
    };
  } else {
    return {
      category: 'high',
      message: 'Too high',
      color: 'text-orange-500'
    };
  }
}

/**
 * Format VPD value for display
 * @param vpd VPD value in kPa
 * @returns Formatted string
 */
export function formatVPD(vpd: number): string {
  if (isNaN(vpd)) {
    return '--';
  }
  return `${vpd.toFixed(2)} kPa`;
}

/**
 * Calculate VPD from Fahrenheit temperature and humidity
 * @param tempF Temperature in Fahrenheit
 * @param humidity Humidity percentage (0-100)
 * @returns VPD in kPa
 */
export function calculateVPDFromFahrenheit(tempF: number, humidity: number): number {
  // Convert Fahrenheit to Celsius
  const tempC = (tempF - 32) * 5/9;
  return calculateVPD(tempC, humidity);
} 