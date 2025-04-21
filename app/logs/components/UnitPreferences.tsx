import { TemperatureUnit, VolumeUnit, LengthUnit, UnitLabels } from '@/lib/units';

interface UnitPreferencesProps {
  preferences: {
    temperature: TemperatureUnit;
    volume: VolumeUnit;
    length: LengthUnit;
  };
  onChange: (newPreferences: UnitPreferencesProps['preferences']) => void;
}

export default function UnitPreferences({ preferences, onChange }: UnitPreferencesProps) {
  return (
    <div className="bg-dark-bg-secondary rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-dark-text-primary mb-4">Display Units</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="temperature-unit" className="block text-sm text-dark-text-secondary mb-1">
            Temperature
          </label>
          <select
            id="temperature-unit"
            value={preferences.temperature}
            onChange={(e) => onChange({
              ...preferences,
              temperature: e.target.value as TemperatureUnit
            })}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            {Object.values(TemperatureUnit).map((unit) => (
              <option key={unit} value={unit}>
                {unit === TemperatureUnit.CELSIUS ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="volume-unit" className="block text-sm text-dark-text-secondary mb-1">
            Volume
          </label>
          <select
            id="volume-unit"
            value={preferences.volume}
            onChange={(e) => onChange({
              ...preferences,
              volume: e.target.value as VolumeUnit
            })}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            {Object.values(VolumeUnit).map((unit) => (
              <option key={unit} value={unit}>
                {unit.charAt(0) + unit.slice(1).toLowerCase()} ({UnitLabels[unit]})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="length-unit" className="block text-sm text-dark-text-secondary mb-1">
            Length
          </label>
          <select
            id="length-unit"
            value={preferences.length}
            onChange={(e) => onChange({
              ...preferences,
              length: e.target.value as LengthUnit
            })}
            className="block w-full rounded-md border-0 bg-dark-bg-primary text-dark-text-primary shadow-sm ring-1 ring-inset ring-dark-border focus:ring-2 focus:ring-inset focus:ring-garden-400 sm:text-sm"
          >
            {Object.values(LengthUnit).map((unit) => (
              <option key={unit} value={unit}>
                {unit.charAt(0) + unit.slice(1).toLowerCase()} ({UnitLabels[unit]})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 