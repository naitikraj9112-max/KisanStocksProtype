import React, { useState, useEffect } from 'react';
import { FiMic, FiSquare, FiPlay } from 'react-icons/fi';
import { useLanguage } from '../utils/LanguageContext';

export default function VoiceAssistant() {
  const [isPlaying, setIsPlaying] = useState(false);
  const { lang } = useLanguage();

  const scripts = {
    en: "Welcome to Kisan Stocks dashboard. Here you can upload your soil health card or enter data manually. The AI will analyze the soil chemistry, verify geofenced environmental data like temperature and humidity, and predict the best crop yields. The top recommendation is shown on the right with alternative options.",
    hi: "किसान स्टॉक्स डैशबोर्ड में आपका स्वागत है। यहाँ आप अपना मृदा स्वास्थ्य कार्ड अपलोड कर सकते हैं या मैन्युअल रूप से डेटा दर्ज कर सकते हैं। AI मिट्टी के रसायन का विश्लेषण करेगा, तापमान और नमी जैसे पर्यावरणी डेटा की पुष्टि करेगा, और सर्वोत्तम फसल उपज की भविष्यवाणी करेगा। शीर्ष अनुशंसा विकल्पों के साथ दाईं ओर दिखाई गई है।"
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToSpeak = scripts[lang] || scripts.en;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Try to select appropriate language voice
      if (lang === 'hi') {
        utterance.lang = 'hi-IN';
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang === 'hi-IN');
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 0.9;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <button 
      className={`voice-assistant-btn ${isPlaying ? 'voice-assistant-btn--playing' : ''}`}
      onClick={handleTogglePlay}
      title={isPlaying ? "Stop voice assistant / आवाज रोकें" : "Play voice assistant / आवाज चलाएं"}
    >
      {isPlaying ? <FiSquare size={22} className="voice-icon-pulse" /> : <FiMic size={24} />}
      {isPlaying && <span className="voice-pulse-ring"></span>}
    </button>
  );
}
