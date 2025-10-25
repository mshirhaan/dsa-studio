'use client';

import { useRef, useEffect, useState, MouseEvent } from 'react';
import { useStore } from '@/store/useStore';
import { DrawingElement, Point } from '@/types';

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  const [laserElements, setLaserElements] = useState<DrawingElement[]>([]);

  const {
    drawingElements,
    activeTool,
    strokeColor,
    strokeWidth,
    fillColor,
    opacity,
    lineStyle,
    canvasBackground,
    zoom,
    setZoom,
    panOffset,
    showGrid,
    gridSize,
    snapToGrid,
    splitRatio,
    addDrawingElement,
    updateDrawingElement,
    deleteDrawingElements,
    selectedElementIds,
    setSelectedElements,
    setPanOffset,
  } = useStore();

  // Set up canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Add a small delay to ensure the resize completes
    const timeoutId = setTimeout(updateCanvasSize, 50);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, [splitRatio]); // Add splitRatio as dependency

  // Add wheel event listener for Cmd/Ctrl + wheel zoom and mouse wheel panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed for zoom
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom change
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
        
        // Calculate the point in canvas coordinates before zoom
        const pointBeforeZoom = {
          x: (mouseX - panOffset.x) / zoom,
          y: (mouseY - panOffset.y) / zoom,
        };
        
        // Calculate the point in canvas coordinates after zoom
        const pointAfterZoom = {
          x: (mouseX - panOffset.x) / newZoom,
          y: (mouseY - panOffset.y) / newZoom,
        };
        
        // Adjust pan offset to keep the mouse point stationary
        const newPanOffset = {
          x: panOffset.x + (pointAfterZoom.x - pointBeforeZoom.x) * newZoom,
          y: panOffset.y + (pointAfterZoom.y - pointBeforeZoom.y) * newZoom,
        };
        
        setZoom(newZoom);
        setPanOffset(newPanOffset);
      } else {
        // Pan the canvas with mouse wheel (infinite scrolling)
        e.preventDefault();
        
        const panSpeed = 1;
        
        // Shift key for horizontal panning, otherwise vertical
        if (e.shiftKey) {
          // Horizontal pan
          setPanOffset({
            x: panOffset.x - e.deltaY * panSpeed,
            y: panOffset.y,
          });
        } else {
          // Vertical pan
          setPanOffset({
            x: panOffset.x - e.deltaX * panSpeed,
            y: panOffset.y - e.deltaY * panSpeed,
          });
        }
      }
    };

    // Add event listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, panOffset, setZoom, setPanOffset]);


  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [drawingElements, selectedElementIds, canvasBackground, zoom, panOffset, showGrid, gridSize, selectionBox, laserElements]);

  const getMousePos = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left - panOffset.x) / zoom;
    let y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    // Snap to grid if enabled
    if (snapToGrid && showGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    return { x, y };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear and fill background
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 0.5;
      
      const startX = Math.floor(-panOffset.x / zoom / gridSize) * gridSize;
      const startY = Math.floor(-panOffset.y / zoom / gridSize) * gridSize;
      const endX = startX + (canvas.width / zoom) + gridSize;
      const endY = startY + (canvas.height / zoom) + gridSize;
      
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      
      // Draw vertical lines
      for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Apply transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw all elements
    drawingElements.forEach((element) => {
      drawElement(ctx, element, selectedElementIds.includes(element.id));
    });

    // Draw laser elements (temporary)
    laserElements.forEach((element) => {
      drawElement(ctx, element, false);
    });

    // Draw current element being created
    if (currentElement) {
      drawElement(ctx, currentElement, false);
    }
    
    // Draw selection box for drag-to-select
    if (isBoxSelecting && selectionBox) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      
      const x = Math.min(selectionBox.start.x, selectionBox.end.x);
      const y = Math.min(selectionBox.start.y, selectionBox.end.y);
      const width = Math.abs(selectionBox.end.x - selectionBox.start.x);
      const height = Math.abs(selectionBox.end.y - selectionBox.start.y);
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement, isSelected: boolean) => {
    ctx.save();
    ctx.globalAlpha = element.opacity;
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set line style
    if (element.lineStyle === 'dashed') {
      ctx.setLineDash([10, 5]);
    } else if (element.lineStyle === 'dotted') {
      ctx.setLineDash([2, 5]);
    } else {
      ctx.setLineDash([]);
    }

    switch (element.type) {
      case 'pen':
        if (element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'line':
      case 'arrow':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw arrowhead
          if (element.type === 'arrow') {
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 15;
            const arrowAngle = Math.PI / 6;

            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - arrowLength * Math.cos(angle - arrowAngle),
              end.y - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - arrowLength * Math.cos(angle + arrowAngle),
              end.y - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.stroke();
          }
        }
        break;

      case 'rectangle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;

          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fillRect(start.x, start.y, width, height);
          }
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;

      case 'circle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const radiusX = Math.abs(end.x - start.x);
          const radiusY = Math.abs(end.y - start.y);
          const centerX = start.x + (end.x - start.x) / 2;
          const centerY = start.y + (end.y - start.y) / 2;

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fill();
          }
          ctx.stroke();
        }
        break;

      case 'triangle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const midX = (start.x + end.x) / 2;

          ctx.beginPath();
          ctx.moveTo(midX, start.y);
          ctx.lineTo(start.x, end.y);
          ctx.lineTo(end.x, end.y);
          ctx.closePath();
          
          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fill();
          }
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && element.points.length > 0) {
          const fontSize = element.fontSize || 16;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.points[0].x, element.points[0].y);
        }
        break;
    }

    // Draw selection box
    if (isSelected && element.points.length > 0) {
      const bounds = getElementBounds(element);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    ctx.restore();
  };

  const getElementBounds = (element: DrawingElement) => {
    // Special handling for circles to get proper bounds
    if (element.type === 'circle' && element.points.length >= 2) {
      const start = element.points[0];
      const end = element.points[element.points.length - 1];
      const radiusX = Math.abs(end.x - start.x);
      const radiusY = Math.abs(end.y - start.y);
      const centerX = start.x + (end.x - start.x) / 2;
      const centerY = start.y + (end.y - start.y) / 2;
      
      return {
        x: centerX - radiusX - 5,
        y: centerY - radiusY - 5,
        width: radiusX * 2 + 10,
        height: radiusY * 2 + 10,
      };
    }
    
    // For all other elements, use min/max of points
    const xs = element.points.map(p => p.x);
    const ys = element.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      x: minX - 5,
      y: minY - 5,
      width: maxX - minX + 10,
      height: maxY - minY + 10,
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);
    
    // Handle Pan tool
    if (activeTool === 'pan') {
      setIsDrawing(true);
      setStartPoint(point);
      return;
    }
    
    // Handle Select tool
    if (activeTool === 'select') {
      // Check if clicking on an existing element
      let found = false;
      let clickedElementId: string | null = null;
      
      for (let i = drawingElements.length - 1; i >= 0; i--) {
        const element = drawingElements[i];
        const bounds = getElementBounds(element);
        
        // point is already in canvas coordinates (after zoom/pan transform)
        if (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        ) {
          clickedElementId = element.id;
          found = true;
          break;
        }
      }
      
      if (found && clickedElementId) {
        // If clicking on already selected element, start dragging
        if (selectedElementIds.includes(clickedElementId)) {
          setIsDragging(true);
          setDragStartPoint(point);
        } else {
          // Toggle selection
          if (e.shiftKey) {
            setSelectedElements([...selectedElementIds, clickedElementId]);
          } else {
            setSelectedElements([clickedElementId]);
          }
        }
      } else {
        // Clicked on empty space - start box selection
        if (!e.shiftKey) {
          setSelectedElements([]);
        }
        setIsBoxSelecting(true);
        setSelectionBox({ start: point, end: point });
      }
      return;
    }
    
    // Handle Eraser tool
    if (activeTool === 'eraser') {
      // Find and delete elements under the cursor
      const elementsToDelete: string[] = [];
      for (let i = drawingElements.length - 1; i >= 0; i--) {
        const element = drawingElements[i];
        const bounds = getElementBounds(element);
        
        if (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        ) {
          elementsToDelete.push(element.id);
          break; // Only erase one element at a time
        }
      }
      
      if (elementsToDelete.length > 0) {
        deleteDrawingElements(elementsToDelete);
      }
      return;
    }

    // Handle Text tool
    setIsDrawing(true);
    setStartPoint(point);

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const element: DrawingElement = {
          id: Date.now().toString() + Math.random(),
          type: 'text',
          points: [point],
          color: strokeColor,
          strokeWidth,
          opacity,
          lineStyle,
          text,
          fontSize: 16,
        };
        addDrawingElement(element);
      }
      setIsDrawing(false);
      return;
    }

    // Handle other drawing tools
    const element: DrawingElement = {
      id: Date.now().toString() + Math.random(),
      type: activeTool === 'laser' ? 'pen' : activeTool, // Laser draws like pen but treated specially
      points: [point],
      color: activeTool === 'laser' ? '#FF0000' : strokeColor, // Red for laser
      strokeWidth: activeTool === 'laser' ? 4 : strokeWidth, // Thicker for laser
      fillColor: activeTool === 'pen' || activeTool === 'laser' ? undefined : fillColor,
      opacity,
      lineStyle,
    };
    setCurrentElement(element);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    // Handle Pan tool
    if (activeTool === 'pan' && isDrawing && startPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const prevX = startPoint.x * zoom + panOffset.x;
      const prevY = startPoint.y * zoom + panOffset.y;
      
      setPanOffset({
        x: panOffset.x + (currentX - prevX),
        y: panOffset.y + (currentY - prevY)
      });
      
      // Update start point for continuous panning
      const newStartPoint = getMousePos(e);
      setStartPoint(newStartPoint);
      return;
    }
    
    // Handle box selection
    if (activeTool === 'select' && isBoxSelecting && selectionBox) {
      const point = getMousePos(e);
      setSelectionBox({ ...selectionBox, end: point });
      return;
    }
    
    // Handle dragging selected elements
    if (activeTool === 'select' && isDragging && dragStartPoint) {
      const point = getMousePos(e);
      const dx = point.x - dragStartPoint.x;
      const dy = point.y - dragStartPoint.y;
      
      // Move all selected elements
      selectedElementIds.forEach(id => {
        const element = drawingElements.find(el => el.id === id);
        if (element) {
          const movedElement = {
            ...element,
            points: element.points.map(p => ({
              x: p.x + dx,
              y: p.y + dy
            }))
          };
          updateDrawingElement(id, movedElement);
        }
      });
      
      // Update drag start point for next move
      setDragStartPoint(point);
      redrawCanvas();
      return;
    }
    
    if (!isDrawing || !currentElement) return;

    const point = getMousePos(e);

    if (currentElement.type === 'pen') {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, point],
      });
    } else {
      // For shapes, update the end point
      setCurrentElement({
        ...currentElement,
        points: [currentElement.points[0], point],
      });
    }

    redrawCanvas();
  };

  const handleMouseUp = () => {
    // Handle box selection completion
    if (isBoxSelecting && selectionBox) {
      const x1 = Math.min(selectionBox.start.x, selectionBox.end.x);
      const x2 = Math.max(selectionBox.start.x, selectionBox.end.x);
      const y1 = Math.min(selectionBox.start.y, selectionBox.end.y);
      const y2 = Math.max(selectionBox.start.y, selectionBox.end.y);
      
      // Find all elements within the selection box
      const selectedIds: string[] = [];
      drawingElements.forEach(element => {
        const bounds = getElementBounds(element);
        // Check if element bounds intersect with selection box
        if (
          bounds.x + bounds.width >= x1 &&
          bounds.x <= x2 &&
          bounds.y + bounds.height >= y1 &&
          bounds.y <= y2
        ) {
          selectedIds.push(element.id);
        }
      });
      
      // Update selection
      setSelectedElements(selectedIds);
      setIsBoxSelecting(false);
      setSelectionBox(null);
      return;
    }
    
    if (isDrawing && currentElement) {
      if (activeTool === 'laser') {
        // Add to laser elements (temporary)
        setLaserElements(prev => [...prev, currentElement]);
        
        // Remove after 1.5 seconds with fade effect
        setTimeout(() => {
          setLaserElements(prev => prev.filter(el => el.id !== currentElement.id));
        }, 1500);
      } else {
        // Add to permanent elements
        addDrawingElement(currentElement);
      }
      setCurrentElement(null);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setIsDragging(false);
    setDragStartPoint(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElementIds.length > 0) {
        deleteDrawingElements(selectedElementIds);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds]);

  const getCursorStyle = () => {
    switch (activeTool) {
      case 'select':
        return 'cursor-pointer';
      case 'pan':
        return 'cursor-move';
      case 'eraser':
        return 'cursor-not-allowed';
      case 'text':
        return 'cursor-text';
      case 'laser':
        return 'cursor-crosshair';
      default:
        return 'cursor-crosshair';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={getCursorStyle()}
        style={{ backgroundColor: canvasBackground }}
      />
    </div>
  );
}

