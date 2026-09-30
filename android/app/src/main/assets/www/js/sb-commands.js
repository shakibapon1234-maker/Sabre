function sbGetSabreDate() {
  const d = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  return `${day}${mon}`;
}

/* =========================================================================
   SABRE TRAINING SIMULATOR — COMMAND PROCESSOR & TERMINAL ENGINE
   Updated to match Sabre 2025 Lecture Sheet specifications
   ========================================================================= */

/* ---------------------------------------------------------------------
   W/-... / W/*... / HCCC/... / HCC...  — Encode & Decode
   Sabre 2025 Lecture Sheet:
   City Encode:    W/-CCDHAKA          City Decode:    W/*DAC
   Airport Encode: W/-APNARITA         Airport Decode: W/*NRT
   Carrier Encode: W/-ALBIMAN BANGLADESH Carrier Decode: W/*BG
   Aircraft:       W/EQ-MCDONNELL DOUGLAS Decode:      W/EQ*D10
   Country:        HCCC/BANGLADESH     Country Decode: HCCC/BD
   US State:       HCCFLORIDA          State Decode:   HCCFL
--------------------------------------------------------------------- */
function cmdEncodeDecode(raw) {
  const cmd = (raw || '').trim().toUpperCase();

  // Country encode / decode: HCCC/BANGLADESH or HCCC/BD
  if (cmd.startsWith('HCCC/')) {
    const val = cmd.replace(/^HCCC\//, '').trim();
    if (typeof SB_COUNTRY_CODES !== 'undefined') {
      if (SB_COUNTRY_CODES[val]) {
        sbPrint(`HCCC/${val}`);
        sbPrint(`${val} - ${SB_COUNTRY_CODES[val]}`);
        return;
      }
      const foundCode = Object.keys(SB_COUNTRY_CODES).find(c => SB_COUNTRY_CODES[c] === val);
      if (foundCode) {
        sbPrint(`HCCC/${val}`);
        sbPrint(`${val} - ${foundCode}`);
        return;
      }
    }
    sbWarn(`COUNTRY NOT FOUND - ${val}`);
    return;
  }

  // US State encode / decode: HCCFLORIDA or HCCFL
  if (cmd.startsWith('HCC')) {
    const val = cmd.replace(/^HCC\s*/, '').trim();
    if (typeof SB_US_STATES !== 'undefined') {
      if (SB_US_STATES[val]) {
        sbPrint(`HCC${val}`);
        sbPrint(`${val} - ${SB_US_STATES[val]}`);
        return;
      }
      const foundState = Object.keys(SB_US_STATES).find(s => SB_US_STATES[s] === val);
      if (foundState) {
        sbPrint(`HCC${val}`);
        sbPrint(`${val} - ${foundState}`);
        return;
      }
    }
    sbWarn(`STATE NOT FOUND - ${val}`);
    return;
  }

  // Aircraft encode / decode: W/EQ-MCDONNELL DOUGLAS or W/EQ*D10
  if (cmd.startsWith('W/EQ') || cmd.startsWith('EQ')) {
    const rest = cmd.replace(/^(?:W\/)?EQ/, '');
    const isDecode = rest.startsWith('*');
    const val = rest.replace(/^[-*]/, '').trim();
    if (typeof SB_AIRCRAFT_CODES !== 'undefined') {
      if (isDecode || SB_AIRCRAFT_CODES[val]) {
        const desc = SB_AIRCRAFT_CODES[val] || val;
        sbPrint('EQUIPMENT DECODE');
        sbPrint(`${val}  ${desc}`);
        return;
      }
      const foundEq = Object.keys(SB_AIRCRAFT_CODES).find(k => SB_AIRCRAFT_CODES[k].toUpperCase().includes(val));
      if (foundEq) {
        sbPrint('EQUIPMENT ENCODE');
        sbPrint(`${SB_AIRCRAFT_CODES[foundEq]} - ${foundEq}`);
        return;
      }
    }
    sbPrint(`EQUIPMENT ${val}`);
    return;
  }

  // City encode: W/-CCDHAKA
  if (cmd.startsWith('W/-CC') || cmd.startsWith('-CC')) {
    const val = cmd.replace(/^(?:W\/)?-CC/, '').trim();
    const match = Object.entries(SB_AIRPORTS).find(([code, apt]) => apt.city.toUpperCase() === val || apt.city.toUpperCase().includes(val));
    if (match) {
      sbPrint(`CITY ENCODE - ${val}`);
      sbPrint(`${match[0]}  ${match[1].city}/${match[1].country}`);
      return;
    }
    sbWarn(`CITY NOT FOUND - ${val}`);
    return;
  }

  // Airport encode: W/-APNARITA
  if (cmd.startsWith('W/-AP') || cmd.startsWith('-AP')) {
    const val = cmd.replace(/^(?:W\/)?-AP/, '').trim();
    const match = Object.entries(SB_AIRPORTS).find(([code, apt]) => apt.name.toUpperCase().includes(val) || apt.city.toUpperCase().includes(val));
    if (match) {
      sbPrint(`AIRPORT ENCODE - ${val}`);
      sbPrint(`${match[0]}  ${match[1].name} / ${match[1].city} / ${match[1].country}`);
      return;
    }
    sbWarn(`AIRPORT NOT FOUND - ${val}`);
    return;
  }

  // Carrier encode: W/-ALBIMAN BANGLADESH
  if (cmd.startsWith('W/-AL') || cmd.startsWith('-AL')) {
    const val = cmd.replace(/^(?:W\/)?-AL/, '').trim();
    const match = Object.entries(SB_AIRLINES).find(([code, al]) => al.name.toUpperCase().includes(val));
    if (match) {
      sbPrint(`CARRIER ENCODE - ${val}`);
      sbPrint(`${match[0]}  ${match[1].name}`);
      return;
    }
    sbWarn(`CARRIER NOT FOUND - ${val}`);
    return;
  }

  // Decode carrier or city/airport: W/*DAC or W/*BG
  if (cmd.startsWith('W/*') || cmd.startsWith('*')) {
    const val = cmd.replace(/^(?:W\/)?\*/, '').trim();
    // Carrier decode
    if (SB_AIRLINES[val]) {
      sbPrint(`CARRIER DECODE - ${val}`);
      sbPrint(`${val}  ${SB_AIRLINES[val].name}`);
      return;
    }
    // Airport decode
    if (SB_AIRPORTS[val]) {
      const info = SB_AIRPORTS[val];
      sbPrint(`AIRPORT/CITY DECODE - ${val}`);
      sbPrint(`${val}  ${info.city} / ${info.name} / ${info.country}`);
      return;
    }
    sbWarn(`CODE NOT FOUND - ${val}`);
    return;
  }

  // Generic encode/decode query
  const query = cmd.replace(/^(?:W\/)?[-*]/, '').trim();
  if (query === 'COUNTRIES' || query === 'COUNTRY LIST') {
    sbPrint('TRAINING COUNTRY CODES (ISO)');
    Object.entries(SB_COUNTRY_CODES).forEach(([code, country]) => sbPrint(`${code}  ${country}`));
    return;
  }
  if (SB_AIRPORTS[query]) {
    const info = SB_AIRPORTS[query];
    sbPrint(`${query}  ${info.city}/${info.name}/${info.country}`);
    return;
  }
  if (SB_AIRLINES[query]) {
    sbPrint(`${query}  ${SB_AIRLINES[query].name}`);
    return;
  }
  const matches = Object.entries(SB_AIRPORTS)
    .filter(([, airport]) => airport.city.toUpperCase().includes(query) || airport.name.toUpperCase().includes(query))
    .slice(0, 10);
  if (matches.length) {
    sbPrint(`CODE SEARCH - ${query}`);
    matches.forEach(([code, airport]) => sbPrint(`${code}  ${airport.city} / ${airport.name} / ${airport.country}`));
    return;
  }
  sbWarn(`NO MATCH - ${query} NOT FOUND`);
}

/* ---------------------------------------------------------------------
   Time Calculator — Sabre 2025 Lecture Sheet:
   • T¤FEB       → View calendar for February
   • T¤25FEB¥80  → View date 80 days from 25FEB
--------------------------------------------------------------------- */
function cmdTimeCalc(raw) {
  const clean = raw.trim().toUpperCase().replace(/^T[¤*]/, '');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  // Date + Days offset: e.g. 25FEB¥80, 25FEB*80, 25FEB+80
  const offsetMatch = clean.match(/^(\d{2})([A-Z]{3})[¥☨‡§*+](\d+)$/);
  if (offsetMatch) {
    const day = parseInt(offsetMatch[1], 10);
    const monStr = offsetMatch[2];
    const daysToAdd = parseInt(offsetMatch[3], 10);
    const monIdx = months.indexOf(monStr);
    if (monIdx === -1) { sbWarn(`INVALID MONTH ${monStr}`); return; }
    const now = new Date();
    const d = new Date(now.getFullYear(), monIdx, day);
    d.setDate(d.getDate() + daysToAdd);
    const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
    const resDay = String(d.getDate()).padStart(2, '0');
    const resMon = months[d.getMonth()];
    const resYr = String(d.getFullYear()).slice(2);
    sbPrint(`TIME CALCULATOR: ${offsetMatch[1]}${monStr} + ${daysToAdd} DAYS`);
    sbPrint(`RESULT: ${dayName} ${resDay}${resMon}${resYr}`);
    return;
  }

  // Month calendar: e.g. FEB
  const monQuery = clean.slice(0, 3);
  const monIndex = months.indexOf(monQuery);
  if (monIndex !== -1) {
    const year = new Date().getFullYear();
    const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    sbPrint(`CALENDAR - ${monthNames[monIndex]} ${year}`);
    sbPrint('  SU  MO  TU  WE  TH  FR  SA');
    const firstDay = new Date(year, monIndex, 1).getDay();
    const daysInMonth = new Date(year, monIndex + 1, 0).getDate();
    let row = ' '.repeat(firstDay * 4);
    for (let day = 1; day <= daysInMonth; day++) {
      row += String(day).padStart(3, ' ') + ' ';
      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        sbPrint(row);
        row = '';
      }
    }
    return;
  }

  sbWarn('FORMAT: T¤<MONTH>  e.g. T¤FEB  |  T¤<DATE>¥<DAYS>  e.g. T¤25FEB¥80');
}

/* ---------------------------------------------------------------------
   Sign In / Sign Out — Sabre 2025 Lecture Sheet:
   • SI*1001 → Sign in all areas
   • SI1002  → Sign in previous area
   • SO*     → Sign out all areas
   • SO      → Sign out current area
--------------------------------------------------------------------- */
function cmdSignIn(raw) {
  const upper = raw.trim().toUpperCase();
  const sine = upper.replace(/^SI\*?/, '').trim() || '1001';
  sbState.agentSine = sine;
  if (upper.includes('*')) {
    sbPrint(`* SIGNED IN ALL AREAS - ${sine}/AGENT  ${sbState.officeId}`);
  } else {
    sbPrint(`* SIGNED IN AREA A - ${sine}/AGENT  ${sbState.officeId}`);
  }
}
function cmdSignOut(raw) {
  const upper = raw.trim().toUpperCase();
  if (upper.includes('*')) {
    sbPrint('* SIGNED OUT ALL AREAS');
  } else {
    sbPrint('* SIGNED OUT AREA A');
  }
}

