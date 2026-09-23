/* =========================================================================
   SABRE TRAINING SIMULATOR — AVAILABILITY ENGINE
   Independent educational tool — no affiliation with Sabre Corporation.
   Builds a Sabre-style 1 availability display for a queried city pair + date,
   mixing direct options with realistic 1-stop connections when the
   origin/destination regions don't share a direct carrier.
   ========================================================================= */

// Small deterministic PRNG so the same route+date keeps giving the same
// schedule within a session (real Sabre does the same on a re-query).
function sbSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function sbRand(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sbClassBuckets(rnd) {
  const letters = ["F", "J", "C", "D", "Y", "B", "M", "H", "K", "Q"];
  return letters.map(l => `${l}${Math.floor(rnd() * 10)}`).join(" ");
}

function sbFlightTime(rnd, baseMinutes) {
  const t = Math.floor(baseMinutes + rnd() * 90) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`;
}

function sbAddMinutes(hhmm, mins) {
  let total = parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(2), 10) + mins;
  const dayOver = total >= 1440 ? Math.floor(total / 1440) : 0;
  total = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { time: `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`, dayOver };
}

// Picks a plausible operating carrier for a leg between two regions.
function sbPickCarrier(rnd, orgRegion, dstRegion) {
  const pool = new Set([
    ...(SB_REGION_CARRIERS[orgRegion] || []),
    ...(SB_REGION_CARRIERS[dstRegion] || [])
  ]);
  const arr = Array.from(pool.size ? pool : Object.keys(SB_AIRLINES));
  return arr[Math.floor(rnd() * arr.length)];
}

function sbEquipment(rnd) {
  const eq = ["320", "321", "738", "739", "77W", "788", "789", "359", "35K", "388"];
  return eq[Math.floor(rnd() * eq.length)];
}

function sbFlightNumber(rnd) {
  return String(100 + Math.floor(rnd() * 899));
}

function sbBuildLeg(rnd, al, org, dst, depBase, elapsedMin, dayOfWeek) {
  const depT = sbFlightTime(rnd, depBase);
  const arr = sbAddMinutes(depT, elapsedMin);
  return {
    al, fn: sbFlightNumber(rnd), dep: org, arr: dst,
    depT, arrT: arr.time, dayOver: arr.dayOver,
    eq: sbEquipment(rnd), day: String(dayOfWeek),
    cls: sbClassBuckets(rnd)
  };
}

/**
 * Returns an array of options for the org/dst/date query.
 * Each option is { legs: [leg, ...] } — 1 leg for a direct service,
 * 2 legs for a realistic connection via a regional hub.
 */
function sbGenerateAvailability(org, dst, date) {
  const oInfo = SB_AIRPORTS[org];
  const dInfo = SB_AIRPORTS[dst];
  if (!oInfo || !dInfo) return null; // unknown airport code(s)

  const seed = sbSeed(`${org}${dst}${date}`);
  const rnd = sbRand(seed);
  const dayOfWeek = String(1 + Math.floor(rnd() * 7));

  const directCarriers = SB_DIRECT_ROUTE_CARRIERS[`${org}-${dst}`] || [];
  const directPossible = directCarriers.length > 0;

  const options = [];

  // A real availability display offers a useful board of choices, rather
  // than a single result.  Keep ten direct options for routings that have
  // direct service (such as DAC-DXB); each retains a unique schedule/carrier.
  if (directPossible) {
    const nDirect = 6;
    for (let i = 0; i < nDirect; i++) {
      const al = directCarriers[i % directCarriers.length];
      const elapsed = 90 + Math.floor(rnd() * 420); // 1.5h - 8.5h
      options.push({ legs: [sbBuildLeg(rnd, al, org, dst, 300 + i * 240, elapsed, dayOfWeek)] });
    }
  }

  // Use a connection only when the routing has no direct service.  This
  // prevents a DAC-DXB display from incorrectly showing a DXB connection.
  // Even a route with non-stop service has connecting alternatives in a GDS
  // display.  Choose a sensible alternate hub so it is never the destination.
  const transitHubs = {
    "DAC-DXB": "DOH", "DXB-DAC": "DOH", "DAC-BKK": "KUL", "BKK-DAC": "KUL",
    "DAC-KUL": "SIN", "KUL-DAC": "SIN", "DAC-SIN": "KUL", "SIN-DAC": "KUL",
    "DAC-DOH": "DXB", "DOH-DAC": "DXB", "DAC-JED": "DXB", "JED-DAC": "DXB",
    "DAC-DEL": "DXB", "DEL-DAC": "DXB", "DAC-CCU": "DEL", "CCU-DAC": "DEL",
    "DAC-CMB": "KUL", "CMB-DAC": "KUL", "DAC-KTM": "DEL", "KTM-DAC": "DEL"
  };
  const hub = transitHubs[`${org}-${dst}`] || SB_HUB_BY_REGION[dInfo.region] || "DXB";
  if (hub !== org && hub !== dst) {
    const al1 = sbPickCarrier(rnd, oInfo.region, "MENA");
    const al2 = sbPickCarrier(rnd, "MENA", dInfo.region);
    const leg1 = sbBuildLeg(rnd, al1, org, hub, 120 + Math.floor(rnd() * 300), 200 + Math.floor(rnd() * 200), dayOfWeek);
    const groundMin = 90 + Math.floor(rnd() * 150); // connection time at hub
    const leg2Dep = sbAddMinutes(leg1.arrT, groundMin);
    const leg2 = sbBuildLeg(rnd, al2, hub, dst, parseInt(leg2Dep.time.slice(0, 2), 10) * 60 + parseInt(leg2Dep.time.slice(2), 10), 90 + Math.floor(rnd() * 420), dayOfWeek);
    leg2.depT = leg2Dep.time;
    options.push({ legs: [leg1, leg2] });
  }

  // Long-haul routes are connection-only, so add enough alternatives to
  // maintain the same ten-choice training board.
  while (options.length < 10 && hub !== org && hub !== dst) {
    const al1 = sbPickCarrier(rnd, oInfo.region, "MENA");
    const al2 = sbPickCarrier(rnd, "MENA", dInfo.region);
    const leg1 = sbBuildLeg(rnd, al1, org, hub, 120 + Math.floor(rnd() * 900), 200 + Math.floor(rnd() * 200), dayOfWeek);
    const leg2Dep = sbAddMinutes(leg1.arrT, 90 + Math.floor(rnd() * 150));
    const leg2 = sbBuildLeg(rnd, al2, hub, dst, parseInt(leg2Dep.time.slice(0, 2), 10) * 60 + parseInt(leg2Dep.time.slice(2), 10), 90 + Math.floor(rnd() * 420), dayOfWeek);
    leg2.depT = leg2Dep.time;
    options.push({ legs: [leg1, leg2] });
  }

  // If nothing at all could be built (e.g. same airport), bail
  if (options.length === 0) return null;

  return options;
}
