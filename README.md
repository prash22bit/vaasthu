# VastuPlan

> An intelligent house-planning application with CAD-like design, Vastu analysis, and AI-assisted layout generation.

## Phase 1 — Foundation

Phase 1 establishes the core monorepo architecture, interactive canvas, project management, and all foundational infrastructure required to build on in future phases.

## Project Structure

```
vastuplan/
├── frontend/          # React + TypeScript + Vite + Tailwind + Konva.js
├── backend/           # Node.js + Express + TypeScript
├── shared/            # Shared TypeScript types
├── package.json       # Root workspace config
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (running locally on port 27017, or set `MONGODB_URI` in `backend/.env`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

**Backend** (`backend/.env`):
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/vastuplan
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Run in development

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

## Architecture

### Coordinate System
VastuPlan uses a **world coordinate system** in real-world units (feet/meters). The canvas rendering layer converts world coordinates to screen pixels using `worldToScreen()` and `screenToWorld()` utility functions, ensuring zoom/pan never affects actual dimensions.

### State Management
Zustand stores:
- `projectStore` — project CRUD and persistence
- `canvasStore` — zoom, pan, grid, selection
- `historyStore` — undo/redo stack
- `uiStore` — active tool, modals, panels

### Extensibility
- **DesignEntity** base type supports: Wall, Room, Door, Window, Furniture, etc.
- **VastuEngine** stub is ready for Phase 3 Vastu rules
- **AIService** stub is ready for Phase 4 AI integration
- **Multi-floor** data model (`floors[]`) is in place from Phase 1

## Roadmap

| Phase | Focus |
|-------|-------|
| **Phase 1** | Foundation: project, plot, canvas, inspector |
| Phase 2 | CAD engine: walls, rooms, doors, windows, snapping |
| Phase 3 | Vastu analysis, zones, scoring, recommendations |
| Phase 4 | AI-assisted layout generation |
| Phase 5 | 3D visualization |
| Phase 6 | Electrical, plumbing, export |
