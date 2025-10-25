# 📋 Quick Reference Card

## 🎨 DSA Teaching Studio - Quick Reference

### 🚀 Getting Started
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

### ⌨️ Keyboard Shortcuts

#### View Modes
| Shortcut | Action |
|----------|--------|
| `Ctrl + 1` | Split View |
| `Ctrl + 2` | Code Only |
| `Ctrl + 3` | Draw Only |

#### Editor
| Shortcut | Action |
|----------|--------|
| `Ctrl + R` | Run Code |
| `Ctrl + S` | Save Session |

#### Canvas
| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + Y` | Redo (Alt) |
| `Delete` | Delete Selected |

#### Drawing Tools (Single Key)
| Key | Tool |
|-----|------|
| `V` | Select |
| `P` | Pen |
| `E` | Eraser |
| `L` | Line |
| `A` | Arrow |
| `R` | Rectangle |
| `C` | Circle |
| `T` | Text |
| `H` | Pan |

---

## 🎨 Drawing Tools

### Available Tools
1. **Select** - Click to select elements
2. **Pen** - Freehand drawing
3. **Eraser** - Remove drawings
4. **Line** - Straight lines
5. **Arrow** - Directional arrows
6. **Rectangle** - Boxes and frames
7. **Circle** - Circles and ellipses
8. **Triangle** - Triangle shapes
9. **Text** - Add labels
10. **Pan** - Move around canvas

### Styling Options
- **11 Preset Colors** - Quick color selection
- **Stroke Width** - 1px to 20px
- **Fill Colors** - Solid fills for shapes
- **Line Styles** - Solid, dashed, dotted
- **Opacity** - 0% to 100% transparency

### Canvas Controls
- **Zoom** - 25% to 400%
- **Pan** - Move around canvas
- **Clear** - Remove all elements
- **Undo/Redo** - 50-state history

---

## 💾 Session Management

### Save Session
1. Click "Save" button
2. Enter session name
3. Session saved to localStorage

### Load Session
1. Click "Load" button
2. Select from saved sessions
3. Workspace restored

### Export Session
- Click download icon
- JSON file downloaded
- Can import later

### Import Session
- Click upload icon
- Select JSON file
- Session restored

---

## 📝 Code Editor

### Supported Languages
- ✅ JavaScript (executable)
- ✅ TypeScript (executable)
- 📋 Python (syntax only)
- 📋 C++ (syntax only)
- 📋 Java (syntax only)

### File Management
- **Add File** - Click + button
- **Delete File** - Click X on tab
- **Switch Files** - Click tab
- **Download** - Click download icon

### Code Execution
1. Write JavaScript/TypeScript code
2. Click "Run" button (or Ctrl+R)
3. View output in console
4. See errors highlighted

---

## 📤 Export Options

### Canvas Export
- **PNG** - High-quality image
- **SVG** - Scalable vector graphics

### Code Export
- **Download File** - Native format (.js, .py, etc.)
- **Copy Code** - Manual copy from editor

### Session Export
- **JSON** - Complete session data
- Includes code + drawings + settings

---

## 🎯 Common Workflows

### Live Teaching Session
```
1. Open in Split View (Ctrl+1)
2. Write code on left
3. Draw diagrams on right
4. Run code to demonstrate (Ctrl+R)
5. Save session for later (Ctrl+S)
```

### Create Tutorial Material
```
1. Write example code
2. Add visual explanations
3. Use colors for emphasis
4. Save as template
5. Export PNG for slides
```

### Student Practice
```
1. Create starter code
2. Add problem instructions as comments
3. Save session
4. Export as JSON
5. Share with students
```

### Algorithm Visualization
```
1. Implement algorithm
2. Draw data structure
3. Use colors for state
4. Add annotations
5. Step through execution
```

---

## 🎨 Visual Design Tips

### Color Coding
- 🔵 **Blue** - Current/active element
- 🔴 **Red** - Errors or invalid
- 🟢 **Green** - Correct or completed
- 🟡 **Yellow** - Warning or special
- ⚫ **Black** - Default/normal
- ⚪ **White** - Background/contrast

### Drawing Arrays
```
1. Use Rectangle tool (R)
2. Draw cells horizontally
3. Use Text tool (T) for values
4. Add arrows for pointers
5. Color-code regions
```

### Drawing Trees
```
1. Use Circle tool (C) for nodes
2. Use Line/Arrow for edges
3. Use Text tool (T) for values
4. Arrange vertically
5. Color-code levels
```

### Drawing Graphs
```
1. Use Circle tool (C) for vertices
2. Use Arrow tool (A) for edges
3. Use Text tool (T) for labels
4. Add weights with text
5. Highlight paths with colors
```

---

## 🐛 Troubleshooting

### Code Won't Run
- ✅ Check it's JavaScript/TypeScript
- ✅ Look for syntax errors in console
- ✅ Verify no infinite loops

### Drawing Issues
- ✅ Select correct tool
- ✅ Check stroke width is visible
- ✅ Try different colors
- ✅ Use undo if needed (Ctrl+Z)

### Session Won't Save
- ✅ Check browser localStorage available
- ✅ Try export as JSON instead
- ✅ Clear old sessions if storage full

### UI Not Styled
- ✅ Clear browser cache
- ✅ Hard refresh (Ctrl+Shift+R)
- ✅ Check Tailwind CSS installed
- ✅ Restart dev server

---

## 📚 Documentation Links

- **Full Guide**: README.md
- **Quick Start**: QUICKSTART.md
- **Technical Docs**: PROJECT_STRUCTURE.md
- **Feature List**: FEATURES.md
- **Project Summary**: SUMMARY.md

---

## 🎓 Teaching Examples

### Example 1: Bubble Sort
```javascript
// Code side
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```
**Canvas side**: Draw array boxes, show swapping with arrows

### Example 2: Binary Search
```javascript
// Code side
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```
**Canvas side**: Draw array with left, mid, right pointers

### Example 3: Linked List
```javascript
// Code side
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }
  
  insert(data) {
    const node = new Node(data);
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
  }
}
```
**Canvas side**: Draw nodes with arrows showing next pointers

---

## 💡 Pro Tips

1. **Save Often** - Use Ctrl+S regularly
2. **Use Colors** - Color-code different states
3. **Template Everything** - Save common patterns
4. **Learn Shortcuts** - Faster than mouse clicks
5. **Export Backups** - Keep JSON copies
6. **Name Descriptively** - Clear session names
7. **Document Code** - Add helpful comments
8. **Test First** - Run code before teaching
9. **Use Layers** - Organize complex diagrams (Phase 2)
10. **Keep It Simple** - Clear > complex

---

**Quick Reference v1.0**  
**Last Updated**: October 2025

Print this card and keep it handy while teaching! 📋🎓

