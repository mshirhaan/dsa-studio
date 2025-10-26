'use client';

import { useStore } from '@/store/useStore';
import { Clock, Play, Pause, RotateCcw, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function Timer() {
  const { 
    timerDuration, 
    timerStartTime, 
    timerIsRunning,
    timerPausedAt,
    startTimer, 
    stopTimer, 
    resetTimer 
  } = useStore();
  
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [showTimer, setShowTimer] = useState(false);
  const [showSetPopup, setShowSetPopup] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Preset durations in seconds
  const presets = [
    { label: '2m', seconds: 120 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '30m', seconds: 1800 },
  ];

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowSetPopup(false);
      }
    };

    if (showSetPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSetPopup]);

  useEffect(() => {
    if (!timerIsRunning) {
      setTimeLeft(timerPausedAt !== null ? timerPausedAt : timerDuration);
      return;
    }

    if (!timerStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        stopTimer();
        if (typeof window !== 'undefined') {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eifTRAMUKfj8LZjHAU7k9n0yXksBSx+zPLaizsKGGS46+mlUBELTKXh8bllHgU2jdXzzn0vBSh6yO/eiz0KFmG35+ytVRILSKHf8LxpIAU0iM/z1YI2Bzh0w+3mtVkUDEqh3+6/ax8EL4TO89iHOwgYZrru7aBRDwxMpeDwuWYdBTKO1/PKfDACEFWo4+6tYBkFMIjP8tiIOggXY7fq7qdTEAtJod/wvWsgBTGIz/PYiDoIF2O36u6nUxALSaHf8L1rIAUuhM7z2Ic7CBdkt+ruqFIRC0ih4PC7ax4EL4PO89mGOwgYZLjr6aRPEAxLpOHwtWYcBjWP1vPJfCwEKHnH7t6KOwgVYbbm7aVSEQtJoN7wvmogBS+EzvLYhjsIF2S46+ikUBALSqPh8LhmHgU2jNXzzn4vBSd6x+7eijsIFWG36O6lUhELSZ/e8L5qHwUvhc7y14U6CBhnt+rspVIQC0me3+/AaB4FM4nO8tiHOwgYZrju76JNEAxMpN/yvGcdBTOIzvLYhzsIF2W56+mlUhAKSJ/f8L5rIAQvg87y2IY7CBdmueruqVQQCkee3+/BaB0FM4rO8tiGOwgYZbjt6qZRDwtNpeDwumUeAzeLzvLYhTsIF2S56++oUw8LTKXh8Ltn');
          audio.play().catch(() => {});
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timerIsRunning, timerStartTime, timerDuration, timerPausedAt, stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    if (timerIsRunning) {
      stopTimer();
    } else {
      const duration = timerPausedAt !== null ? timerPausedAt : timeLeft;
      startTimer(duration);
    }
  };

  const handlePresetClick = (seconds: number) => {
    stopTimer();
    startTimer(seconds);
    setShowSetPopup(false);
    setShowTimer(true);
  };

  const handleCustomTime = () => {
    const minutes = parseInt(customMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      const seconds = minutes * 60;
      stopTimer();
      startTimer(seconds);
      setCustomMinutes('');
      setShowSetPopup(false);
      setShowTimer(true);
    }
  };

  const isLowTime = timeLeft <= 60 && timerIsRunning;
  const isExpired = timeLeft === 0;

  if (!showTimer) {
    return (
      <button
        onClick={() => setShowTimer(true)}
        className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Show Timer"
      >
        <Clock className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono transition-colors ${
          isExpired 
            ? 'bg-red-600 text-white animate-pulse' 
            : isLowTime 
            ? 'bg-orange-600 text-white' 
            : 'bg-gray-700 text-white'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span className="font-semibold min-w-[3rem]">{formatTime(timeLeft)}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleStartStop}
          className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title={timerIsRunning ? 'Pause' : 'Start'}
        >
          {timerIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        
        <button
          onClick={resetTimer}
          className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="relative" ref={popupRef}>
          <button
            onClick={() => setShowSetPopup(!showSetPopup)}
            className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs transition-colors"
            title="Set time"
          >
            Set
          </button>

          {showSetPopup && (
            <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-xl border border-gray-700 p-3 w-48 z-[999]">
              <div className="space-y-2">
                {presets.map((preset) => (
                  <button
                    key={preset.seconds}
                    onClick={() => handlePresetClick(preset.seconds)}
                    className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomTime()}
                      placeholder="Min"
                      className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                      min="1"
                    />
                    <button
                      onClick={handleCustomTime}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded whitespace-nowrap"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowTimer(false)}
          className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Hide timer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
