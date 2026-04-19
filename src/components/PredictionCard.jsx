import { FiCheckCircle, FiTrendingUp, FiAlertCircle, FiAward } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { useLanguage } from '../utils/LanguageContext';

export default function PredictionCard({ prediction, soilData }) {
  const { t } = useLanguage();
  // prediction is now an array of top 3 crops
  if (!prediction || prediction.length === 0) {
    return (
      <div className="prediction-card prediction-card--empty">
        <div className="prediction-empty-icon">
          <PiPlantFill size={48} />
        </div>
        <h3 className="prediction-empty-title">{t('awaitingAnalysis')}</h3>
        <p className="prediction-empty-desc">
          {t('awaitingAnalysisDesc')}
        </p>
      </div>
    );
  }

  const topCrop = prediction[0];

  return (
    <div className="prediction-card prediction-card--active">
      <div className="prediction-card-bg"></div>

      <div className="prediction-header-top">
        <div className="prediction-badge">
          <FiCheckCircle size={14} />
          <span>{t('recommendedCropType')}</span>
        </div>
      </div>

      <p className="prediction-label">
        {topCrop.isTargeted ? `${t('targetVerificationPrefix')} ${topCrop.cropName}` : t('recCropPrefix')}
      </p>

      <div className="prediction-header-top" style={{marginBottom: '1rem'}}>
        <div className="prediction-value-wrapper" style={{marginBottom: 0}}>
          <span className="prediction-value" style={{fontSize: '2.5rem', lineHeight: 1.2, padding: '4px 0'}}>
            {topCrop.cropName}
          </span>
        </div>
        <div className="prediction-crop-badge" style={{background: topCrop.isTargeted && topCrop.suitability < 50 ? 'var(--color-error)' : 'var(--color-success)'}}>
          <FiAward style={{display:'inline-block', marginRight:'4px'}}/> 
          {topCrop.isTargeted && topCrop.suitability < 50 ? t('poorMatch') : topCrop.isTargeted && topCrop.suitability < 70 ? t('moderateMatch') : t('highMatch')}
        </div>
      </div>

      <div className="prediction-stats" style={{marginBottom: '2rem'}}>
        <div className="prediction-stat">
          <span className="prediction-stat-label">{t('projectedYield')}</span>
          <span className="prediction-stat-value">
            {topCrop.yieldResult} <span style={{fontSize: '0.8rem', opacity: 0.6}}>T/ha</span>
          </span>
        </div>
        <div className="prediction-stat-divider"></div>
        <div className="prediction-stat">
          <span className="prediction-stat-label">{t('confidence')}</span>
          <span className="prediction-stat-value">
            {topCrop.confidence}%
          </span>
        </div>
        <div className="prediction-stat-divider"></div>
        <div className="prediction-stat">
          <span className="prediction-stat-label">{t('profileMatch')}</span>
          <span className="prediction-stat-value prediction-quality--excellent">
            {topCrop.suitability}%
          </span>
        </div>
      </div>

      <p className="prediction-label" style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>{t('alternativeRecs')}</p>
      
      <div className="alt-crops-list">
        {prediction.slice(1).map((crop, idx) => (
          <div key={idx} className="alt-crop-row">
            <span className="alt-crop-name">{crop.cropName}</span>
            <span className="alt-crop-stat">{crop.yieldResult} T/ha</span>
            <span className="alt-crop-stat alt-crop-stat--suitability">{crop.suitability}% {t('match')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
