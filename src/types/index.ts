// Core types for DSA Teaching Studio

export type ViewMode = 'split' | 'code-only' | 'draw-only' | 'pip';

export type Language = 'javascript' | 'python' | 'cpp' | 'java' | 'typescript';

export type DrawingTool = 
  | 'select' 
  | 'pen' 
  | 'eraser' 
  | 'line' 
  | 'arrow' 
  | 'rectangle' 
  | 'circle' 
  | 'triangle' 
  | 'text' 
  | 'pan'
  | 'laser'
  | 'image';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: DrawingTool;
  points: Point[];
  color: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  lineStyle: LineStyle;
  text?: string;
  fontSize?: number;
  width?: number;
  height?: number;
  rotation?: number;
  // Image-specific properties
  imageSrc?: string; // base64 or URL
  imageWidth?: number;
  imageHeight?: number;
}

export interface CodeFile {
  id: string;
  name: string;
  language: Language;
  content: string;
}

export interface ConsoleOutput {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  viewMode: ViewMode;
  codeFiles: CodeFile[];
  activeFileId: string;
  drawingElements: DrawingElement[];
  canvasBackground: string;
  zoom: number;
  panOffset: Point;
  splitRatio: number;
  timestamp: number;
  // Multi-slide support
  slides?: DrawingElement[][];
  currentSlide?: number;
  // Grid support
  showGrid?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
}

export interface AppState {
  // View state
  viewMode: ViewMode;
  splitRatio: number;
  
  // Code editor state
  codeFiles: CodeFile[];
  activeFileId: string;
  editorTheme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  
  // Console state
  consoleOutput: ConsoleOutput[];
  isRunning: boolean;
  
  // Drawing canvas state
  drawingElements: DrawingElement[];
  selectedElementIds: string[];
  activeTool: DrawingTool;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  lineStyle: LineStyle;
  canvasBackground: string;
  zoom: number;
  panOffset: Point;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  currentSlide: number;
  slides: DrawingElement[][];
  
  // History
  historyIndex: number;
  history: DrawingElement[][];
  
  // Session
  currentSessionId: string | null;
  savedSessions: Session[];
}