/* ---------------------------------------------------------------------
   Availability Commands — Sabre 2025 Lecture Sheet:
   • 120DECJEDAUH        → Basic availability
   • 120DECJEDAUH¥EY     → Availability by airline EY
   • 120DECJEDAUH0800BAH → Availability via BAH with time 0800
   • 120DECJEDAUH-Q      → Availability for Q class
   • 120DECJEDAUH¤EY     → Direct Access Availability (DCA) on EY
--------------------------------------------------------------------- */
function cmdAvailability(raw) {
  const upper = raw.trim().toUpperCase();
  // Regex to extract date, org, dst, and any qualifiers
  const baseMatch = upper.match(/^1(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})(.*)$/);
  if (!baseMatch) {
    sbWarn('FORMAT: 1<DDMMM><ORG><DST>  e.g. 120DECJEDAUH');
    return;
  }
  const [, date, org, dst, extra] = baseMatch;
  if (org === dst) { sbWarn('ORIGIN AND DESTINATION CANNOT BE THE SAME'); return; }
  if (!SB_AIRPORTS[org] || !SB_AIRPORTS[dst]) {
    sbWarn(`UNABLE TO BUILD AVAILABILITY - ${(!SB_AIRPORTS[org] ? org : dst)} NOT IN TRAINING DATABASE`);
    return;
  }

  // Parse qualifiers from extra
  let reqCarrier = '';
  let reqClass = '';
  let reqTime = '';
  let reqVia = '';
  let isDCA = false;

  if (extra) {
    if (extra.includes('¤')) {
      isDCA = true;
      reqCarrier = extra.split('¤')[1]?.slice(0, 2);
    }
    const alMatch = extra.match(/[¥☨‡§*]([A-Z0-9]{2})/);
    if (alMatch) reqCarrier = alMatch[1];

    const clsMatch = extra.match(/-([A-Z])/);
    if (clsMatch) reqClass = clsMatch[1];

    const timeViaMatch = extra.match(/(\d{4})([A-Z]{3})/);
    if (timeViaMatch) {
      reqTime = timeViaMatch[1];
      reqVia = timeViaMatch[2];
    }
  }

  let options = sbGenerateAvailability(org, dst, date);
  if (!options || !options.length) { sbWarn(`NO SERVICE FOUND ${org}${dst} ${date}`); return; }

  // Filter or adapt for requested carrier
  if (reqCarrier) {
    options.forEach(opt => {
      opt.legs.forEach(leg => {
        leg.al = reqCarrier;
      });
    });
  }

  // Filter or ensure requested class
  if (reqClass) {
    options.forEach(opt => {
      opt.legs.forEach(leg => {
        if (!leg.cls.includes(reqClass)) {
          leg.cls = `${reqClass}7 ${leg.cls}`;
        }
      });
    });
  }

  // If via airport specified
  if (reqVia) {
    options.forEach(opt => {
      if (opt.legs.length === 1) {
        const leg1 = { ...opt.legs[0], arr: reqVia, arrT: '1030' };
        const leg2 = { ...opt.legs[0], dep: reqVia, depT: '1200', arr: dst, fn: String(Number(leg1.fn) + 1) };
        opt.legs = [leg1, leg2];
      }
    });
  }

  sbState._availCache = options.map(opt => ({
    date, dep: opt.legs[0].dep, arr: opt.legs[opt.legs.length - 1].arr, legs: opt.legs
  }));

  if (isDCA) {
    sbPrint(`DIRECT ACCESS AVAILABILITY - ${reqCarrier || 'CARRIER'}`);
  }

  if (typeof sbRenderAvailabilityBoard === 'function') {
    sbRenderAvailabilityBoard(options, date);
    return;
  }

  const weekDays = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const displayDay = weekDays[Number(options[0]?.legs[0]?.day)] || '---';
  sbPrint(`${date} ${displayDay} ${org} ${dst}`);
  options.forEach((opt, i) => {
    opt.legs.forEach((leg, li) => {
      const lineNo = li === 0 ? String(i + 1) : ' ';
      const dayOverTag = leg.dayOver ? `+${leg.dayOver}` : '';
      const classes = leg.cls.split(' ');
      sbPrint(` ${lineNo.padStart(2)} ${leg.al.padEnd(5)} ${leg.fn.padEnd(4)} ${classes.slice(0, 9).join(' ').padEnd(27)} ${leg.dep.padEnd(4)} ${leg.arr.padEnd(4)} ${leg.depT}  ${leg.arrT}${dayOverTag.padStart(3)}  ${leg.eq}`);
      if (classes.length > 9) sbPrint(`          ${classes.slice(9).join(' ')}`);
    });
    if (opt.legs.length > 1) sbPrint(`   CONNECTION VIA ${opt.legs[0].arr} — 2 SEGMENTS WILL BE SOLD TOGETHER`, 'line-warn');
  });
}

/* ---------------------------------------------------------------------
   Sell Flight / ARNK Segment — Sabre 2025 Lecture Sheet:
   • 01Y1 / 0Y1  → Sell seats
   • 0AA         → Add ARNK segment
   • ,3          → Increase party size to 3
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   Sell from FareShop / Bargain Finder (BFM / JR / WPNI) — Sabre Standard:
   • 0J1   → Sell 1 seat from ITINERARY OPTION 1
   • 01J1  → Sell 1 seat from ITINERARY OPTION 1
   • 02J1  → Sell 2 seats from ITINERARY OPTION 1
   • 0J2   → Sell 1 seat from ITINERARY OPTION 2
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   Sell from FareShop / Bargain Finder (BFM / JR / WPNI) — Sabre Standard:
   • 0J1 / 0J2  → Rejects with ¥FORMAT¥ (seat count mandatory in Sabre)
   • 01J1       → Sell 1 seat from ITINERARY OPTION 1
   • 02J1       → Sell 2 seats from ITINERARY OPTION 1
   • 01J2       → Sell 1 seat from ITINERARY OPTION 2
--------------------------------------------------------------------- */
function cmdSellBfm(raw) {
  const upper = raw.trim().toUpperCase();
  // In Sabre, typing 0J1 or 0J2 without seat count returns ¥FORMAT¥
  if (/^0J\d+$/i.test(upper)) {
    sbWarn('¥FORMAT¥');
    return false;
  }
  const m = upper.match(/^0(\d+)J(\d+)$/i);
  if (!m) {
    sbWarn('¥FORMAT¥');
    return false;
  }
  const qty = parseInt(m[1], 10);
  const optNum = parseInt(m[2], 10);
  if (typeof sbSellBfmOption === 'function') {
    return sbSellBfmOption(optNum, qty);
  }
  sbWarn('NO AVAIL.');
  return false;
}

function cmdSell(raw, quantity = 1) {
  const m = raw.match(/^0(\d+)?([A-Z])(\d+)$/);
  if (!m) { sbWarn('FORMAT: 0<CLASS><LINE>  e.g. 0Y1  or 01Y1'); return false; }
  const qty = m[1] ? parseInt(m[1], 10) : quantity;
  const cls = m[2];
  const lineStr = m[3];
  const idx = parseInt(lineStr, 10) - 1;

  if (!sbState._availCache || !sbState._availCache[idx]) {
    sbWarn(`NO AVAILABILITY DISPLAYED FOR LINE ${lineStr} - RUN 1DDMMMCITYCITY FIRST`);
    return false;
  }
  const opt = sbState._availCache[idx];
  const weekDays = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  sbPrint('BOOKING STATUS: SEGMENTS ADDED TO PNR', 'sb-booking-status');
  opt.legs.forEach(leg => {
    sbState.booked.push({
      al: leg.al, fn: leg.fn, cls, date: opt.date, dep: leg.dep, arr: leg.arr,
      status: `SS${qty}`, depT: leg.depT || '----', arrT: leg.arrT || '----',
      eq: leg.eq, day: leg.day, dayOver: leg.dayOver
    });
    const s = sbState.booked[sbState.booked.length - 1];
    const dayOverTag = s.dayOver ? ` +${s.dayOver}` : '';
    const dayName = weekDays[Number(s.day)] || '---';
    sbPrint(` ${sbState.booked.length} ${s.al.padEnd(5)} ${s.fn.padEnd(4)} ${s.cls.padEnd(2)} ${s.date} ${dayName}  ${s.dep.padEnd(4)} ${s.arr.padEnd(4)} ${s.status.padEnd(4)} ${s.depT}  ${s.arrT}${dayOverTag}`);
  });
  return true;
}

function cmdSellARNK() {
  const lastSeg = sbState.booked[sbState.booked.length - 1];
  const dep = lastSeg ? lastSeg.arr : '----';
  sbState.booked.push({
    al: '--', fn: 'ARNK', cls: '--', date: '----', dep, arr: '----',
    status: 'HK', depT: '----', arrT: '----', eq: 'SURFACE'
  });
  sbPrint(` ${sbState.booked.length}  -- ARNK`);
  sbPrint('*');
}

function cmdChangeParty(raw) {
  const qty = raw.replace(/^,/, '').trim();
  if (!qty || !/^\d+$/.test(qty)) { sbWarn('FORMAT: ,<NUMBER>  e.g. ,3'); return; }
  if (!sbState.booked.length) { sbWarn('NO SEGMENTS IN PNR TO MODIFY PARTY SIZE'); return; }
  sbState.booked.forEach(s => {
    s.status = s.status.slice(0, 2) + qty;
  });
  sbPrint(`PARTY SIZE CHANGED TO ${qty}`);
}

/* ---------------------------------------------------------------------
   Name field — Sabre 2025 Lecture Sheet:
   • Adult:  -KHAN/ABDULLAH MR
   • Child:  -KHAN/SONIA MISS*C10   (age after *C)
   • Infant: -I/KHAN/ALI MSTR*I17  (starts with -I/, age after *I)
--------------------------------------------------------------------- */
function sbCalculateAgeFromDob(dobStr) {
  if (!dobStr) return null;
  const s = String(dobStr).trim().toUpperCase();
  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

  let birthDate = null;
  const now = new Date();

  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    birthDate = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  } else {
    const ddmmyy = s.match(/^(\d{1,2})([A-Z]{3})(\d{2,4})$/);
    if (ddmmyy) {
      const d = parseInt(ddmmyy[1], 10);
      const mon = months[ddmmyy[2]];
      if (mon === undefined) return null;
      let yr = parseInt(ddmmyy[3], 10);
      if (yr < 100) {
        const cur2 = now.getFullYear() % 100;
        yr = (yr <= cur2 + 1) ? (2000 + yr) : (1900 + yr);
      }
      birthDate = new Date(yr, mon, d);
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) return null;

  let years = now.getFullYear() - birthDate.getFullYear();
  let mDiff = now.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) {
    years--;
  }

  let totalMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) {
    totalMonths--;
  }

  return { years, totalMonths, birthDate };
}
if (typeof window !== 'undefined') window.sbCalculateAgeFromDob = sbCalculateAgeFromDob;

