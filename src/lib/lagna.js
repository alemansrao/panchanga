import { RASHI_NAMES } from "./constants";
import { findCrossing } from "./swisseph";
import { jdToLocalStringCompact } from "./time";
import { norm360 } from "./math";

const HOUSE_SYSTEM = "P";

// Search every 30 minutes so Lagna sign transitions are found reliably.
const SEARCH_STEP_DAYS = 1 / 48;

// Lagna completes a full cycle roughly once per day,
// so 3 days gives plenty of search room.
const MAX_SEARCH_DAYS = 3;

export const computeLagna = (
  swe,
  jd,
  { lat, lon, timeZone } = {}
) => {
  if (!swe || !Number.isFinite(Number(jd))) {
    return null;
  }

  const geoLat = Number(lat);
  const geoLon = Number(lon);

  if (!Number.isFinite(geoLat) || geoLat < -90 || geoLat > 90) {
    throw new RangeError(`Invalid geographic latitude: ${lat}`);
  }

  if (!Number.isFinite(geoLon) || geoLon < -180 || geoLon > 180) {
    throw new RangeError(`Invalid geographic longitude: ${lon}`);
  }

  /*
   * Vedic Lagna requires sidereal zodiac.
   * Use Lahiri ayanamsha because the rest of this project
   * already uses Lahiri for sidereal Sun/Moon calculations.
   */
  if (typeof swe.set_sid_mode === "function") {
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  }

  if (typeof swe.houses_ex !== "function") {
    throw new Error(
      "Swiss Ephemeris houses_ex() is required for sidereal Lagna calculation."
    );
  }

  /*
   * Calculate the sidereal Ascendant for a given UT Julian Day.
   *
   * houses_ex arguments:
   *   jd          = Julian Day in UT
   *   SEFLG_SIDEREAL = sidereal calculation
   *   geoLat      = observer latitude
   *   geoLon      = observer longitude
   *   P           = Placidus house system
   *
   * The Ascendant itself is returned in ascmc[0].
   */
  const ascAtJd = (j) => {
    const res = swe.houses_ex(
      j,
      swe.SEFLG_SIDEREAL,
      geoLat,
      geoLon,
      HOUSE_SYSTEM
    );

    const asc = Number(res?.ascmc?.[0]);

    if (!Number.isFinite(asc)) {
      throw new Error(
        `Swiss Ephemeris returned an invalid Ascendant for JD ${j}.`
      );
    }

    return norm360(asc);
  };

  const ascDeg = ascAtJd(jd);

  /*
   * 0..29.999  = Mesha
   * 30..59.999 = Vrishabha
   * ...
   */
  const idx = Math.floor(ascDeg / 30);
  const name = RASHI_NAMES[idx];

  const degreeWithinSign = ascDeg - idx * 30;
  const prog = (degreeWithinSign / 30) * 100;

  const startDeg = idx * 30;
  const endDeg = (idx + 1) * 30;

  const crossingOptions = {
    step: SEARCH_STEP_DAYS,
    maxDays: MAX_SEARCH_DAYS,
    tol: 1e-6,
  };

  /*
   * Find when the current Lagna sign began.
   */
  const startJd = findCrossing(ascAtJd, startDeg, {
    jdStart: jd,
    dir: -1,
    ...crossingOptions,
  });

  /*
   * Find when the current Lagna sign ends.
   */
  const endJd = findCrossing(ascAtJd, endDeg, {
    jdStart: jd,
    dir: +1,
    ...crossingOptions,
  });

  return {
    name: `${name} (${ascDeg.toFixed(2)}°)`,

    meta: `Lagna #${idx + 1}/12 • ${prog.toFixed(1)}%`,

    times: `${
      startJd
        ? jdToLocalStringCompact(startJd, timeZone)
        : "-"
    } ↔ ${
      endJd
        ? jdToLocalStringCompact(endJd, timeZone)
        : "-"
    }`,

    progress: Number(prog.toFixed(1)),

    ascDeg,
  };
};

export default computeLagna;