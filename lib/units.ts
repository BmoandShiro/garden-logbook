export enum TemperatureUnit {
  CELSIUS = 'CELSIUS',
  FAHRENHEIT = 'FAHRENHEIT'
}

export enum VolumeUnit {
  MILLILITERS = 'MILLILITERS',
  LITERS = 'LITERS',
  GALLONS = 'GALLONS',
  FLUID_OUNCES = 'FLUID_OUNCES'
}

export enum LengthUnit {
  CENTIMETERS = 'CENTIMETERS',
  INCHES = 'INCHES',
  METERS = 'METERS',
  FEET = 'FEET'
}

export const UnitLabels: Record<string, string> = {
  [TemperatureUnit.CELSIUS]: '°C',
  [TemperatureUnit.FAHRENHEIT]: '°F',
  [VolumeUnit.MILLILITERS]: 'ml',
  [VolumeUnit.LITERS]: 'L',
  [VolumeUnit.GALLONS]: 'gal',
  [VolumeUnit.FLUID_OUNCES]: 'fl oz',
  [LengthUnit.CENTIMETERS]: 'cm',
  [LengthUnit.INCHES]: 'in',
  [LengthUnit.METERS]: 'm',
  [LengthUnit.FEET]: 'ft'
};

export const convertTemperature = (value: number, from: TemperatureUnit, to: TemperatureUnit): number => {
  if (from === to) return value;
  
  if (from === TemperatureUnit.FAHRENHEIT && to === TemperatureUnit.CELSIUS) {
    return (value - 32) * 5/9;
  }
  
  if (from === TemperatureUnit.CELSIUS && to === TemperatureUnit.FAHRENHEIT) {
    return (value * 9/5) + 32;
  }
  
  return value;
};

export const convertVolume = (value: number, from: VolumeUnit, to: VolumeUnit): number => {
  // Convert to milliliters first as base unit
  let mlValue = value;
  switch (from) {
    case VolumeUnit.LITERS:
      mlValue = value * 1000;
      break;
    case VolumeUnit.GALLONS:
      mlValue = value * 3785.41;
      break;
    case VolumeUnit.FLUID_OUNCES:
      mlValue = value * 29.5735;
      break;
  }

  // Convert from milliliters to target unit
  switch (to) {
    case VolumeUnit.MILLILITERS:
      return mlValue;
    case VolumeUnit.LITERS:
      return mlValue / 1000;
    case VolumeUnit.GALLONS:
      return mlValue / 3785.41;
    case VolumeUnit.FLUID_OUNCES:
      return mlValue / 29.5735;
    default:
      return mlValue;
  }
};

export const convertLength = (value: number, from: LengthUnit, to: LengthUnit): number => {
  // Convert to centimeters first as base unit
  let cmValue = value;
  switch (from) {
    case LengthUnit.INCHES:
      cmValue = value * 2.54;
      break;
    case LengthUnit.METERS:
      cmValue = value * 100;
      break;
    case LengthUnit.FEET:
      cmValue = value * 30.48;
      break;
  }

  // Convert from centimeters to target unit
  switch (to) {
    case LengthUnit.CENTIMETERS:
      return cmValue;
    case LengthUnit.INCHES:
      return cmValue / 2.54;
    case LengthUnit.METERS:
      return cmValue / 100;
    case LengthUnit.FEET:
      return cmValue / 30.48;
    default:
      return cmValue;
  }
};

export const formatMeasurement = (value: number | null, unit: string): string => {
  if (value === null) return '-';
  return `${value.toFixed(1)} ${UnitLabels[unit] || unit}`;
}; 