import React from 'react';

interface WeatherAlertMessageProps {
  alert: any; // raw alert object with meta, message, etc.
  variant?: 'notification' | 'calendar';
}

function formatDrought(alert: any) {
  // Handles both forecasted and current drought
  if (alert.meta?.forecastedAlerts?.drought && alert.meta.forecastedAlerts.drought.length > 0) {
    const droughtPeriods = alert.meta.forecastedAlerts.drought;
    const allZero = droughtPeriods.every((e: any) => (e.weather.precipitationMm ?? 0) === 0);
    if (allZero) {
      return <div className="ml-4 text-amber-300">No rain expected for the next {droughtPeriods.length} periods.</div>;
    } else {
      return (
        <ul className="ml-4">
          {droughtPeriods.map((entry: any, idx: number) => {
            const chance = entry.period.probabilityOfPrecipitation?.value;
            return (
              <li key={idx}>
                {entry.period.name} ({entry.period.startTime}): {entry.weather.daysWithoutRain} days without rain, Chance of Rain: {typeof chance === 'number' ? chance + '%' : 'N/A'}
              </li>
            );
          })}
        </ul>
      );
    }
  }
  // Current drought
  if (alert.meta?.currentAlerts?.drought) {
    return <span>{alert.meta.currentAlerts.drought.weather.daysWithoutRain} days</span>;
  }
  // Fallback
  return <span>None</span>;
}

function formatAlertValue(type: string, alert: any) {
  const ca = alert.meta?.currentAlerts?.[type];
  if (!ca) return 'None';
  if (type === 'heat' || type === 'frost') return `${ca.weather.temperature}°F`;
  if (type === 'wind') return `${ca.weather.windSpeed} mph`;
  if (type === 'heavyRain' || type === 'flood') return `${ca.weather.precipitation ?? 'N/A'} precipitation`;
  if (type === 'drought') return `${ca.weather.daysWithoutRain} days`;
  return ca.severity ?? 'None';
}

export const WeatherAlertMessage: React.FC<WeatherAlertMessageProps> = ({ alert, variant = 'notification' }) => {
  // Use meta if available, otherwise fallback to message
  const isForecast = alert.type?.includes('FORECAST');
  const allAlertTypes = ['heat', 'frost', 'drought', 'wind', 'flood', 'heavyRain'];

  return (
    <div className={variant === 'calendar' ? 'p-2 border-t border-red-700 mt-2' : ''}>
      {isForecast ? (
        <>
          <div className="font-bold text-emerald-300 mb-1">Forecasted Weather Alerts</div>
          {alert.meta && (
            <div className="mb-1 text-xs text-emerald-200">
              Room/Plot: {alert.meta.roomName} Zone: {alert.meta.zoneName}
            </div>
          )}
          <div className="mb-2 text-sm">Forecasted weather conditions in {alert.meta?.gardenName} ({alert.meta?.gardenId}) may affect {alert.meta?.plantName} in {alert.meta?.roomName}, {alert.meta?.zoneName}:</div>
          <div>
            {allAlertTypes.map(type => (
              <div key={type} className={
                type === 'heat' ? 'text-red-400' :
                type === 'frost' ? 'text-blue-300' :
                type === 'drought' ? 'text-amber-300' :
                type === 'wind' ? 'text-emerald-200' :
                type === 'flood' ? 'text-blue-400' :
                type === 'heavyRain' ? 'text-blue-400' : ''
              }>
                • {type.charAt(0).toUpperCase() + type.slice(1)}:{' '}
                {type === 'drought' ? formatDrought(alert) :
                  alert.meta?.forecastedAlerts?.[type] && alert.meta.forecastedAlerts[type].length > 0 ? (
                    <ul className="ml-4">
                      {alert.meta.forecastedAlerts[type].map((entry: any, idx: number) => (
                        <li key={idx}>
                          {type === 'heat' && `${entry.period.name} ${entry.weather.temperature}°F`}
                          {type === 'wind' && `${entry.period.name} ${entry.weather.windSpeed} mph`}
                          {type === 'heavyRain' && `${entry.period.name} ${entry.weather.precipitation} precipitation`}
                          {type === 'frost' && `${entry.period.name} ${entry.weather.temperature}°F`}
                        </li>
                      ))}
                    </ul>
                  ) : 'None'}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-dark-text-secondary">Please prepare in advance to protect your plant.</div>
        </>
      ) : (
        <>
          <div className="font-bold text-emerald-300 mb-1">Current Weather Alerts</div>
          {alert.meta && (
            <div className="mb-1 text-xs text-emerald-200">
              Room/Plot: {alert.meta.roomName} Zone: {alert.meta.zoneName}
            </div>
          )}
          <div>
            {allAlertTypes.map(type => (
              <div key={type} className={
                type === 'heat' ? 'text-red-400' :
                type === 'frost' ? 'text-blue-300' :
                type === 'drought' ? 'text-amber-300' :
                type === 'wind' ? 'text-emerald-200' :
                type === 'flood' ? 'text-blue-400' :
                type === 'heavyRain' ? 'text-blue-400' : ''
              }>
                • {type.charAt(0).toUpperCase() + type.slice(1)}: {type === 'drought' ? formatDrought(alert) : formatAlertValue(type, alert)}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-dark-text-secondary">Please take necessary precautions to protect your plant.</div>
        </>
      )}
    </div>
  );
}; 