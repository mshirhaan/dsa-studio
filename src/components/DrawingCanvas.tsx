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
  const [laserElements, setLaserElements] = useState<Array<DrawingElement & { createdAt: number }>>([]);
  
  // Image state
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
  const [resizeStartBounds, setResizeStartBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<Point | null>(null);
  const [resizeStartElements, setResizeStartElements] = useState<DrawingElement[]>([]); // Store original elements
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null); // Track hovered resize handle
  
  // Text editing state
  const [textEdit, setTextEdit] = useState<{
    canvasPoint: Point;
    text: string;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const justCreatedTextarea = useRef(false);
 
  const {
    drawingElements,
    activeTool,
    setActiveTool,
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
    saveCurrentStateToHistory,
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

  // Handle image upload from toolbar
  useEffect(() => {
    const handleImageUpload = (e: Event) => {
      const customEvent = e as CustomEvent<{ imageSrc: string }>;
      const { imageSrc } = customEvent.detail;
      
      // Load the image
      const img = new Image();
      img.onload = () => {
        // Calculate center position
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const centerX = (canvas.width / 2 - panOffset.x) / zoom;
        const centerY = (canvas.height / 2 - panOffset.y) / zoom;
        
        // Create image element
        const imageElement: DrawingElement = {
          id: `img-${Date.now()}`,
          type: 'image',
          points: [{ x: centerX - img.width / 2, y: centerY - img.height / 2 }],
          color: strokeColor,
          strokeWidth,
          fillColor,
          opacity,
          lineStyle,
          imageSrc,
          imageWidth: img.width,
          imageHeight: img.height,
        };
        
        addDrawingElement(imageElement);
        
        // Store loaded image
        setLoadedImages(prev => {
          const newMap = new Map(prev);
          newMap.set(imageSrc, img);
          return newMap;
        });
      };
      img.src = imageSrc;
    };
    
    window.addEventListener('imageUpload', handleImageUpload);
    return () => window.removeEventListener('imageUpload', handleImageUpload);
  }, [panOffset, zoom, strokeColor, strokeWidth, fillColor, opacity, lineStyle, addDrawingElement]);

  // Handle drag and drop for images
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please drop an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const imageSrc = readerEvent.target?.result as string;
        const img = new Image();
        
        img.onload = () => {
          // Get drop position
          const rect = canvas.getBoundingClientRect();
          const dropX = (e.clientX - rect.left - panOffset.x) / zoom;
          const dropY = (e.clientY - rect.top - panOffset.y) / zoom;
          
          // Create image element at drop position
          const imageElement: DrawingElement = {
            id: `img-${Date.now()}`,
            type: 'image',
            points: [{ x: dropX - img.width / 2, y: dropY - img.height / 2 }],
            color: strokeColor,
            strokeWidth,
            fillColor,
            opacity,
            lineStyle,
            imageSrc,
            imageWidth: img.width,
            imageHeight: img.height,
          };
          
          addDrawingElement(imageElement);
          
          // Store loaded image
          setLoadedImages(prev => {
            const newMap = new Map(prev);
            newMap.set(imageSrc, img);
            return newMap;
          });
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [panOffset, zoom, strokeColor, strokeWidth, fillColor, opacity, lineStyle, addDrawingElement]);


  // Auto-focus text input when created (only once)
  useEffect(() => {
    if (textEdit && textInputRef.current && justCreatedTextarea.current) {
      justCreatedTextarea.current = false;
      // Use setTimeout to ensure the textarea is rendered
      const timeoutId = setTimeout(() => {
        textInputRef.current?.focus();
        const length = textInputRef.current?.value.length || 0;
        textInputRef.current?.setSelectionRange(length, length);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [textEdit]);

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [drawingElements, selectedElementIds, canvasBackground, zoom, panOffset, showGrid, gridSize, selectionBox, laserElements]);

  // Animate laser fade effect
  useEffect(() => {
    if (laserElements.length === 0) return;

    let animationFrameId: number;
    const fadeDuration = 1500; // 1.5 seconds fade

    const animate = () => {
      const now = Date.now();
      
      // Remove expired laser elements
      setLaserElements(prev => {
        const filtered = prev.filter(el => now - el.createdAt < fadeDuration);
        return filtered;
      });
      
      // Continue animation if there are still laser elements
      if (laserElements.some(el => now - el.createdAt < fadeDuration)) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [laserElements.length]);

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

    // Draw laser elements (temporary) with fade effect
    const now = Date.now();
    const fadeDuration = 1500;
    laserElements.forEach((element) => {
      const age = now - element.createdAt;
      const fadeProgress = age / fadeDuration;
      const fadeOpacity = Math.max(0, 1 - fadeProgress);
      
      // Create a copy with fading opacity
      const fadingElement = {
        ...element,
        opacity: fadeOpacity,
      };
      drawElement(ctx, fadingElement, false);
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
          ctx.font = `${fontSize}px Kalam, cursive`;
          ctx.fillStyle = element.color;
          ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline (default)
          
          // Split text by newlines and render each line
          const lines = element.text.split('\n');
          const lineHeight = fontSize * 1.5; // Line spacing
          
          lines.forEach((line, index) => {
            ctx.fillText(
              line, 
              element.points[0].x, 
              element.points[0].y + fontSize + (index * lineHeight) // Add fontSize to account for baseline
            );
          });
        }
        break;

      case 'image':
        if (element.imageSrc && element.points.length > 0) {
          const img = loadedImages.get(element.imageSrc);
          if (img && img.complete) {
            const x = element.points[0].x;
            const y = element.points[0].y;
            const width = element.imageWidth || img.width;
            const height = element.imageHeight || img.height;
            
            ctx.drawImage(img, x, y, width, height);
          } else if (element.imageSrc) {
            // Load image if not already loaded
            const newImg = new Image();
            newImg.onload = () => {
              setLoadedImages(prev => {
                const newMap = new Map(prev);
                newMap.set(element.imageSrc!, newImg);
                return newMap;
              });
              redrawCanvas();
            };
            newImg.src = element.imageSrc;
          }
        }
        break;
      
      case 'array':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const height = Math.abs(end.y - start.y);
          const width = Math.abs(end.x - start.x);
          
          // Use height as box size (makes square boxes), with minimum size
          const boxSize = Math.max(30, height); // Minimum 30px boxes
          const numBoxes = Math.max(1, Math.floor(width / boxSize));
          
          // Draw array boxes
          for (let i = 0; i < numBoxes; i++) {
            const x = start.x + (i * boxSize);
            const y = start.y;
            
            // Fill box
            if (element.fillColor && element.fillColor !== 'transparent') {
              ctx.fillStyle = element.fillColor;
              ctx.fillRect(x, y, boxSize, boxSize);
            }
            
            // Stroke box
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            // Index label (above)
            ctx.fillStyle = '#9CA3AF';
            ctx.font = `${Math.max(10, boxSize * 0.25)}px Kalam, cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(i.toString(), x + boxSize / 2, y - 4);
            
            // Value label (center)
            if (element.text) {
              const values = element.text.split(',');
              if (i < values.length && values[i].trim()) {
                ctx.fillStyle = element.color;
                ctx.font = `${Math.max(12, boxSize * 0.35)}px Kalam, cursive`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(values[i].trim(), x + boxSize / 2, y + boxSize / 2);
              }
            }
          }
        }
        break;
      
      case 'linked-list':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const totalWidth = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y);
          
          // Single node size
          const nodeHeight = Math.max(40, height);
          const nodeWidth = nodeHeight * 2; // 2:1 ratio (width:height)
          
          // Calculate number of nodes based on drag width
          const numNodes = Math.max(1, Math.floor(totalWidth / nodeWidth));
          
          // Draw multiple linked list nodes
          for (let i = 0; i < numNodes; i++) {
            const nodeX = start.x + (i * nodeWidth);
            const nodeY = start.y;
            
            // Value box takes 70% of node width, pointer box takes 30%
            const valueBoxWidth = nodeWidth * 0.7;
            const pointerBoxWidth = nodeWidth * 0.3;

            // Draw value box
            if (element.fillColor && element.fillColor !== 'transparent') {
              ctx.fillStyle = element.fillColor;
              ctx.fillRect(nodeX, nodeY, valueBoxWidth, nodeHeight);
            }
            ctx.strokeRect(nodeX, nodeY, valueBoxWidth, nodeHeight);
            
            // Draw pointer box
            ctx.strokeRect(nodeX + valueBoxWidth, nodeY, pointerBoxWidth, nodeHeight);
            
            // Draw value text
            if (element.text) {
              const values = element.text.split(',');
              if (i < values.length && values[i].trim()) {
                ctx.fillStyle = element.color;
                ctx.font = `${Math.max(12, nodeHeight * 0.4)}px Kalam, cursive`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(values[i].trim(), nodeX + valueBoxWidth / 2, nodeY + nodeHeight / 2);
              }
            }
            
            // Draw arrow in pointer box (or NULL for last node)
            const arrowCenterX = nodeX + valueBoxWidth + pointerBoxWidth / 2;
            const arrowCenterY = nodeY + nodeHeight / 2;
            const arrowSize = Math.min(pointerBoxWidth, nodeHeight) * 0.4;
            
            if (i < numNodes - 1) {
              // Draw arrow to next node
              ctx.beginPath();
              ctx.moveTo(arrowCenterX - arrowSize, arrowCenterY);
              ctx.lineTo(arrowCenterX + arrowSize * 0.5, arrowCenterY);
              ctx.stroke();
              
              // Arrow head
              ctx.beginPath();
              ctx.moveTo(arrowCenterX + arrowSize * 0.5, arrowCenterY);
              ctx.lineTo(arrowCenterX + arrowSize * 0.2, arrowCenterY - arrowSize * 0.4);
              ctx.moveTo(arrowCenterX + arrowSize * 0.5, arrowCenterY);
              ctx.lineTo(arrowCenterX + arrowSize * 0.2, arrowCenterY + arrowSize * 0.4);
              ctx.stroke();
            } else {
              // Draw NULL for last node
              ctx.fillStyle = '#9CA3AF';
              ctx.font = `${Math.max(8, nodeHeight * 0.25)}px Kalam, cursive`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('NULL', arrowCenterX, arrowCenterY);
            }
          }
        }
        break;
      
      case 'tree':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const totalWidth = Math.abs(end.x - start.x);
          const totalHeight = Math.abs(end.y - start.y);
          
          // Node size
          const nodeRadius = Math.max(15, Math.min(totalHeight / 6, totalWidth / 10));
          
          // Calculate number of levels based on drag size
          const maxLevels = Math.max(1, Math.min(4, Math.floor((totalHeight / (nodeRadius * 3))))); // Max 4 levels
          
          // Get values from text (comma-separated)
          const values = element.text ? element.text.split(',').map(v => v.trim()).filter(v => v) : [];
          
          // Calculate tree width needed
          const treeWidth = Math.max(totalWidth, nodeRadius * 4 * Math.pow(2, maxLevels - 1));
          const levelHeight = Math.max(nodeRadius * 3, totalHeight / maxLevels);
          
          let valueIndex = 0;
          
          // Draw tree level by level
          for (let level = 0; level < maxLevels; level++) {
            const nodesInLevel = Math.pow(2, level);
            const yPos = start.y + (level * levelHeight) + nodeRadius;
            
            for (let nodeInLevel = 0; nodeInLevel < nodesInLevel; nodeInLevel++) {
              // Calculate x position to center nodes in their space
              const spacing = treeWidth / (nodesInLevel + 1);
              const xPos = start.x + spacing * (nodeInLevel + 1);
              
              // Draw edges to children (if not last level)
              if (level < maxLevels - 1) {
                const childY = yPos + levelHeight;
                const childSpacing = treeWidth / (Math.pow(2, level + 1) + 1);
                const leftChildX = start.x + childSpacing * (nodeInLevel * 2 + 1);
                const rightChildX = start.x + childSpacing * (nodeInLevel * 2 + 2);
                
                ctx.strokeStyle = element.color;
                ctx.lineWidth = element.strokeWidth;
                
                // Left edge
                ctx.beginPath();
                ctx.moveTo(xPos, yPos + nodeRadius);
                ctx.lineTo(leftChildX, childY - nodeRadius);
                ctx.stroke();
                
                // Right edge
                ctx.beginPath();
                ctx.moveTo(xPos, yPos + nodeRadius);
                ctx.lineTo(rightChildX, childY - nodeRadius);
                ctx.stroke();
              }
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(xPos, yPos, nodeRadius, 0, Math.PI * 2);
              if (element.fillColor && element.fillColor !== 'transparent') {
                ctx.fillStyle = element.fillColor;
                ctx.fill();
              }
              ctx.strokeStyle = element.color;
              ctx.lineWidth = element.strokeWidth;
              ctx.stroke();
              
              // Draw value
              if (valueIndex < values.length) {
                ctx.fillStyle = element.color;
                ctx.font = `${Math.max(10, nodeRadius * 0.8)}px Kalam, cursive`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(values[valueIndex], xPos, yPos);
                valueIndex++;
              }
            }
          }
        }
        break;
      
      case 'hashmap':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const dragWidth = Math.abs(end.x - start.x);
          const totalHeight = Math.abs(end.y - start.y);
          
          // Bucket size
          const bucketHeight = Math.max(40, totalHeight / 8); // Each bucket height
          const bucketWidth = 60; // Fixed index column width
          const valueWidth = Math.max(120, dragWidth); // Minimum 120px for values
          const totalWidth = bucketWidth + valueWidth; // Total width
          
          // Calculate number of buckets based on height
          const numBuckets = Math.max(3, Math.floor(totalHeight / bucketHeight));
          
          // Parse entries: format "key:value,key:value" or just "value,value"
          const entries = element.text ? element.text.split(',').map(e => e.trim()).filter(e => e) : [];
          
          // Draw hash map structure
          for (let i = 0; i < numBuckets; i++) {
            const y = start.y + (i * bucketHeight);
            
            // Draw index box (left side)
            if (element.fillColor && element.fillColor !== 'transparent') {
              ctx.fillStyle = '#374151'; // Darker gray for index
              ctx.fillRect(start.x, y, bucketWidth, bucketHeight);
            }
            ctx.strokeRect(start.x, y, bucketWidth, bucketHeight);
            
            // Draw index number
            ctx.fillStyle = '#9CA3AF';
            ctx.font = `${Math.max(10, bucketHeight * 0.3)}px Kalam, cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), start.x + bucketWidth / 2, y + bucketHeight / 2);
            
            // Draw value box (right side)
            if (element.fillColor && element.fillColor !== 'transparent') {
              ctx.fillStyle = element.fillColor;
              ctx.fillRect(start.x + bucketWidth, y, valueWidth, bucketHeight);
            }
            ctx.strokeRect(start.x + bucketWidth, y, valueWidth, bucketHeight);
            
            // Draw entries if available
            if (i < entries.length && entries[i]) {
              const entry = entries[i];
              const [key, value] = entry.includes(':') ? entry.split(':') : [entry, ''];
              
              // Draw key (or full entry if no colon)
              ctx.fillStyle = element.color;
              ctx.font = `${Math.max(10, bucketHeight * 0.35)}px Kalam, cursive`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              
              if (value) {
                // Draw key:value format
                ctx.fillText(
                  `${key} → ${value}`,
                  start.x + bucketWidth + 10,
                  y + bucketHeight / 2
                );
              } else {
                // Just draw the value
                ctx.fillText(
                  key,
                  start.x + bucketWidth + 10,
                  y + bucketHeight / 2
                );
              }
            } else {
              // Draw "null" for empty buckets
              ctx.fillStyle = '#6B7280';
              ctx.font = `${Math.max(8, bucketHeight * 0.25)}px Kalam, cursive`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('null', start.x + bucketWidth + valueWidth / 2, y + bucketHeight / 2);
            }
          }
          
          // Draw "Hash Map" label on top
          ctx.fillStyle = '#9CA3AF';
          ctx.font = `${Math.max(12, bucketHeight * 0.4)}px Kalam, cursive`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Hash Map', start.x + totalWidth / 2, start.y - 5);
        }
        break;
      
      case 'matrix':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const totalWidth = Math.abs(end.x - start.x);
          const totalHeight = Math.abs(end.y - start.y);
          
          // Calculate cell size based on drag
          const minCellSize = 30;
          const maxRows = Math.max(2, Math.floor(totalHeight / minCellSize));
          const maxCols = Math.max(2, Math.floor(totalWidth / minCellSize));
          
          const cellHeight = totalHeight / maxRows;
          const cellWidth = totalWidth / maxCols;
          
          // Parse values: comma-separated, fills row by row
          const values = element.text ? element.text.split(',').map(v => v.trim()) : [];
          
          // Draw row indices (left side)
          for (let row = 0; row < maxRows; row++) {
            const y = start.y + (row * cellHeight);
            ctx.fillStyle = '#9CA3AF';
            ctx.font = `${Math.max(8, cellHeight * 0.25)}px Kalam, cursive`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(row.toString(), start.x - 10, y + cellHeight / 2);
          }
          
          // Draw column indices (top)
          for (let col = 0; col < maxCols; col++) {
            const x = start.x + (col * cellWidth);
            ctx.fillStyle = '#9CA3AF';
            ctx.font = `${Math.max(8, cellWidth * 0.25)}px Kalam, cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(col.toString(), x + cellWidth / 2, start.y - 5);
          }
          
          // Draw grid cells
          let valueIndex = 0;
          for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxCols; col++) {
              const x = start.x + (col * cellWidth);
              const y = start.y + (row * cellHeight);
              
              // Fill cell
              if (element.fillColor && element.fillColor !== 'transparent') {
                ctx.fillStyle = element.fillColor;
                ctx.fillRect(x, y, cellWidth, cellHeight);
              }
              
              // Stroke cell
              ctx.strokeRect(x, y, cellWidth, cellHeight);
              
              // Draw value
              if (valueIndex < values.length && values[valueIndex]) {
                ctx.fillStyle = element.color;
                ctx.font = `${Math.max(10, Math.min(cellWidth, cellHeight) * 0.4)}px Kalam, cursive`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(values[valueIndex], x + cellWidth / 2, y + cellHeight / 2);
              }
              valueIndex++;
            }
          }
          
          // Draw "Matrix" label
          ctx.fillStyle = '#9CA3AF';
          ctx.font = `${Math.max(12, cellHeight * 0.4)}px Kalam, cursive`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Matrix', start.x, start.y - 20);
        }
        break;
      
      case 'graph-node':
        if (element.points.length > 0) {
          const center = element.points[0];
          const radius = 25; // Fixed radius for graph nodes
          
          // Draw circle
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          
          // Fill
          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fill();
          }
          
          // Stroke
          ctx.stroke();
          
          // Draw value/label
          if (element.text) {
            ctx.fillStyle = element.color;
            ctx.font = `${Math.max(14, radius * 0.6)}px Kalam, cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(element.text, center.x, center.y);
          }
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
      
      // Draw resize handles for selected elements (only corners)
      const handles = getResizeHandles(bounds);
      ctx.fillStyle = '#3B82F6';
      ctx.setLineDash([]);
      
      // Only show corner handles (nw, ne, se, sw)
      const cornerHandles = ['nw', 'ne', 'se', 'sw'];
      cornerHandles.forEach(key => {
        const handle = handles[key as keyof typeof handles];
        ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(handle.x, handle.y, handle.width, handle.height);
      });
    }

    ctx.restore();
  };

  const getElementBounds = (element: DrawingElement) => {
    // Special handling for text elements
    if (element.type === 'text' && element.text && element.points.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const fontSize = element.fontSize || 16;
          const lineHeight = fontSize * 1.5;
          ctx.font = `${fontSize}px Kalam, cursive`;
          
          // Split text by newlines
          const lines = element.text.split('\n');
          
          // Measure each line to find the widest
          let maxWidth = 0;
          lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) {
              maxWidth = metrics.width;
            }
          });
          
          const textHeight = lines.length * lineHeight;
          
          return {
            x: element.points[0].x - 5,
            y: element.points[0].y - 5, // Match the textarea top position
            width: maxWidth + 10,
            height: textHeight + fontSize + 10, // Add fontSize for baseline offset
          };
        }
      }
      // Fallback if canvas context is not available
      const fontSize = element.fontSize || 16;
      const lineHeight = fontSize * 1.5;
      const lines = element.text.split('\n');
      const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
      const approxWidth = (longestLine.length * fontSize * 0.6); // Rough estimate
      return {
        x: element.points[0].x - 5,
        y: element.points[0].y - 5, // Match the textarea top position
        width: approxWidth + 10,
        height: (lines.length * lineHeight) + fontSize + 10, // Add fontSize for baseline offset
      };
    }
    
    // Special handling for image elements
    if (element.type === 'image' && element.points.length > 0) {
      const width = element.imageWidth || 100;
      const height = element.imageHeight || 100;
      return {
        x: element.points[0].x - 5,
        y: element.points[0].y - 5,
        width: width + 10,
        height: height + 10,
      };
    }
    
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

  // Get resize handles for a bounds
  const getResizeHandles = (bounds: { x: number; y: number; width: number; height: number }) => {
    const handleSize = 8 / zoom; // Size of resize handles
    const { x, y, width, height } = bounds;
    
    return {
      nw: { x: x - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      n:  { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      ne: { x: x + width - handleSize / 2, y: y - handleSize / 2, width: handleSize, height: handleSize },
      e:  { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2, width: handleSize, height: handleSize },
      se: { x: x + width - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },
      s:  { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },
      sw: { x: x - handleSize / 2, y: y + height - handleSize / 2, width: handleSize, height: handleSize },
      w:  { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2, width: handleSize, height: handleSize },
    };
  };

  // Check if a point is on a resize handle
  const getResizeHandleAtPoint = (point: Point, bounds: { x: number; y: number; width: number; height: number }): string | null => {
    const handles = getResizeHandles(bounds);
    const edgeThreshold = 5; // Pixels from edge to trigger resize
    
    // First check corner handles (they have priority)
    const cornerHandles = ['nw', 'ne', 'se', 'sw'];
    for (const name of cornerHandles) {
      const handle = handles[name as keyof typeof handles];
      if (
        point.x >= handle.x &&
        point.x <= handle.x + handle.width &&
        point.y >= handle.y &&
        point.y <= handle.y + handle.height
      ) {
        return name;
      }
    }
    
    // Check edges (entire line, not just middle handle)
    // Top edge
    if (
      point.y >= bounds.y - edgeThreshold &&
      point.y <= bounds.y + edgeThreshold &&
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width
    ) {
      return 'n';
    }
    
    // Bottom edge
    if (
      point.y >= bounds.y + bounds.height - edgeThreshold &&
      point.y <= bounds.y + bounds.height + edgeThreshold &&
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width
    ) {
      return 's';
    }
    
    // Left edge
    if (
      point.x >= bounds.x - edgeThreshold &&
      point.x <= bounds.x + edgeThreshold &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    ) {
      return 'w';
    }
    
    // Right edge
    if (
      point.x >= bounds.x + bounds.width - edgeThreshold &&
      point.x <= bounds.x + bounds.width + edgeThreshold &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    ) {
      return 'e';
    }
    
    return null;
  };

  // Transform an element based on new bounds
  const transformElement = (
    element: DrawingElement,
    oldBounds: { x: number; y: number; width: number; height: number },
    newBounds: { x: number; y: number; width: number; height: number }
  ): DrawingElement => {
    const scaleX = newBounds.width / oldBounds.width;
    const scaleY = newBounds.height / oldBounds.height;
    
    // Transform points
    const transformedPoints = element.points.map(p => ({
      x: newBounds.x + (p.x - oldBounds.x) * scaleX,
      y: newBounds.y + (p.y - oldBounds.y) * scaleY,
    }));
    
    // For text elements, also scale font size
    if (element.type === 'text') {
      const avgScale = (scaleX + scaleY) / 2;
      return {
        ...element,
        points: transformedPoints,
        fontSize: Math.max(8, Math.round((element.fontSize || 16) * avgScale)),
      };
    }
    
    // For image elements, scale image dimensions
    if (element.type === 'image' && element.imageWidth && element.imageHeight) {
      return {
        ...element,
        points: transformedPoints,
        imageWidth: Math.round(element.imageWidth * scaleX),
        imageHeight: Math.round(element.imageHeight * scaleY),
      };
    }
    
    return {
      ...element,
      points: transformedPoints,
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
      // First check if clicking on a resize handle of selected elements
      if (selectedElementIds.length > 0) {
        // Get combined bounds of all selected elements
        const selectedElements = drawingElements.filter(el => selectedElementIds.includes(el.id));
        if (selectedElements.length > 0) {
          // For single selection, use element bounds
          if (selectedElements.length === 1) {
            const bounds = getElementBounds(selectedElements[0]);
            const handle = getResizeHandleAtPoint(point, bounds);
            
            if (handle) {
              // Start resizing - store original elements
              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStartBounds(bounds);
              setResizeStartPoint(point);
              setResizeStartElements(JSON.parse(JSON.stringify(selectedElements))); // Deep copy
              return;
            }
          } else {
            // For multiple selection, use combined bounds
            const allBounds = selectedElements.map(el => getElementBounds(el));
            const minX = Math.min(...allBounds.map(b => b.x));
            const minY = Math.min(...allBounds.map(b => b.y));
            const maxX = Math.max(...allBounds.map(b => b.x + b.width));
            const maxY = Math.max(...allBounds.map(b => b.y + b.height));
            const combinedBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
            
            const handle = getResizeHandleAtPoint(point, combinedBounds);
            
            if (handle) {
              // Start resizing - store original elements
              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStartBounds(combinedBounds);
              setResizeStartPoint(point);
              setResizeStartElements(JSON.parse(JSON.stringify(selectedElements))); // Deep copy
              return;
            }
          }
        }
      }
      
      // Check if clicking on an existing element
      let found = false;
      let clickedElementId: string | null = null;
      let clickedElement: DrawingElement | null = null;
      
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
          clickedElement = element;
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
    if (activeTool === 'text') {
      // If there's an existing text edit, save it first
      if (textEdit) {
        if (textEdit.text.trim()) {
          const element: DrawingElement = {
            id: Date.now().toString() + Math.random(),
            type: 'text',
            points: [textEdit.canvasPoint],
            color: strokeColor,
            strokeWidth,
            opacity,
            lineStyle,
            text: textEdit.text,
            fontSize: 16,
          };
          addDrawingElement(element);
        }
        // Close text edit mode and switch to select tool
        setTextEdit(null);
        setActiveTool('select');
        return;
      }
      
      // Start text editing at this point
      setTextEdit({
        canvasPoint: point,
        text: ''
      });
      
      // Mark that we just created the textarea
      justCreatedTextarea.current = true;
      
      return;
    }
    
    // Handle Array tool
    if (activeTool === 'array') {
      setIsDrawing(true);
      setStartPoint(point);
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'array',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Can add values like: "1,2,3,4,5"
        fontSize: 14,
      };
      setCurrentElement(element);
      return;
    }
    
    // Handle Linked List tool
    if (activeTool === 'linked-list') {
      setIsDrawing(true);
      setStartPoint(point);
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'linked-list',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Node value
        fontSize: 14,
      };
      setCurrentElement(element);
      return;
    }
    
    // Handle Tree tool
    if (activeTool === 'tree') {
      setIsDrawing(true);
      setStartPoint(point);
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'tree',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Node values (comma-separated, level-order)
        fontSize: 14,
      };
      setCurrentElement(element);
      return;
    }
    
    // Handle Hash Map tool
    if (activeTool === 'hashmap') {
      setIsDrawing(true);
      setStartPoint(point);
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'hashmap',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Entries: "key:value,key:value" or "value,value"
        fontSize: 14,
      };
      setCurrentElement(element);
      return;
    }
    
    // Handle Matrix tool
    if (activeTool === 'matrix') {
      setIsDrawing(true);
      setStartPoint(point);
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'matrix',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Values: comma-separated, row by row
        fontSize: 14,
      };
      setCurrentElement(element);
      return;
    }
    
    // Handle Graph Node tool (single click to place)
    if (activeTool === 'graph-node') {
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'graph-node',
        points: [point],
        color: strokeColor,
        strokeWidth,
        fillColor,
        opacity,
        lineStyle,
        text: '', // Node label/value
        fontSize: 14,
      };
      addDrawingElement(element);
      return; // No dragging needed for graph nodes
    }

    setIsDrawing(true);
    setStartPoint(point);

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
    
    // Handle resizing
    if (activeTool === 'select' && isResizing && resizeHandle && resizeStartBounds && resizeStartPoint) {
      const point = getMousePos(e);
      const dx = point.x - resizeStartPoint.x;
      const dy = point.y - resizeStartPoint.y;
      
      // Calculate new bounds based on resize handle
      let newBounds = { ...resizeStartBounds };
      
      // Check if Shift key is pressed for aspect ratio lock
      const lockAspectRatio = e.shiftKey;
      const originalAspectRatio = resizeStartBounds.width / resizeStartBounds.height;
      
      switch (resizeHandle) {
        case 'nw':
          newBounds.x += dx;
          newBounds.y += dy;
          newBounds.width -= dx;
          newBounds.height -= dy;
          if (lockAspectRatio) {
            const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
            const sign = (dx < 0 || dy < 0) ? 1 : -1;
            newBounds.width = resizeStartBounds.width + sign * avgDelta;
            newBounds.height = newBounds.width / originalAspectRatio;
            newBounds.x = resizeStartBounds.x + resizeStartBounds.width - newBounds.width;
            newBounds.y = resizeStartBounds.y + resizeStartBounds.height - newBounds.height;
          }
          break;
        case 'n':
          newBounds.y += dy;
          newBounds.height -= dy;
          if (lockAspectRatio) {
            newBounds.width = newBounds.height * originalAspectRatio;
            newBounds.x = resizeStartBounds.x + (resizeStartBounds.width - newBounds.width) / 2;
          }
          break;
        case 'ne':
          newBounds.y += dy;
          newBounds.width += dx;
          newBounds.height -= dy;
          if (lockAspectRatio) {
            const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
            const sign = (dx > 0 || dy < 0) ? 1 : -1;
            newBounds.width = resizeStartBounds.width + sign * avgDelta;
            newBounds.height = newBounds.width / originalAspectRatio;
            newBounds.y = resizeStartBounds.y + resizeStartBounds.height - newBounds.height;
          }
          break;
        case 'e':
          newBounds.width += dx;
          if (lockAspectRatio) {
            newBounds.height = newBounds.width / originalAspectRatio;
            newBounds.y = resizeStartBounds.y + (resizeStartBounds.height - newBounds.height) / 2;
          }
          break;
        case 'se':
          newBounds.width += dx;
          newBounds.height += dy;
          if (lockAspectRatio) {
            const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
            const sign = (dx > 0 && dy > 0) ? 1 : -1;
            newBounds.width = resizeStartBounds.width + sign * avgDelta;
            newBounds.height = newBounds.width / originalAspectRatio;
          }
          break;
        case 's':
          newBounds.height += dy;
          if (lockAspectRatio) {
            newBounds.width = newBounds.height * originalAspectRatio;
            newBounds.x = resizeStartBounds.x + (resizeStartBounds.width - newBounds.width) / 2;
          }
          break;
        case 'sw':
          newBounds.x += dx;
          newBounds.width -= dx;
          newBounds.height += dy;
          if (lockAspectRatio) {
            const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
            const sign = (dx < 0 || dy > 0) ? 1 : -1;
            newBounds.width = resizeStartBounds.width + sign * avgDelta;
            newBounds.height = newBounds.width / originalAspectRatio;
            newBounds.x = resizeStartBounds.x + resizeStartBounds.width - newBounds.width;
          }
          break;
        case 'w':
          newBounds.x += dx;
          newBounds.width -= dx;
          if (lockAspectRatio) {
            newBounds.height = newBounds.width / originalAspectRatio;
            newBounds.y = resizeStartBounds.y + (resizeStartBounds.height - newBounds.height) / 2;
          }
          break;
      }
      
      // Prevent negative dimensions
      if (newBounds.width < 10) {
        newBounds.width = 10;
        if (resizeHandle.includes('w')) {
          newBounds.x = resizeStartBounds.x + resizeStartBounds.width - 10;
        }
      }
      if (newBounds.height < 10) {
        newBounds.height = 10;
        if (resizeHandle.includes('n')) {
          newBounds.y = resizeStartBounds.y + resizeStartBounds.height - 10;
        }
      }
      
      // Calculate scale factors
      const scaleX = newBounds.width / resizeStartBounds.width;
      const scaleY = newBounds.height / resizeStartBounds.height;
      
      // Apply transformation to selected elements
      resizeStartElements.forEach(originalElement => {
        const oldBounds = getElementBounds(originalElement);
        
        // Calculate element's relative position within the original bounds
        const relX = (oldBounds.x - resizeStartBounds.x) / resizeStartBounds.width;
        const relY = (oldBounds.y - resizeStartBounds.y) / resizeStartBounds.height;
        const relW = oldBounds.width / resizeStartBounds.width;
        const relH = oldBounds.height / resizeStartBounds.height;
        
        // Calculate new element bounds
        const newElementBounds = {
          x: newBounds.x + relX * newBounds.width,
          y: newBounds.y + relY * newBounds.height,
          width: relW * newBounds.width,
          height: relH * newBounds.height,
        };
        
        // Transform points based on element type - always from original
        const transformedElement = transformElement(originalElement, oldBounds, newElementBounds);
        updateDrawingElement(originalElement.id, transformedElement);
      });
      
      redrawCanvas();
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
    
    if (!isDrawing || !currentElement) {
      // Check for hover over resize handles when select tool is active
      if (activeTool === 'select' && !isResizing && selectedElementIds.length > 0) {
        const point = getMousePos(e);
        const selectedElements = drawingElements.filter(el => selectedElementIds.includes(el.id));
        
        if (selectedElements.length > 0) {
          let bounds;
          
          if (selectedElements.length === 1) {
            bounds = getElementBounds(selectedElements[0]);
          } else {
            // Combined bounds for multiple selection
            const allBounds = selectedElements.map(el => getElementBounds(el));
            const minX = Math.min(...allBounds.map(b => b.x));
            const minY = Math.min(...allBounds.map(b => b.y));
            const maxX = Math.max(...allBounds.map(b => b.x + b.width));
            const maxY = Math.max(...allBounds.map(b => b.y + b.height));
            bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
          }
          
          const handle = getResizeHandleAtPoint(point, bounds);
          setHoveredHandle(handle);
        } else {
          setHoveredHandle(null);
        }
      } else {
        setHoveredHandle(null);
      }
      
      return;
    }

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
    // Handle resize completion
    if (isResizing) {
      saveCurrentStateToHistory(); // Save history after resize
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartBounds(null);
      setResizeStartPoint(null);
      setResizeStartElements([]); // Clear stored elements
      return;
    }
    
    // Handle dragging completion
    if (isDragging) {
      saveCurrentStateToHistory(); // Save history after drag
      setIsDragging(false);
      setDragStartPoint(null);
    }
    
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
        // Add to laser elements (temporary) with timestamp
        setLaserElements(prev => [...prev, { ...currentElement, createdAt: Date.now() }]);
      } else {
        // Add to permanent elements
        addDrawingElement(currentElement);
      }
      setCurrentElement(null);
    }
    setIsDrawing(false);
    setStartPoint(null);
    
    // Only reset dragging if not already handled
    if (!isDragging) {
      setIsDragging(false);
      setDragStartPoint(null);
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);
    
    // Check if we double-clicked on an existing text element
    for (let i = drawingElements.length - 1; i >= 0; i--) {
      const element = drawingElements[i];
      
      // Only handle text elements
      if (element.type !== 'text') continue;
      
      const bounds = getElementBounds(element);
      
      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        // Switch to text tool
        setActiveTool('text');
        
        // Found a text element - enable editing
        setTextEdit({
          canvasPoint: element.points[0],
          text: element.text || ''
        });
        
        // Delete the old text element
        deleteDrawingElements([element.id]);
        
        // Mark that we just created the textarea
        justCreatedTextarea.current = true;
        
        return;
      }
    }
    
    // No text element found - create new text at double-click position
    // Automatically switch to text tool and start editing
    setActiveTool('text');
    setTextEdit({
      canvasPoint: point,
      text: ''
    });
    
    // Mark that we just created the textarea
    justCreatedTextarea.current = true;
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

  // Focus textarea when textEdit is set
  useEffect(() => {
    if (textEdit && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textEdit]);

  // Save text and exit edit mode when switching tools
  useEffect(() => {
    if (textEdit && activeTool !== 'text') {
      // User switched to a different tool - save the text
      if (textEdit.text.trim()) {
        const element: DrawingElement = {
          id: Date.now().toString() + Math.random(),
          type: 'text',
          points: [textEdit.canvasPoint],
          color: strokeColor,
          strokeWidth,
          opacity,
          lineStyle,
          text: textEdit.text,
          fontSize: 16,
        };
        addDrawingElement(element);
      }
      setTextEdit(null);
    }
  }, [activeTool, textEdit, strokeColor, strokeWidth, opacity, lineStyle, addDrawingElement]);

  // Text editing handlers
  const saveText = () => {
    if (textEdit && textEdit.text.trim()) {
      const element: DrawingElement = {
        id: Date.now().toString() + Math.random(),
        type: 'text',
        points: [textEdit.canvasPoint],
        color: strokeColor,
        strokeWidth,
        opacity,
        lineStyle,
        text: textEdit.text,
        fontSize: 16,
      };
      addDrawingElement(element);
    }
    setTextEdit(null);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop event from propagating to prevent triggering shortcuts
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setTextEdit(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveText();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Insert tab character at cursor position
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = textEdit!.text.substring(0, start) + '\t' + textEdit!.text.substring(end);
      setTextEdit({ ...textEdit!, text: newText });
      // Move cursor after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const getCursorStyle = () => {
    // If resizing or hovering over resize handle, show appropriate resize cursor
    const activeHandle = isResizing ? resizeHandle : hoveredHandle;
    
    if (activeHandle) {
      switch (activeHandle) {
        case 'nw':
        case 'se':
          return 'cursor-nwse-resize';
        case 'ne':
        case 'sw':
          return 'cursor-nesw-resize';
        case 'n':
        case 's':
          return 'cursor-ns-resize';
        case 'e':
        case 'w':
          return 'cursor-ew-resize';
      }
    }
    
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
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={getCursorStyle()}
        style={{ backgroundColor: canvasBackground }}
      />
      
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-blue-500 border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900 bg-opacity-90 px-6 py-4 rounded-lg">
            <p className="text-white text-xl font-semibold">Drop image here</p>
          </div>
        </div>
      )}
      
      {/* Inline text editor (Excalidraw style) */}
      {textEdit && (
        <textarea
          id="canvas-text-input"
          ref={textInputRef}
          value={textEdit.text}
          onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
          onKeyDown={handleTextKeyDown}
          autoFocus
          className="absolute bg-transparent outline-none resize-none overflow-hidden scrollbar-hide"
          style={{
            left: `${textEdit.canvasPoint.x * zoom + panOffset.x}px`,
            top: `${textEdit.canvasPoint.y * zoom + panOffset.y}px`,
            fontSize: `${16 * zoom}px`, // Scale font size with zoom
            lineHeight: '1.5',
            minWidth: `${200 * zoom}px`, // Scale min width with zoom
            height: 'auto', // Auto height based on content
            maxHeight: '80vh', // Max height to prevent going off screen
            overflowY: 'auto', // Scroll if exceeds max height (hidden with CSS)
            zIndex: 100000,
            border: 'none',
            padding: 0,
            color: strokeColor, // Text color matches stroke color
            caretColor: strokeColor, // Cursor color matches stroke color
            transformOrigin: 'top left',
            whiteSpace: 'pre', // Preserve all whitespace including multiple spaces and tabs
            wordWrap: 'normal',
            overflowWrap: 'normal',
            tabSize: 4, // Tab width
            fontFamily: 'Kalam, cursive', // Handwritten font
            fontWeight: 400, // Normal weight for Kalam
          }}
          rows={textEdit.text.split('\n').length || 1} // Dynamic rows based on newlines
          data-canvas-x={textEdit.canvasPoint.x}
          data-canvas-y={textEdit.canvasPoint.y}
          data-zoom={zoom}
          data-pan-x={panOffset.x}
          data-pan-y={panOffset.y}
        />
      )}
    </div>
  );
}

