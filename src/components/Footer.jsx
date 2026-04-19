import React from 'react';
import { useLanguage } from '../utils/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <span className="footer-text">{t('poweredByGemini')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gemini-sparkle">
          <path d="M12 2v20"></path>
          <path d="M2 12h20"></path>
          <path d="m19 5-14 14"></path>
          <path d="M5 5l14 14"></path>
        </svg>
      </div>
    </footer>
  );
}
