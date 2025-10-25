'use client';

import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

export function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on macOS
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Use Cmd (⌘) for Mac, Ctrl for others
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { category: 'View Modes', items: [
      { keys: [modKey, '1'], description: 'Split View' },
      { keys: [modKey, '2'], description: 'Code Only' },
      { keys: [modKey, '3'], description: 'Draw Only' },
    ]},
    { category: 'Editor', items: [
      { keys: [modKey, 'R'], description: 'Run Code' },
      { keys: [modKey, 'S'], description: 'Save Session' },
    ]},
    { category: 'Canvas', items: [
      { keys: [modKey, 'Z'], description: 'Undo' },
      { keys: [modKey, 'Shift', 'Z'], description: 'Redo' },
      { keys: [modKey, 'Y'], description: 'Redo (Alt)' },
      { keys: [modKey, 'C'], description: 'Copy Selected' },
      { keys: [modKey, 'V'], description: 'Paste' },
      { keys: [modKey, 'D'], description: 'Duplicate Selected' },
      { keys: ['Delete'], description: 'Delete Selected' },
    ]},
    { category: 'Tools (Single Key)', items: [
      { keys: ['S'], description: 'Select Tool' },
      { keys: ['P'], description: 'Pen Tool' },
      { keys: ['K'], description: 'Laser Pointer Tool' },
      { keys: ['E'], description: 'Eraser Tool' },
      { keys: ['L'], description: 'Line Tool' },
      { keys: ['A'], description: 'Arrow Tool' },
      { keys: ['R'], description: 'Rectangle Tool' },
      { keys: ['C'], description: 'Circle Tool' },
      { keys: ['X'], description: 'Triangle Tool' },
      { keys: ['T'], description: 'Text Tool' },
      { keys: ['I'], description: 'Image Tool (Upload)' },
      { keys: ['H'], description: 'Pan Tool' },
    ]},
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors z-40"
        title="Keyboard Shortcuts"
      >
        <Keyboard size={20} className="text-white" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {shortcuts.map((section) => (
                <div key={section.category}>
                  <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-750 rounded">
                        <span className="text-gray-300">{item.description}</span>
                        <div className="flex gap-1">
                          {item.keys.map((key, keyIdx) => (
                            <kbd
                              key={keyIdx}
                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
              <p>💡 Tip: Use keyboard shortcuts for faster workflow!</p>
              {isMac && <p className="mt-1 text-xs">🍎 Using Command (⌘) key for macOS</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

