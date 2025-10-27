'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '@/store/useStore';
import { Play, Square, Trash2, Download, Plus, X, ZoomIn, ZoomOut, GripHorizontal, Flashlight, Zap } from 'lucide-react';
import { executeCode } from '@/lib/pistonApi';
import { LaserPointer } from './LaserPointer';

export function CodeEditor() {
  const {
    codeFiles,
    activeFileId,
    editorTheme,
    fontSize,
    setFontSize,
    updateCodeFile,
    renameCodeFile,
    setActiveFile,
    addCodeFile,
    deleteCodeFile,
    consoleOutput,
    isRunning,
    addConsoleOutput,
    clearConsole,
    setIsRunning,
    autoRun,
    setAutoRun,
    codeLaserActive,
    toggleCodeLaser,
  } = useStore();

  const activeFile = codeFiles.find(f => f.id === activeFileId);
  const consoleRef = useRef<HTMLDivElement>(null);
  const [consoleHeight, setConsoleHeight] = useState(192); // 192px = h-48
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const startHeight = useRef(0);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const runIdRef = useRef(0); // Track execution runs to ignore stale ones
  const abortControllerRef = useRef<AbortController | null>(null); // For canceling API calls
  
  // Helper function to detect language from file extension
  const getLanguageFromExtension = (filename: string): 'javascript' | 'python' | 'cpp' | 'java' | 'typescript' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, 'javascript' | 'python' | 'cpp' | 'java' | 'typescript'> = {
      'js': 'javascript',
      'py': 'python',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'java': 'java',
      'ts': 'typescript',
      'tsx': 'typescript',
    };
    return langMap[ext || ''] || 'javascript';
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Handle console resize
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    startHeight.current = consoleHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(50, Math.min(window.innerHeight - 200, startHeight.current + deltaY));
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, consoleHeight]);

  // Auto-run effect with debouncing
  useEffect(() => {
    if (!autoRun || !activeFile) return;
    
    // Cancel any pending execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const timeoutId = setTimeout(() => {
      handleRun();
    }, 1000); // 1000ms debounce to avoid API rate limits
    
    return () => clearTimeout(timeoutId);
  }, [activeFile?.content, autoRun]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom controls
  const handleZoomIn = () => {
    setFontSize(Math.min(32, fontSize + 2));
  };

  const handleZoomOut = () => {
    setFontSize(Math.max(10, fontSize - 2));
  };

  const handleResetZoom = () => {
    setFontSize(14);
  };

  const handleRun = async () => {
    if (!activeFile) return;
    
    // Cancel any ongoing API call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Increment run ID to track this execution
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;
    
    // Snapshot the code content at the start of execution
    const codeSnapshot = activeFile.content;
    
    // Helper to check if code has changed since execution started
    const hasCodeChanged = () => {
      const currentFile = codeFiles.find(f => f.id === activeFileId);
      return !currentFile || currentFile.content !== codeSnapshot || currentRunId !== runIdRef.current;
    };
    
    // Clear console for new run
    clearConsole();
    setIsRunning(true);
    
    try {
      // Check if it's JavaScript/TypeScript (run locally)
      if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
        // Create a custom console
        const customConsole = {
          log: (...args: any[]) => {
            if (hasCodeChanged()) return; // Ignore if code changed
            addConsoleOutput({
              type: 'log',
              content: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' '),
            });
          },
          error: (...args: any[]) => {
            if (hasCodeChanged()) return; // Ignore if code changed
            addConsoleOutput({
              type: 'error',
              content: args.map(arg => String(arg)).join(' '),
            });
          },
          warn: (...args: any[]) => {
            if (hasCodeChanged()) return; // Ignore if code changed
            addConsoleOutput({
              type: 'warn',
              content: args.map(arg => String(arg)).join(' '),
            });
          },
          info: (...args: any[]) => {
            if (hasCodeChanged()) return; // Ignore if code changed
            addConsoleOutput({
              type: 'info',
              content: args.map(arg => String(arg)).join(' '),
            });
          },
        };

        // Create a sandboxed function
        const sandboxedCode = `
          (function(console) {
            ${activeFile.content}
          })
        `;
        const fn = eval(sandboxedCode);
        fn(customConsole);
        
        // Only show success if code hasn't changed
        if (!hasCodeChanged()) {
          addConsoleOutput({
            type: 'info',
            content: '✓ Execution completed successfully',
          });
        }
      } else {
        // Use Piston API for other languages (Python, Java, C++)
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        // Retry logic with exponential backoff for rate limiting
        let result;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          try {
            result = await executeCode(activeFile.language, activeFile.content);
            break; // Success, exit retry loop
          } catch (error: any) {
            // Check if code changed
            if (hasCodeChanged()) {
              return; // Ignore stale results
            }
            
            // Check if it's a rate limit error
            if (error.message && error.message.includes('Too Many Requests') && retryCount < maxRetries) {
              retryCount++;
              const waitTime = Math.pow(2, retryCount) * 500; // 1s, 2s, 4s
              
              // Check again before showing warning
              if (hasCodeChanged()) return;
              
              addConsoleOutput({
                type: 'warn',
                content: `⏳ Rate limited, retrying in ${waitTime/1000}s... (attempt ${retryCount}/${maxRetries})`,
              });
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Check again if code changed during wait
              if (hasCodeChanged()) {
                return; // Ignore if superseded
              }
            } else {
              throw error; // Re-throw if not rate limit or max retries reached
            }
          }
        }
        
        // Final check: only display if code hasn't changed
        if (hasCodeChanged()) {
          return; // Ignore stale results
        }
        
        // Display stdout
        if (result!.run.stdout) {
          addConsoleOutput({
            type: 'log',
            content: result!.run.stdout,
          });
        }
        
        // Display stderr
        if (result!.run.stderr) {
          addConsoleOutput({
            type: 'error',
            content: result!.run.stderr,
          });
        }
        
        // Display exit code
        if (result!.run.code === 0) {
          addConsoleOutput({
            type: 'info',
            content: `✓ Execution completed successfully (exit code: ${result!.run.code})`,
          });
        } else {
          addConsoleOutput({
            type: 'error',
            content: `✗ Execution failed (exit code: ${result!.run.code})`,
          });
        }
      }
    } catch (error: any) {
      // Only show error if code hasn't changed and not aborted
      if (!hasCodeChanged() && error.name !== 'AbortError') {
        // Show rate limit error if max retries reached
        if (error.message && error.message.includes('Too Many Requests')) {
          addConsoleOutput({
            type: 'error',
            content: '✗ Rate limit exceeded. Please wait a moment and try again.',
          });
        } else {
          addConsoleOutput({
            type: 'error',
            content: `Error: ${error.message}`,
          });
        }
      }
    } finally {
      // Only clear running state if this is still the current run
      if (currentRunId === runIdRef.current) {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleAddFile = () => {
    const newFile = {
      id: `file-${Date.now()}`,
      name: `untitled-${codeFiles.length + 1}.js`,
      language: 'javascript' as const,
      content: '// New file\n',
    };
    addCodeFile(newFile);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    
    const extensions: Record<string, string> = {
      javascript: 'js',
      python: 'py',
      cpp: 'cpp',
      java: 'java',
      typescript: 'ts',
    };
    
    const ext = extensions[activeFile.language] || 'txt';
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile.name.split('.')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileDoubleClick = (fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingFileName(currentName);
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingFileName(e.target.value);
  };

  const handleFileNameBlur = () => {
    if (editingFileId && editingFileName.trim()) {
      const newLanguage = getLanguageFromExtension(editingFileName);
      renameCodeFile(editingFileId, editingFileName.trim(), newLanguage);
    }
    setEditingFileId(null);
    setEditingFileName('');
  };

  const handleFileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFileNameBlur();
    } else if (e.key === 'Escape') {
      setEditingFileId(null);
      setEditingFileName('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* File tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {codeFiles.map(file => (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                file.id === activeFileId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
              }`}
            >
              {editingFileId === file.id ? (
                <input
                  type="text"
                  value={editingFileName}
                  onChange={handleFileNameChange}
                  onBlur={handleFileNameBlur}
                  onKeyDown={handleFileNameKeyDown}
                  className="bg-gray-800 text-white px-2 py-0.5 rounded border border-blue-500 focus:outline-none w-32"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => setActiveFile(file.id)}
                  onDoubleClick={() => handleFileDoubleClick(file.id, file.name)}
                  title="Double-click to rename"
                >
                  {file.name}
                </span>
              )}
              {codeFiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCodeFile(file.id);
                  }}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddFile}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Add new file"
          >
            <Plus size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title="Zoom out (Cmd/Ctrl + -)"
            >
              <ZoomOut size={14} className="text-gray-300" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 text-xs text-gray-400 hover:text-white transition-colors"
              title="Reset zoom"
            >
              {fontSize}px
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title="Zoom in (Cmd/Ctrl + +)"
            >
              <ZoomIn size={14} className="text-gray-300" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600" />

          <button
            onClick={toggleCodeLaser}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
              codeLaserActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Laser pointer for teaching"
          >
            <Flashlight size={14} className={codeLaserActive ? 'animate-pulse' : ''} />
            Laser
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || autoRun}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            title="Run code (Cmd+R)"
          >
            {isRunning ? <Square size={14} /> : <Play size={14} />}
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={() => setAutoRun(!autoRun)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
              autoRun 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Auto-run code on changes"
          >
            <Zap size={14} className={autoRun ? 'animate-pulse' : ''} />
            Auto-Run
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Download file"
          >
            <Download size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 relative">
        {/* Hide cursor in Monaco when laser is active */}
        {codeLaserActive && (
          <style>{`
            .monaco-editor, .monaco-editor * {
              cursor: none !important;
            }
          `}</style>
        )}
        {activeFile && (
          <>
            <Editor
              height="100%"
              language={activeFile.language}
              value={activeFile.content}
              theme={editorTheme}
              onChange={(value) => updateCodeFile(activeFile.id, value || '')}
              options={{
                fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16 },
              }}
            />
            {/* Laser Pointer Overlay */}
            <LaserPointer isActive={codeLaserActive} />
          </>
        )}
      </div>

      {/* Console */}
      <div 
        className="border-t border-gray-700 bg-gray-900 flex flex-col"
        style={{ height: `${consoleHeight}px` }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="h-2 bg-gray-700 hover:bg-blue-500 cursor-row-resize transition-colors flex items-center justify-center group relative"
          style={{ minHeight: '8px' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <GripHorizontal size={20} className="text-gray-500 group-hover:text-blue-300 transition-colors" />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-300">Console</span>
          <button
            onClick={clearConsole}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-400 transition-colors"
            title="Clear console"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
        <div
          ref={consoleRef}
          className="flex-1 overflow-auto p-3 font-mono text-sm"
        >
          {consoleOutput.length === 0 ? (
            <div className="text-gray-500 italic">Console output will appear here...</div>
          ) : (
            consoleOutput.map((output) => (
              <div
                key={output.id}
                className={`mb-1 ${
                  output.type === 'error'
                    ? 'text-red-400'
                    : output.type === 'warn'
                    ? 'text-yellow-400'
                    : output.type === 'info'
                    ? 'text-blue-400'
                    : 'text-gray-300'
                }`}
              >
                <span className="text-gray-500 mr-2">
                  {output.type === 'error' ? '✗' : output.type === 'warn' ? '⚠' : output.type === 'info' ? 'ℹ' : '›'}
                </span>
                {output.content}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

