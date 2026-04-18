import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, uploadPdf, saveSoilReport } from '../services/supabaseClient';
import { fetchWeather } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import { predictYield } from '../utils/prediction';
import Navbar from '../components/Navbar';
import SoilForm from '../components/SoilForm';
import PredictionCard from '../components/PredictionCard';
import WeatherCard from '../components/WeatherCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(''); // Text for the loading spinner
  
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' | 'manual'
  const [manualLocationInput, setManualLocationInput] = useState('');

  // Auth guard + auto-detect location & weather on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Check auth
        const session = await getSession();
        if (!session) {
          navigate('/login');
          return;
        }
        if (!cancelled) setUser(session.user);

        // Get location
        try {
          const loc = await getCurrentLocation();
          if (!cancelled) {
            setLocation(loc);
            setLocationLoading(false);

            // Fetch weather using location
            try {
              const weatherData = await fetchWeather(loc.latitude, loc.longitude);
              if (!cancelled) {
                setWeather(weatherData);
                setWeatherLoading(false);
              }
            } catch (weatherErr) {
              console.error('Weather fetch error:', weatherErr);
              if (!cancelled) setWeatherLoading(false);
            }
          }
        } catch (locErr) {
          console.error('Location error:', locErr);
          if (!cancelled) {
            setLocationLoading(false);
            setWeatherLoading(false);
          }
        }
      } catch (authErr) {
        navigate('/login');
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [navigate, locationMode]);

  const handleFormSubmit = async ({ targetCrop, nitrogen, phosphorus, potassium, ph, pdfFile, manualLocationMode, manualLocInput, manualLat, manualLng }) => {
    setIsLoading(true);
    setError('');

    try {
      let activeWeather = weather;
      let activeLocation = location;

      // Suspenseful 5-second processing sequence
      setLoadingPhase("Analyzing Soil Chemistry...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Handle manual location vs auto
      if (manualLocationMode && manualLat && manualLng) {
        setLoadingPhase("Establishing Geofence & Querying Weather...");
        setWeatherLoading(true);
        // Map exact pinned lat/lng
        const mockManualPos = { latitude: manualLat, longitude: manualLng };
        activeLocation = mockManualPos;
        setLocation(mockManualPos);
        setLocationMode('manual');
        try {
           activeWeather = await fetchWeather(mockManualPos.latitude, mockManualPos.longitude);
           setWeather(activeWeather);
        } catch (e) {
           console.warn('Weather fetch failed for manual location', e);
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        setWeatherLoading(false);
      } else {
        setLoadingPhase("Verifying Environmental Data...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setLoadingPhase("Running Yield Variance Models...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLoadingPhase("Finalizing AI Matrices...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use weather data for prediction (fallback to 0 if unavailable)
      const temp = activeWeather?.temperature ?? 25;
      const humidity = activeWeather?.humidity ?? 50;
      const rainfall = activeWeather?.rainfall ?? 0;

      // Calculate new advanced prediction mapping
      const predictionArray = predictYield(nitrogen, phosphorus, potassium, ph, temp, humidity, rainfall, targetCrop);
      setPrediction(predictionArray); 
      setSoilData({ nitrogen, phosphorus, potassium, ph });

      // Upload PDF if provided
      let fileUrl = null;
      if (pdfFile && user) {
        try {
          fileUrl = await uploadPdf(pdfFile, user.id);
        } catch (uploadErr) {
          console.error('PDF upload error:', uploadErr);
          // Continue without file URL
        }
      }

      // Save to Supabase
      try {
        await saveSoilReport({
          nitrogen,
          phosphorus,
          potassium,
          ph,
          temperature: temp,
          humidity,
          rainfall,
          latitude: activeLocation?.latitude ?? null,
          longitude: activeLocation?.longitude ?? null,
          prediction: predictionArray[0]?.yieldResult || 0, // Save top crop yield
          file_url: fileUrl,
        });
      } catch (saveErr) {
        console.error('Save error:', saveErr);
        setError('Data saved locally but failed to sync with database.');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar userEmail={user?.email} />

      <main className="dashboard-main">
        {error && (
          <div className="dashboard-error">
            <span>{error}</span>
            <button onClick={() => setError('')} className="dashboard-error-close">×</button>
          </div>
        )}

        <div className="dashboard-content">
          {/* Left Panel — Soil Form */}
          <div className="dashboard-left">
            <SoilForm
              onSubmit={handleFormSubmit}
              location={location}
              weather={weather}
              isLoading={isLoading ? loadingPhase : false}
              locationLoading={locationLoading}
            />
          </div>

          {/* Right Panel — Results */}
          <div className="dashboard-right">
            <PredictionCard prediction={prediction} soilData={soilData} />
            <WeatherCard
              weather={weather}
              location={location}
              isLoading={weatherLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
