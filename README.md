# Nitro Rush — Street Racing

A responsive 2D arcade racing game built with React, Vite, Tailwind CSS and Canvas.

## Requirements
- Node.js 18.0 or newer
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Controls
- Move: `←` / `→` or `A` / `D`
- Pause / resume: `P` or `Esc`
- Mobile: use the on-screen left and right buttons

## Gameplay
- Three stages: City Sprint, Neon Highway and Midnight Pro.
- Dodge traffic, collect nitro energy, and reach the target distance.
- Each completed stage unlocks the next one. Unlock progress and best scores are saved in local storage.

## Project structure
```text
nitro-rush/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    └── game/
        ├── GameCanvas.jsx
        └── gameConfig.js
```
