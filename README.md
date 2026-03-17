# Panchanga

A lightweight client-side Panchanga app built while learning modern frontend tooling and algorithms.

## What this project is

Panchanga is a small single-page app that calculates traditional Hindu calendar elements (tithi, nakshatra, rashi, lagna, sunrise/sunset, and related details) on the client using JavaScript. It was created as a learning project to practice React, Vite, state management, and implementing domain-specific algorithms.

## Features

- Pick a location and date
- Calculate tithi, nakshatra, rashi, lagna
- Sunrise and sunset times
- Small, dependency-light client-side implementation

## Tech stack

- Vite
- React (JSX)
- JavaScript (some files use TypeScript-style naming)
- No backend — all calculations run in the browser

## Important files

- `src/App.jsx` — main application UI
- `src/components/` — UI components (e.g., `Card.jsx`, `LocationPicker.jsx`)
- `src/lib/` — core calculation logic (tithi, nakshatra, rashi, etc.)

## Installation

Prerequisites: Node.js (v14+ recommended) and npm/yarn installed.

1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

4. Preview production build

```bash
npm run preview
```

## Usage

Open the app in your browser (dev server prints the local URL). Pick a location and date to see the calculated Panchanga details. The UI is intentionally minimal — the goal was correctness of the computation and learning frontend patterns.

## Contributing

This is a personal learning project. If you find issues or want to suggest improvements, open an issue or send a PR. I'm happy to collaborate — feedback is appreciated.

## License

This repository is intended for learning and demonstration. Use freely; attribution appreciated.

