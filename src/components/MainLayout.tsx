'use client';

import { useStore } from '@/store/useStore';
import {
  Split,
  Code,
  Pencil,
  Save,
  FolderOpen,
  Download,
  Upload,
  Layers,
  GripVertical,
  Map,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingToolbar } from './DrawingToolbar';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ShortcutsPanel } from './ShortcutsPanel';
import { TemplatesPanel } from './TemplatesPanel';
import { SlideNavigation } from './SlideNavigation';
import { RoadmapPanel } from './RoadmapPanel';
import { useState, useRef, useEffect } from 'react';

export function MainLayout() {
  const {
    viewMode,
    setViewMode,
    splitRatio,
    setSplitRatio,
    saveSession,
    loadSession,
    savedSessions,
    exportSession,
    importSession,
    showRoadmap,
    setShowRoadmap,
  } = useStore();

  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSaveSession = () => {
    const name = prompt('Enter session name:');
    if (name) {
      saveSession(name);
      alert('Session saved successfully!');
    }
  };

  const handleExportSession = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsa-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        importSession(data);
        alert('Session imported successfully!');
      };
      reader.readAsText(file);
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      // Use container's bounding rect to account for browser zoom
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <>
      <KeyboardShortcuts />
      <ShortcutsPanel />
      <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold">DSA Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex gap-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
              title="Split View"
            >
              <Split size={16} />
              Split
            </button>
            <button
              onClick={() => setViewMode('code-only')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'code-only'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
              title="Code Only"
            >
              <Code size={16} />
              Code
            </button>
            <button
              onClick={() => setViewMode('draw-only')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'draw-only'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
              title="Draw Only"
            >
              <Pencil size={16} />
              Draw
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600" />

          {/* Templates Button */}
          <TemplatesPanel />

          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
              showRoadmap
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title="DSA Roadmap"
          >
            <Map size={16} />
            Roadmap
          </button>

          <div className="w-px h-6 bg-gray-600" />

          {/* Session Controls */}
          <button
            onClick={handleSaveSession}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            title="Save Session"
          >
            <Save size={16} />
            Save
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSessionMenu(!showSessionMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Load Session"
            >
              <FolderOpen size={16} />
              Load
            </button>

            {showSessionMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-400 mb-2 px-2">Saved Sessions</div>
                  {savedSessions.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No saved sessions
                    </div>
                  ) : (
                    savedSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          loadSession(session.id);
                          setShowSessionMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm transition-colors"
                      >
                        <div className="font-medium text-gray-200">{session.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExportSession}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            title="Export Session"
          >
            <Download size={16} />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            title="Import Session"
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportSession}
            className="hidden"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'split' && (
          <>
            <div
              className="flex-shrink-0"
              style={{ width: `${splitRatio * 100}%` }}
            >
              <CodeEditor />
            </div>
            {/* Resize handle */}
            <div
              onMouseDown={handleMouseDown}
              className="w-2 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex items-center justify-center group relative select-none"
              style={{ minWidth: '8px' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <GripVertical size={20} className="text-gray-500 group-hover:text-blue-300 transition-colors" />
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <DrawingToolbar />
              <div className="flex-1">
                <DrawingCanvas />
              </div>
              <SlideNavigation />
            </div>
          </>
        )}

        {viewMode === 'code-only' && (
          <div className="flex-1">
            <CodeEditor />
          </div>
        )}

        {viewMode === 'draw-only' && (
          <div className="flex-1 flex flex-col">
            <DrawingToolbar />
            <div className="flex-1">
              <DrawingCanvas />
            </div>
            <SlideNavigation />
          </div>
        )}
        </div>
        
        {/* Roadmap Panel */}
        <RoadmapPanel />
      </div>
    </div>
    </>
  );
}

