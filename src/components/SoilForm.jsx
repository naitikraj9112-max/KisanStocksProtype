import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiUploadCloud, FiMapPin, FiDroplet, FiSun, FiCloudRain, FiExternalLink, FiNavigation, FiMaximize, FiMinimize } from 'react-icons/fi';
import { GiChemicalDrop } from 'react-icons/gi';
import * as pdfjsLib from 'pdfjs-dist';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../utils/LanguageContext';

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Config PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function SoilForm({
  onSubmit,
  location,
  weather,
  isLoading,
  locationLoading,
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    targetCrop: 'auto',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' | 'manual'
  const [manualPosition, setManualPosition] = useState({ lat: 20.5937, lng: 78.9629 }); // Default center India
  const [farmRadius, setFarmRadius] = useState(5); // km
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Map Click Handler component
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setManualPosition(e.latlng);
      },
    });
    return manualPosition ? <Marker position={manualPosition} /> : null;
  };

  // Autoresize map helper
  const MapUpdater = ({ expanded }) => {
    const map = useMap();
    useEffect(() => {
      // Small timeout allows DOM to finish rendering
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timeout);
    }, [expanded, map]);
    return null;
  };

  const mapContent = (
    <div style={{
         position: isMapExpanded ? 'fixed' : 'relative',
         top: isMapExpanded ? 0 : 'auto',
         left: isMapExpanded ? 0 : 'auto',
         width: isMapExpanded ? '100vw' : '100%',
         height: isMapExpanded ? '100vh' : '240px',
         zIndex: isMapExpanded ? 99999 : 0,
         overflow: 'hidden', 
         borderRadius: isMapExpanded ? '0' : 'var(--radius-md)',
         margin: 0
    }}>
      <button 
        type="button" 
        onClick={() => setIsMapExpanded(!isMapExpanded)}
        style={{
          position: 'absolute', top: '15px', right: '15px', zIndex: 100000,
          background: 'white', border: 'none', borderRadius: '6px', padding: '10px 14px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
        }}
      >
        {isMapExpanded ? <><FiMinimize size={18} /> {t('closeMap')}</> : <><FiMaximize size={18} /> {t('expand')}</>}
      </button>
      <MapContainer 
         center={[manualPosition.lat, manualPosition.lng]} 
         zoom={4} 
         style={{height: '100%', width: '100%'}}
      >
        <MapUpdater expanded={isMapExpanded} />
        <TileLayer
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parsePDF = async (file) => {
    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + " ";
      }

      console.log("PDF Extracted Text:", fullText);
      
      // Basic regex extraction logic for N P K pH using strict word boundaries
      // Real models would use NLP. This is a heuristic fallback.
      const matchN = fullText.match(/\b(?:Nitrogen|N)\b.*?(\d+(\.\d+)?)/i);
      const matchP = fullText.match(/\b(?:Phosphorus|P)\b.*?(\d+(\.\d+)?)/i);
      const matchK = fullText.match(/\b(?:Potassium|K)\b.*?(\d+(\.\d+)?)/i);
      const matchPH = fullText.match(/\b(?:pH|PH|Power of Hydrogen)\b.*?(\d+(\.\d+)?)/i);

      setFormData(prev => ({
        ...prev,
        nitrogen: matchN ? matchN[1] : prev.nitrogen,
        phosphorus: matchP ? matchP[1] : prev.phosphorus,
        potassium: matchK ? matchK[1] : prev.potassium,
        ph: matchPH ? matchPH[1] : prev.ph,
      }));
      
    } catch (err) {
      console.error("Failed to parse PDF", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        await parsePDF(file);
      }
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      await parsePDF(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let manualLat = null;
    let manualLng = null;
    if (locationMode === 'manual') {
      manualLat = manualPosition.lat;
      manualLng = manualPosition.lng;
    }

    onSubmit({
      nitrogen: parseFloat(formData.nitrogen),
      phosphorus: parseFloat(formData.phosphorus),
      potassium: parseFloat(formData.potassium),
      ph: parseFloat(formData.ph),
      targetCrop: formData.targetCrop,
      pdfFile,
      manualLocationMode: locationMode === 'manual',
      manualLat,
      manualLng,
      farmRadius
    });
  };

  const isFormValid = formData.nitrogen && formData.phosphorus && formData.potassium && formData.ph;

  return (
    <div className="soil-form-card">
      <div className="soil-form-header">
        <h2 className="soil-form-title">{t('soilAnalysisData')}</h2>
        <p className="soil-form-desc">
          {t('uploadCardContent')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* PDF Upload Zone */}
        <div
          className={`pdf-upload-zone ${dragActive ? 'pdf-upload-zone--active' : ''} ${pdfFile ? 'pdf-upload-zone--has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="pdf-upload-input"
          />
          <FiUploadCloud size={28} className="pdf-upload-icon" />
          
          {isExtracting ? (
             <div className="pdf-upload-text">
               <span className="pdf-upload-label" style={{color: 'var(--color-primary)'}}>{t('extractingData')}</span>
               <span className="spinner" style={{borderColor: 'var(--color-primary)', borderTopColor: 'transparent', margin: '4px auto'}}></span>
             </div>
          ) : pdfFile ? (
            <div className="pdf-upload-file-info">
              <span className="pdf-upload-filename">{pdfFile.name}</span>
              <span className="pdf-upload-filesize">
                {(pdfFile.size / 1024).toFixed(1)} KB — {t('dataExtracted')}
              </span>
            </div>
          ) : (
            <div className="pdf-upload-text">
               <span className="pdf-upload-label">{t('uploadPdfHint')}</span>
               <span className="pdf-upload-hint">{t('dragDropHint')}</span>
            </div>
          )}
        </div>
        
        <a href="https://www.soilhealth.dac.gov.in/home" target="_blank" rel="noopener noreferrer" className="soil-card-link">
          <FiExternalLink /> {t('noSoilCard')}
        </a>

        <div className="soil-form-grid" style={{marginTop: '1rem'}}>
          <div className="form-group form-group--full-width">
            <label className="form-label">
              <span className="form-label-icon-text" style={{background: 'var(--color-accent)'}}>🎯</span>
              {t('targetVerification')}
            </label>
            <select
              name="targetCrop"
              value={formData.targetCrop}
              onChange={handleChange}
              className="form-input form-select"
            >
              <option value="auto">{t('autoRecommendBest')}</option>
              <option value="wheat">{t('wheat')}</option>
              <option value="rice">{t('rice')}</option>
              <option value="maize">{t('maize')}</option>
              <option value="cotton">{t('cotton')}</option>
              <option value="soybean">{t('soybean')}</option>
              <option value="sugarcane">{t('sugarcane')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <GiChemicalDrop className="form-label-icon" />
              {t('phLevel')}
            </label>
            <input
              type="number"
              name="ph"
              value={formData.ph}
              onChange={handleChange}
              placeholder="6.5"
              step="0.1"
              min="0"
              max="14"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon-text">N</span>
              {t('nitrogen')}
            </label>
            <input
              type="number"
              name="nitrogen"
              value={formData.nitrogen}
              onChange={handleChange}
              placeholder="42"
              min="0"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon-text">P</span>
              {t('phosphorus')}
            </label>
            <input
              type="number"
              name="phosphorus"
              value={formData.phosphorus}
              onChange={handleChange}
              placeholder="18"
              min="0"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon-text">K</span>
              {t('potassium')}
            </label>
            <input
              type="number"
              name="potassium"
              value={formData.potassium}
              onChange={handleChange}
              placeholder="210"
              min="0"
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Location Display & Geofencing Mode */}
        <div className="location-mode-container">
           <div className="location-toggle-group">
              <button 
                type="button"
                className={`location-toggle-btn ${locationMode === 'auto' ? 'active' : ''}`}
                onClick={() => setLocationMode('auto')}
              >
                {t('autoGps')}
              </button>
              <button 
                type="button"
                className={`location-toggle-btn ${locationMode === 'manual' ? 'active' : ''}`}
                onClick={() => setLocationMode('manual')}
              >
                {t('manualGeofence')}
              </button>
           </div>
           
           {locationMode === 'manual' ? (
             <div className="manual-location-inputs animate-fade-in">
               <div className="form-group" style={{ zIndex: 0 }}>
                 {isMapExpanded ? createPortal(mapContent, document.body) : mapContent}
               </div>
               <div className="form-group">
                 <label className="form-label">{t('farmBoundaryRadius')}: {farmRadius}km</label>
                 <input 
                    type="range" 
                    min="1" max="50" 
                    value={farmRadius}
                    onChange={(e) => setFarmRadius(e.target.value)}
                    className="radius-slider"
                 />
                 <span className="form-label" style={{textTransform: 'none', marginTop: '4px', opacity: 0.7}}>{t('clickMapHint')}</span>
               </div>
             </div>
           ) : (
             <div className="soil-form-location animate-fade-in">
              <FiNavigation size={16} className="location-icon" />
              {locationLoading ? (
                <span className="location-text location-text--loading">
                  {t('detectingLocation')}
                </span>
              ) : location ? (
                <span className="location-text">
                  {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
                </span>
              ) : (
                <span className="location-text location-text--error">
                  {t('locationUnavailable')}
                </span>
              )}

              {weather && (
                <div className="location-weather-mini">
                  <span><FiSun size={13} /> {weather.temperature}°C</span>
                  <span><FiDroplet size={13} /> {weather.humidity}%</span>
                  <span><FiCloudRain size={13} /> {weather.rainfall}mm</span>
                </div>
              )}
            </div>
           )}
        </div>

        <button
          type="submit"
          className="soil-form-submit"
          disabled={(!isFormValid && locationMode === 'auto') || isLoading || (locationMode === 'manual' && (!isFormValid))}
        >
          {isLoading ? (
            <span className="submit-loading">
              <span className="spinner"></span>
              {isLoading === true ? t('generatingRecs') : isLoading}
            </span>
          ) : (
            t('generateRecsBtn')
          )}
        </button>
      </form>
    </div>
  );
}
