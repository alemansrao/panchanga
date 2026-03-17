
// ./lib/riseSet.js

import { jdToLocalStringCompact } from "./time";

const JD_UNIX_EPOCH = 2440587.5;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const jdToMonthDayHM = (jd) => {
  if (jd == null) return "-";
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);
  const mmm = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mmm} ${dd}, ${hh}:${mm}`;
};

const dateToJdUT = (date) => date.getTime() / 86400000 + JD_UNIX_EPOCH;
const jdToDate = (jd) => new Date((jd - JD_UNIX_EPOCH) * 86400000);

/** Normalize angle to [0,360) */
const norm360 = (x) => {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
};

const gmstHours = (jdUT) => {
  const D = jdUT - 2451545.0;
  const gmst = 18.697374558 + 24.06570982441908 * D;
  let h = gmst % 24;
  if (h < 0) h += 24;
  return h;
};

/** Sun apparent altitude (deg) at given jdUT for observer (lat, lon in degrees, lon>0 East) */
const sunAltitudeDeg = (swe, jdUT, latDeg, lonDeg) => {
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_EQUATORIAL;
  const res = swe.calc_ut(jdUT, swe.SE_SUN, flags);
  const raDeg = res[0];
  const decDeg = res[1];
  const raHours = raDeg / 15;
  const lstHours = gmstHours(jdUT) + lonDeg / 15;
  let Hdeg = (lstHours - raHours) * 15;
  Hdeg = norm360(Hdeg);
  if (Hdeg > 180) Hdeg -= 360; // [-180,180]
  const latRad = latDeg * DEG2RAD;
  const decRad = decDeg * DEG2RAD;
  const Hrad = Hdeg * DEG2RAD;
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(Hrad);
  return Math.asin(sinAlt) * RAD2DEG;
};

const findAltitudeCrossing = (swe, h0Deg, { jdStart, jdEnd, lat, lon }) => {
  const stepMin = 2;
  const stepDays = stepMin / (60 * 24);
  let jd0 = jdStart;
  let f0 = sunAltitudeDeg(swe, jd0, lat, lon) - h0Deg;

  for (let jd1 = jd0 + stepDays; jd1 <= jdEnd + 1e-9; jd1 += stepDays) {
    const f1 = sunAltitudeDeg(swe, jd1, lat, lon) - h0Deg;
    if (f0 === 0) return jd0;
    if (f0 * f1 <= 0) {
      let a = jd0,
        b = jd1,
        fa = f0,
        fb = f1;
      let iter = 0;
      while ((b - a) > 1e-6 && iter < 80) {
        const m = 0.5 * (a + b);
        const fm = sunAltitudeDeg(swe, m, lat, lon) - h0Deg;
        if (fa * fm <= 0) {
          b = m;
          fb = fm;
        } else {
          a = m;
          fa = fm;
        }
        iter++;
      }
      return 0.5 * (a + b);
    }
    jd0 = jd1;
    f0 = f1;
  }
  return null;
};

export const computeRiseSet = (swe, dateLocal, { lat, lon, alt = 0 }) => {
  const local = new Date(dateLocal);
  local.setHours(0, 0, 0, 0);
  const jd0 = dateToJdUT(local);
  const jd1 = jd0 + 1.0;

  const H0 = -0.833;

  const sunriseJd = findAltitudeCrossing(swe, H0, { jdStart: jd0, jdEnd: jd1, lat, lon });
  const sunsetJd = findAltitudeCrossing(swe, H0, {
    jdStart: sunriseJd ? sunriseJd + (2 / (60 * 24)) : jd0, // start a bit after sunrise to find sunset
    jdEnd: jd1,
    lat,
    lon,
  });

  const sunrise = sunriseJd ? jdToDate(sunriseJd) : null;
  const sunset = sunsetJd ? jdToDate(sunsetJd) : null;

  // Previous day's sunset and next day's sunrise (for the night segments)
  const jdPrevDay0 = jd0 - 1.0;
  const prevSunsetJd = findAltitudeCrossing(swe, H0, {
    jdStart: jdPrevDay0,
    jdEnd: jd0,
    lat,
    lon,
  });

  const nextSunriseJd = findAltitudeCrossing(swe, H0, {
    jdStart: jd1,
    jdEnd: jd1 + 1.0,
    lat,
    lon,
  });

  const prevSunset = prevSunsetJd ? jdToDate(prevSunsetJd) : null;
  const nextSunrise = nextSunriseJd ? jdToDate(nextSunriseJd) : null;

  const dayLengthMs = sunrise && sunset ? (sunset - sunrise) : null;

  const now = dateLocal;
  let phase = "day";
  let progress = 0;

  let displayLeftType = "sunrise";
  let displayRightType = "sunset";
  let displayLeftJd = sunriseJd;
  let displayRightJd = sunsetJd;

  if (sunrise && sunset && now >= sunrise && now <= sunset) {
    phase = "day";
    progress = (now - sunrise) / (sunset - sunrise);

    displayLeftType = "sunrise";
    displayRightType = "sunset";
    displayLeftJd = sunriseJd;
    displayRightJd = sunsetJd;
  } else if (sunset && nextSunrise && now > sunset) {
    // Night after sunset: show today's sunset … tomorrow's sunrise
    phase = "night";
    progress = (now - sunset) / (nextSunrise - sunset);

    displayLeftType = "sunset";
    displayRightType = "sunrise";
    displayLeftJd = sunsetJd;
    displayRightJd = nextSunriseJd;
  } else if (prevSunset && sunrise && now < sunrise) {
    // Night before sunrise: show yesterday's sunset … today's sunrise
    phase = "night";
    progress = (now - prevSunset) / (sunrise - prevSunset);

    displayLeftType = "sunset";
    displayRightType = "sunrise";
    displayLeftJd = prevSunsetJd;
    displayRightJd = sunriseJd;
  } else {
    // Fallbacks if something is missing (e.g., polar day/night edge cases)
    // Prefer the pair that exists.
    if (sunriseJd && sunsetJd) {
      displayLeftType = "sunrise";
      displayRightType = "sunset";
      displayLeftJd = sunriseJd;
      displayRightJd = sunsetJd;
      phase = "day";
      progress = 0;
    } else if (sunsetJd && nextSunriseJd) {
      displayLeftType = "sunset";
      displayRightType = "sunrise";
      displayLeftJd = sunsetJd;
      displayRightJd = nextSunriseJd;
      phase = "night";
      progress = 0;
    } else if (prevSunsetJd && sunriseJd) {
      displayLeftType = "sunset";
      displayRightType = "sunrise";
      displayLeftJd = prevSunsetJd;
      displayRightJd = sunriseJd;
      phase = "night";
      progress = 0;
    } else {
      // nothing sensible available
      progress = 0;
    }
  }

  // Convenience formatted strings
  const formatedSunrise = jdToMonthDayHM(sunriseJd);
  const formatedSunset = jdToMonthDayHM(sunsetJd);
  const formatedPrevSunset = jdToMonthDayHM(prevSunsetJd);
  const formatedNextSunrise = jdToMonthDayHM(nextSunriseJd);

  const formatedDisplayLeft = jdToMonthDayHM(displayLeftJd);
  const formatedDisplayRight = jdToMonthDayHM(displayRightJd);

  // Optional compact "times" & "meta"
  const times = `${sunriseJd ? jdToLocalStringCompact(sunriseJd) : "-"} ↔ ${sunsetJd ? jdToLocalStringCompact(sunsetJd) : "-"
    }`;

  let meta = "-";
  if (sunrise && sunset) {
    const hrs = Math.floor(dayLengthMs / 3600000);
    const mins = Math.round((dayLengthMs % 3600000) / 60000);
    meta = `Sunrise: ${jdToLocalStringCompact(sunriseJd)} • Sunset: ${jdToLocalStringCompact(
      sunsetJd
    )} • Day length: ${hrs}h ${mins}m`;
  }

  return {
    // raw Date objects
    sunrise,
    sunset,
    prevSunset,
    nextSunrise,

    sunriseJd,
    sunsetJd,
    prevSunsetJd,
    nextSunriseJd,

    dayLengthMs,
    meta,
    times,

    phase,
    progress,

    formatedSunrise,
    formatedSunset,
    formatedPrevSunset,
    formatedNextSunrise,

    displayLeftType,
    displayRightType,
    formatedDisplayLeft,
    formatedDisplayRight,
  };
};
