## OutRun Clone

Demo here [https://echooff3.github.io/outrun-clone/](https://echooff3.github.io/outrun-clone/)

A JavaScript clone of the classic arcade racer OutRun, built with Pixi.js and TypeScript.

## Features Implemented

### 🏎️ Rendering Engine
- **Pseudo-3D Rendering**: Custom segment-based projection system (2.5D) simulating depth and speed.
- **Curvature**: Smooth road curves implemented using accumulated X-offsets.
- **Elevation**: Hill and valley support with proper occlusion handling (hills block the view behind them).
- **Performance**: Efficient rendering loop using Pixi.js `Graphics`.

### 🛣️ Track System
- **JSON Level Format**: Tracks are defined in `src/levels/*.json` allowing easy creation of straights, curves, and hills.
- **Procedural Generation**: The `Track` class parses level data into renderable segments.
- **Visuals**: Alternating road colors (light/dark) for speed perception, grass, and rumble strips.

### 🎮 Gameplay & Controls
- **Physics**: Acceleration, braking, drag/deceleration, and speed-dependent steering sensitivity.
- **Reverse Gear**: Added ability to reverse when stuck.
- **Input Handling**: Responsive keyboard controls.

## Controls

| Key | Action |
| --- | --- |
| **W** | Accelerate (Gas) |
| **S** | Brake |
| **A** | Steer Left |
| **D** | Steer Right |
| **X** | Reverse |

## Getting Started

### Prerequisites
- Node.js
- npm

### Installation
```bash
cd outrun
npm install
```

### Development
Start the development server:
```bash
npm run dev
```

### Build
Build for production:
```bash
npm run build
```
