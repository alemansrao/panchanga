// App.jsx
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiSun } from "react-icons/fi";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { GiSunset, GiSunrise } from "react-icons/gi";
import { FaCloudMoonRain } from "react-icons/fa";
import { TbScale } from "react-icons/tb";
import { IoMdTime } from "react-icons/io";
import { HiMoon } from "react-icons/hi";
import {
  WiMoonNew,
  WiMoonWaxingCrescent3,
  WiMoonFirstQuarter,
  WiMoonWaxingGibbous3,
  WiMoonFull,
  WiMoonWaningGibbous3,
  WiMoonThirdQuarter,
  WiMoonWaningCrescent3,
} from "react-icons/wi";

import { MdOutlineStar } from "react-icons/md";
import { TbZodiacCancer } from "react-icons/tb";
import Card from "./components/Card";
// ---- lib imports ----
import { initSwiss, setTopo, sunTropical, moonTropical, buildFuncs } from "./lib/swisseph";
import { toInputLocal } from "./lib/time";
// Domain calculators
import { computeTithi } from "./lib/tithi";
import { computeYoga } from "./lib/yoga";
import { computeNakshatra } from "./lib/nakshatra";
import { computeJanmaRashi } from "./lib/rashi";
import { computeSauraMasa } from "./lib/sauraMasa";
import { computeAyana } from "./lib/ayana";
import { computeRuthu } from "./lib/ruthu";
import { computeKarana } from "./lib/karana";
import { computeRiseSet } from "./lib/riseSet";
import { computeSamvatsara } from "./lib/samvatsara";
import { computeLagna } from "./lib/lagna";
// ---- NEW: Finder imports ----
import {
  findTithiByMasaPaksha,
  MASA_OPTIONS,
  PAKSHA_OPTIONS,
  TITHI_NUMBERS
} from "./lib/tithiFinder";
import LocationPicker from "./components/LocationPicker";
import { Button } from "@heroui/react";
import { GrFormNextLink, GrFormPreviousLink } from "react-icons/gr";