function cmdName(raw) {
  let body = raw.trim();
  if (body.startsWith('-')) body = body.slice(1).trim();

  // Support chained entries: -NAME1-NAME2
  const parts = body.split(/(?=(?:^|[^-])-)/);
  const namesToAdd = parts.length > 1 ? parts.map(p => p.replace(/^-/, '').trim()) : [body];

  for (const item of namesToAdd) {
    let text = item.trim().toUpperCase();
    let isInfant = false;
    let isChild = false;
    let age = '';

    // Infant: starts with I/ or contains *I
    if (text.startsWith('I/')) {
      isInfant = true;
      text = text.slice(2).trim();
    }
    const infantAgeMatch = text.match(/\*I(\d+)/);
    if (infantAgeMatch) {
      isInfant = true;
      age = infantAgeMatch[1];
      const mVal = parseInt(age, 10);
      if (mVal < 1 || mVal >= 24) {
        sbPrint('INFANT AGE DATA REQUIRED USE *I1/I01-*I23.NOT ENT BGNG WITH');
        return;
      }
      text = text.replace(/\*I\d+/, '').trim();
    } else if (/\*I\b/.test(text)) {
      isInfant = true;
      text = text.replace(/\*I\b/, '').trim();
    }

    // Child: contains *C<age>
    const childAgeMatch = text.match(/\*C(\d+)/);
    if (childAgeMatch) {
      isChild = true;
      age = childAgeMatch[1];
      const cVal = parseInt(age, 10);
      if (cVal < 2 || cVal >= 12) {
        sbPrint('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        return;
      }
      text = text.replace(/\*C\d+/, '').trim();
    } else if (/\*C\b|\bCHD\b|\bCNN\b/.test(text)) {
      isChild = true;
      text = text.replace(/\*C\b|\bCHD\b|\bCNN\b/, '').trim();
    }

    text = text.replace(/[\s/]+$/, '');

    const nm = text.match(/^([A-Z' -]+)\/([A-Z' ]+?)(?:\s+(MR|MRS|MS|MSTR|MISS|DR|INF|CNN))?$/);
    if (!nm) {
      sbWarn('FORMAT: -SURNAME/FIRSTNAME MR  |  -SURNAME/CHILD MISS*C10  |  -I/SURNAME/INFANT MSTR*I17');
      return;
    }

    const surname = nm[1].trim();
    const first = nm[2].trim();
    const paxType = isInfant ? 'INF' : (isChild ? 'CHD' : 'ADT');
    const title = (nm[3] || (paxType === 'INF' ? 'MSTR' : paxType === 'CHD' ? 'MISS' : 'MR')).toUpperCase();
    const rawDisplay = isInfant ? `I/${surname}/${first} ${title}*I${age || '17'}` :
                       isChild ? `${surname}/${first} ${title}*C${age || '10'}` :
                       `${surname}/${first} ${title}`;

    sbState.names.push({
      raw: rawDisplay,
      surname,
      first,
      title,
      paxType,
      age: age || (isInfant ? '17' : isChild ? '10' : ''),
      dob: ''
    });
  }
  sbPrint('*');
}

function sbPaxMultiplier(pax) { return pax?.paxType === 'INF' ? 0.10 : pax?.paxType === 'CHD' ? 0.75 : 1; }
function sbPaxLabel(pax) { return pax?.paxType || 'ADT'; }
function sbBuildFareQuote(fare) {
  const passengers = sbState.names.length ? sbState.names : [{ paxType: 'ADT' }];
  const breakdown = passengers.map((pax, index) => {
    const multiplier = sbPaxMultiplier(pax);
    const base = Math.round(fare.baseBdt * multiplier);
    const tax = Math.round(fare.tax * multiplier);
    return { index: index + 1, type: sbPaxLabel(pax), base, tax, total: base + tax };
  });
  return { base: breakdown.reduce((sum, item) => sum + item.base, 0), tax: breakdown.reduce((sum, item) => sum + item.tax, 0), total: breakdown.reduce((sum, item) => sum + item.total, 0), currency: 'BDT', pax: passengers.length, breakdown };
}

/* ---------------------------------------------------------------------
   Mandatory PNR Fields:
   • 9<PHONE>      — Phone field
   • 6<NAME>       — Received from field (e.g. 6P)
   • 7TAW/ or 7T-  — Ticketing arrangement
--------------------------------------------------------------------- */
function cmdPhone(raw) {
  const body = raw.replace(/^9\s*/, '').trim();
  if (!body) { sbWarn('FORMAT: 9 <PHONE/AGENCY/CONTACT DETAILS>'); return; }
  sbState.phones.push({ raw: body.toUpperCase() });
  sbPrint('*');
}

function cmdReceivedFrom(raw) {
  const body = raw.replace(/^6\s*/, '').trim();
  if (!body) { sbWarn('FORMAT: 6<AGENT/PASSENGER NAME>  e.g. 6P'); return; }

  // Verify child/infant age validity
  for (const p of (sbState.names || [])) {
    if (p.paxType === 'CHD' && p.age) {
      const c = parseInt(p.age, 10);
      if (c < 2 || c >= 12) {
        sbPrint('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        return;
      }
    }
    if (p.paxType === 'INF' && p.age) {
      const m = parseInt(p.age, 10);
      if (m < 1 || m >= 24) {
        sbPrint('INFANT AGE DATA REQUIRED USE *I1/I01-*I23.NOT ENT BGNG WITH');
        return;
      }
    }
  }

  sbState.receivedFrom = body.toUpperCase();
  sbPrint('*');
}

function cmdTicketingArrangement(raw) {
  const body = raw.replace(/^7\s*/, '').trim();
  if (!body) { sbWarn('FORMAT: 7TAW/  or  7TAW/20DEC  or  7T-'); return; }
  sbState.ticketingArrangement = body.toUpperCase();
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   OSI & SSR Entries — Sabre 2025 Lecture Sheet:
   • 3CTCM/8801731808182-1           → Mobile for Pax 1
   • 3CTCE/email//gmail.com-1        → Email
   • 3AVML2-1                        → AVML for Pax 1 on seg 2
   • 3CHLD/02FEB20-2.1               → Child SSR message
   • 3INFT/ KHAN/ALI MSTR/01JAN24-1.1→ Infant SSR message
   • 3OSI SV CTCM 966552576776       → OSI message
   • 32.XX                           → Delete document/SSR line 2
--------------------------------------------------------------------- */
function cmdSSR(raw) {
  const upper = raw.trim().toUpperCase();

  // Document/SSR line delete: 32.XX or 31.XX
  const delMatch = upper.match(/^3(\d+)\.XX$/);
  if (delMatch) {
    const idx = parseInt(delMatch[1], 10) - 1;
    if (sbState.documents && sbState.documents[idx]) {
      sbState.documents.splice(idx, 1);
      sbPrint('*');
      return;
    }
    if (sbState.ssrEntries && sbState.ssrEntries[idx]) {
      sbState.ssrEntries.splice(idx, 1);
      sbPrint('*');
      return;
    }
    sbPrint('*');
    return;
  }

  const body = upper.replace(/^3/, '').trim();
  if (!body) { sbWarn('FORMAT: 3<SSRCODE>/...  e.g. 3CTCM/8801731808182-1'); return; }

  // OSI: 3OSI ...
  if (body.startsWith('OSI ')) {
    const carrier = sbState.booked[0]?.al || '1B';
    sbState.ssrEntries.push({ text: `OSI ${body.replace(/^OSI\s+/, '')}`, paxRef: 1 });
    sbPrint('*');
    return;
  }

  // Documents: 3DOCS/...
  if (body.startsWith('DOCS/')) {
    const carrier = sbState.privateFare?.carrier || sbState.booked[0]?.al || 'MH';
    const paxRef = Number(body.match(/-(?:1\.)?(\d+)$/)?.[1] || body.match(/\/P(\d+)$/i)?.[1] || 1);
    sbState.documents.push({ raw: body, carrier, paxRef });
    sbPrint('*');
    return;
  }

  // Parse pax ref if any (-1 or -2.1 or /P1)
  const paxMatch = body.match(/-(?:1\.)?(\d+(?:\.\d+)?)$/) || body.match(/\/P(\d+)$/);
  const paxRef = paxMatch ? Number(paxMatch[1].split('.')[0]) : 1;
  const carrier = sbState.privateFare?.carrier || sbState.booked[0]?.al || '1B';

  // Age verification on 3CHLD and 3INFT manual SSR entry
  if (/^CHLD\//i.test(body)) {
    const chldDobMatch = body.match(/^CHLD\/(\d{1,2}[A-Z]{3}\d{2})/i);
    if (chldDobMatch) {
      const aInfo = sbCalculateAgeFromDob(chldDobMatch[1]);
      if (aInfo && (aInfo.years < 2 || aInfo.years >= 12)) {
        sbPrint('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        return;
      }
    }
  }
  if (/^INFT/i.test(body)) {
    const inftDobMatch = body.match(/(\d{1,2}[A-Z]{3}\d{2})/i);
    if (inftDobMatch) {
      const aInfo = sbCalculateAgeFromDob(inftDobMatch[1]);
      if (aInfo && (aInfo.totalMonths >= 24 || aInfo.years >= 2)) {
        sbPrint('INFANT AGE DATA REQUIRED USE *I1/I01-*I23.NOT ENT BGNG WITH');
        return;
      }
    }
  }

  sbState.ssrEntries.push({ text: `SSR ${body}`, paxRef });
  if (/^CHLD\/|^INFT/i.test(body)) {
    sbPrint(upper);
  }
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   Modify Booking — Sabre 2025 Lecture Sheet:
   • WCAJ          → Change all segments to J class
   • WC1-2J/3-4Y   → Segment class changes
   • WC1HK         → Change status code
   • X1¤0025DEC    → Rebook segment 1 to 25DEC
--------------------------------------------------------------------- */
function cmdChangeStatus(raw) {
  const upper = raw.trim().toUpperCase();

  // WCAJ -> Change all segments to class J
  const wcaMatch = upper.match(/^WCA([A-Z])$/);
  if (wcaMatch) {
    const cls = wcaMatch[1];
    if (!sbState.booked.length) { sbWarn('NO BOOKED SEGMENTS IN PNR'); return; }
    sbState.booked.forEach(s => s.cls = cls);
    sbPrint(`ALL SEGMENTS CHANGED TO ${cls} CLASS`);
    return;
  }

  // Segment class changes: WC1-2J/3-4Y or WC1J
  const classChangeMatch = upper.match(/^WC(\d+(?:-\d+)?)([A-Z])(?:\/(\d+(?:-\d+)?)([A-Z]))?$/);
  if (classChangeMatch && !['HK','SS','HL','UC','WL','GK','SA','PN','NO'].includes(upper.slice(-2))) {
    const applyChunk = (rangeStr, cls) => {
      if (!rangeStr) return;
      const parts = rangeStr.split('-').map(Number);
      const start = parts[0] - 1;
      const end = parts.length > 1 ? parts[1] - 1 : start;
      for (let i = start; i <= end && i < sbState.booked.length; i++) {
        sbState.booked[i].cls = cls;
      }
    };
    applyChunk(classChangeMatch[1], classChangeMatch[2]);
    applyChunk(classChangeMatch[3], classChangeMatch[4]);
    sbPrint('SEGMENT CLASS CHANGE PROCESSED');
    return;
  }

  // Status code change: WC1HK
  const m = upper.match(/^WC(\d+)([A-Z]{2})$/);
  if (!m) { sbWarn('FORMAT: WCA<CLASS>  |  WC<SEG><CLASS>  |  WC<N><STATUS>'); return; }
  const idx = parseInt(m[1], 10) - 1;
  const newStatus = m[2];
  const validStatuses = ['HK','SS','HL','UC','WL','GK','SA','PN','NO'];
  if (!validStatuses.includes(newStatus)) {
    sbWarn(`INVALID STATUS ${newStatus} — VALID: ${validStatuses.join(' ')}`);
    return;
  }
  if (!sbState.booked.length || idx < 0 || idx >= sbState.booked.length) {
    sbWarn(`SEGMENT ${m[1]} NOT FOUND`);
    return;
  }
  const seg = sbState.booked[idx];
  seg.status = newStatus + '1';
  sbPrint(`SEGMENT ${m[1]} STATUS CHANGED TO ${newStatus}`);
  sbPrint(`${seg.al}${seg.fn} ${seg.date} ${seg.dep}${seg.arr} ${seg.status}`);
}

function cmdRebookSegment(raw) {
  const m = raw.trim().toUpperCase().match(/^X(\d+)[¤*]0*(\d{2}[A-Z]{3})$/);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    const newDate = m[2];
    if (!sbState.booked[idx]) { sbWarn(`SEGMENT ${m[1]} NOT FOUND`); return; }
    sbState.booked[idx].date = newDate;
    sbPrint(`SEGMENT ${m[1]} REBOOKED TO ${newDate}`);
    sbPrint(`${sbState.booked[idx].al}${sbState.booked[idx].fn} ${newDate} ${sbState.booked[idx].dep}${sbState.booked[idx].arr}`);
    return;
  }
  sbWarn('FORMAT: X<SEG>¤00<DATE>  e.g. X1¤0025DEC');
}

/* ---------------------------------------------------------------------
   Cancel Booking — Sabre 2025 Lecture Sheet:
   • XI    → Cancel all flights
   • X1-2  → Cancel segments 1 & 2
   • X1    → Cancel segment 1
--------------------------------------------------------------------- */
function cmdCancelFlights(raw) {
  const upper = raw.trim().toUpperCase();
  if (upper === 'XI') {
    if (!sbState.booked.length) { sbWarn('NO SEGMENTS TO CANCEL'); return; }
    const count = sbState.booked.length;
    sbState.booked = [];
    sbState.fareQuote = null;
    sbState.pqPriced = false;
    sbState.ticketed = false;
    sbPrint(`ALL ITINERARY SEGMENTS CANCELLED (${count} SEGMENT${count > 1 ? 'S' : ''})`);
    sbState.ended = false;
    sbSyncSidePanel();
    return;
  }

  // Range cancel: X1-2
  const rangeMatch = upper.match(/^X(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10) - 1;
    const end = parseInt(rangeMatch[2], 10) - 1;
    if (start < 0 || end >= sbState.booked.length || start > end) {
      sbWarn(`INVALID SEGMENT RANGE ${rangeMatch[1]}-${rangeMatch[2]}`);
      return;
    }
    const count = end - start + 1;
    sbState.booked.splice(start, count);
    sbPrint(`SEGMENTS ${rangeMatch[1]}-${rangeMatch[2]} CANCELLED`);
    sbState.ended = false;
    sbSyncSidePanel();
    return;
  }

  // Single cancel: X1, XE1, XK1
  const singleMatch = upper.match(/^X[EK]?(\d+)$/);
  if (singleMatch) {
    const idx = parseInt(singleMatch[1], 10) - 1;
    if (!sbState.booked[idx]) { sbWarn(`SEGMENT ${singleMatch[1]} NOT FOUND`); return; }
    const removed = sbState.booked.splice(idx, 1)[0];
    sbPrint(`SEGMENT ${singleMatch[1]} CANCELLED: ${removed.al}${removed.fn} ${removed.date} ${removed.dep}${removed.arr}`);
    sbState.ended = false;
    sbSyncSidePanel();
    return;
  }
}

/* ---------------------------------------------------------------------
   Remarks — Sabre 2025 Lecture Sheet:
   • Add:     5PSGR ADV FARE SAR 1500
   • History: 5HPSGR ...
   • Delete:  *P5 then 51¤
--------------------------------------------------------------------- */
function cmdRemarks(raw) {
  const upper = raw.trim().toUpperCase();

  // Delete remark: 51¤ or 51/
  const delMatch = upper.match(/^5(\d+)[¤*\/]$/);
  if (delMatch) {
    const idx = parseInt(delMatch[1], 10) - 1;
    if (sbState.remarks && sbState.remarks[idx]) {
      sbState.remarks.splice(idx, 1);
      sbPrint('*');
      return;
    }
    sbWarn(`REMARK ${delMatch[1]} NOT FOUND`);
    return;
  }

  const body = raw.replace(/^5(?:C\/|H)?\s*/i, '').trim();
  if (!body) { sbWarn('FORMAT: 5<REMARK TEXT>  e.g. 5PSGR ADV FARE SAR 1500'); return; }
  if (!sbState.remarks) sbState.remarks = [];
  sbState.remarks.push(body.toUpperCase());
  sbPrint('*');
}

function cmdDisplayRemarks() {
  if (!sbState.remarks || !sbState.remarks.length) { sbWarn('NO REMARKS IN PNR'); return; }
  sbPrint('GENERAL REMARKS');
  sbState.remarks.forEach((r, i) => sbPrint(` ${i + 1}.${r}`));
}

/* ---------------------------------------------------------------------
   Frequent Flyer — Sabre 2025 Lecture Sheet:
   • Add:    FFGF123456-1
   • Delete: *FF then FF1¤
--------------------------------------------------------------------- */
function cmdFF(raw) {
  const upper = raw.trim().toUpperCase();

  // Delete: FF1¤
  const delMatch = upper.match(/^FF(\d+)[¤*]$/);
  if (delMatch) {
    const idx = parseInt(delMatch[1], 10) - 1;
    if (sbState.frequentFlyers && sbState.frequentFlyers[idx]) {
      sbState.frequentFlyers.splice(idx, 1);
      sbPrint('*');
      return;
    }
    sbWarn(`FREQUENT FLYER ${delMatch[1]} NOT FOUND`);
    return;
  }

  const m = upper.match(/^FF([A-Z0-9]{2})([A-Z0-9]+)(?:-(\d+))?$/);
  if (!m) { sbWarn('FORMAT: FF<CARRIER><NUMBER>-<PAX>  e.g. FFGF123456-1'); return; }
  if (!sbState.frequentFlyers) sbState.frequentFlyers = [];
  sbState.frequentFlyers.push({
    carrier: m[1],
    number: m[2],
    paxRef: m[3] || '1',
    raw: upper
  });
  sbPrint('*');
}

function cmdDisplayFF() {
  if (!sbState.frequentFlyers || !sbState.frequentFlyers.length) {
    sbWarn('NO FREQUENT FLYER DATA IN PNR');
    return;
  }
  sbPrint('FREQUENT FLYER DATA:');
  sbState.frequentFlyers.forEach((ff, i) => {
    sbPrint(` ${i + 1}.FF ${ff.carrier} ${ff.number}-1.${ff.paxRef}`);
  });
}

/* ---------------------------------------------------------------------
   Email — Sabre 2025 Lecture Sheet:
   • Add:    PE¥email@gmail.com¥-1
   • Delete: *PE then PE1¤
--------------------------------------------------------------------- */
function cmdEmail(raw) {
  const upper = raw.trim().toUpperCase();

  // Delete: PE1¤
  const delMatch = upper.match(/^PE(\d+)[¤*]$/);
  if (delMatch) {
    const idx = parseInt(delMatch[1], 10) - 1;
    if (sbState.emails && sbState.emails[idx]) {
      sbState.emails.splice(idx, 1);
      sbPrint('*');
      return;
    }
    sbWarn(`EMAIL ${delMatch[1]} NOT FOUND`);
    return;
  }

  const emailMatch = raw.match(/^PE[¥☨‡§*]([^\s¥☨‡§*]+)(?:[¥☨‡§*]-?(\d+))?/i);
  if (!emailMatch) { sbWarn('FORMAT: PE¥<EMAIL>¥-1  e.g. PE¥email@gmail.com¥-1'); return; }
  if (!sbState.emails) sbState.emails = [];
  sbState.emails.push({
    email: emailMatch[1].trim(),
    paxRef: emailMatch[2] || '1',
    raw: raw.trim()
  });
  sbPrint('*');
}

function cmdDisplayEmail() {
  if (!sbState.emails || !sbState.emails.length) {
    sbWarn('NO PASSENGER EMAIL DATA IN PNR');
    return;
  }
  sbPrint('PASSENGER EMAIL ADDRESSES:');
  sbState.emails.forEach((em, i) => {
    sbPrint(` ${i + 1}.PE ${em.email} - 1.${em.paxRef}`);
  });
}

/* ---------------------------------------------------------------------
   Split PNR — Sabre 2025 Lecture Sheet:
   • D2       → Divide PAX 2
   • 6P, then F, then ER
--------------------------------------------------------------------- */
function cmdDivide(raw) {
  const m = raw.trim().toUpperCase().match(/^D(\d+)$/);
  if (!m) { sbWarn('FORMAT: D<PAX NUMBER>  e.g. D2'); return; }
  const paxNum = parseInt(m[1], 10);
  if (!sbState.names.length || paxNum < 1 || paxNum > sbState.names.length) {
    sbWarn(`PAX ${paxNum} NOT FOUND IN PNR`);
    return;
  }
  sbState.splitPax = paxNum;
  sbPrint(`DIVIDE IN PROGRESS - PASSENGER ${paxNum} DIVIDED`);
  sbPrint('ENTER 6<NAME>, THEN F TO FILE, THEN ER');
}

function cmdFileSplit() {
  if (!sbState.splitPax) { sbWarn('NO SPLIT IN PROGRESS - ENTER D<PAX> FIRST'); return; }
  const newLocator = sbRandomLocator();
  const dividedName = sbState.names[sbState.splitPax - 1];
  sbPrint('SPLIT RECORD FILED');
  sbPrint(`NEW RECORD LOCATOR: ${newLocator}`);
  sbPrint(`PASSENGER: ${dividedName?.raw || 'PAX'}`);
  sbState.splitPax = null;
}

/* ---------------------------------------------------------------------
   Clone PNR — Sabre 2025 Lecture Sheet:
   • IC   → Clone itinerary
   • ICX1 → Clone except segment 1
--------------------------------------------------------------------- */
function cmdClone(raw) {
  const upper = raw.trim().toUpperCase();
  if (!sbState.booked.length) { sbWarn('NO ITINERARY IN CURRENT PNR TO CLONE'); return; }
  const exceptMatch = upper.match(/^ICX(\d+)$/);
  const exceptIdx = exceptMatch ? parseInt(exceptMatch[1], 10) - 1 : -1;
  const cloned = sbState.booked
    .filter((_, i) => i !== exceptIdx)
    .map(s => ({ ...s, status: 'SS1' }));

  sbState.locator = null;
  sbState.names = [];
  sbState.ticketed = false;
  sbState.invoiced = false;
  sbState.eticketNumber = null;
  sbState.ticketNumbers = [];
  sbState.fareQuote = null;
  sbState.ended = false;
  sbState.booked = cloned;

  sbPrint(exceptIdx >= 0 ? `ITINERARY CLONED EXCEPT SEGMENT ${exceptMatch[1]}` : 'ITINERARY CLONED TO WORK AREA');
  sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   Fare Quote — Sabre 2025 Lecture Sheet:
   • FQJEDKHI24JAN-SV → Basic fare
--------------------------------------------------------------------- */
function cmdFareQuote(raw) {
  const upper = raw.trim().toUpperCase();
  const m = upper.match(/^FQ([A-Z]{3})([A-Z]{3})(\d{2}[A-Z]{3})?(?:-([A-Z0-9]{2}))?$/);
  if (!m) { sbWarn('FORMAT: FQ<ORG><DST><DATE>-<CARRIER>  e.g. FQJEDKHI24JAN-SV'); return; }
  const [, org, dst, date, al] = m;
  const carrier = al || 'SV';
  const queryDate = date || '24JAN';
  sbPrint(`FQ${org}${dst}${queryDate}-${carrier}`);
  sbPrint(`${queryDate}  ${org}-${dst}  ${carrier}`);
  sbPrint('LN FARE BASIS   OW/RT  CURR   FARE      EFF    EXP    R');
  sbPrint('01 YIFSA        OW     SAR    1250.00   ----   ----   R');
  sbPrint('02 YRT          RT     SAR    2100.00   ----   ----   R');
  sbPrint('03 JIFSA        OW     SAR    2800.00   ----   ----   R');
  sbPrint('04 JRT          RT     SAR    4900.00   ----   ----   R');
  sbPrint('05 FIFSA        OW     SAR    3900.00   ----   ----   R');
}

/* ---------------------------------------------------------------------
   Pricing PNR & Issue Ticket — Sabre 2025 Lecture Sheet:
   • WPABG or WP          → Price PNR
   • WPNCB                → Book Best Price
   • PQ, then ER          → Save fare
   • W¥PQ1¥AEY¥FCA¥KP0    → Issue ticket for PQ1
   • WV2                  → Void ticket on line 2
   • WV*                  → Void report
   • DQB*                 → Today's sales
   • DQB*17JAN            → Sales on specific date
--------------------------------------------------------------------- */
function cmdPriceQuote() {
  const carrier = (sbState.booked.length > 0 && sbState.booked[0].al) || 'MH';
  cmdWpa('WPA' + carrier);
}

function sbFindAirline(query) {
  const q = query.trim().toUpperCase();
  if (SB_AIRLINES[q]) return { code: q, ...SB_AIRLINES[q] };
  for (const [code, al] of Object.entries(SB_AIRLINES)) {
    if (al.name.toUpperCase().includes(q)) return { code, ...al };
  }
  return null;
}

function sbGetFareForCarrier(carrierCode) {
  const carrier = (carrierCode || 'MH').toUpperCase();
  const cInfo = SB_AIRLINES[carrier];
  const cName = cInfo ? cInfo.name : 'MALAYSIA AIRLINES';
  const fares = {
    MH: { baseUsd: 310.00, rate: 122.25, baseBdt: 37898, tax: 6994, total: 44892, fareBasis: 'QLW1YM4' },
    BG: { baseUsd: 280.00, rate: 122.25, baseBdt: 34230, tax: 6500, total: 40730, fareBasis: 'YEE1M' },
    BS: { baseUsd: 270.00, rate: 122.25, baseBdt: 33008, tax: 6200, total: 39208, fareBasis: 'WEE1M' },
    TG: { baseUsd: 350.00, rate: 122.25, baseBdt: 42788, tax: 7800, total: 50588, fareBasis: 'VEE3M' },
    SQ: { baseUsd: 420.00, rate: 122.25, baseBdt: 51345, tax: 8900, total: 60245, fareBasis: 'KEE6M' },
    EK: { baseUsd: 460.00, rate: 122.25, baseBdt: 56235, tax: 9200, total: 65435, fareBasis: 'TEE3M' },
    QR: { baseUsd: 450.00, rate: 122.25, baseBdt: 55013, tax: 9100, total: 64113, fareBasis: 'OEE3M' },
    EY: { baseUsd: 440.00, rate: 122.25, baseBdt: 53790, tax: 8900, total: 62690, fareBasis: 'VEE3M' },
    SV: { baseUsd: 430.00, rate: 122.25, baseBdt: 52568, tax: 8500, total: 61068, fareBasis: 'QEE3M' },
    GF: { baseUsd: 400.00, rate: 122.25, baseBdt: 48900, tax: 8200, total: 57100, fareBasis: 'GEE3M' },
    KU: { baseUsd: 390.00, rate: 122.25, baseBdt: 47678, tax: 8100, total: 55778, fareBasis: 'VEE3M' },
    AI: { baseUsd: 290.00, rate: 122.25, baseBdt: 35453, tax: 6400, total: 41853, fareBasis: 'TEE1M' }
  };
  const f = fares[carrier] || {
    baseUsd: 300.00, rate: 122.25, baseBdt: 36675, tax: 6800, total: 43475, fareBasis: 'YEE1M'
  };
  return {
    carrier, carrierName: cName, ...f,
    route: `${carrier} DAC KUL 270.00${carrier} DAC 40.00NUC310.00END ROE1.000000`
  };
}

function cmdWpa(raw) {
  let carrier = '';
  const clean = (raw || '').trim().toUpperCase();

  if (clean.startsWith('WPA')) {
    const after = clean.slice(3).trim();
    if (after.length === 2) {
      if (!SB_AIRLINES[after]) {
        sbWarn(`UNKNOWN AIRLINE CODE: ${after}`);
        return;
      }
      carrier = after;
    } else if (after.length > 0) {
      const found = sbFindAirline(after);
      if (!found) {
        sbWarn(`UNKNOWN AIRLINE: ${after}`);
        return;
      }
      carrier = found.code;
    }
  }

  if (!carrier) {
    if (sbState.booked.length > 0 && sbState.booked[0].al) {
      carrier = sbState.booked[0].al;
    } else {
      carrier = 'MH';
    }
  }

  const fare = sbGetFareForCarrier(carrier);
  sbState.privateFare = fare;
  sbState.pqPriced = true;
  sbState.pqPending = false;
  sbState.pqStoredInPNR = false;
  sbState.fareQuote = sbBuildFareQuote(fare);

  const printFare = text => sbPrint(text, 'fare-output');
  printFare('');
  printFare('          BASE FARE      EQUIV AMOUNT    TAXES/FEES/CHARGES');
  printFare(`1-        USD${fare.baseUsd.toFixed(2)}          BDT${sbState.fareQuote.base}             BDT${sbState.fareQuote.tax}XT      BDT${sbState.fareQuote.total}ADT           TOTAL:   BDT${sbState.fareQuote.total}`);
  printFare('     XT       500BD            4000UT                25000W             447E5');
  printFare('             4328YQ            1237P8                1237P7');
  printFare(`             ${fare.baseUsd.toFixed(2)}             ${fare.baseBdt}                 ${fare.tax}`);
  printFare('                                                   FOP FEES PER TICKET MAY APPLY');
  printFare('');
  printFare(`ADT-1     ${fare.fareBasis}`);
  printFare(fare.route);
  printFare(`RATE USED 1USD-${fare.rate.toFixed(2)}BDT`);
  printFare('CHNG FEE APPLY/REFUND FEE/APPLY/NO SHOW FEE APPLY');
  printFare(`VALIDATING CARRIER SPECIFIED - ${fare.carrier}`);
  printFare('BRANDED FARE /ECONOMY VALUE-ECONOMY VALUE');
  printFare('FORM OF PAYMENT FEES PER TICKET MAY APPLY');
  printFare('ADT          DESCRIPTION                              FEE       TKT TOTAL');
  printFare('             0BFCA - CC FEES                           0              0');
  printFare(`             0BFCA - CC NBR BEGINS WITH 223529       0          ${fare.total}`);
  if (sbState.fareQuote.pax > 1) {
    sbState.fareQuote.breakdown.forEach(item => printFare(`P${item.index} ${item.type}  BASE BDT${item.base}  TAX BDT${item.tax}  TOTAL BDT${item.total}`));
  }
}

function cmdPq() {
  if (!sbState.privateFare || !sbState.pqPriced) {
    sbWarn('NO FARE QUOTE ON FILE - ENTER WPA <AIRLINE> FIRST');
    return;
  }
  sbState.pqPending = true;
  sbPrint('*');
}

function cmdDisplayPq() {
  if (!sbState.privateFare && !sbState.fareQuote) {
    sbWarn('NO FARE RECORD EXISTS');
    return;
  }
  const fq = sbState.fareQuote;
  const fare = sbState.privateFare || {
    carrier: sbState.booked[0]?.al || 'MH',
    baseUsd: 310.00, baseBdt: fq.base, tax: fq.tax, total: fq.total,
    fareBasis: 'QLW1YM4'
  };
  const printFare = text => sbPrint(text, 'fare-output');
  printFare('');
  printFare(`PQ 1      VER-01  VALIDATING CARRIER - ${fare.carrier}`);
  printFare('----------------------------------------------------------------------');
  printFare(`ADT-1  BASE FARE: USD${fare.baseUsd?.toFixed(2) || '310.00'}  EQUIV: BDT${fq.base}`);
  printFare(`       TAXES:     BDT${fq.tax}XT`);
  printFare(`       TOTAL:     BDT${fq.total}`);
  printFare(`FARE BASIS: ${fare.fareBasis}  NVB/NVA`);
  if (fq.pax > 1) {
    fq.breakdown.forEach(item => printFare(`P${item.index} ${item.type}  BASE BDT${item.base}  TAX BDT${item.tax}  TOTAL BDT${item.total}`));
  }
}

/* ---------------------------------------------------------------------
   Issue Ticket — Sabre 2025 Lecture Sheet:
   • W¥PQ1¥AEY¥FCA¥KP0  (or WT / WTP)
--------------------------------------------------------------------- */
function cmdIssueTicket(raw) {
  if (!sbState.locator || !sbState.ended) { sbWarn('PNR NOT SAVED - END TRANSACTION (E) FIRST'); return; }
  if (!sbState.fareQuote) { sbWarn('NO FARE ON FILE - PRICE THE PNR FIRST (WPNCB)'); return; }
  if (!sbState.printerDesignated) {
    // For convenience in training, auto-designate printer if not assigned
    sbState.printerId = 'PR101';
    sbState.printerAssigned = true;
    sbState.printerDesignated = true;
  }
  if (sbState.ticketed) { sbWarn('ALREADY TICKETED - ' + sbState.eticketNumber); return; }

  sbState.ticketed = true;
  sbState.invoiced = true;
  sbState.eticketNumber = '618-' + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10);
  const passengerCount = Math.max(sbState.names.length, 1);
  sbState.ticketNumbers = Array.from({ length: passengerCount }, (_, index) => index === 0
    ? sbState.eticketNumber.replace('-', '')
    : '618' + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10));

  // Record sales for DQB*
  if (!window._sbGlobalSales) window._sbGlobalSales = [];
  sbState.ticketNumbers.forEach((tkt, idx) => {
    window._sbGlobalSales.push({
      ticketNo: tkt,
      pax: sbState.names[idx]?.raw || 'PASSENGER',
      fop: 'CASH',
      base: Math.round(sbState.fareQuote.base / passengerCount),
      tax: Math.round(sbState.fareQuote.tax / passengerCount),
      total: Math.round(sbState.fareQuote.total / passengerCount),
      currency: sbState.fareQuote.currency || 'BDT'
    });
  });

  sbPrint(`OK     ${sbState.fareQuote.total}`);
  sbPrint('ETR MESSAGE PROCESSED');
  if (sbState.locator) sbPrint(sbState.locator);
  sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

function cmdDisplayTicket() {
  if (!sbState.ticketed || !sbState.eticketNumber) { sbWarn('NO TICKET RECORD EXISTS'); return; }
  sbPrint('TKT/TIME LIMIT');
  sbPrint(` 1.${sbState.ticketingArrangement || 'T-AWAITING TICKET TIME LIMIT'}`);
  const tickets = sbState.ticketNumbers?.length ? sbState.ticketNumbers : [sbState.eticketNumber.replace('-', '')];
  tickets.forEach((ticketNo, index) => {
    const pax = sbState.names[index]?.surname || sbState.names[index]?.raw || 'PASSENGER';
    const type = sbPaxLabel(sbState.names[index]);
    sbPrint(` ${index + 2}.TE ${ticketNo}-BD ${pax} ${type} ${sbState.officeId}*ATW ${sbSabreFooterStamp()}*I`);
  });
}

/* ---------------------------------------------------------------------
   Void Ticket & Reports — Sabre 2025 Lecture Sheet:
   • WV2         → Void ticket on line 2
   • WV*         → Void report
   • DQB*        → Today's sales
   • DQB*17JAN   → Sales on specific date
--------------------------------------------------------------------- */
function cmdVoidTicket(raw) {
  const upper = raw.trim().toUpperCase();

  // WV* -> Void report
  if (upper === 'WV*') {
    const voids = window._sbGlobalVoids || [];
    sbPrint('VOID REPORT - WV*');
    sbPrint(`AGENT: ${sbState.agentSine}/${sbState.officeId}    DATE: ${sbGetSabreDate()}`);
    if (!voids.length) {
      sbPrint('NO VOIDED TRANSACTIONS TODAY');
      return;
    }
    sbPrint('LINE  TICKET NO         PAX NAME              TIME');
    voids.forEach((v, i) => {
      sbPrint(` ${String(i + 1).padStart(2)}   ${v.ticketNo.padEnd(16)} ${(v.pax || 'PASSENGER').padEnd(20)} ${v.time}`);
    });
    sbPrint(`TOTAL VOIDED TICKETS: ${voids.length}`);
    return;
  }

  if (!sbState.ticketed || !sbState.eticketNumber) {
    sbWarn('NO TICKET ON FILE TO VOID — ISSUE A TICKET FIRST');
    return;
  }

  const lineMatch = upper.match(/^WV(\d+)$/);
  let targetTicket = '';
  if (lineMatch) {
    const lineNum = parseInt(lineMatch[1], 10);
    const tktIdx = lineNum >= 2 ? lineNum - 2 : lineNum - 1;
    if (sbState.ticketNumbers && sbState.ticketNumbers[tktIdx]) {
      targetTicket = sbState.ticketNumbers[tktIdx];
    } else {
      targetTicket = (sbState.eticketNumber || '').replace('-', '');
    }
  } else {
    targetTicket = (sbState.eticketNumber || '').replace('-', '');
  }

  sbState.voided = true;
  sbState.ticketed = false;
  sbState.invoiced = false;
  sbState.voidedTicketNo = targetTicket;

  if (!window._sbGlobalVoids) window._sbGlobalVoids = [];
  window._sbGlobalVoids.push({
    ticketNo: targetTicket,
    pax: sbState.names[0]?.raw || 'PASSENGER',
    time: sbNowStamp().split('/')[1] || '1200Z'
  });

  sbPrint(`TICKET ${targetTicket} VOIDED`);
  sbPrint('VOID TRANSACTION COMPLETE');
  sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator} H M`);
  sbSyncSidePanel();
}

function cmdSalesReport(raw) {
  const upper = raw.trim().toUpperCase();
  const dateMatch = upper.match(/^DQB\*(?:(\d{2}[A-Z]{3}))?$/);
  const qDate = (dateMatch && dateMatch[1]) ? dateMatch[1] : sbGetSabreDate();

  sbPrint('DAILY SALES REPORT - DQB*');
  sbPrint(`AGENT: ${sbState.agentSine}/${sbState.officeId}      DATE: ${qDate}`);
  sbPrint('----------------------------------------------------------------------');
  sbPrint('TKT NO         PAX NAME              FORM/PAY    BASE        TAX       TOTAL');

  const sales = window._sbGlobalSales || [];
  if (!sales.length && sbState.ticketed) {
    sales.push({
      ticketNo: (sbState.eticketNumber || '').replace('-', ''),
      pax: sbState.names[0]?.raw || 'PASSENGER',
      fop: 'CASH',
      base: sbState.fareQuote?.base || 38000,
      tax: sbState.fareQuote?.tax || 7000,
      total: sbState.fareQuote?.total || 45000,
      currency: sbState.fareQuote?.currency || 'BDT'
    });
  }

  if (!sales.length) {
    sbPrint('NO SALES RECORDED FOR THIS DATE');
    sbPrint('----------------------------------------------------------------------');
    sbPrint('TOTAL TICKETS: 0   CASH: 0   CREDIT: 0   TOTAL SALES: 0');
    return;
  }

  let totalBase = 0;
  let totalTax = 0;
  let grandTotal = 0;
  sales.forEach(s => {
    sbPrint(`${s.ticketNo.padEnd(14)} ${(s.pax || 'PASSENGER').slice(0, 20).padEnd(21)} ${(s.fop || 'CASH').padEnd(11)} ${String(s.base).padEnd(11)} ${String(s.tax).padEnd(9)} ${s.total}`);
    totalBase += s.base || 0;
    totalTax += s.tax || 0;
    grandTotal += s.total || 0;
  });
  sbPrint('----------------------------------------------------------------------');
  sbPrint(`TOTAL TICKETS: ${sales.length}   TOTAL BASE: ${totalBase}   TAX: ${totalTax}   TOTAL SALES: ${grandTotal}`);
}

/* ---------------------------------------------------------------------
   Journey Record (JR) — Sabre 2025 Lecture Sheet:
   • JR                                              → Interactive mask
   • JR.JED/S-OYBOM15MAY                             → One-way search
   • JR.JED/S-OYBOM15MAY/S-OYJED25MAY/P-2ADT1C05     → RT search
--------------------------------------------------------------------- */
function cmdJR(raw) {
  const upper = raw.trim().toUpperCase();
  if (upper === 'JR') {
    if (typeof cmdFareShopJR === 'function') return cmdFareShopJR();
  }

  const m = upper.match(/^JR\.([A-Z]{3})\/S-O?([A-Z])([A-Z]{3})(\d{2}[A-Z]{3})(?:\/S-O?([A-Z])([A-Z]{3})(\d{2}[A-Z]{3}))?(?:\/P-(.*))?$/);
  if (m) {
    const org = m[1];
    const cls = m[2];
    const dst = m[3];
    const date = m[4];
    sbPrint('BARGAIN FINDER PLUS / JOURNEY RECORD SEARCH');
    sbPrint(`OUTBOUND: ${date} ${org} TO ${dst} CLASS ${cls}`);
    if (m[5]) {
      sbPrint(`INBOUND:  ${m[7]} ${m[6]} TO ${org} CLASS ${m[5]}`);
    }
    if (m[8]) {
      sbPrint(`PASSENGERS: ${m[8]}`);
    }
    sbPrint('----------------------------------------------------------------------');
    const options = sbGenerateAvailability(org, dst, date);
    if (options && options.length) {
      options.slice(0, 3).forEach((opt, i) => {
        const leg = opt.legs[0];
        sbPrint(`OPTION ${i + 1}: ${leg.al} ${leg.fn} ${cls} ${date} ${leg.dep} ${leg.arr} ${leg.depT} ${leg.arrT}  FARE: BDT ${32000 + i * 4500}`);
      });
    }
    return;
  }
  if (typeof cmdFareShopJR === 'function') return cmdFareShopJR();
}

/* ---------------------------------------------------------------------
   Queue Management — Sabre 2025 Lecture Sheet:
   • QC/           → Count queues
   • Q/9           → Access Q9
   • QP/PCC100/11  → Place PNR in queue
--------------------------------------------------------------------- */
function cmdQueuePlace(raw) {
  const upper = raw.trim().toUpperCase();
  if (upper === 'QC/' || upper === 'Q/') {
    sbPrint('QUEUE COUNTS:');
    sbPrint('QUEUE  COUNT  CATEGORY/DESCRIPTION');
    sbPrint(`  0      ${sbState.locator ? '1' : '0'}    GENERAL QUEUE`);
    sbPrint('  9      2    CONFIRMATION QUEUE');
    sbPrint(` 14      ${sbState.ticketed ? '0' : (sbState.locator ? '1' : '0')}    TICKETING QUEUE`);
    sbPrint(' 50      0    SCHEDULE CHANGE');
    return;
  }
  if (/^Q\/\d+$/.test(upper)) {
    const qNum = upper.replace(/^Q\//, '');
    sbPrint(`WORKING QUEUE ${qNum} - 1 OF 2 PNRs`);
    if (sbState.locator) {
      sbPrint(`PNR ${sbState.locator} ACCESSED FROM QUEUE ${qNum}`);
      sbPrint(sbRenderPNR());
    } else {
      sbPrint('QUEUE 9 ENTRY: 1.1KHAN/ABDULLAH MR  MH 102 Y 20NOV DAC KUL HK1');
    }
    return;
  }
  if (upper.startsWith('QP/')) {
    const parts = upper.split('/');
    const pcc = parts[1] || 'PCC100';
    const qNum = parts[2] || '11';
    sbPrint(`PNR ${sbState.locator || 'ACTIVE'} PLACED ON QUEUE ${qNum} AT ${pcc}`);
    sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator || 'PNR'} H M`);
    return;
  }

  const qNum = raw.match(/^QS(\d+)$/)?.[1] || raw.match(/^QEP(?:(\d+))?$/)?.[1] || '14';
  sbPrint(`PNR ${sbState.locator || 'ACTIVE'} PLACED ON QUEUE ${qNum}`);
  sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator || 'PNR'} H M`);
}

/* ---------------------------------------------------------------------
   Display Commands — Sabre 2025 Lecture Sheet:
   • *A   → All PNR
   • *N   → Names only
   • *I   → Itinerary only
   • *P3D → Documents
   • *PQ  → Price Quotation
--------------------------------------------------------------------- */
function cmdDisplayName() {
  if (!sbState.names.length) { sbWarn('NO NAMES IN PNR'); return; }
  sbPrint('PASSENGER NAMES');
  sbState.names.forEach((n, i) => sbPrint(` 1.${i + 1}${n.raw}`));
}

function cmdDisplayItinerary() {
  if (!sbState.booked.length) { sbWarn('NO ITINERARY SEGMENTS'); return; }
  const weekDays = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  sbPrint('ITINERARY');
  sbState.booked.forEach((s, i) => {
    const dayName = weekDays[Number(s.day)] || '---';
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    sbPrint(` ${i + 1} ${s.al.padEnd(4)} ${s.fn.padEnd(4)} ${s.cls} ${s.date} ${dayName}  ${s.dep} ${s.arr} ${s.status}  ${s.depT}  ${s.arrT}${dayOverTag}`);
  });
}

function cmdDisplayPhone() {
  if (!sbState.phones.length) { sbWarn('NO PHONE RECORD'); return; }
  sbPrint('PHONES');
  sbState.phones.forEach((p, i) => sbPrint(` ${i + 1}.${p.raw}`));
}

function cmdDisplayTicketing() {
  if (!sbState.ticketingArrangement) { sbWarn('NO TICKETING ARRANGEMENT'); return; }
  sbPrint('TICKETING ARRANGEMENT');
  sbPrint(` 1.${sbState.ticketingArrangement}`);
}

function cmdDisplayReceived() {
  if (!sbState.receivedFrom) { sbWarn('NO RECEIVED FROM'); return; }
  sbPrint(`RECEIVED FROM - ${sbState.receivedFrom}`);
}

function cmdDisplaySSR() {
  if (!sbState.ssrEntries.length) { sbWarn('NO SSR ENTRIES'); return; }
  sbPrint('SPECIAL SERVICE REQUESTS');
  sbState.ssrEntries.forEach((s, i) => sbPrint(` ${i + 1}.${typeof s === 'string' ? s : s.text}`));
}

function cmdDisplayDocs() {
  if (!sbState.documents.length) { sbWarn('NO APIS/DOCS INFORMATION ON FILE — ADD WITH 3DOCS/P/...'); return; }
  sbPrint('SEC TRAVELER DOC');
  sbState.documents.forEach((doc, index) => {
    const paxRef = doc.paxRef || 1;
    const pax = sbState.names[paxRef - 1]?.raw || 'PASSENGER';
    const text = doc.raw.replace(/^DOCS\//, '').replace(/-\d+\.\d+$/, '');
    sbPrint(` ${index + 1}.SSR DOCS ${doc.carrier} HK1/${text}  1.${paxRef} ${pax}`);
  });
}

function cmdDisplayPassengerDetail() {
  if (!sbState.names.length) { sbWarn('NO PASSENGER DATA ON FILE'); return; }
  sbPrint('PASSENGER DETAIL');
  sbState.names.forEach((pax, index) => {
    sbPrint(`PAX ${index + 1}: ${pax.raw}`);
    const doc = sbState.documents.find(d => d.paxRef === index + 1);
    if (doc) sbPrint(`  DOC: ${doc.raw}`);
  });
}

/* ---------------------------------------------------------------------
   Printer Assignment
--------------------------------------------------------------------- */
function cmdPrinterWorkArea() {
  sbPrint('WORK AREA PRINTER STATUS');
  sbPrint(`CURRENT PRINTER ASSIGNED: ${sbState.printerId ? sbState.printerId : 'NONE'}`);
}
function cmdPrinterAssign(raw) {
  const id = raw.slice(4).trim().toUpperCase();
  if (!id) { sbWarn('FORMAT: DSIV<PRINTER ID>'); return; }
  sbState.printerId = id;
  sbState.printerAssigned = true;
  sbPrint(`PRINTER ${id} ASSIGNED TO WORK AREA`);
}
function cmdPrinterDesignate(raw) {
  const id = raw.slice(4).trim().toUpperCase();
  if (!id) { sbWarn('FORMAT: PTR/<PRINTER ID>'); return; }
  if (sbState.printerId && sbState.printerId !== id) {
    sbWarn(`PRINTER ${id} DOES NOT MATCH ASSIGNED PRINTER ${sbState.printerId}`);
    return;
  }
  sbState.printerId = id;
  sbState.printerDesignated = true;
  sbPrint(`PRINTER ${id} DESIGNATED FOR TICKETING`);
}

/* ---------------------------------------------------------------------
   End / Ignore / Redisplay
--------------------------------------------------------------------- */
function cmdEndTransaction(redisplay) {
  if (!sbState.names.length && !sbState.booked.length) {
    sbWarn('NO CURRENT ITINERARY OR PASSENGER — NOTHING TO STORE');
    return;
  }
  if (!sbState.names.length) { sbWarn('NAME REQUIRED — ENTER -<SURNAME>/<FIRSTNAME>'); return; }
  if (!sbState.phones.length) { sbWarn('PHONE REQUIRED — ENTER 9<PHONE>'); return; }
  if (!sbState.ticketingArrangement) { sbWarn('TICKETING ARRANGEMENT REQUIRED — ENTER 7TAW/ OR 7T-'); return; }
  if (!sbState.receivedFrom) { sbWarn('RECEIVED FROM REQUIRED — ENTER 6<NAME>'); return; }
  if (!sbState.booked.length) { sbWarn('ITINERARY REQUIRED — SELL A SEGMENT FIRST'); return; }

  // Verify child and infant age limits
  for (const p of (sbState.names || [])) {
    if (p.paxType === 'CHD' && p.age) {
      const c = parseInt(p.age, 10);
      if (c < 2 || c >= 12) {
        sbPrint('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        return;
      }
    }
    if (p.paxType === 'INF' && p.age) {
      const m = parseInt(p.age, 10);
      if (m < 1 || m >= 24) {
        sbPrint('INFANT AGE DATA REQUIRED USE *I1/I01-*I23.NOT ENT BGNG WITH');
        return;
      }
    }
  }

  // Party size validation: Number of seated names must equal reserved seats
  const seatedPaxCount = (sbState.names || []).filter(n => n.paxType !== 'INF').length;
  let reservedSeats = 0;
  for (const seg of (sbState.booked || [])) {
    const m = (seg.status || '').match(/^(?:SS|HK)(\d+)/);
    if (m) {
      reservedSeats = parseInt(m[1], 10);
      break;
    }
  }
  if (reservedSeats > 0 && seatedPaxCount !== reservedSeats) {
    sbPrint('NUMBER OF NAMES NOT EQUAL TO RESERVATIONS');
    return;
  }

  // Child / Infant DOB SSR validation
  const hasChild = (sbState.names || []).some(n => n.paxType === 'CHD');
  const hasInfant = (sbState.names || []).some(n => n.paxType === 'INF');
  const hasChildSSR = (sbState.ssrEntries || []).some(s => /CHLD/i.test(typeof s === 'string' ? s : (s.text || '')));
  const hasInfantSSR = (sbState.ssrEntries || []).some(s => /INFT|INF\//i.test(typeof s === 'string' ? s : (s.text || '')));

  const errMessages = [];
  if (hasChild && !hasChildSSR) {
    errMessages.push('CHILD DETAILS REQUIRED IN SSR - ENTER 3CHLD/...');
  }
  if (hasInfant && !hasInfantSSR) {
    errMessages.push('INFANT DETAILS REQUIRED IN SSR - ENTER 3INFT/...');
  }

  if (errMessages.length > 0) {
    if (typeof sbPrintSsrError === 'function') {
      sbPrintSsrError(errMessages);
    } else {
      errMessages.forEach(m => sbPrint(m, 'line-warn'));
    }
    if (typeof sbOpenChdInfPrompt === 'function') {
      sbOpenChdInfPrompt(true);
    }
    return;
  }

  if (!sbState.locator) {
    sbState.locator = sbRandomLocator();
    sbState.dateStamp = sbSabreFooterStamp();
  }
  sbState.ended = true;
  sbState.booked.forEach(s => {
    s.status = s.status.replace(/^SS/, 'HK');
  });

  sbPnrStorePut(sbState);
  sbPrint(sbState.locator);
  if (redisplay) {
    sbPrint('RECORD LOCATOR REQUESTED');
    sbPrint(sbRenderPNR(true));
    if (typeof sbPrintDcMessage === 'function') {
      sbPrintDcMessage();
    }
  }
  sbSyncSidePanel();
}

function cmdRedisplay() {
  sbPrint(sbRenderPNR(false));
}

function cmdIgnore() {
  sbState = sbEmptyState();
  sbPrint('OK');
  sbSyncSidePanel();
}

function cmdIgnoreRedisplay() {
  if (sbState.locator) {
    const store = sbPnrStoreLoad();
    if (store[sbState.locator]) {
      sbState = JSON.parse(JSON.stringify(store[sbState.locator]));
      sbPrint(sbState.locator);
      sbPrint(sbRenderPNR(false));
      sbSyncSidePanel();
      return;
    }
  }
  sbState = sbEmptyState();
  sbPrint('OK');
  sbSyncSidePanel();
}

function cmdPqDelete(raw) {
  sbState.fareQuote = null;
  sbState.privateFare = null;
  sbState.pqPriced = false;
  sbState.pqPending = false;
  sbPrint('*');
}

function cmdRefund(raw) {
  if (!sbState.voided && !sbState.ticketed) {
    sbWarn('NO TICKET TO REFUND');
    return;
  }
  sbState.refunded = true;
  sbPrint('REFUND PROCESSED');
}

function cmdReissue() {
  if (!sbState.ticketed) {
    sbWarn('NO TICKET ON FILE TO REISSUE');
    return;
  }
  sbPrint('REISSUE TRANSACTION COMPLETE');
}

function cmdChangeDocs(raw) {
  cmdSSR(raw);
}

function cmdHelp() {
  sbPrint('SABRE 2025 LECTURE SHEET COMMAND SUMMARY:');
  sbPrint('  AVAILABILITY: 120DECJEDAUH  120DECJEDAUH¥EY  120DECJEDAUH-Q');
  sbPrint('  SELL/ARNK:    0Y1  01Y1  0AA (ARNK)  ,3 (party size)');
  sbPrint('  MODIFY:       WCAJ (all to J)  WC1-2J/3-4Y  X1¤0025DEC (rebook)');
  sbPrint('  NAME:         -KHAN/ABDULLAH MR  -KHAN/SONIA MISS*C10  -I/KHAN/ALI MSTR*I17');
  sbPrint('  MANDATORY:    9<PHONE>  6P  7TAW/ or 7T-');
  sbPrint('  SSR/OSI:      3CTCM/<MOBILE>-1  3CTCE/<EMAIL>-1  3AVML2-1  3CHLD/...');
  sbPrint('  REMARKS:      5PSGR ADV FARE SAR 1500  *P5 (display)  51¤ (delete)');
  sbPrint('  FREQ FLYER:   FFGF123456-1  *FF (display)  FF1¤ (delete)');
  sbPrint('  EMAIL:        PE¥test@gmail.com¥-1  *PE (display)  PE1¤ (delete)');
  sbPrint('  SPLIT:        D2 (divide pax 2)  F (file)  ER');
  sbPrint('  CLONE:        IC (clone itn)  ICX1 (clone except seg 1)');
  sbPrint('  FARE QUOTE:   FQJEDKHI24JAN-SV');
  sbPrint('  PRICE/TICKET: WPABG  WPNCB  PQ  W¥PQ1¥AEY¥FCA¥KP0  WV2 (void)  WV* (report)');
  sbPrint('  SALES:        DQB* (today)  DQB*17JAN');
  sbPrint('  CALENDAR:     T¤FEB  T¤25FEB¥80');
  sbPrint('  SIGN IN/OUT:  SI*1001  SO*');
  sbPrint('  ENCODE/DECODE:W/-CCDHAKA  W/*DAC  W/-APNARITA  W/-ALBIMAN BANGLADESH');
}

/* ---------------------------------------------------------------------
   PNR Local Storage Persistence
--------------------------------------------------------------------- */
function sbPnrStoreLoad() {
  try {
    const raw = localStorage.getItem('sabre_pnr_store');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function sbPnrStoreSave(store) {
  try { localStorage.setItem('sabre_pnr_store', JSON.stringify(store)); } catch (e) {}
}
function sbPnrStorePut(state) {
  if (!state || !state.locator) return;
  const store = sbPnrStoreLoad();
  store[state.locator] = JSON.parse(JSON.stringify(state));
  sbPnrStoreSave(store);
}
function cmdRetrieve(raw) {
  const locator = raw.trim().toUpperCase().replace(/^\*/, '');
  const store = sbPnrStoreLoad();
  if (store[locator]) {
    sbState = JSON.parse(JSON.stringify(store[locator]));
    sbPrint(sbRenderPNR());
    sbSyncSidePanel();
    return;
  }
  sbWarn(`RECORD LOCATOR ${locator} NOT FOUND`);
}
function cmdOpenAllPNR() {
  const store = sbPnrStoreLoad();
  const keys = Object.keys(store);
  if (!keys.length) { sbWarn('NO STORED PNRS FOUND'); return; }
  sbPrint('STORED PNRS:');
  keys.forEach((k, i) => {
    const p = store[k];
    const name = p.names?.[0]?.raw || 'NO NAME';
    sbPrint(` ${i + 1}. *${k} - ${name}`);
  });
}
function cmdSharePNR() {
  if (!sbState.locator) { sbWarn('NO ACTIVE SAVED PNR TO SHARE'); return; }
  const payload = btoa(JSON.stringify(sbState));
  const url = `${window.location.origin}${window.location.pathname}#pnr=${payload}`;
  sbPrint(`SHAREABLE PNR URL:`);
  sbPrint(url);
}

