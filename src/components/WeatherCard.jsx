import { FiThermometer, FiDroplet, FiCloudRain, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../utils/LanguageContext';

export default function WeatherCard({ weather, location, isLoading }) {
  const { t } = useLanguage();
  if (isLoading) {
    return (
      <div className="weather-card weather-card--loading">
        <div className="weather-shimmer"></div>
        <div className="weather-shimmer weather-shimmer--short"></div>
        <div className="weather-stats">
          <div className="weather-stat-skeleton"></div>
          <div className="weather-stat-skeleton"></div>
          <div className="weather-stat-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="weather-card weather-card--empty">
        <FiCloudRain size={32} className="weather-empty-icon" />
        <p className="weather-empty-text">{t('weatherDataAppear')}</p>
      </div>
    );
  }

  return (
    <div className="weather-card">
      <div className="weather-header">
        <div>
          <h3 className="weather-title">{t('liveWeather')}</h3>
          {weather.cityName && (
            <p className="weather-location">
              <FiMapPin size={12} />
              {weather.cityName}{weather.country ? `, ${weather.country}` : ''}
            </p>
          )}
        </div>
        <span className="weather-condition">{weather.description}</span>
      </div>

      <div className="weather-stats">
        <div className="weather-stat">
          <div className="weather-stat-icon weather-stat-icon--temp">
            <FiThermometer size={20} />
          </div>
          <div className="weather-stat-info">
            <span className="weather-stat-label">{t('weatherTemp')}</span>
            <span className="weather-stat-value">
              {weather.temperature}<span className="weather-stat-unit">°C</span>
            </span>
          </div>
        </div>

        <div className="weather-stat">
          <div className="weather-stat-icon weather-stat-icon--humidity">
            <FiDroplet size={20} />
          </div>
          <div className="weather-stat-info">
            <span className="weather-stat-label">{t('weatherHumidity')}</span>
            <span className="weather-stat-value">
              {weather.humidity}<span className="weather-stat-unit">%</span>
            </span>
          </div>
        </div>

        <div className="weather-stat">
          <div className="weather-stat-icon weather-stat-icon--rain">
            <FiCloudRain size={20} />
          </div>
          <div className="weather-stat-info">
            <span className="weather-stat-label">{t('weatherRainfall')}</span>
            <span className="weather-stat-value">
              {weather.rainfall}<span className="weather-stat-unit">mm</span>
            </span>
          </div>
        </div>
      </div>

      {location && (
        <div className="weather-coords">
          <span>{location.latitude.toFixed(4)}° N</span>
          <span className="weather-coords-sep">•</span>
          <span>{location.longitude.toFixed(4)}° E</span>
        </div>
      )}
    </div>
  );
}
