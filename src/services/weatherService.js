const API_KEY = import.meta.env.VITE_ACCUWEATHER_API_KEY;

// Session-level cache to avoid redundant API calls
let weatherCache = null;
let cacheKey = null;

/**
 * Get AccuWeather location key from coordinates
 */
async function getLocationKey(lat, lng) {
  const url = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${lat},${lng}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`AccuWeather location lookup failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    locationKey: data.Key,
    cityName: data.LocalizedName,
    country: data.Country?.LocalizedName,
  };
}

/**
 * Get current weather conditions from AccuWeather
 */
async function getCurrentConditions(locationKey) {
  const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`AccuWeather conditions fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data[0];
}

/**
 * Fetch weather data for given coordinates
 * Returns { temperature, humidity, rainfall, description, cityName }
 * Uses session-level caching to avoid redundant calls
 */
export async function fetchWeather(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

  // Return cached data if available for same approximate location
  if (weatherCache && cacheKey === key) {
    return weatherCache;
  }

  try {
    const location = await getLocationKey(lat, lng);
    const conditions = await getCurrentConditions(location.locationKey);

    const result = {
      temperature: conditions.Temperature?.Metric?.Value ?? 0,
      humidity: conditions.RelativeHumidity ?? 0,
      rainfall: conditions.PrecipitationSummary?.Past12Hours?.Metric?.Value ?? 0,
      description: conditions.WeatherText ?? 'Unknown',
      cityName: location.cityName,
      country: location.country,
      icon: conditions.WeatherIcon,
      isDayTime: conditions.IsDayTime,
    };

    // Cache the result
    weatherCache = result;
    cacheKey = key;

    return result;
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
}

/**
 * Clear the weather cache
 */
export function clearWeatherCache() {
  weatherCache = null;
  cacheKey = null;
}