export default function PanchangaLive() {
  // ---- LocalStorage helpers ----
  const DEFAULT_LOCATION = { "city": "Bengaluru", "lat": 12.9716, "lon": 77.5946 };
  const LS_KEY = "panchanga.location";

  function readStoredLocation() {
    if (typeof window === "undefined") return DEFAULT_LOCATION;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return DEFAULT_LOCATION;
      const obj = JSON.parse(raw);
      const lat = Number(obj?.lat);
      const lon = Number(obj?.lon);
      const city = typeof obj?.city === "string" ? obj.city : "";
      if (Number.isFinite(lat) && Number.isFinite(lon) && city) {
        return { city, lat, lon };
      }
    } catch (_) { }
    return DEFAULT_LOCATION;
  }

  const [location, setLocation] = useState(() => readStoredLocation());
  const observerLatRef = useRef(location.lat);
  const observerLonRef = useRef(location.lon);
  const observerAltRef = useRef(0);

  // --- Swiss Ephemeris instance ---
  const sweRef = useRef(null);

  // --- UI state ---
  const [status, setStatus] = useState({ text: "Loading Swiss Ephemeris…", cls: "muted" });
  const [nowString, setNowString] = useState("-");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dtInputValue, setDtInputValue] = useState(() => toInputLocal(new Date()));

  // Longitudes for debug/visibility panel
  const [sunLon, setSunLon] = useState("-");
  const [moonLon, setMoonLon] = useState("-");
  const [moonLonSid, setMoonLonSid] = useState("-");

  // Moon phase for Tithi card icon
  const [moonPhase, setMoonPhase] = useState(null);

  // Cards
  const [tithi, setTithi] = useState(null);
  const [yoga, setYoga] = useState(null);
  const [nak, setNak] = useState(null);
  const [rashi, setRashi] = useState(null);
  const [saura, setSaura] = useState(null);
  const [ayana, setAyana] = useState(null);
  const [ruthu, setRuthu] = useState(null);
  const [karana, setKarana] = useState(null);
  const [lagna, setLagna] = useState(null);
  // const [showDayProgress, setShowDayProgress] = useState(true);
  // ---- NEW: Additional Cards state ----
  const [riseSet, setRiseSet] = useState(null);          // {sunrise, sunset, dayLengthMs}
  const [samvatsara, setSamvatsara] = useState(null);    // {name, meta, times, progress}

  // ---- NEW: Tithi Finder UI State ----
  const currentYear = new Date().getFullYear();
  const [finderYear, setFinderYear] = useState(currentYear);
  const [finderMasa, setFinderMasa] = useState("Any"); // "Any" or one from MASA_OPTIONS
  const [finderPaksha, setFinderPaksha] = useState("Shukla"); // or "Krishna"
  const [finderTithi, setFinderTithi] = useState(1); // 1..15
  const [finderBusy, setFinderBusy] = useState(false);
  const [finderResults, setFinderResults] = useState([]); // Array of { label, start, end, masa, paksha, tithi }
  // --- Clock updater: always show TRUE current local time ---
  const updateClocks = useCallback(() => {
    const now = new Date(); // <-- independent of selectedDate
    setNowString(
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    );
  }, []);


  // Map Sun–Moon elongation (0..360) to a phase label & icon.
  // 0° = New, 90° = First Quarter, 180° = Full, 270° = Third Quarter
  function getMoonPhase(sepDeg) {
    const sep = ((sepDeg % 360) + 360) % 360;
    const pct = (1 - Math.cos((sep * Math.PI) / 180)) / 2; // illumination 0..1
    // 8-bin phase mapping (every 45°)
    if (sep < 22.5 || sep >= 337.5) return { label: "New Moon", illu: pct, Icon: WiMoonNew };
    if (sep < 67.5) return { label: "Waxing Crescent", illu: pct, Icon: WiMoonWaxingCrescent3 };
    if (sep < 112.5) return { label: "First Quarter", illu: pct, Icon: WiMoonFirstQuarter };
    if (sep < 157.5) return { label: "Waxing Gibbous", illu: pct, Icon: WiMoonWaxingGibbous3 };
    if (sep < 202.5) return { label: "Full Moon", illu: pct, Icon: WiMoonFull };
    if (sep < 247.5) return { label: "Waning Gibbous", illu: pct, Icon: WiMoonWaningGibbous3 };
    if (sep < 292.5) return { label: "Third Quarter", illu: pct, Icon: WiMoonThirdQuarter };
    return { label: "Waning Crescent", illu: pct, Icon: WiMoonWaningCrescent3 };
  }






  // --- Core refresh ---
  const refresh = useCallback(async () => {
    const swe = sweRef.current;
    setFinderResults([]); // clear previous results on refresh
    if (!swe) return;

    // Use user-selected datetime (local) if present, else "now"
    const nowLocal = selectedDate ? new Date(selectedDate) : new Date();

    // Convert to UT for SwissEph julday
    const y = nowLocal.getUTCFullYear();
    const m = nowLocal.getUTCMonth() + 1;
    const d = nowLocal.getUTCDate();
    const hourUT =
      nowLocal.getUTCHours() + nowLocal.getUTCMinutes() / 60 + nowLocal.getUTCSeconds() / 3600;
    const jd = swe.julday(y, m, d, hourUT);

    // Show current longitudes
    const sunLonDeg = sunTropical(swe, jd);
    const moonLonDeg = moonTropical(swe, jd);
    const { moonSid } = buildFuncs(swe);
    setSunLon(`${sunLonDeg.toFixed(6)}°`);
    setMoonLon(`${moonLonDeg.toFixed(6)}°`);
    setMoonLonSid(`${moonSid(jd).toFixed(6)}°`);

    // Moon phase (Sun–Moon elongation)
    const sep = ((moonLonDeg - sunLonDeg) % 360 + 360) % 360;
    setMoonPhase(getMoonPhase(sep));

    // Compute domain entities (pure functions)
    setTithi(computeTithi(swe, jd));
    setYoga(computeYoga(swe, jd));
    setNak(computeNakshatra(swe, jd));
    setRashi(computeJanmaRashi(swe, jd));
    setSaura(computeSauraMasa(swe, jd));
    setAyana(computeAyana(swe, jd));
    setRuthu(computeRuthu(swe, jd));
    setKarana(computeKarana(swe, jd));
    // Lagna (ascendant) depends on observer location
    try {
      setLagna(computeLagna(swe, jd, { lat: observerLatRef.current, lon: observerLonRef.current }));
    } catch (e) {
      setLagna(null);
    }

    const rs = computeRiseSet(swe, nowLocal, {
      lat: Number(location.lat),
      lon: Number(location.lon),
      alt: observerAltRef.current
    });
    setRiseSet(rs);

    const sv = computeSamvatsara(swe, jd);
    setSamvatsara(sv);

    updateClocks();
  }, [selectedDate, updateClocks, location]);


  useEffect(() => {
    try {
      const payload = {
        city: String(location.city ?? "Bengaluru"),
        lat: Number(location.lat),
        lon: Number(location.lon),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (_) {
    }
  }, [location]);

  useEffect(() => {
    observerLatRef.current = Number(location.lat);
    observerLonRef.current = Number(location.lon);

    if (sweRef.current) {
      setTopo(
        sweRef.current,
        observerLonRef.current,
        observerLatRef.current,
        observerAltRef.current);
      refresh();
    }
  }, [location, refresh]);




  // --- Initialize Swiss Ephemeris and timers ---
  useEffect(() => {
    let tick60 = null;
    let tick1 = null;
    let cancelled = false;
    (async () => {
      try {
        setStatus({ text: "Initializing Swiss Ephemeris…", cls: "warn" });
        const swe = await initSwiss();
        if (cancelled) return;
        sweRef.current = swe;
        setTopo(swe, observerLonRef.current, observerLatRef.current, observerAltRef.current);
        setStatus({ text: "Ready (Swiss Ephemeris loaded)", cls: "ok" });
        await refresh();
        // refresh heavy calc every minute; clock label every second
        tick60 = setInterval(refresh, 60_000);
        tick1 = setInterval(updateClocks, 1_000);
        updateClocks();
      } catch (e) {
        console.error(e);
        setStatus({ text: "Error loading Swiss Ephemeris (check console)", cls: "err" });
      }
    })();
    return () => {
      cancelled = true;
      if (tick60) clearInterval(tick60);
      if (tick1) clearInterval(tick1);
    };
  }, [refresh, updateClocks]);

  // Keep the datetime-local input seeded on first mount
  useEffect(() => {
    setDtInputValue(toInputLocal(new Date()));
  }, []);

  // --- Handlers ---
  const onApply = useCallback(() => {
    if (!dtInputValue) return;
    setSelectedDate(new Date(dtInputValue));
    setTimeout(refresh, 0);
  }, [dtInputValue, refresh]);


  const shiftDay = useCallback((delta) => {
    const base = dtInputValue ? new Date(dtInputValue) : new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + delta);
    const nextStr = toInputLocal(next);

    setDtInputValue(nextStr);
    setSelectedDate(next);
    setTimeout(refresh, 0);
  }, [dtInputValue, refresh]);

  const onPrevDay = useCallback(() => shiftDay(-1), [shiftDay]);
  const onNextDay = useCallback(() => shiftDay(1), [shiftDay]);


  const onUseNow = useCallback(() => {
    const nowStr = toInputLocal(new Date());
    setSelectedDate(null);
    setDtInputValue(nowStr);
    setTimeout(refresh, 0);
  }, [refresh]);

  const onFindTithi = useCallback(async () => {
    const swe = sweRef.current;
    if (!swe) return;
    setFinderBusy(true);
    try {
      const yearEmpty = finderYear === "" || finderYear === null || typeof finderYear === "undefined";
      if (finderMasa === "Any" && (yearEmpty || !finderPaksha || !finderTithi)) {
        window.alert("Māsa may be 'Any' only when Year, Paksha and Tithi are all specified.");
        setFinderBusy(false);
        return;
      }

      const masaParam = finderMasa === "Any" ? null : finderMasa;

      if (yearEmpty) {
        const startYear = new Date().getFullYear();
        const years = Array.from({ length: 10 }, (_, i) => startYear + i);
        const promises = years.map((y) =>
          findTithiByMasaPaksha(swe, {
            year: Number(y),
            masa: masaParam,
            paksha: finderPaksha,
            tithiNum: Number(finderTithi),
          })
        );
        const arrays = await Promise.all(promises);
        const combined = arrays.flat();
        combined.sort((a, b) => {
          const sa = a.start instanceof Date ? a.start.getTime() : new Date(a.start).getTime();
          const sb = b.start instanceof Date ? b.start.getTime() : new Date(b.start).getTime();
          return sa - sb;
        });
        setFinderResults(combined);
      } else {
        const results = await findTithiByMasaPaksha(swe, {
          year: Number(finderYear),
          masa: masaParam,
          paksha: finderPaksha,
          tithiNum: Number(finderTithi),
        });
        setFinderResults(results);
      }
    } catch (e) {
      console.error(e);
      setFinderResults([]);
    } finally {
      setFinderBusy(false);
    }
  }, [finderYear, finderMasa, finderPaksha, finderTithi]);

  const fmtLocal = useCallback((date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }, []);



  // --- Render ---
  return (
    <>
      <div className="dark min-h-screen bg-gray-900 text-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-4">
            <div className="flex flex-row items-center justify-between">
              <p className="text-2xl lg:text-4xl font-bold leading-tight">{location.city} Panchanga</p>
              <LocationPicker location={location} setLocation={setLocation} />
            </div>
            <hr className="my-4 text-gray-500" />
          </header>
          <div className="bg-gray-800/60 border border-gray-400 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="w-3/4 md:w-5/6 lg:w-10/12">
              <div className="flex flex-row justify-between">
                <div className="text-sm text-white mt-1 font-semibold">{location.city}</div>
                <div className="text-xs text-gray-400 mt-1"><span className="text-emerald-300"></span>({location.lat}, {location.lon})</div>
              </div>

              <div className="flex flex-row align-middle items-center justify-between gap-2">
                {(riseSet?.displayLeftType === "sunrise") ? <GiSunrise size={24} /> : <GiSunset size={24} />}
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden flex flex-row gap-1">
                  <div className={`h-2 bg-red-500`} style={{ width: `${riseSet?.progress * 100}%` }} />
                </div>
                {(riseSet?.displayRightType === "sunrise") ? <GiSunrise size={24} /> : <GiSunset size={24} />}
              </div>

              <div className="flex flex-row justify-between">
                <div className="text-xs text-gray-400 mt-1">
                  <span className="text-emerald-300">{(riseSet?.displayLeftType === "sunrise") ? "Sun Rise : " : "Sun Set : "}</span>
                  {riseSet?.formatedDisplayLeft}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  <span className="text-emerald-300">{(riseSet?.displayRightType === "sunrise") ? "Sun Rise : " : "Sun Set : "}</span>
                  {riseSet?.formatedDisplayRight}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onUseNow}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm shadow-sm"
              >
                Now
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 ">
              <div className="w-full">
                <div className="text-xs text-gray-400">Current local time</div>
                <div className="font-medium text-lg font-mono mt-1">{nowString}</div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3 items-center">

                  <Button
                    onPress={onPrevDay}
                    className="min-w-fit hidden sm:flex bg-transparent border rounded-full hover:bg-blue-600"
                  >
                    <GrFormPreviousLink color="white" size={20} />
                  </Button>

                  <input
                    type="datetime-local"
                    value={dtInputValue}
                    onChange={(e) => setDtInputValue(e.target.value)}
                    className="w-full text sm:flex-1 min-w-0 bg-gray-900 border border-gray-700 text-gray-200 rounded-md px-2 py-2 text-sm scheme-only-dark"
                  />

                  <Button
                    onPress={onNextDay}
                    className="min-w-fit hidden sm:flex bg-transparent border rounded-full hover:bg-blue-600"
                  >
                    <GrFormNextLink color="white" size={20} />
                  </Button>

                  <div className="flex flex-col sm:flex-col gap-2 w-full sm:w-auto items-center">
                    <div className="flex flex-row w-full gap-3 sm:hidden">

                      <Button
                        onPress={onPrevDay}
                        className="w-full sm:w-auto px-3 py-2 sm:hidden rounded-md hover:bg-blue-500 bg-blue-600 text-sm"
                      >
                        Previous Day
                      </Button>
                      <Button
                        onPress={onNextDay}
                        className="w-full sm:w-auto px-3 py-2 sm:hidden rounded-md hover:bg-blue-500 bg-blue-600 text-sm"
                      >
                        Next Day
                      </Button>

                    </div>
                    <Button
                      onPress={onApply}
                      className="w-full sm:w-auto px-3 py-2 rounded-md hover:bg-blue-500 bg-blue-600 text-sm"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">(All dates shown in your local time)</div>
              </div>
            </div>

            <Card
              title="Tithi"
              name={tithi?.name ?? "-"}
              meta={
                tithi?.meta &&
                `${tithi.meta} • ${moonPhase?.label ?? ""} ${moonPhase ? `• ${(moonPhase.illu * 100).toFixed(0)}%` : ""}`
              }
              times={tithi?.times}
              progress={tithi?.progress ?? 0}
              Icon={moonPhase?.Icon ?? HiMoon}
              iconKey={moonPhase?.label ?? "Moon"}
            />


            <Card title="Nakshatra" name={nak?.name || "-"} meta={nak?.meta} times={nak?.times} progress={nak?.progress || 0} Icon={MdOutlineStar} />
            <Card title="Janma Rashi" name={rashi?.name || "-"} meta={rashi?.meta} times={rashi?.times} progress={rashi?.progress || 0} Icon={TbZodiacCancer} />
            <Card title="Lagna" name={lagna?.name ?? "-"} meta={lagna?.meta} times={lagna?.times} progress={lagna?.progress ?? 0} Icon={MdOutlineStar} iconKey={lagna?.ascDeg?.toFixed(2) ?? "Lagna"} />
            <Card title="Yoga" name={yoga?.name || "-"} meta={yoga?.meta} times={yoga?.times} progress={yoga?.progress || 0} Icon={TbScale} />
            <Card title="Karana" name={karana?.name || "-"} meta={karana?.meta} times={karana?.times} progress={karana?.progress || 0} Icon={IoMdTime} />
            <Card title="Saura Māsa" name={saura?.name || "-"} meta={saura?.meta} times={saura?.times} progress={saura?.progress || 0} Icon={TiWeatherPartlySunny} />
            <Card title="Ruthu" name={ruthu?.name || "-"} meta={ruthu?.meta} times={ruthu?.times} progress={ruthu?.progress || 0} Icon={FaCloudMoonRain} />
            <Card title="Ayana" name={ayana?.name || "-"} meta={ayana?.meta} times={ayana?.times} progress={ayana?.progress || 0} Icon={FiSun} />
            <Card title="Samvatsara" name={samvatsara?.name || "-"} meta={samvatsara?.meta} times={samvatsara?.times} progress={samvatsara?.progress || 0} Icon={FiSun} />

            {/* --- Find Tithi by Solar (Saura) Māsa / Paksha / Tithi --- */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 col-span-1 md:col-span-2">
              <div className="text-sm font-semibold">
                Find Date by <span className="text-emerald-300">Saura Māsa / Paksha / Tithi</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Select a Saura Māsa (Sun's sidereal sign), Paksha and Tithi number. We scan the selected year and return the exact start-end times for that Tithi.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
                {/* Year */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    min="1800"
                    max="2199"
                    value={finderYear}
                    onChange={(e) => setFinderYear(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-md px-2 py-2 text-sm"
                  />
                </div>

                {/* Saura Māsa */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Saura Māsa</label>
                  <select
                    value={finderMasa}
                    onChange={(e) => setFinderMasa(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    <option value="Any">Any</option>
                    {MASA_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Paksha */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Paksha</label>
                  <select
                    value={finderPaksha}
                    onChange={(e) => setFinderPaksha(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {PAKSHA_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Tithi number */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tithi (1-15)</label>
                  <select
                    value={finderTithi}
                    onChange={(e) => setFinderTithi(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-md px-2 py-2 text-sm"
                  >
                    {TITHI_NUMBERS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  onPress={onFindTithi}
                  disabled={finderBusy}
                  className={`px-3 py-2 rounded-md w-fit text-sm ${finderBusy ? "bg-gray-700 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"}`}
                >
                  {finderBusy ? "Searching…" : "Find Tithi"}
                </Button>
              </div>

              {/* Results */}
              <div className="mt-4">
                {finderResults.length === 0 ? (
                  <div className="text-xs text-gray-400">No results yet.</div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="wait" /* try: 'wait' | 'popLayout' */>
                      {finderResults.map((r, idx) => (

                        <motion.div
                          key={`${r.masa}-${r.paksha}-${r.tithi}-${idx}`}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={{
                            hidden: { opacity: 0, x: 35, filter: "blur(4px)", scale: 0.40 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              filter: "blur(0px)",
                              scale: 1,
                              transition: { duration: 0.25, ease: "easeOut" },
                            },
                            exit: {
                              opacity: 0,
                              x: -24,
                              filter: "blur(4px)",
                              scale: 0.98,
                              transition: { duration: 0.2, ease: "easeIn" },
                            },
                          }}
                          layout
                          className="border border-gray-700 rounded-lg p-3 bg-gray-900/50">

                          <div className="text-sm font-semibold">
                            {r.masa} masa • {r.paksha} paksha
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{r.label}</div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <div>
                              <div className="text-xs text-gray-400">Starts</div>
                              <div className="font-mono text-sm">{fmtLocal(r.start)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Ends</div>
                              <div className="font-mono text-sm">{fmtLocal(r.end)}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
