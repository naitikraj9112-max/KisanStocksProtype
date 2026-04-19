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
      // Clear any stuck speech in the queue
      window.speechSynthesis.cancel();
      
      const textToSpeak = scripts[lang] || scripts.en;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Ensure we set the lang attribute so the browser knows which text it is
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'hi') {
        // Look for Hindi or Indian voices
        const hindiVoice = voices.find(v => 
          v.lang.includes('hi') || 
          v.lang.includes('IN') || 
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('india')
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      }
      
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Clean up on unmount and eagerly fetch voices
  useEffect(() => {
    // Eagerly fetch voices so they're ready when clicked
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

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
