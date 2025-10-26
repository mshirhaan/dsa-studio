'use client';

import { useStore } from '@/store/useStore';
import { useRef, useEffect } from 'react';
import {
  MousePointer2,
  Pencil,
  Eraser,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Type,
  Hand,
  Undo,
  Redo,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Magnet,
  Zap,
  Image as ImageIcon,
  SquareStack,
  Link2,
  GitBranch,
} from 'lucide-react';

const tools = [
  { id: 'select' as const, icon: MousePointer2, label: 'Select', shortcut: 'S' },
  { id: 'pen' as const, icon: Pencil, label: 'Pen', shortcut: 'P' },
  { id: 'laser' as const, icon: Zap, label: 'Laser Pointer', shortcut: 'K' },
  { id: 'eraser' as const, icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'line' as const, icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'arrow' as const, icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: 'rectangle' as const, icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle' as const, icon: Circle, label: 'Circle', shortcut: 'C' },
  { id: 'triangle' as const, icon: Triangle, label: 'Triangle', shortcut: 'X' },
  { id: 'text' as const, icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'image' as const, icon: ImageIcon, label: 'Image', shortcut: 'I', isUpload: true },
  { id: 'pan' as const, icon: Hand, label: 'Pan', shortcut: 'H' },
];

const dsaTools = [
  { id: 'array' as const, icon: SquareStack, label: 'Array', shortcut: 'Y' },
  { id: 'linked-list' as const, icon: Link2, label: 'Linked List', shortcut: 'N' },
  { id: 'tree' as const, icon: GitBranch, label: 'Tree', shortcut: 'B' },
];

const colors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280', // Gray
  '#000000', // Black
  '#FFFFFF', // White
];

export function DrawingToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    fillColor,
    setFillColor,
    opacity,
    setOpacity,
    lineStyle,
    setLineStyle,
    zoom,
    setZoom,
    undo,
    redo,
    clearCanvas,
    historyIndex,
    history,
    drawingElements,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    snapToGrid,
    setSnapToGrid,
  } = useStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Listen for image tool keyboard shortcut
  useEffect(() => {
    const handleImageShortcut = () => {
      fileInputRef.current?.click();
    };
    
    window.addEventListener('imageToolShortcut', handleImageShortcut);
    return () => window.removeEventListener('imageToolShortcut', handleImageShortcut);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      // Dispatch custom event to DrawingCanvas with image data
      const event = new CustomEvent('imageUpload', { 
        detail: { imageSrc } 
      });
      window.dispatchEvent(event);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToolClick = (toolId: typeof tools[number]['id']) => {
    if (toolId === 'image') {
      fileInputRef.current?.click();
    } else {
      setActiveTool(toolId);
    }
  };

  const handleExportCanvas = () => {
    // Get the canvas element
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    // Create a link and download
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvasElement.toDataURL();
    link.click();
  };

  const handleExportSVG = () => {
    // Simple SVG export (basic implementation)
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800">`;
    
    drawingElements.forEach(element => {
      if (element.type === 'pen' && element.points.length > 1) {
        const pathData = element.points.map((p, i) => 
          `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');
        svgContent += `<path d="${pathData}" stroke="${element.color}" stroke-width="${element.strokeWidth}" fill="none" opacity="${element.opacity}" />`;
      } else if (element.type === 'rectangle' && element.points.length >= 2) {
        const [start, end] = element.points;
        svgContent += `<rect x="${start.x}" y="${start.y}" width="${end.x - start.x}" height="${end.y - start.y}" stroke="${element.color}" stroke-width="${element.strokeWidth}" fill="${element.fillColor || 'none'}" opacity="${element.opacity}" />`;
      } else if (element.type === 'circle' && element.points.length >= 2) {
        const [start, end] = element.points;
        const radiusX = Math.abs(end.x - start.x);
        const radiusY = Math.abs(end.y - start.y);
        const cx = start.x + (end.x - start.x) / 2;
        const cy = start.y + (end.y - start.y) / 2;
        svgContent += `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" stroke="${element.color}" stroke-width="${element.strokeWidth}" fill="${element.fillColor || 'none'}" opacity="${element.opacity}" />`;
      }
    });
    
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 border-b border-gray-700">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* Tools */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-400 mr-2">Tools:</span>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`relative p-2 rounded transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={18} />
              <span className="absolute -top-1 -right-1 bg-gray-900 text-gray-400 text-[9px] font-mono px-1 py-0.5 rounded border border-gray-700 leading-none">
                {tool.shortcut}
              </span>
            </button>
          );
        })}
        
        {/* Separator */}
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        {/* DSA Tools */}
        <span className="text-xs font-medium text-green-400 mr-2">DSA:</span>
        {dsaTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`relative p-2 rounded transition-colors ${
                activeTool === tool.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={18} />
              <span className="absolute -top-1 -right-1 bg-gray-900 text-gray-400 text-[9px] font-mono px-1 py-0.5 rounded border border-gray-700 leading-none">
                {tool.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {/* Colors and Properties */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Stroke Color */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Stroke:</span>
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  strokeColor === color ? 'border-white scale-110' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Width:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-400 w-8">{strokeWidth}px</span>
        </div>

        {/* Fill Color */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Fill:</span>
          <select
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600"
          >
            <option value="transparent">None</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        {/* Line Style */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Style:</span>
          <select
            value={lineStyle}
            onChange={(e) => setLineStyle(e.target.value as any)}
            className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-400 w-8">{Math.round(opacity * 100)}%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-400 mr-2">Actions:</span>
        
        <button
          onClick={undo}
          disabled={!canUndo}
          className="relative flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 disabled:text-gray-600 rounded text-sm transition-colors"
          title="Undo (⌘Z / Ctrl+Z)"
        >
          <Undo size={14} />
          Undo
          <span className="ml-1 text-[10px] font-mono text-gray-500">⌘Z</span>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="relative flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 disabled:text-gray-600 rounded text-sm transition-colors"
          title="Redo (⌘⇧Z / Ctrl+Y)"
        >
          <Redo size={14} />
          Redo
          <span className="ml-1 text-[10px] font-mono text-gray-500">⌘⇧Z</span>
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
            showGrid
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 size={14} />
          Grid
        </button>

        {showGrid && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-20"
              title="Grid Size"
            />
            <span className="text-xs text-gray-400 w-10">{gridSize}px</span>
          </div>
        )}

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
            snapToGrid
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="Snap to Grid"
        >
          <Magnet size={14} />
          Snap
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-xs text-gray-400 px-2">{Math.round(zoom * 100)}%</span>

        <button
          onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          onClick={handleExportCanvas}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          title="Export as PNG"
        >
          <Download size={14} />
          PNG
        </button>

        <button
          onClick={handleExportSVG}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          title="Export as SVG"
        >
          <Download size={14} />
          SVG
        </button>

        <button
          onClick={() => {
            if (confirm('Clear entire canvas? This cannot be undone.')) {
              clearCanvas();
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
          title="Clear canvas"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}

