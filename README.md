# 🎓 DSA Studio

A comprehensive web-based teaching tool designed for Data Structures & Algorithms instruction, combining a powerful code editor with a fully-featured drawing canvas for live teaching, screen sharing, and interactive demonstrations.

![DSA Studio](https://img.shields.io/badge/Phase-MVP%20Complete-success)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-blue)

## ✨ Features (Phase 1 - MVP)

### 🎯 View Modes
- **Split View**: Code editor and drawing canvas side-by-side with resizable divider
- **Code Only Mode**: Full-screen code editor for focused coding
- **Draw Only Mode**: Full-screen drawing canvas for visual explanations
- Easy switching between modes with keyboard shortcuts (Ctrl+1/2/3)

### 📝 Code Editor
- **Monaco Editor** integration (same editor as VS Code)
- Syntax highlighting for JavaScript, Python, C++, Java, and TypeScript
- Multiple file tabs with easy switching
- Dark theme optimized for extended use
- Adjustable font size
- Line numbers and bracket matching
- **Code Execution**: Run JavaScript code directly in the browser
- **Console Output**: View logs, errors, warnings, and info messages
- **File Management**: Add, rename, delete, and download code files

### 🎨 Drawing Canvas
- **Drawing Tools**:
  - Pen/Brush for freehand drawing
  - Line tool for straight lines
  - Arrow tool for directional indicators
  - Rectangle, Circle, and Triangle shapes
  - Text tool for annotations
  - Eraser tool
  - Select and Pan tools
  
- **Customization**:
  - Color picker with 11 preset colors
  - Adjustable stroke width (1-20px)
  - Fill color options for shapes
  - Line styles: solid, dashed, dotted
  - Opacity control (0-100%)
  
- **Canvas Features**:
  - Infinite canvas with pan and zoom (25%-400%)
  - Undo/Redo with 50-state history
  - Custom background colors
  - Clear canvas option

### 💾 Session Management
- **Save Sessions**: Save your entire workspace (code + drawings + settings)
- **Load Sessions**: Resume previous teaching sessions
- **Export/Import**: Export sessions as JSON files
- **Auto-storage**: Sessions saved to browser localStorage
- **Session Browser**: View and load from saved sessions

### 📤 Export Features
- **Canvas Export**:
  - Export as PNG (high quality)
  - Export as SVG (vector format)
- **Code Export**: Download code files in their native format (.js, .py, .cpp, etc.)
- **Session Export**: Export entire session as JSON

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + 1`: Split View
- `Ctrl/Cmd + 2`: Code Only
- `Ctrl/Cmd + 3`: Draw Only
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + R`: Run Code
- `Ctrl/Cmd + S`: Save Session
- Tool shortcuts (single key):
  - `V`: Select Tool
  - `P`: Pen Tool
  - `E`: Eraser Tool
  - `L`: Line Tool
  - `A`: Arrow Tool
  - `R`: Rectangle Tool
  - `C`: Circle Tool
  - `T`: Text Tool
  - `H`: Pan Tool
- `Delete`: Delete selected elements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dsa-tool
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Code Editor**: Monaco Editor
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser localStorage/IndexedDB

## 📖 Usage Guide

### Basic Workflow

1. **Start Coding**: 
   - Write your code in the editor
   - Click "Run" or press Ctrl+R to execute
   - View output in the console below

2. **Draw Diagrams**:
   - Select a tool from the drawing toolbar
   - Choose colors and stroke width
   - Draw on the canvas to visualize concepts

3. **Switch Views**:
   - Use the view mode buttons in the header
   - Or use keyboard shortcuts (Ctrl+1/2/3)

4. **Save Your Work**:
   - Click "Save" to save your session
   - Give it a descriptive name
   - Load it later from the "Load" menu

5. **Export**:
   - Export canvas as PNG/SVG
   - Download code files
   - Export entire session as JSON

### Teaching Tips

1. **Split View**: Perfect for live coding + visual explanation
2. **Use Colors**: Color-code different concepts (e.g., blue for visited nodes, red for current)
3. **Annotations**: Use text tool to add labels and explanations
4. **Save Templates**: Create reusable session templates for common topics
5. **Keyboard Shortcuts**: Learn shortcuts for faster workflow

## 🗺️ Roadmap

### Phase 2 (Planned)
- [ ] Array and Linked List visualizers
- [ ] Step-by-step code execution
- [ ] Code templates library
- [ ] Multiple canvas slides
- [ ] Grid and snap-to-grid
- [ ] Advanced selection tools
- [ ] More export formats

### Phase 3 (Planned)
- [ ] Tree and Graph builders
- [ ] Algorithm animations
- [ ] Variable tracking panel
- [ ] Layers system
- [ ] Collaboration features
- [ ] GitHub integration

### Phase 4 (Future)
- [ ] AI-powered code suggestions
- [ ] Advanced DSA visualizations
- [ ] Team workspaces
- [ ] Recording and streaming
- [ ] Analytics and insights

## 🤝 Contributing

Contributions are welcome! This is a comprehensive educational tool, and there's plenty of room for enhancements.

### Areas for Contribution
- New drawing tools
- Additional language support
- DSA visualizers
- UI/UX improvements
- Performance optimizations
- Documentation

## 📝 License

MIT License - feel free to use this for teaching, learning, or commercial purposes.

## 🙏 Acknowledgments

- Monaco Editor by Microsoft
- Excalidraw for drawing inspiration
- The developer education community

## 📧 Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Built with ❤️ for DSA educators and students worldwide**

*Last Updated: October 2025*
