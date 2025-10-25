'use client';

import { useStore } from '@/store/useStore';
import { Plus, ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';

export function SlideNavigation() {
  const {
    slides,
    currentSlide,
    setCurrentSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
  } = useStore();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700">
      <span className="text-xs font-medium text-gray-400">Slides:</span>
      
      <button
        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
        disabled={currentSlide === 0}
        className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        title="Previous slide"
      >
        <ChevronLeft size={16} className="text-gray-400" />
      </button>

      <div className="flex items-center gap-1 overflow-x-auto max-w-md">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`relative min-w-[60px] h-10 rounded border-2 transition-all ${
              index === currentSlide
                ? 'border-blue-500 bg-blue-600'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
            title={`Slide ${index + 1}`}
          >
            <span className="text-xs font-medium text-white">{index + 1}</span>
            {index === currentSlide && slides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete slide ${index + 1}?`)) {
                    deleteSlide(index);
                  }
                }}
                className="absolute -top-1 -right-1 p-0.5 bg-red-600 hover:bg-red-700 rounded-full"
              >
                <Trash2 size={10} className="text-white" />
              </button>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
        disabled={currentSlide === slides.length - 1}
        className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        title="Next slide"
      >
        <ChevronRight size={16} className="text-gray-400" />
      </button>

      <div className="w-px h-6 bg-gray-600" />

      <button
        onClick={() => duplicateSlide(currentSlide)}
        className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
        title="Duplicate current slide"
      >
        <Copy size={12} className="text-gray-400" />
        <span className="text-gray-300">Duplicate</span>
      </button>

      <button
        onClick={addSlide}
        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
        title="Add new slide"
      >
        <Plus size={12} className="text-white" />
        <span className="text-white">New Slide</span>
      </button>

      <span className="text-xs text-gray-500 ml-2">
        {currentSlide + 1} / {slides.length}
      </span>
    </div>
  );
}

