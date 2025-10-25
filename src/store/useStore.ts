import { create } from 'zustand';
import { AppState, CodeFile, DrawingElement, ConsoleOutput, Session } from '@/types';

interface StoreActions {
  // View mode actions
  setViewMode: (mode: AppState['viewMode']) => void;
  setSplitRatio: (ratio: number) => void;
  
  // Code editor actions
  addCodeFile: (file: CodeFile) => void;
  updateCodeFile: (id: string, content: string) => void;
  deleteCodeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  setEditorTheme: (theme: AppState['editorTheme']) => void;
  setFontSize: (size: number) => void;
  
  // Console actions
  addConsoleOutput: (output: Omit<ConsoleOutput, 'id' | 'timestamp'>) => void;
  clearConsole: () => void;
  setIsRunning: (running: boolean) => void;
  
  // Drawing actions
  addDrawingElement: (element: DrawingElement) => void;
  updateDrawingElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteDrawingElements: (ids: string[]) => void;
  setSelectedElements: (ids: string[]) => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  duplicateSelectedElements: () => void;
  setActiveTool: (tool: AppState['activeTool']) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  setOpacity: (opacity: number) => void;
  setLineStyle: (style: AppState['lineStyle']) => void;
  setCanvasBackground: (color: string) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: AppState['panOffset']) => void;
  clearCanvas: () => void;
  
  // Grid actions
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // Slide actions
  addSlide: () => void;
  deleteSlide: (index: number) => void;
  setCurrentSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  addToHistory: (elements: DrawingElement[]) => void;
  
  // Session actions
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  exportSession: () => string;
  importSession: (data: string) => void;
}

const defaultCodeFile: CodeFile = {
  id: 'default-1',
  name: 'main.js',
  language: 'javascript',
  content: `// Welcome to DSA Teaching Studio!
// Write your code here and click Run to execute

function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Original array:", numbers);
console.log("Sorted array:", bubbleSort([...numbers]));
`
};

const initialState: AppState = {
  viewMode: 'split',
  splitRatio: 0.5,
  codeFiles: [defaultCodeFile],
  activeFileId: defaultCodeFile.id,
  editorTheme: 'vs-dark',
  fontSize: 14,
  consoleOutput: [],
  isRunning: false,
  drawingElements: [],
  selectedElementIds: [],
  clipboard: [], // For copy/paste
  activeTool: 'pen',
  strokeColor: '#3B82F6',
  strokeWidth: 2,
  fillColor: 'transparent',
  opacity: 1,
  lineStyle: 'solid',
  canvasBackground: '#1F2937',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
  currentSlide: 0,
  slides: [[]],
  historyIndex: 0,
  history: [[]], // Start with empty state as first history entry
  currentSessionId: null,
  savedSessions: [],
};

