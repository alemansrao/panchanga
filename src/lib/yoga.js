import { findCrossing, buildFuncs } from "./swisseph";
import { jdToLocalStringCompact } from "./time";
import { YOGA } from "./constants";
export const computeYoga = (swe, jd) => {
	const { moonSid, sunSid } = buildFuncs(swe);
	const sumFunc = (j) => {
		const s = sunSid(j);
		const m = moonSid(j);
		return ((s + m) % 360 + 360) % 360;
	};

	const seg = 360 / 27;
	const nFloat = sumFunc(jd) / seg;
	const idx = Math.floor(nFloat); // 0..26
	const name = `Yoga #${idx + 1}`;
	const prog = (nFloat - idx) * 100;

	const startDeg = (idx * seg) % 360;
	const endDeg = ((idx + 1) * seg) % 360;
	const startJd = findCrossing(sumFunc, startDeg, { jdStart: jd, dir: -1, step: 0.5, maxDays: 45 });
	const endJd = findCrossing(sumFunc, endDeg, { jdStart: jd, dir: +1, step: 0.5, maxDays: 45 });

	return {
		name: YOGA[idx],
		meta: `Yoga #${idx + 1}/27 • ${prog.toFixed(1)}%`,
		times: `${startJd ? jdToLocalStringCompact(startJd) : "-"} ↔ ${endJd ? jdToLocalStringCompact(endJd) : "-"}`,
		progress: Number(prog.toFixed(1)),
	};
};
