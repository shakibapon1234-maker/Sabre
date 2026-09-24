/* =========================================================================
   SABRE TRAINING SIMULATOR — COMMAND HANDLERS + PARSER (Phase 1: to Issue)
   Independent educational tool — no affiliation with Sabre Corporation.
   Not connected to any live GDS.
   ========================================================================= */

/* ---------------------------------------------------------------------
   W/-XXX  — encode/decode a 3-letter city/airport code
--------------------------------------------------------------------- */
function cmdEncodeDecode(arg) {
  const query = arg.trim().toUpperCase().replace(/^C(?:OUNTRY)?\s+/, '');
  if (query === 'COUNTRIES' || query === 'COUNTRY LIST') {
    sbPrint('TRAINING COUNTRY CODES (ISO)');
    Object.entries(SB_COUNTRY_CODES).forEach(([code, country]) => sbPrint(`${code}  ${country}`));
    return;
  }
  const info = SB_AIRPORTS[query];
  if (info) { sbPrint(`${query}  ${info.city}/${info.name}/${info.country}`); return; }

  const aliases = { ...Object.fromEntries(Object.entries(SB_COUNTRY_CODES).map(([code, country]) => [code, country])), UAE: 'UAE', UK: 'UK', USA: 'USA' };
  const country = aliases[query] || query;
  const isCountryQuery = Object.values(SB_COUNTRY_CODES).includes(country);
  const matches = Object.entries(SB_AIRPORTS)
    .filter(([, airport]) => isCountryQuery
      ? airport.country === country
      : airport.city.includes(query) || airport.name.includes(query))
    .slice(0, 12);
  if (matches.length) {
    const heading = matches[0][1].country === country ? `AIRPORTS IN ${country}` : `CODE SEARCH - ${query}`;
    sbPrint(heading);
    matches.forEach(([code, airport]) => sbPrint(`${code}  ${airport.city} / ${airport.name} / ${airport.country}`));
    return;
  }
  sbWarn(`NO AIRPORT OR COUNTRY MATCH - ${query} NOT IN TRAINING DATABASE`);
}

/* ---------------------------------------------------------------------
   1  DDMMMCITYCITY — availability display (direct + connections)
--------------------------------------------------------------------- */
function cmdAvailability(raw) {
  const m = raw.match(/^1(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})$/);
  if (!m) { sbWarn("FORMAT: 1<DDMMM><ORG><DST>  e.g. 120NOVDACBKK"); return; }
  const [, date, org, dst] = m;

  if (org === dst) { sbWarn("ORIGIN AND DESTINATION CANNOT BE THE SAME"); return; }
  if (!SB_AIRPORTS[org] || !SB_AIRPORTS[dst]) {
    sbWarn(`UNABLE TO BUILD AVAILABILITY - ${(!SB_AIRPORTS[org] ? org : dst)} NOT IN TRAINING DATABASE`);
    return;
  }

  const options = sbGenerateAvailability(org, dst, date);
  if (!options) { sbWarn(`NO SERVICE FOUND ${org}${dst} ${date}`); return; }

  sbState._availCache = options.map(opt => ({
    date, dep: opt.legs[0].dep, arr: opt.legs[opt.legs.length - 1].arr, legs: opt.legs
  }));
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
   0<CLASS><LINE> — sell from displayed availability (all legs of that
   option are booked; a connection therefore adds 2 PNR lines)
