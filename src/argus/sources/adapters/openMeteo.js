/**
 * Open-Meteo current-weather adapter (keyless, CC-BY-4.0).
 * Documentation: https://open-meteo.com/en/docs
 * The feed is a contextual signal for outdoor calm/comfort, not a crowd measure.
 */

export function parseOpenMeteoCurrent(json) {
  const current = json?.current;
  if (!current) throw new Error('open-meteo: response has no "current" block');
  return {
    temperatureC: num(current.temperature_2m),
    windSpeedKmh: num(current.wind_speed_10m),
    precipitationMm: num(current.precipitation),
    weatherCode: num(current.weather_code),
  };
}

function num(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const COMFORT_TEMP_LOW = 10;
const COMFORT_TEMP_HIGH = 25;

/**
 * Maps weather to a 0..100 outdoor comfort context: 100 = calm and pleasant,
 * 0 = hostile. High wind or rain lowers it sharply because it suppresses calm
 * outdoor activity. This is a contextual signal, never a person count.
 */
export function weatherCalmContext(current) {
  const wind = current.windSpeedKmh === null ? 0 : Math.min(1, current.windSpeedKmh / 60);
  const rain = current.precipitationMm === null ? 0 : Math.min(1, current.precipitationMm / 5);
  let temp = 0;
  if (current.temperatureC !== null) {
    if (current.temperatureC < COMFORT_TEMP_LOW) temp = Math.min(1, (COMFORT_TEMP_LOW - current.temperatureC) / 20);
    else if (current.temperatureC > COMFORT_TEMP_HIGH) temp = Math.min(1, (current.temperatureC - COMFORT_TEMP_HIGH) / 20);
  }
  const penalty = Math.max(wind, rain, temp);
  return Math.round((1 - penalty) * 100);
}
