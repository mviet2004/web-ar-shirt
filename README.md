# Web AR Shirt

A web AR app built with React, Vite, Three.js, and MindAR. It detects a printed shirt graphic and plays an animation/video overlay through the device camera.

## Features

- Auto-start camera scan on load (pixel anime game UI).
- MindAR target detection from `.mind` files.
- Video or 3D animation overlay on the shirt graphic.
- Local HTTPS dev server for camera access.

## Stack

- React 19
- Vite 7
- TypeScript
- MindAR
- Three.js
- Vite basic SSL plugin

## Requirements

- Node.js 20+ recommended
- npm
- A device with a camera for real AR testing
- A browser with WebGL and camera API support

## Install

```bash
npm install
```

## Dev

```bash
npm run dev
```

Vite runs a local HTTPS server. Open the URL shown in the terminal, e.g.:

```text
https://localhost:5173
```

For phone testing, use the LAN URL from Vite. Camera access usually requires HTTPS or localhost.

## Production build

```bash
npm run build
```

Output is in `dist/`.

## Preview build

```bash
npm run preview
```

## Project structure

```text
public/
  animations/        Video or animation used as AR overlay
  targets/           MindAR .mind target files
src/
  ar/                MindAR and Three.js components
  config/            AR target configuration
  pages/             App screens
  styles/            Global CSS
```

## AR target config

Main config file:

```text
src/config/arTargets.ts
```

Example target:

```ts
{
  id: 'shirt-01',
  targetSrc: '/targets/shirt-01.mind',
  animationSrc: '/animations/shirt-01.mp4',
  animationType: 'video',
  targetIndex: 0,
  overlayWidth: 1,
  overlayHeight: 1.25
}
```

To change the marker or animation:

1. Add a `.mind` file to `public/targets/`.
2. Add a video or animation to `public/animations/`.
3. Update `src/config/arTargets.ts`.

## Notes

- Do not commit `node_modules/` or `dist/`.
- `.mind` files must be generated from the marker image using MindAR tools.
- If the camera does not open, check browser permissions and ensure the app runs on HTTPS.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
```