--------------------------------------------------------------------- */
function cmdSell(raw, quantity = 1) {
  const m = raw.match(/^0([A-Z])(\d+)$/);
  if (!m) { sbWarn("FORMAT: 0<CLASS><LINE>  e.g. 0Y1"); return false; }
  const [, cls, lineStr] = m;
  const line = parseInt(lineStr, 10);
  const cache = sbState._availCache;
  if (!cache) { sbWarn("NO AVAILABILITY DISPLAYED - USE 1 ENTRY FIRST"); return false; }
  if (sbState.booked.length > 0 && !sbState.ended) {
    sbWarn("UNSAVED SEAT HOLD EXISTS - ENTER E/ER TO CREATE PNR OR XI TO IGNORE BEFORE A NEW HOLD");
    return false;
  }
  const opt = cache[line - 1];
  if (!opt) { sbWarn(`LINE ${line} NOT FOUND IN LAST AVAILABILITY DISPLAY`); return false; }

  sbPrint("BOOKING STATUS: SEGMENTS ADDED TO PNR", "sb-booking-status");
  const weekDays = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  opt.legs.forEach(leg => {
    sbState.booked.push({
      al: leg.al, fn: leg.fn, cls, date: opt.date, dep: leg.dep, arr: leg.arr,
      status: `SS${quantity}`, depT: leg.depT || "----", arrT: leg.arrT || "----",
      eq: leg.eq, day: leg.day, dayOver: leg.dayOver
    });
    const s = sbState.booked[sbState.booked.length - 1];
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    const dayName = weekDays[Number(s.day)] || '---';
    sbPrint(` ${sbState.booked.length} ${s.al.padEnd(5)} ${s.fn.padEnd(4)} ${s.cls.padEnd(2)} ${s.date} ${dayName}  ${s.dep.padEnd(4)} ${s.arr.padEnd(4)} ${s.status.padEnd(4)} ${s.depT}  ${s.arrT}${dayOverTag}`);
  });
  return true;
}