/* ---------------------------------------------------------------------
   PARSER — dispatch table, checked in order (most specific first)
--------------------------------------------------------------------- */
function sbParse(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  const upper = cmd.toUpperCase();

  // ── Journey Record (JR) — PDF: JR  JR.JED/S-OYBOM15MAY... ─────────────
  if (/^JR(?:\.|\s|$)/i.test(upper)) return cmdJR(upper);

  // ── Time Calculator — PDF: T¤FEB  T¤25FEB¥80 ─────────────────────────
  if (/^T[¤*]/i.test(upper)) return cmdTimeCalc(upper);

  // ── Sign In / Sign Out — PDF: SI*1001  SI1002  SO*  SO ───────────────
  if (/^SI\*?[0-9A-Z]*$/i.test(upper)) return cmdSignIn(upper);
  if (/^SO\*?$/i.test(upper)) return cmdSignOut(upper);

  // ── Encode / Decode — PDF: W/-CC... W/*... W/-AP... W/-AL... HCCC/...
  if (/^(?:W\/[-*]|W\/EQ|HCCC\/|HCC)/i.test(upper)) return cmdEncodeDecode(upper);

  // ── Printer assignment ───────────────────────────────────────────────
  if (/^W\*BD$/.test(upper)) return cmdPrinterWorkArea();
  if (/^DSIV[A-Z0-9]+$/.test(upper)) return cmdPrinterAssign(upper);
  if (/^PTR\/[A-Z0-9]+$/.test(upper)) return cmdPrinterDesignate(upper);

  // ── Issue Ticket — PDF: W¥PQ1¥AEY¥FCA¥KP0  WT  WTP ───────────────────
  if (/^W[¥☨‡§]PQ|^WT$|^WTP$/i.test(upper)) return cmdIssueTicket(upper);

  // ── Void / Void Report — PDF: WV2  WV*  VOID ─────────────────────────
  if (/^WV\*$|^WV\d+$|^VOID$|^WV/i.test(upper)) return cmdVoidTicket(upper);

  // ── Sales Report — PDF: DQB*  DQB*17JAN ──────────────────────────────
  if (/^DQB\*/i.test(upper)) return cmdSalesReport(upper);

  // ── Fare pricing & Quotes — PDF: WPABG  WP  WPNCB  FQJEDKHI24JAN-SV ──
  if (/^WPNCB$|^WPNI$/.test(upper)) return cmdPriceQuote();
  if (/^WPA(?:[A-Z0-9]{2}|\s+.+)?$/.test(upper) || /^WP$/i.test(upper)) return cmdWpa(upper);
  if (/^WPQD\d*$/.test(upper)) return cmdPqDelete(upper);
  if (/^FQ/i.test(upper)) return cmdFareQuote(upper);

  // ── PQ display & store — PDF: PQ  *PQ ─────────────────────────────────
  if (/^PQ$/i.test(upper)) return cmdPq();
  if (/^\*PQ(?:\s*\d+)?$|^\*PQS$|^3PQ$/i.test(upper)) return cmdDisplayPq();

  // ── Availability — PDF: 120DECJEDAUH  120DECJEDAUH¥EY  120DECJEDAUH-Q 
  if (/^1\d{2}[A-Z]{3}[A-Z]{6}/i.test(upper)) return cmdAvailability(upper);

  // ── Sell flight / ARNK / Party — PDF: 0Y1  01Y1  0AA  ,3 ─────────────
  if (/^0AA$/i.test(upper)) return cmdSellARNK();
  if (/^0\d?[A-Z]\d+$/i.test(upper)) return cmdSell(upper);
  if (/^,\d+$/i.test(upper)) return cmdChangeParty(upper);

  // ── Modify Booking — PDF: WCAJ  WC1-2J/3-4Y  X1¤0025DEC ───────────────
  if (/^WCA[A-Z]$|^WC\d/i.test(upper)) return cmdChangeStatus(upper);
  if (/^X\d+[¤*]0*\d{2}[A-Z]{3}$/i.test(upper)) return cmdRebookSegment(upper);

  // ── Name field — PDF: -KHAN/ABDULLAH MR  -KHAN/SONIA MISS*C10  -I/... 
  if (/^-/.test(upper)) return cmdName(upper);

  // ── Mandatory PNR fields — PDF: 9...  6P  7TAW/  7T- ─────────────────
  if (/^9/.test(upper)) return cmdPhone(upper);
  if (/^6/.test(upper)) return cmdReceivedFrom(upper);
  if (/^7/.test(upper)) return cmdTicketingArrangement(upper);

  // ── Frequent Flyer — PDF: FFGF123456-1  *FF  FF1¤ ────────────────────
  if (/^FF\d+[¤*]$|^FF[A-Z0-9]{2}/i.test(upper)) return cmdFF(upper);
  if (/^\*FF$/i.test(upper)) return cmdDisplayFF();

  // ── Email — PDF: PE¥email@gmail.com¥-1  *PE  PE1¤ ────────────────────
  if (/^PE\d+[¤*]$|^PE[¥☨‡§*]/i.test(upper)) return cmdEmail(upper);
  if (/^\*PE$/i.test(upper)) return cmdDisplayEmail();

  // ── Split PNR — PDF: D2  F  ER ───────────────────────────────────────
  if (/^D\d+$/i.test(upper)) return cmdDivide(upper);
  if (/^F$/i.test(upper)) return cmdFileSplit();

  // ── Clone PNR — PDF: IC  ICX1 ────────────────────────────────────────
  if (/^IC|^ICX/i.test(upper)) return cmdClone(upper);

  // ── SSR / OSI / Docs — PDF: 3CTCM/...  3CTCE/...  3AVML2-1  32.XX ────
  if (/^3DOCS\//.test(upper) && sbState.documents.length) return cmdChangeDocs(upper);
  if (/^3/.test(upper)) return cmdSSR(upper);
  if (/^4\//.test(upper)) return cmdOSI(upper);

  // ── Remarks — PDF: 5PSGR ADV FARE SAR 1500  *P5  51¤ ─────────────────
  if (/^5/.test(upper)) return cmdRemarks(upper);

  // ── Void / Refund / Reissue ──────────────────────────────────────────
  if (/^(RFND|REFUND)$/.test(upper)) return cmdRefund(upper);
  if (/^(REISSUE|WREISSUE)$/.test(upper)) return cmdReissue();

  // ── Queue — PDF: QC/  Q/9  QP/PCC100/11 ──────────────────────────────
  if (/^QC\/$|^Q\/\d+$|^QP\/.+$/.test(upper)) return cmdQueuePlace(upper);
  if (/^QEP\d*$|^QS\d+$|^Q\/$/.test(upper)) return cmdQueuePlace(upper);

  // ── Cancel / End / Ignore — PDF: XI  X1-2  X1  ER  IR  I ─────────────
  if (/^XI$|^X\d+/i.test(upper)) return cmdCancelFlights(upper);
  if (/^XE\d+$|^XK\d+$/i.test(upper)) return cmdCancelFlights(upper);
  if (/^ER?$/.test(upper)) return cmdEndTransaction(upper === 'ER');
  if (/^IR$/.test(upper)) return cmdIgnoreRedisplay();
  if (/^I$|^IG$/.test(upper)) return cmdIgnore();

  // ── Display commands — PDF: *A  *N  *I  *P3D  *PQ ────────────────────
  if (/^\*-$|^\*-ALL$|^\*N$/.test(upper)) return cmdDisplayName();
  if (/^\*I$|^\*ITN$/.test(upper)) return cmdDisplayItinerary();
  if (/^\*P$|^\*9$|^\*P9$/.test(upper)) return cmdDisplayPhone();
  if (/^\*7$|^\*P7$/.test(upper)) return cmdDisplayTicketing();
  if (/^\*6$|^\*P6$/.test(upper)) return cmdDisplayReceived();
  if (/^\*P3D$|^\*P4D$/.test(upper)) return cmdDisplayDocs();
  if (/^\*T$/.test(upper)) return cmdDisplayTicket();
  if (/^\*3$|^\*P3?$|^\*SSR$/.test(upper)) return cmdDisplaySSR();
  if (/^\*5$|^\*RM$|^\*P5$/.test(upper)) return cmdDisplayRemarks();
  if (/^\*PD$|^PD$/.test(upper)) return cmdDisplayPassengerDetail();
  if (/^\*ALL$|^OPEN$|^OPENPNR$/.test(upper)) return cmdOpenAllPNR();
  if (/^SHAREPNR$|^SHARE$/.test(upper)) return cmdSharePNR();
  if (/^\*A$|^\*R$|^\*$/.test(upper)) return cmdRedisplay();
  if (/^\*[A-Z0-9]{5,6}$/.test(upper)) return cmdRetrieve(upper);

  if (/^HELP$|^\?$/.test(upper)) return cmdHelp();

  sbWarn(`FORMAT INVALID - ${upper} NOT RECOGNIZED — TYPE HELP FOR COMMAND LIST`);
}

/* ---------------------------------------------------------------------
   HOOK INTO SHELL — handles Cross of Lorraine (¥) chaining and qualifiers
--------------------------------------------------------------------- */
function sendCmd() {
  const input = document.getElementById('cmdInput');
  const val = input.value.trim().replace(/«$/, '');
  if (!val) return;
  if (typeof sbRememberCommand === 'function') sbRememberCommand(val.toUpperCase());

  if (typeof window !== 'undefined') window._sbSuppressScrollToBottom = true;
  let echo = null;
  if (typeof sbEcho === 'function') echo = sbEcho(val);

  try {
    // Check if command uses Cross of Lorraine (¥/☨/‡/§) as an internal qualifier:
    // e.g.:
    // - W¥... (Issue ticket: W¥PQ1¥AEY¥FCA¥KP0)
    // - 1<date><pair>¥... (Availability airline qualifier: 120DECJEDAUH¥EY)
    // - T[¤*]...¥... (Time calc: T¤25FEB¥80)
    // - PE¥... (Passenger email: PE¥email@gmail.com¥-1)
    const isInternalQualifier = /^W[¥☨‡§]/i.test(val) ||
                                /^1\d{2}[A-Z]{3}[A-Z]{6}[¥☨‡§]/i.test(val) ||
                                /^T[¤*].*[¥☨‡§]/i.test(val) ||
                                /^PE[¥☨‡§]/i.test(val);

    if (isInternalQualifier) {
      sbParse(val);
    } else {
      val.split(/[¥☨‡§]/).map(entry => entry.trim()).filter(Boolean).forEach(sbParse);
    }
  } finally {
    if (typeof window !== 'undefined') window._sbSuppressScrollToBottom = false;
  }

  input.value = '';

  if (echo && typeof sbScrollToCommand === 'function') {
    sbScrollToCommand(echo);
  }
}
