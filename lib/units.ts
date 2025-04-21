export enum TemperatureUnit {
  CELSIUS = 'CELSIUS',
  FAHRENHEIT = 'FAHRENHEIT'
}

export enum VolumeUnit {
  MILLILITERS = 'MILLILITERS',
  LITERS = 'LITERS',
  FLUID_OUNCES = 'FLUID_OUNCES',
  CUPS = 'CUPS',
  GALLONS = 'GALLONS'
}

export enum LengthUnit {
  MILLIMETERS = 'MILLIMETERS',
  CENTIMETERS = 'CENTIMETERS',
  METERS = 'METERS',
  INCHES = 'INCHES',
  FEET = 'FEET'
}

export const UnitLabels: Record<string, string> = {
  [TemperatureUnit.CELSIUS]: '°C',
  [TemperatureUnit.FAHRENHEIT]: '°F',
  [VolumeUnit.MILLILITERS]: 'mL',
  [VolumeUnit.LITERS]: 'L',
  [VolumeUnit.FLUID_OUNCES]: 'fl oz',
  [VolumeUnit.CUPS]: 'cups',
  [VolumeUnit.GALLONS]: 'gal',
  [LengthUnit.MILLIMETERS]: 'mm',
  [LengthUnit.CENTIMETERS]: 'cm',
  [LengthUnit.METERS]: 'm',
  [LengthUnit.INCHES]: 'in',
  [LengthUnit.FEET]: 'ft'
};

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) return value;
  
  if (from === TemperatureUnit.CELSIUS && to === TemperatureUnit.FAHRENHEIT) {
    return (value * 9/5) + 32;
  } else {
    return (value - 32) * 5/9;
  }
}

export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  // Convert to milliliters first as base unit
  const mlValue = (() => {
    switch (from) {
      case VolumeUnit.MILLILITERS: return value;
      case VolumeUnit.LITERS: return value * 1000;
      case VolumeUnit.FLUID_OUNCES: return value * 29.5735;
      case VolumeUnit.CUPS: return value * 236.588;
      case VolumeUnit.GALLONS: return value * 3785.41;
      default: return value;
    }
  })();

  // Convert from milliliters to target unit
  switch (to) {
    case VolumeUnit.MILLILITERS: return mlValue;
    case VolumeUnit.LITERS: return mlValue / 1000;
    case VolumeUnit.FLUID_OUNCES: return mlValue / 29.5735;
    case VolumeUnit.CUPS: return mlValue / 236.588;
    case VolumeUnit.GALLONS: return mlValue / 3785.41;
    default: return mlValue;
  }
}

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  // Convert to millimeters first as base unit
  const mmValue = (() => {
    switch (from) {
      case LengthUnit.MILLIMETERS: return value;
      case LengthUnit.CENTIMETERS: return value * 10;
      case LengthUnit.METERS: return value * 1000;
      case LengthUnit.INCHES: return value * 25.4;
      case LengthUnit.FEET: return value * 304.8;
      default: return value;
    }
  })();

  // Convert from millimeters to target unit
  switch (to) {
    case LengthUnit.MILLIMETERS: return mmValue;
    case LengthUnit.CENTIMETERS: return mmValue / 10;
    case LengthUnit.METERS: return mmValue / 1000;
    case LengthUnit.INCHES: return mmValue / 25.4;
    case LengthUnit.FEET: return mmValue / 304.8;
    default: return mmValue;
  }
}

export function formatMeasurement(value: number, unit: string): string {
  // Round to 2 decimal places for most units
  const roundedValue = Math.round(value * 100) / 100;
  return `${roundedValue} ${UnitLabels[unit] || unit}`;
} 