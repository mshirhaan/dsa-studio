'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function KeyboardShortcuts() {
  const { 
    undo, 
    redo, 
    setViewMode, 
    setActiveTool, 
    fontSize, 
    setFontSize,
    copySelectedElements,
    pasteElements,
    duplicateSelectedElements,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, contenteditable, or Monaco editor
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.monaco-editor'); // Monaco editor
      
      // Skip tool shortcuts (single letter keys without modifiers) if typing
      const isToolShortcut = !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
      
      if (isTyping && isToolShortcut) {
        return; // Let the editor handle the keypress
      }

      // Ctrl/Cmd + Z: Undo (only for drawing, Monaco handles its own undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo (only for drawing)
      if (
        (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) && !isTyping
      ) {
        e.preventDefault();
        redo();
      }

      // Ctrl/Cmd + C: Copy (only for drawing elements)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        copySelectedElements();
      }

      // Ctrl/Cmd + V: Paste (only for drawing elements)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        pasteElements();
      }

      // Ctrl/Cmd + D: Duplicate (only for drawing elements)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isTyping) {
        e.preventDefault();
        duplicateSelectedElements();
      }

      // Ctrl/Cmd + Plus: Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setFontSize(Math.min(32, fontSize + 2));
      }

      // Ctrl/Cmd + Minus: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setFontSize(Math.max(10, fontSize - 2));
      }

      // Ctrl/Cmd + 0: Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setFontSize(14);
      }

      // Ctrl/Cmd + 1: Split view
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setViewMode('split');
      }

      // Ctrl/Cmd + 2: Code only
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('code-only');
      }

      // Ctrl/Cmd + 3: Draw only
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setViewMode('draw-only');
      }

      // Tool shortcuts (no modifiers) - already blocked if typing
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            setActiveTool('select');
            break;
          case 'p':
            setActiveTool('pen');
            break;
          case 'k':
            setActiveTool('laser');
            break;
          case 'e':
            setActiveTool('eraser');
            break;
          case 'l':
            setActiveTool('line');
            break;
          case 'a':
            setActiveTool('arrow');
            break;
          case 'r':
            setActiveTool('rectangle');
            break;
          case 'c':
            setActiveTool('circle');
            break;
          case 'x':
            setActiveTool('triangle');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'i':
            // Trigger image upload
            const event = new CustomEvent('imageToolShortcut');
            window.dispatchEvent(event);
            break;
          case 'h':
            setActiveTool('pan');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setViewMode, setActiveTool, fontSize, setFontSize, copySelectedElements, pasteElements, duplicateSelectedElements]);

  return null;
}

