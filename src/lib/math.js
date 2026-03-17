
export const norm360 = (x) => {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
};

export const angleDiffSigned = (a, b) => {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};
