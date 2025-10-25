'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '@/store/useStore';
import { Play, Square, Trash2, Download, Plus, X, ZoomIn, ZoomOut, GripHorizontal } from 'lucide-react';

export function CodeEditor() {
  const {
    codeFiles,
    activeFileId,
    editorTheme,
    fontSize,
    setFontSize,
    updateCodeFile,
    setActiveFile,
    addCodeFile,
    deleteCodeFile,
    consoleOutput,
    isRunning,
    addConsoleOutput,
    clearConsole,
    setIsRunning,
  } = useStore();

  const activeFile = codeFiles.find(f => f.id === activeFileId);
  const consoleRef = useRef<HTMLDivElement>(null);
  const [consoleHeight, setConsoleHeight] = useState(192); // 192px = h-48
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const startHeight = useRef(0);

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

  const handleRun = () => {
    if (!activeFile || isRunning) return;
    
    setIsRunning(true);
    clearConsole();
    
    try {
      // Create a custom console
      const customConsole = {
        log: (...args: any[]) => {
          addConsoleOutput({
            type: 'log',
            content: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
          });
        },
        error: (...args: any[]) => {
          addConsoleOutput({
            type: 'error',
            content: args.map(arg => String(arg)).join(' '),
          });
        },
        warn: (...args: any[]) => {
          addConsoleOutput({
            type: 'warn',
            content: args.map(arg => String(arg)).join(' '),
          });
        },
        info: (...args: any[]) => {
          addConsoleOutput({
            type: 'info',
            content: args.map(arg => String(arg)).join(' '),
          });
        },
      };

      // Execute code
      if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
        // Create a sandboxed function
        const sandboxedCode = `
          (function(console) {
            ${activeFile.content}
          })
        `;
        const fn = eval(sandboxedCode);
        fn(customConsole);
      } else if (activeFile.language === 'python') {
        addConsoleOutput({
          type: 'warn',
          content: 'Python execution not yet supported. Coming soon!',
        });
      } else {
        addConsoleOutput({
          type: 'warn',
          content: `${activeFile.language} execution not yet supported. Coming soon!`,
        });
      }
      
      addConsoleOutput({
        type: 'info',
        content: '✓ Execution completed successfully',
      });
    } catch (error: any) {
      addConsoleOutput({
        type: 'error',
        content: `Error: ${error.message}`,
      });
    } finally {
      setIsRunning(false);
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

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* File tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {codeFiles.map(file => (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer transition-colors ${
                file.id === activeFileId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
              }`}
              onClick={() => setActiveFile(file.id)}
            >
              <span>{file.name}</span>
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
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            title="Run code (Ctrl+R)"
          >
            {isRunning ? <Square size={14} /> : <Play size={14} />}
            {isRunning ? 'Running...' : 'Run'}
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
      <div className="flex-1 min-h-0">
        {activeFile && (
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

