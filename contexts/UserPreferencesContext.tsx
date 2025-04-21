import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TemperatureUnit, VolumeUnit, LengthUnit } from '@/lib/units';

interface UnitPreferences {
  temperature: TemperatureUnit;
  volume: VolumeUnit;
  length: LengthUnit;
}

interface UserPreferences {
  units: UnitPreferences;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  updateUnitPreference: (unit: keyof UnitPreferences, value: TemperatureUnit | VolumeUnit | LengthUnit) => void;
}

const defaultPreferences: UserPreferences = {
  units: {
    temperature: TemperatureUnit.CELSIUS,
    volume: VolumeUnit.MILLILITERS,
    length: LengthUnit.CENTIMETERS
  }
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Try to load preferences from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved preferences:', e);
        }
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    // Save preferences to localStorage whenever they change
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  const updateUnitPreference = (
    unit: keyof UnitPreferences,
    value: TemperatureUnit | VolumeUnit | LengthUnit
  ) => {
    setPreferences(prev => ({
      ...prev,
      units: {
        ...prev.units,
        [unit]: value
      }
    }));
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        updateUnitPreference
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
} 