/* ---------------------------------------------------------------------
   -SURNAME/FIRST MR  — name field (chain multiple entries for group PNRs)
--------------------------------------------------------------------- */
function cmdName(raw) {
  const body = raw.replace(/^-/, '').trim();
  const nm = body.match(/^([A-Z' -]+)\/([A-Z' ]+)\s+(MR|MRS|MS|MSTR|MISS|DR)?$/i);
  if (!nm) { sbWarn("FORMAT: -SURNAME/FIRSTNAME MR"); return; }
  sbState.names.push({ raw: body.toUpperCase(), surname: nm[1].trim(), first: nm[2].trim(), title: (nm[3] || '').toUpperCase() });
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   9<CITY><NUMBER>-<TYPE>  — phone field
--------------------------------------------------------------------- */
function cmdPhone(raw) {
  const body = raw.replace(/^9\s*/, '').trim();
  if (!body) { sbWarn("FORMAT: 9 <PHONE/AGENCY/CONTACT DETAILS>"); return; }
  sbState.phones.push({ raw: body.toUpperCase() });
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   6<NAME>  — received from field
--------------------------------------------------------------------- */
function cmdReceivedFrom(raw) {
  const body = raw.replace(/^6\s*/, '').trim();
  if (!body) { sbWarn("FORMAT: 6<AGENT/PASSENGER NAME>"); return; }
  sbState.receivedFrom = body.toUpperCase();
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   7TAW-DDMMM/  — ticketing arrangement / time limit
--------------------------------------------------------------------- */
function cmdTicketingArrangement(raw) {
  const body = raw.replace(/^7/, '').trim();
  if (!body) { sbWarn("FORMAT: 7TAW-DDMMM/  e.g. 7TAW-20DEC/"); return; }
  sbState.ticketingArrangement = body.toUpperCase();
  sbPrint('*');

}

/* ---------------------------------------------------------------------
   3<SSRCODE>/P<N>  — special service request (meal, docs, etc.)
--------------------------------------------------------------------- */
function cmdSSR(raw) {
  const body = raw.replace(/^3/, '').trim();
  if (!body) { sbWarn("FORMAT: 3<SSRCODE>/P1  e.g. 3VGML/1"); return; }
  const paxRefMatch = body.match(/\/P?(\d+)$/i);
  if (paxRefMatch) {
    const paxNum = parseInt(paxRefMatch[1], 10);
    if (sbState.names.length && paxNum > sbState.names.length) {
      sbWarn(`INVALID PASSENGER REFERENCE - ONLY ${sbState.names.length} NAME(S) IN PNR`);
      return;
    }
  }
  sbState.ssrEntries.push(body.toUpperCase());
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   WPNCB / WPNI — price the PNR (simplified flat training fare, scaled
   by segment count and passenger count)
--------------------------------------------------------------------- */
function cmdPriceQuote() {
  if (sbState.booked.length === 0) { sbWarn("NO SEGMENTS BOOKED - SELL A SEGMENT FIRST"); return; }
  const pax = Math.max(sbState.names.length, 1);
  const segMultiplier = Math.max(sbState.booked.length, 1);
  const base = 14500 * segMultiplier * pax;
  const tax = Math.round(base * 0.19);
  sbState.fareQuote = { base, tax, total: base + tax, currency: "BDT", pax };
  sbPrint(`FARE  BDT${base}  TAX BDT${tax}  TOTAL BDT${base + tax}` + (pax > 1 ? `  (${pax} PAX)` : ''));
  sbPrint(`** THIS IS A SIMULATED TRAINING FARE — NOT LIVE PRICING **`, 'line-warn');
}

/* ---------------------------------------------------------------------
   E / ER — end transaction (save PNR, generate locator if new)
--------------------------------------------------------------------- */
function cmdEndTransaction(redisplay) {
  if (sbState.names.length === 0) { sbWarn("CANNOT END - NAME FIELD REQUIRED"); return; }
  if (sbState.booked.length === 0) { sbWarn("CANNOT END - AT LEAST ONE SEGMENT REQUIRED"); return; }
  if (!sbState.locator) {
    sbState.locator = sbRandomLocator();
    sbState.dateStamp = sbNowStamp();
    sbState.booked.forEach(s => {
      s.status = s.status.replace(/^SS/, 'HK');
    });
  }
  sbState.ended = true;
  sbPrint('DIRECT CONNECT IN PROGRESS, PLEASE WAIT', 'line-pnr');
  sbPrint('', 'line-pnr');
  if (redisplay) {
    if (sbState.locator) sbPrint(sbState.locator, 'line-pnr');
    sbPrint(sbRenderPNR(), 'line-pnr');
  } else {
    sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator} H M`, 'line-pnr');
  }
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   *R — redisplay current PNR
--------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   DISPLAY COMMANDS (*-, *I, *P/*9, *7, *6, *3)
--------------------------------------------------------------------- */
function cmdDisplayName() {
  if (!sbState.names.length) { sbWarn("NO NAMES IN PNR"); return; }
  sbState.names.forEach((n, i) => sbPrint(` ${i + 1}.${n.raw}`));
}

/* ---------------------------------------------------------------------
   WPA <AIRLINE> / PQ / 3PQ — carrier fare-load training flow
--------------------------------------------------------------------- */
function sbFindAirline(query) {
  const value = query.trim().toUpperCase().replace(/\s+/g, ' ');
  if (SB_AIRLINES[value]) return { code: value, ...SB_AIRLINES[value] };
  const matches = Object.entries(SB_AIRLINES)
    .filter(([, airline]) => airline.name === value)
    .map(([code, airline]) => ({ code, ...airline }));
  return matches.length === 1 ? matches[0] : null;
}

function cmdWpa(raw) {
  const airline = sbFindAirline(raw.replace(/^WPA\s+/, ''));
  if (!airline) { sbWarn('AIRLINE NOT FOUND - FORMAT: WPA <2-LETTER CODE OR AIRLINE NAME>  e.g. WPA MH'); return; }
  sbState.privateFare = { carrier: airline.code, carrierName: airline.name, loaded: false };
  sbPrint(`WPA ${airline.code} - ${airline.name} SELECTED`);
  sbPrint('ENTER PQ TO LOAD FARE');
}

function cmdPq() {
  if (!sbState.privateFare?.carrier) { sbWarn('NO VALIDATING CARRIER SELECTED - ENTER WPA <AIRLINE> FIRST'); return; }
  const isMH = sbState.privateFare.carrier === 'MH';
  const baseUsd = isMH ? 296 : 220 + ((sbState.privateFare.carrier.charCodeAt(0) * 7 + sbState.privateFare.carrier.charCodeAt(1)) % 181);
  const rate = 123.65;
  const baseBdt = Math.ceil(baseUsd * rate);
  const tax = isMH ? 14249 : Math.round(baseBdt * 0.39);
  sbState.privateFare = { ...sbState.privateFare, loaded: true, baseUsd, rate, baseBdt, tax, total: baseBdt + tax, fareBasis: isMH ? 'NBX0WBD' : `${sbState.privateFare.carrier}X0WBD`, route: isMH ? 'DAC MH KUL' : 'DAC ' + sbState.privateFare.carrier + ' KUL' };
  sbPrint(`PQ FARE LOADED FOR ${sbState.privateFare.carrier} - ${sbState.privateFare.carrierName}`);
  sbPrint('ENTER 3PQ TO DISPLAY FARE LOAD');
}

function cmdDisplayPq() {
  const fare = sbState.privateFare;
  if (!fare?.loaded) { sbWarn('NO PQ FARE LOAD ON FILE - ENTER WPA <AIRLINE>, THEN PQ'); return; }
  sbPrint(`WPA${fare.carrier}«`, 'line-display');
  sbPrint('');
  sbPrint('1-        BASE FARE       EQUIV AMOUNT       TAXES/FEES/CHARGES                 TOTAL');
  sbPrint(`          USD${fare.baseUsd.toFixed(2).padEnd(11)} BDT${fare.baseBdt.toString().padEnd(12)} BDT${fare.tax}XT                  BDT${fare.total}`);
  sbPrint(`ADT-1     ${fare.fareBasis}`);
  sbPrint(`${fare.route} Q25.00 NUC${fare.baseUsd.toFixed(2)}END ROE1.00`);
  sbPrint(`RATE USED 1USD-${fare.rate.toFixed(2)}BDT`);
  sbPrint('NONEND-SUBJ TO PENALTY');
  sbPrint(`VALIDATING CARRIER SPECIFIED - ${fare.carrier} ${fare.carrierName}`);
  sbPrint('BRANDED FARE /BASIC-BASIC');
}

function cmdDisplayItinerary() {
  if (!sbState.booked.length) { sbWarn("NO ITINERARY IN PNR"); return; }
  const weekDays = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  sbState.booked.forEach((s, i) => {
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    const dayName = weekDays[Number(s.day)] || '---';
    sbPrint(` ${i + 1} ${s.al.padEnd(5)} ${s.fn.padEnd(4)} ${s.cls.padEnd(2)} ${s.date} ${dayName}  ${s.dep.padEnd(4)} ${s.arr.padEnd(4)} ${s.status.padEnd(4)} ${s.depT}  ${s.arrT}${dayOverTag}`);
  });
}

function cmdDisplayPhone() {
  if (!sbState.phones.length) { sbWarn("NO PHONES IN PNR"); return; }
  sbPrint("PHONES");
  sbState.phones.forEach((p, i) => sbPrint(` ${i + 1}.${p.raw}`));
}

function cmdDisplayTicketing() {
  if (!sbState.ticketingArrangement) { sbWarn("NO TICKETING ARRANGEMENT IN PNR"); return; }
  sbPrint("TKT/TIME LIMIT");
  sbPrint(` 1.${sbState.ticketingArrangement}`);
}

function cmdDisplayReceived() {
  if (!sbState.receivedFrom) { sbWarn("NO RECEIVED FROM IN PNR"); return; }
  sbPrint(`RECEIVED FROM - ${sbState.receivedFrom}`);
}

function cmdDisplaySSR() {
  if (!sbState.ssrEntries.length) { sbWarn("NO SSR IN PNR"); return; }
  sbPrint("SPECIAL SERVICE REQUEST");
  sbState.ssrEntries.forEach((s, i) => sbPrint(` ${i + 1} ${s}`));
}

function cmdRedisplay() {
  sbPrint(sbRenderPNR());
}

function cmdIgnoreRedisplay() {
  const term = document.getElementById('termArea');
  if (term) term.innerHTML = '';
  sbPrint('DIRECT CONNECT IN PROGRESS, PLEASE WAIT', 'line-pnr');
  sbPrint('', 'line-pnr');
  sbEcho('IR');
  sbPrint('', 'line-pnr');
  if (sbState.locator) {
    sbPrint(sbState.locator, 'line-pnr');
  }
  sbPrint(sbRenderPNR(), 'line-pnr');
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   *<LOCATOR> — retrieve a stored PNR (only the lesson one is known)
--------------------------------------------------------------------- */
function cmdRetrieve(raw) {
  const loc = raw.replace(/^\*/, '').trim().toUpperCase();
  if (loc === '' || loc === 'R') { cmdRedisplay(); return; }
  if (sbState.locator === loc) { sbPrint(sbRenderPNR()); return; }
  if (loc === "K7QZLM") { sbLoadLessonPNR(); return; }
  sbWarn(`RECORD LOCATOR ${loc} NOT FOUND IN TRAINING DATABASE`);
}

/* ---------------------------------------------------------------------
   WT / WTP — issue ticket
--------------------------------------------------------------------- */
function cmdIssueTicket() {
  if (!sbState.locator || !sbState.ended) { sbWarn("PNR NOT SAVED - END TRANSACTION (E) FIRST"); return; }
  if (!sbState.fareQuote) { sbWarn("NO FARE ON FILE - PRICE THE PNR FIRST (WPNCB)"); return; }
  if (sbState.ticketed) { sbWarn("ALREADY TICKETED - " + sbState.eticketNumber); return; }
  sbState.ticketed = true;
  sbState.eticketNumber = "657-" + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10);
  sbPrint(`OK ETICKET  ${sbState.eticketNumber}`);
  sbState.names.forEach(n => sbPrint(n.raw));
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   XI — ignore/cancel current work
--------------------------------------------------------------------- */
function cmdIgnore() {
  sbState = sbEmptyState();
  sbPrint("PNR IGNORED - WORKAREA CLEARED");
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   HELP — open the Command Helper popup (also reachable via the
   "🪄 Command Helper" button / F-key row "⋮" overflow)
--------------------------------------------------------------------- */
function cmdHelp() {
  sbPrint("OPENING COMMAND HELPER...");
  if (typeof sbOpenCommandHelper === 'function') sbOpenCommandHelper();
}

/* ---------------------------------------------------------------------
   PARSER — dispatch table, checked in order (most specific first)
--------------------------------------------------------------------- */
function sbParse(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  const upper = cmd.toUpperCase();

  if (/^W\/-[A-Z][A-Z .'-]*$/.test(upper)) return cmdEncodeDecode(upper.slice(3));
  if (/^WPA\s+.+$/.test(upper)) return cmdWpa(upper);
  if (/^PQ$/.test(upper)) return cmdPq();
  if (/^3PQ$/.test(upper)) return cmdDisplayPq();
  if (/^1\d{2}[A-Z]{3}[A-Z]{6}$/.test(upper)) return cmdAvailability(upper);
  if (/^0[A-Z]\d+$/.test(upper)) return cmdSell(upper);
  if (/^-[A-Z]/.test(upper)) return cmdName(upper);
  if (/^9/.test(upper)) return cmdPhone(upper);
  if (/^6/.test(upper)) return cmdReceivedFrom(upper);
  if (/^7/.test(upper)) return cmdTicketingArrangement(upper);
  if (/^3/.test(upper)) return cmdSSR(upper);
  if (/^WPNCB$|^WPNI$/.test(upper)) return cmdPriceQuote();
  if (/^ER?$/.test(upper)) return cmdEndTransaction(upper === "ER");
  if (/^\*-$|^\*-ALL$|^\*N$/.test(upper)) return cmdDisplayName();
  if (/^\*I$|^\*ITN$/.test(upper)) return cmdDisplayItinerary();
  if (/^\*P$|^\*9$|^\*P9$/.test(upper)) return cmdDisplayPhone();
  if (/^\*7$|^\*P7$/.test(upper)) return cmdDisplayTicketing();
  if (/^\*6$|^\*P6$/.test(upper)) return cmdDisplayReceived();
  if (/^\*3$|^\*P3D?$|^\*SSR$/.test(upper)) return cmdDisplaySSR();
  if (/^\*A$|^\*R$|^\*$/.test(upper)) return cmdRedisplay();
  if (/^\*[A-Z0-9]{5,6}$/.test(upper)) return cmdRetrieve(upper);
  if (/^WTP?$/.test(upper)) return cmdIssueTicket();
  if (/^IR$/.test(upper)) return cmdIgnoreRedisplay();
  if (/^I$|^IG$|^XI$/.test(upper)) return cmdIgnore();
  if (/^HELP$|^\?$/.test(upper)) return cmdHelp();

  sbWarn(`FORMAT INVALID - ${upper} NOT RECOGNIZED (PHASE 1 COMMAND SET) — TYPE HELP FOR COMMAND LIST`);
}

/* ---------------------------------------------------------------------
   HOOK INTO SHELL — replaces the placeholder sendCmd() from the shell
--------------------------------------------------------------------- */
function sendCmd() {
  const input = document.getElementById('cmdInput');
  const val = input.value.trim();
  if (!val) return;
  if (typeof sbRememberCommand === 'function') sbRememberCommand(val.toUpperCase());
  if (val.toUpperCase() === 'IR') {
    const term = document.getElementById('termArea');
    if (term) term.innerHTML = '';
  }
  sbEcho(val);
  sbParse(val);
  input.value = '';
}
