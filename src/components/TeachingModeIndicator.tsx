'use client';

import { useStore } from '@/store/useStore';
import { Presentation, MessageCircle, Coffee, Timer } from 'lucide-react';

export default function TeachingModeIndicator() {
  const { teachingMode, setTeachingMode } = useStore();

  const modes = {
    teaching: {
      icon: Presentation,
      label: 'Teaching',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    qa: {
      icon: MessageCircle,
      label: 'Q&A',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    challenge: {
      icon: Timer,
      label: 'Challenge',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
    break: {
      icon: Coffee,
      label: 'Break',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
  };

  const currentMode = modes[teachingMode];
  const Icon = currentMode.icon;

  const cycleMode = () => {
    const modeOrder: Array<'teaching' | 'qa' | 'challenge' | 'break'> = ['teaching', 'qa', 'challenge', 'break'];
    const currentIndex = modeOrder.indexOf(teachingMode);
    const nextIndex = (currentIndex + 1) % modeOrder.length;
    setTeachingMode(modeOrder[nextIndex]);
  };

  return (
    <button
      onClick={cycleMode}
      className={`${currentMode.bgColor} ${currentMode.hoverColor} text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2`}
      title={`Click to cycle modes (currently: ${currentMode.label})`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{currentMode.label}</span>
    </button>
  );
}
