# Panchanga

A lightweight, client-side Panchanga web app built with React and Vite. It uses Swiss Ephemeris in the browser to calculate traditional Hindu calendar and astronomical values for a selected location and date/time.

## What this project does

Panchanga is a single-page application focused on client-side Panchanga calculations. The selected location, date/time, and timezone are used to calculate the visible calendar details directly in the browser. No application backend is required.

The app uses Swiss Ephemeris through a local WebAssembly-backed implementation and applies a Lahiri sidereal mode where sidereal calculations are required.

## Features

### Panchanga calculations

The main dashboard calculates and displays:

- Tithi, including metadata, start/end times, progress, and the current Moon phase
- Nakshatra, including metadata, times, and progress
- Janma Rashi
- Lagna based on observer latitude, longitude, and timezone
- Yoga
- Karana
- Saura Māsa
- Chandra Māsa, including Adhika and Kshaya indicators
- Ruthu
- Ayana
- Samvatsara
- Sunrise and sunset with a day-progress indicator
- Moon phase and estimated illumination based on Sun-Moon angular separation

### Date and location controls

- Select from the predefined cities in `src/lib/constants.js`
- Persist the selected location in browser `localStorage`
- Change the calculation date/time with a `datetime-local` control
- Move one day backward or forward
- Reset the calculation to the current time with `Now`
- Use the selected location's timezone for local date/time conversion

### Tithi finder

The dashboard includes a search tool for finding dates for a specific:

- Year
- Saura Māsa
- Paksha
- Tithi number

The finder returns matching start and end times. When the year is left empty, the current year and the following nine years are scanned, subject to the validation rules in the UI.

### URL-based initialization

The app can initialize its location and date/time from query parameters.

Supported location parameters:

- `city` or `location`
- `lat`
- `lon` or `lng`
- `tz` or `timezone`

Supported date/time parameters:

- `date` in `YYYY-MM-DD`
- `time` in `HH:mm`

Example:

```text
/?city=Bengaluru&date=2026-09-26&time=08:30
```

Latitude, longitude, and timezone can also be supplied directly when using a custom location.

## Responsive UI

The dashboard is designed to adapt across desktop, high-resolution, tablet, and mobile viewports.

Responsive behavior includes:

- Fluid page width with a readable large-screen maximum
- Single-column layout on small screens and two-column layout on larger screens
- Responsive finder controls that expand to four columns on wide screens
- Wrapping headers, location data, and long calculated values instead of forcing horizontal overflow
- Full-width mobile actions where appropriate
- Touch-device handling that disables the desktop cursor spotlight
- Reduced hover effects on devices without a fine pointer
- Card sizing and spacing that scale with viewport size

## Tech stack

- React 19
- Vite 7
- Tailwind CSS 4
- HeroUI
- Motion / Framer Motion
- React Icons
- JavaScript / JSX
- Swiss Ephemeris local WebAssembly implementation
- No application backend

## Project structure

Important files and directories:

```text
src/
├─ App.jsx                         Main dashboard and application state
├─ index.css                       Global theme and responsive styles
├─ components/
│  ├─ Card.jsx                     Panchanga result card
│  ├─ LocationPicker.jsx           City/location selector
│  └─ cred/                        CRED-inspired demo components
├─ lib/
│  ├─ swisseph.js                  Swiss Ephemeris initialization/helpers
│  ├─ tithi.js
│  ├─ nakshatra.js
│  ├─ rashi.js
│  ├─ lagna.js
│  ├─ yoga.js
│  ├─ karana.js
│  ├─ sauraMasa.js
│  ├─ chandraMasa.js
│  ├─ ayana.js
│  ├─ ruthu.js
│  ├─ riseSet.js
│  ├─ samvatsara.js
│  └─ tithiFinder.js
└─ main.jsx                        React entry point

public/
└─ swisseph/                       Swiss Ephemeris WebAssembly/data assets
```

## Installation

Prerequisites:

- Node.js and npm

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

## Usage

1. Start the development server with `npm run dev`.
2. Open the URL printed by Vite.
3. Select a city from the location picker.
4. Choose a date/time or use `Now`.
5. Review the calculated Panchanga cards.
6. Use the Tithi finder when you need to locate dates matching a Saura Māsa, Paksha, and Tithi combination.

All date/time calculations are handled client-side.

## Notes

- The Swiss Ephemeris assets are loaded from `public/swisseph`.
- The selected location is stored under the browser localStorage key `panchanga.location`.
- Location calculations use latitude, longitude, and timezone. Elevation is currently fixed to `0` in the application state.
- The project contains a few CRED-inspired demo components under `src/components/cred/` and `src/CredDemo.jsx`; the main dashboard is implemented in `src/App.jsx`.

## Contributing

This is a personal learning and demonstration project. Improvements, fixes, and suggestions are welcome.

## License

This repository is intended for learning and demonstration. Use freely; attribution is appreciated.