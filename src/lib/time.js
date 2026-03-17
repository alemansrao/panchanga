
// ./lib/time.js
export const jdToLocalString = (jd) => {
  const ms = (jd - 2440587.5) * 86400000;
  const d = new Date(ms);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(d);
};

export const jdToLocalStringCompact = (jd) => {
  const ms = (jd - 2440587.5) * 86400000;
  const d = new Date(ms);

  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  return `${dd} ${mmm}, ${yyyy}, ${hh}:${mm}`;
};

export const toInputLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