export const useStore = create<AppState & StoreActions>((set, get) => ({
  ...initialState,
  
  // View mode actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.05, Math.min(0.95, ratio)) }),
  
  // Code editor actions
  addCodeFile: (file) => set((state) => ({
    codeFiles: [...state.codeFiles, file],
    activeFileId: file.id,
  })),
  
  updateCodeFile: (id, content) => set((state) => ({
    codeFiles: state.codeFiles.map(f => f.id === id ? { ...f, content } : f),
  })),
  
  deleteCodeFile: (id) => set((state) => {
    const filtered = state.codeFiles.filter(f => f.id !== id);
    return {
      codeFiles: filtered,
      activeFileId: state.activeFileId === id ? (filtered[0]?.id || '') : state.activeFileId,
    };
  }),
  
  setActiveFile: (id) => set({ activeFileId: id }),
  setEditorTheme: (theme) => set({ editorTheme: theme }),
  setFontSize: (size) => set({ fontSize: size }),
  
  // Console actions
  addConsoleOutput: (output) => set((state) => ({
    consoleOutput: [
      ...state.consoleOutput,
      {
        ...output,
        id: Date.now().toString() + Math.random(),
        timestamp: Date.now(),
      },
    ],
  })),
  
  clearConsole: () => set({ consoleOutput: [] }),
  setIsRunning: (running) => set({ isRunning: running }),
  
  // Drawing actions
  addDrawingElement: (element) => set((state) => {
    const newElements = [...state.drawingElements, element];
    get().addToHistory(newElements);
    return { drawingElements: newElements };
  }),
  
  updateDrawingElement: (id, updates) => set((state) => {
    const newElements = state.drawingElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    return { drawingElements: newElements };
  }),
  
  deleteDrawingElements: (ids) => set((state) => {
    const newElements = state.drawingElements.filter(el => !ids.includes(el.id));
    get().addToHistory(newElements);
    return { drawingElements: newElements, selectedElementIds: [] };
  }),
  
  setSelectedElements: (ids) => set({ selectedElementIds: ids }),
  
  copySelectedElements: () => set((state) => {
    const selectedElements = state.drawingElements.filter(el => 
      state.selectedElementIds.includes(el.id)
    );
    return { clipboard: selectedElements };
  }),
  
  pasteElements: () => set((state) => {
    if (state.clipboard.length === 0) return state;
    
    // Create copies of clipboard elements with new IDs and offset positions
    const offset = 20; // Offset by 20px to see the pasted elements
    const newElements = state.clipboard.map(el => ({
      ...el,
      id: Date.now().toString() + Math.random(),
      points: el.points.map(p => ({ x: p.x + offset, y: p.y + offset })),
    }));
    
    const updatedElements = [...state.drawingElements, ...newElements];
    get().addToHistory(updatedElements);
    
    // Select the newly pasted elements
    const newIds = newElements.map(el => el.id);
    return { 
      drawingElements: updatedElements,
      selectedElementIds: newIds,
    };
  }),
  
  duplicateSelectedElements: () => set((state) => {
    const selectedElements = state.drawingElements.filter(el => 
      state.selectedElementIds.includes(el.id)
    );
    
    if (selectedElements.length === 0) return state;
    
    // Create copies with new IDs and offset positions
    const offset = 20; // Offset by 20px
    const newElements = selectedElements.map(el => ({
      ...el,
      id: Date.now().toString() + Math.random(),
      points: el.points.map(p => ({ x: p.x + offset, y: p.y + offset })),
    }));
    
    const updatedElements = [...state.drawingElements, ...newElements];
    get().addToHistory(updatedElements);
    
    // Select the newly duplicated elements
    const newIds = newElements.map(el => el.id);
    return { 
      drawingElements: updatedElements,
      selectedElementIds: newIds,
    };
  }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFillColor: (color) => set({ fillColor: color }),
  setOpacity: (opacity) => set({ opacity }),
  setLineStyle: (style) => set({ lineStyle: style }),
  setCanvasBackground: (color) => set({ canvasBackground: color }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  clearCanvas: () => set((state) => {
    const newSlides = [...state.slides];
    newSlides[state.currentSlide] = [];
    get().addToHistory([]);
    return { drawingElements: [], selectedElementIds: [], slides: newSlides };
  }),
  
  // Grid actions
  setShowGrid: (show) => set({ showGrid: show }),
  setGridSize: (size) => set({ gridSize: Math.max(10, Math.min(100, size)) }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  
  // Slide actions
  addSlide: () => set((state) => {
    // Save current slide before adding new one
    const newSlides = [...state.slides];
    newSlides[state.currentSlide] = state.drawingElements;
    newSlides.push([]); // Add empty new slide
    
    return {
      slides: newSlides,
      currentSlide: newSlides.length - 1,
      drawingElements: [],
      selectedElementIds: [],
    };
  }),
  
  deleteSlide: (index) => set((state) => {
    if (state.slides.length <= 1) return state;
    
    // Save current slide before deleting
    const updatedSlides = [...state.slides];
    updatedSlides[state.currentSlide] = state.drawingElements;
    
    // Now remove the slide at the specified index
    const newSlides = updatedSlides.filter((_, i) => i !== index);
    
    // Calculate new current slide
    const newCurrentSlide = index === state.currentSlide 
      ? Math.max(0, index - 1)
      : state.currentSlide > index 
        ? state.currentSlide - 1 
        : state.currentSlide;
        
    return {
      slides: newSlides,
      currentSlide: newCurrentSlide,
      drawingElements: newSlides[newCurrentSlide] || [],
      selectedElementIds: [],
    };
  }),
  
  setCurrentSlide: (index) => set((state) => {
    // Save current slide before switching
    const newSlides = [...state.slides];
    newSlides[state.currentSlide] = state.drawingElements;
    return {
      slides: newSlides,
      currentSlide: index,
      drawingElements: newSlides[index] || [],
      selectedElementIds: [],
    };
  }),
  
  duplicateSlide: (index) => set((state) => {
    // Save current slide before duplicating
    const newSlides = [...state.slides];
    newSlides[state.currentSlide] = state.drawingElements;
    
    // Now duplicate the slide at the specified index
    newSlides.splice(index + 1, 0, JSON.parse(JSON.stringify(newSlides[index])));
    
    return {
      slides: newSlides,
      currentSlide: index + 1,
      drawingElements: newSlides[index + 1],
      selectedElementIds: [],
    };
  }),
  
  // History actions
  addToHistory: (elements) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(elements)));
    return {
      history: newHistory.slice(-50), // Keep last 50 states
      historyIndex: Math.min(newHistory.length - 1, 49),
    };
  }),
  
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        historyIndex: newIndex,
        drawingElements: JSON.parse(JSON.stringify(state.history[newIndex])),
        selectedElementIds: [],
      };
    }
    return state;
  }),
  
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return {
        historyIndex: newIndex,
        drawingElements: JSON.parse(JSON.stringify(state.history[newIndex])),
        selectedElementIds: [],
      };
    }
    return state;
  }),
  
  // Session actions
  saveSession: (name) => set((state) => {
    // Save current slide before saving session
    const updatedSlides = [...state.slides];
    updatedSlides[state.currentSlide] = state.drawingElements;
    
    const session: Session = {
      id: Date.now().toString(),
      name,
      viewMode: state.viewMode,
      codeFiles: state.codeFiles,
      activeFileId: state.activeFileId,
      drawingElements: state.drawingElements,
      canvasBackground: state.canvasBackground,
      zoom: state.zoom,
      panOffset: state.panOffset,
      splitRatio: state.splitRatio,
      timestamp: Date.now(),
      // Save slides
      slides: updatedSlides,
      currentSlide: state.currentSlide,
      // Save grid settings
      showGrid: state.showGrid,
      gridSize: state.gridSize,
      snapToGrid: state.snapToGrid,
    };
    
    const newSessions = [...state.savedSessions, session];
    localStorage.setItem('dsa-sessions', JSON.stringify(newSessions));
    
    return {
      savedSessions: newSessions,
      currentSessionId: session.id,
    };
  }),
  
  loadSession: (id) => {
    const state = get();
    const session = state.savedSessions.find(s => s.id === id);
    if (session) {
      set({
        viewMode: session.viewMode,
        codeFiles: session.codeFiles,
        activeFileId: session.activeFileId,
        drawingElements: session.drawingElements,
        canvasBackground: session.canvasBackground,
        zoom: session.zoom,
        panOffset: session.panOffset,
        splitRatio: session.splitRatio,
        currentSessionId: session.id,
        // Restore slides if available
        slides: session.slides || [session.drawingElements],
        currentSlide: session.currentSlide || 0,
        // Restore grid settings if available
        showGrid: session.showGrid ?? false,
        gridSize: session.gridSize ?? 20,
        snapToGrid: session.snapToGrid ?? false,
      });
    }
  },
  
  deleteSession: (id) => set((state) => {
    const newSessions = state.savedSessions.filter(s => s.id !== id);
    localStorage.setItem('dsa-sessions', JSON.stringify(newSessions));
    return { savedSessions: newSessions };
  }),
  
  exportSession: () => {
    const state = get();
    // Save current slide before exporting
    const updatedSlides = [...state.slides];
    updatedSlides[state.currentSlide] = state.drawingElements;
    
    const session: Session = {
      id: Date.now().toString(),
      name: 'Exported Session',
      viewMode: state.viewMode,
      codeFiles: state.codeFiles,
      activeFileId: state.activeFileId,
      drawingElements: state.drawingElements,
      canvasBackground: state.canvasBackground,
      zoom: state.zoom,
      panOffset: state.panOffset,
      splitRatio: state.splitRatio,
      timestamp: Date.now(),
      // Export slides
      slides: updatedSlides,
      currentSlide: state.currentSlide,
      // Export grid settings
      showGrid: state.showGrid,
      gridSize: state.gridSize,
      snapToGrid: state.snapToGrid,
    };
    return JSON.stringify(session, null, 2);
  },
  
  importSession: (data) => {
    try {
      const session: Session = JSON.parse(data);
      set({
        viewMode: session.viewMode,
        codeFiles: session.codeFiles,
        activeFileId: session.activeFileId,
        drawingElements: session.drawingElements,
        canvasBackground: session.canvasBackground,
        zoom: session.zoom,
        panOffset: session.panOffset,
        splitRatio: session.splitRatio,
        // Import slides if available
        slides: session.slides || [session.drawingElements],
        currentSlide: session.currentSlide || 0,
        // Import grid settings if available
        showGrid: session.showGrid ?? false,
        gridSize: session.gridSize ?? 20,
        snapToGrid: session.snapToGrid ?? false,
      });
    } catch (error) {
      console.error('Failed to import session:', error);
    }
  },
}));

// Load saved sessions on init
if (typeof window !== 'undefined') {
  const savedData = localStorage.getItem('dsa-sessions');
  if (savedData) {
    try {
      const sessions = JSON.parse(savedData);
      useStore.setState({ savedSessions: sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }
}

