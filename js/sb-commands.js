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
  const upper = body.toUpperCase();
  const infant = upper.match(/(?:\*I|\bINF)\/?(\d{2}[A-Z]{3}\d{2,4})?$/);
  const child = upper.match(/(?:\*C|\bCHD|\bCNN|\bC\d{1,2})(?:\/(\d{2}[A-Z]{3}\d{2,4}))?$/);
  const clean = upper.replace(/(?:\*I|\bINF|\*C|\bCHD|\bCNN|\bC\d{1,2})(?:\/?\d{2}[A-Z]{3}\d{2,4})?$/g, '').trim().replace(/[\s/]+$/, '');
  const nm = clean.match(/^([A-Z' -]+)\/([A-Z' ]+?)(?:\s+(MR|MRS|MS|MSTR|MISS|DR))?$/);
  if (!nm) { sbWarn("FORMAT: -SURNAME/FIRSTNAME MR  |  -SURNAME/CHILD CHD/15JAN15  |  -SURNAME/INFANT*I/20JAN25"); return; }
  const paxType = infant ? 'INF' : (child ? 'CHD' : 'ADT');
  const dob = (infant?.[1] || child?.[1] || '');
  const title = (nm[3] || (paxType === 'CHD' ? 'CNN' : paxType === 'INF' ? 'INF' : '')).toUpperCase();
  sbState.names.push({ raw: body.toUpperCase(), surname: nm[1].trim(), first: nm[2].trim(), title, paxType, dob });
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
  if (/^DOCS(?:\/|$)/i.test(body)) {
    const carrier = sbState.privateFare?.carrier || sbState.booked[0]?.al || 'MH';
    const paxRef = Number(body.match(/-(?:1\.)?(\d+)$/)?.[1] || body.match(/\/P(\d+)$/i)?.[1] || 1);
    if (paxRef > sbState.names.length) { sbWarn(`INVALID PASSENGER REFERENCE - ONLY ${sbState.names.length} NAME(S) IN PNR`); return; }
    sbState.documents.push({ raw: body.toUpperCase(), carrier, paxRef });
    sbPrint('*');
    return;
  }
  const slashPaxMatch = body.match(/\/P?(\d+)$/i);
  const dashPaxMatch = !slashPaxMatch ? body.match(/-(\d+)$/) : null;
  const paxRefMatch = slashPaxMatch || dashPaxMatch;
  const paxRef = Number(paxRefMatch?.[1] || 1);
  if (paxRefMatch) {
    const paxNum = parseInt(paxRefMatch[1], 10);
    if (paxNum < 1 || (sbState.names.length && paxNum > sbState.names.length)) {
      sbWarn(`INVALID PASSENGER REFERENCE - ONLY ${sbState.names.length} NAME(S) IN PNR`);
      return;
    }
  }
  const bodyForCode = dashPaxMatch ? body.slice(0, -dashPaxMatch[0].length) : body;
  const bodyForValidation = slashPaxMatch ? body.slice(0, -slashPaxMatch[0].length) : bodyForCode;
  const upperBody = bodyForCode.toUpperCase();
  const validationBody = bodyForValidation.toUpperCase();
  const [code] = validationBody.split('/');
  const payload = validationBody.startsWith(`${code}/`) ? validationBody.slice(code.length + 1) : '';
  if (!/^[A-Z]{4}$/.test(code)) {
    sbWarn('FORMAT: 3<4-LETTER SSR CODE>/<DETAIL>/P<PAX>');
    return;
  }
  if (code === 'MOML' && payload) {
    sbWarn('FORMAT: 3MOML-<PAX>  e.g. 3MOML-1');
    return;
  }
  if (code === 'CTCM' && !/^\+?\d{7,15}$/.test(payload)) {
    sbWarn('FORMAT: 3CTCM/<MOBILE>/P<PAX>');
    return;
  }
  if (code === 'CTCE' && !/^[A-Z0-9._%+-]+\/\/[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(payload)) {
    sbWarn('FORMAT: 3CTCE/<EMAIL WITH // FOR @>/P<PAX>');
    return;
  }
  if (code === 'WCHR' && !payload.trim()) {
    sbWarn('FORMAT: 3WCHR/<DETAIL>/P<PAX>');
    return;
  }
  const carrier = sbState.privateFare?.carrier || sbState.booked[0]?.al || '1B';
  const [, ...detail] = upperBody.split('/');
  // Store the same SSR shape that is shown again after ER / IR.
  sbState.ssrEntries.push({ text: `SSR ${code} ${carrier} HK1${detail.length ? '/' + detail.join('/') : ''}`, paxRef });
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   WPNCB / WPNI — price the PNR (simplified flat training fare, scaled
   by segment count and passenger count)
--------------------------------------------------------------------- */
function cmdPriceQuote() {
  const carrier = (sbState.booked.length > 0 && sbState.booked[0].al) || "MH";
  cmdWpa("WPA" + carrier);
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
  if (sbState.privateFare && sbState.pqPending) {
    sbState.pqStoredInPNR = true;
  }
  // Auto-persist to localStorage store so *<LOCATOR> retrieves it later
  if (typeof sbPnrStorePut === 'function') sbPnrStorePut(sbState);
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
   WPA <AIRLINE> / *PQ / 3PQ — Sabre carrier fare pricing & PQ display
   WPAMH, WPA MH, WPA <AIRLINE NAME> computes and displays the fare
   quote (Screenshot 1) and stores PQ 1.
   *PQ, *PQ1, 3PQ displays the stored PQ fare record (Screenshot 2).
--------------------------------------------------------------------- */
function sbFindAirline(query) {
  const value = query.trim().toUpperCase().replace(/\s+/g, ' ');
  if (SB_AIRLINES[value]) return { code: value, ...SB_AIRLINES[value] };
  const matches = Object.entries(SB_AIRLINES)
    .filter(([, airline]) => airline.name === value)
    .map(([code, airline]) => ({ code, ...airline }));
  return matches.length === 1 ? matches[0] : null;
}

function sbGetFareForCarrier(carrierCode) {
  const code = (carrierCode || 'MH').toUpperCase();
  const isMH = code === 'MH';
  const baseUsd = isMH ? 296 : 220 + ((code.charCodeAt(0) * 7 + (code.charCodeAt(1) || 65)) % 181);
  const rate = 123.65;
  const baseBdt = Math.round(baseUsd * rate);
  const tax = isMH ? 14249 : Math.round(baseBdt * 0.389);
  const total = baseBdt + tax;

  const seg0 = sbState.booked[0] || {};
  const origin = seg0.dep || 'DAC';
  const dest = seg0.arr || 'KUL';
  const flightNo = seg0.fn || '103';
  const cls = seg0.cls || 'N';
  const date = seg0.date || '20DEC';
  const depTime = seg0.depT || '1230';
  const fareBasis = isMH ? 'NBX0WBD' : `${cls}BX0WBD`;
  const route = `${origin} ${code} ${dest} Q25.00 ${(baseUsd - 25).toFixed(2)}NUC${baseUsd.toFixed(2)}END ROE1.00`;

  return {
    carrier: code,
    carrierName: SB_AIRLINES[code]?.name || `${code} AIRLINES`,
    baseUsd,
    rate,
    baseBdt,
    tax,
    total,
    fareBasis,
    route,
    origin,
    dest,
    flightNo,
    cls,
    date,
    depTime,
    loaded: true
  };
}

function cmdWpa(raw) {
  let carrier = "";
  const clean = (raw || "").trim().toUpperCase();

  if (clean.startsWith("WPA")) {
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
      carrier = "MH";
    }
  }

  const fare = sbGetFareForCarrier(carrier);
  sbState.privateFare = fare;
  sbState.pqPriced = true;
  sbState.pqPending = false;
  sbState.pqStoredInPNR = false;
  sbState.fareQuote = sbBuildFareQuote(fare);

  // Fare load reply: keep the command echo above this reply and render the
  // host response as one compact block, like Sabre Agency Workspace.
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
  if (sbState.fareQuote.pax > 1) sbState.fareQuote.breakdown.forEach(item => printFare(`P${item.index} ${item.type}  BASE BDT${item.base}  TAX BDT${item.tax}  TOTAL BDT${item.total}`));
}

function cmdPq() {
  if (!sbState.privateFare || !sbState.pqPriced) {
    sbWarn("NO FARE QUOTE ON FILE - ENTER WPA <AIRLINE> FIRST");
    return;
  }
  sbState.pqPending = true;
  sbPrint("*");
}

function cmdDisplayPq() {
  // A stored PNR may retain the fare summary even if the in-memory PQ flag
  // was lost while redisplaying it.  Rebuild its display record when possible.
  if (!sbState.privateFare && !sbState.fareQuote) {
    sbWarn("NO FARE RECORD EXISTS");
    return;
  }

  if (!sbState.privateFare) {
    const carrier = (sbState.booked[0] && sbState.booked[0].al) || 'MH';
    sbState.privateFare = sbGetFareForCarrier(carrier);
    sbState.fareQuote = {
      ...sbBuildFareQuote(sbState.privateFare)
    };
  }

  const fare = sbState.privateFare;
  const paxName = sbState.names.length > 0
    ? (sbState.names[0].surname ? `${sbState.names[0].surname}/${sbState.names[0].first} ${sbState.names[0].title}`.trim() : sbState.names[0].raw)
    : 'APON/SHAKIB MR';

  // Full *PQ fare record, including the payment-fee and pricing-trailer area.
  const printFare = text => sbPrint(text, 'fare-output');
  printFare('');
  printFare('FARE RECORD-ADT-AUTO PRICED      -ATPC');
  printFare('PQ 1                                    INPUT PTC - ADT');
  printFare('');
  printFare(` 1.1${paxName}`);
  sbState.names.slice(1).forEach((pax, index) => printFare(` 1.${index + 2}${pax.surname}/${pax.first} ${pax.title}  - ${sbPaxLabel(pax)}${pax.dob ? `/${pax.dob}` : ''}`));
  sbState.names.slice(1).forEach((pax, index) => printFare(` 1.${index + 2}${pax.surname}/${pax.first} ${pax.title}  - ${sbPaxLabel(pax)}${pax.dob ? `/${pax.dob}` : ''}`));
  printFare(`VALIDATING CARRIER - ${fare.carrier}`);
  printFare(` 1 O${fare.origin} ${fare.carrier} ${fare.flightNo}${fare.cls} ${fare.date} ${fare.depTime}  ${fare.fareBasis}       OK ${fare.date}${fare.date}25K`);
  printFare(`   ${fare.dest}`);
  printFare('');
  printFare('      BASE FARE       EQUIV AMT    TAXES/FEES/CHARGES       TOTAL');
  printFare(`      USD${fare.baseUsd.toFixed(2)}        BDT${sbState.fareQuote.base}              ${sbState.fareQuote.tax}XT     BDT${sbState.fareQuote.total}`);
  printFare(' XT       500BD          4000UT              25000W         447E5');
  printFare('         4328YQ          1237P8              1237P7');
  printFare(fare.route);
  printFare('');
  printFare('CHNG FEE APPLY/REFUND FEE/APPLY/NO SHOW FEE APPLY');
  printFare('');
  printFare('ONE OR MORE FORM OF PAYMENT FEES MAY APPLY');
  printFare('ACTUAL TOTAL WILL BE BASED ON FORM OF PAYMENT USED');
  printFare('FEE CODE     DESCRIPTION                         FEE    TKT TOTAL');
  printFare(`OBFCAX       - ANY CC                              0       ${fare.total}`);
  printFare(`OBFCAX       - CC NBR BEGINS WITH 223529          0       ${fare.total}`);
  printFare('');
  printFare('PRICING TRAILER MSG');
  printFare('¥');
  printFare(`3DOCS/P/BD/A3863636/BD/20MAY95/M/${paxName.replace(/\s+(MR|MS|MRS)$/i, '')}-.1«`);
  printFare('*');
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
  sbState.ssrEntries.forEach((s, i) => sbPrint(` ${i + 1} ${typeof s === 'string' ? s : s.text}`));
}

function cmdDisplayDocs() {
  if (!sbState.documents.length) { sbWarn('NO PASSENGER DOCUMENTS IN PNR'); return; }
  const print = text => sbPrint(text, 'fare-output');
  print('GENERAL FACTS');
  sbState.documents.forEach((doc, index) => {
    const pax = sbState.names[(doc.paxRef || 1) - 1]?.raw || 'PASSENGER';
    const docText = doc.raw.replace(/^DOCS\//, '').replace(/-\d+\.\d+$/, '');
    const fields = docText.split('/');
    const firstPart = fields.slice(0, 3).join('/');
    const remainder = fields.slice(3).join('/');
    print(` ${index + 1}.SSR DOCS ${doc.carrier} HK1/${firstPart}/  1.${doc.paxRef || 1} ${pax}`);
    if (remainder) print(`      ${remainder}`);
  });
}

/* ---------------------------------------------------------------------
   PRINTER ASSIGNMENT — required once per running session before ticketing
   W*BD -> DSIV<id> -> PTR/<id>
--------------------------------------------------------------------- */
function cmdPrinterWorkArea() {
  sbPrint('OK-0008');
}

function cmdPrinterAssign(raw) {
  const id = raw.replace(/^DSIV/, '').trim().toUpperCase();
  if (!id) { sbWarn('FORMAT: DSIV<PRINTER ID>  e.g. DSIVE8C987'); return; }
  sbState.printerId = id;
  sbState.printerAssigned = true;
  sbState.printerDesignated = false;
  sbPrint('OK PTR ASSIGNED');
}

function cmdPrinterDesignate(raw) {
  const id = raw.replace(/^PTR\//, '').trim().toUpperCase();
  if (!sbState.printerAssigned) { sbWarn('NO PTR ASSIGNED - ENTER DSIV<PRINTER ID> FIRST'); return; }
  if (!id || id !== sbState.printerId) { sbWarn(`INVALID PRINTER ID - ENTER PTR/${sbState.printerId}`); return; }
  sbState.printerDesignated = true;
  sbPrint('PRINTER DESIGNATED');
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

/* =====================================================================
   PNR STORE — save every ended PNR to localStorage and retrieve by
   locator, list all saved PNRs, or share via URL hash.
   ===================================================================== */
const SB_PNR_STORE_KEY = 'sabre_pnr_store_v1';

function sbPnrStoreLoad() {
  try {
    const raw = localStorage.getItem(SB_PNR_STORE_KEY);
    if (raw) { const p = JSON.parse(raw); if (typeof p === 'object' && p) return p; }
  } catch (e) {}
  return {};
}

function sbPnrStoreSave(store) {
  try { localStorage.setItem(SB_PNR_STORE_KEY, JSON.stringify(store)); } catch (e) {}
}

/* Called by cmdEndTransaction — snapshot current state into the store. */
function sbPnrStorePut(state) {
  if (!state.locator) return;
  const store = sbPnrStoreLoad();
  store[state.locator] = {
    locator: state.locator,
    savedAt: sbSabreFooterStamp(),
    names: state.names,
    booked: state.booked,
    phones: state.phones,
    receivedFrom: state.receivedFrom,
    ticketingArrangement: state.ticketingArrangement,
    ssrEntries: state.ssrEntries,
    documents: state.documents,
    remarks: state.remarks || [],
    fareQuote: state.fareQuote,
    privateFare: state.privateFare,
    ticketed: state.ticketed,
    eticketNumber: state.eticketNumber,
    ticketNumbers: state.ticketNumbers || [],
    invoiced: state.invoiced,
    voided: state.voided || false,
    voidedTicketNo: state.voidedTicketNo || null,
    refunded: state.refunded || false,
    officeId: state.officeId,
    agentSine: state.agentSine,
    dateStamp: state.dateStamp,
    ended: true
  };
  const keys = Object.keys(store);
  if (keys.length > 100) delete store[keys[0]]; // keep last 100
  sbPnrStoreSave(store);
}

/* ---------------------------------------------------------------------
   *<LOCATOR> — retrieve any saved PNR from localStorage or lesson
--------------------------------------------------------------------- */
function cmdRetrieve(raw) {
  const loc = raw.replace(/^\*/, '').trim().toUpperCase();
  if (loc === '' || loc === 'R') { cmdRedisplay(); return; }
  if (sbState.locator === loc) { sbPrint(sbRenderPNR()); return; }
  if (loc === 'K7QZLM') { sbLoadLessonPNR(); return; }

  const snap = sbPnrStoreLoad()[loc];
  if (snap) {
    sbState = { ...sbEmptyState(), ...snap };
    sbPrint('DIRECT CONNECT IN PROGRESS, PLEASE WAIT', 'line-pnr');
    sbPrint('', 'line-pnr');
    sbPrint(snap.locator, 'line-pnr');
    sbPrint(sbRenderPNR(), 'line-pnr');
    sbSyncSidePanel();
    return;
  }
  sbWarn(`RECORD LOCATOR ${loc} NOT FOUND IN TRAINING DATABASE`);
}

/* ---------------------------------------------------------------------
   *ALL / OPEN / OPENPNR — display all saved PNRs
--------------------------------------------------------------------- */
function cmdOpenAllPNR() {
  const store = sbPnrStoreLoad();
  const keys = Object.keys(store);

  sbPrint('SAVED PNR LIST');
  sbPrint(` ${'LOC'.padEnd(7)} ${'PAX NAME'.padEnd(24)} ${'FLIGHT'.padEnd(9)} ${'DATE'.padEnd(7)} ROUTE     STATUS`);
  sbPrint('─'.repeat(72));
  // Built-in lesson PNR always first
  sbPrint(` K7QZLM  RAHMAN/ANIS MR          BG555     25DEC   DACSIN    OPEN  (LESSON)`);

  if (keys.length === 0) {
    sbPrint('');
    sbPrint('NO USER-SAVED PNRs — USE ER TO SAVE A PNR');
  } else {
    keys.forEach(loc => {
      const p = store[loc];
      const name = (p.names?.[0]?.raw || 'UNKNOWN').slice(0, 23).padEnd(23);
      const seg  = p.booked?.[0];
      const fl   = seg ? `${seg.al}${seg.fn}`.padEnd(9) : '---'.padEnd(9);
      const dt   = (seg?.date || '---').padEnd(7);
      const rt   = seg ? `${seg.dep}${seg.arr}`.padEnd(9) : '---'.padEnd(9);
      const st   = p.ticketed ? 'TKTED' : (p.voided ? 'VOID ' : 'OPEN ');
      sbPrint(` ${loc.padEnd(7)}  ${name} ${fl} ${dt} ${rt} ${st}`);
    });
  }

  sbPrint('─'.repeat(72));
  sbPrint(`TOTAL: ${keys.length + 1} PNR(S)  — TYPE *<LOCATOR> TO RETRIEVE  |  SHAREPNR TO SHARE`);
}

/* ---------------------------------------------------------------------
   SHAREPNR — copy a deep-link URL and show a share modal
   URL format:  <base>#PNR=<LOCATOR>
--------------------------------------------------------------------- */
function cmdSharePNR() {
  if (!sbState.locator || !sbState.ended) {
    sbWarn('NO SAVED PNR TO SHARE — END TRANSACTION (ER) FIRST');
    return;
  }
  sbPnrStorePut(sbState); // ensure latest state is persisted
  const base = window.location.href.split('#')[0];
  const url  = `${base}#PNR=${sbState.locator}`;

  sbPrint(`SHARE URL: ${url}`);
  sbPrint(`LOCATOR  : ${sbState.locator}`);
  sbPrint('RECIPIENT TYPES  *' + sbState.locator + '  TO RETRIEVE THIS PNR');

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => sbPrint('✓ URL COPIED TO CLIPBOARD'));
  }
  sbShowShareModal(sbState.locator, url);
}

function sbShowShareModal(locator, url) {
  let modal = document.getElementById('sbShareModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sbShareModal';
    modal.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:rgba(0,0,0,0.78);z-index:9999;',
      'display:flex;align-items:center;justify-content:center;'
    ].join('');
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background:#1b2330;border:1px solid #3a4457;border-radius:10px;
                padding:28px 32px;min-width:400px;max-width:92vw;
                color:#eef0f3;font-family:'Consolas',monospace;">
      <div style="font-size:15px;font-weight:700;color:#13a3a0;margin-bottom:14px;">&#x1F4E4; SHARE PNR</div>
      <div style="font-size:11px;color:#8992a3;margin-bottom:4px;">PNR LOCATOR</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:5px;color:#c8472f;margin-bottom:14px;">${locator}</div>
      <div style="font-size:11px;color:#8992a3;margin-bottom:4px;">SHARE LINK (click to copy)</div>
      <div id="sbShareUrlText"
           onclick="sbCopyShareUrl()"
           style="background:#141a24;border:1px solid #2b3547;border-radius:5px;
                  padding:10px 12px;font-size:11px;color:#13a3a0;
                  word-break:break-all;cursor:pointer;">${url}</div>
      <div id="sbShareCopyMsg" style="font-size:11px;color:#13a3a0;height:18px;margin-top:5px;"></div>
      <div style="font-size:11px;color:#8992a3;margin-top:4px;">
        Recipient opens the link, then types
        <span style="color:#eef0f3">*${locator}</span> to retrieve.
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button onclick="sbCopyShareUrl()"
                style="flex:1;padding:9px;background:#13a3a0;border:none;
                       border-radius:5px;color:#fff;font-weight:700;cursor:pointer;
                       font-family:inherit;">
          &#x1F4CB; COPY LINK
        </button>
        <button onclick="document.getElementById('sbShareModal').style.display='none'"
                style="flex:1;padding:9px;background:#2b3547;border:none;
                       border-radius:5px;color:#eef0f3;font-weight:700;cursor:pointer;
                       font-family:inherit;">
          CLOSE
        </button>
      </div>
    </div>`;
  modal._url = url;
  modal.style.display = 'flex';
}

function sbCopyShareUrl() {
  const modal = document.getElementById('sbShareModal');
  const url   = modal?._url || '';
  const msg   = document.getElementById('sbShareCopyMsg');
  if (navigator.clipboard && url) {
    navigator.clipboard.writeText(url)
      .then(() => { if (msg) msg.textContent = '✓ COPIED TO CLIPBOARD!'; });
  } else {
    const el = document.getElementById('sbShareUrlText');
    if (el) { const r = document.createRange(); r.selectNodeContents(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); }
    if (msg) msg.textContent = 'SELECT & COPY MANUALLY (Ctrl+C)';
  }
}

/* Auto-retrieve from URL hash on page load: #PNR=K7QZLM */
function sbCheckUrlHash() {
  const m = window.location.hash.match(/[#&]PNR=([A-Z0-9]{5,7})/i);
  if (!m) return;
  const loc = m[1].toUpperCase();
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  setTimeout(() => {
    sbEcho('*' + loc);
    cmdRetrieve('*' + loc);
    sbPrint('AUTO-RETRIEVED FROM SHARE LINK: ' + loc, 'line-pnr');
  }, 600);
}

/* ---------------------------------------------------------------------
   WT / WTP — issue ticket
--------------------------------------------------------------------- */
function cmdIssueTicket() {
  if (!sbState.locator || !sbState.ended) { sbWarn("PNR NOT SAVED - END TRANSACTION (E) FIRST"); return; }
  if (!sbState.fareQuote) { sbWarn("NO FARE ON FILE - PRICE THE PNR FIRST (WPNCB)"); return; }
  if (!sbState.printerDesignated) { sbWarn('PRINTER NOT DESIGNATED - ENTER W*BD, DSIV<PRINTER ID>, THEN PTR/<PRINTER ID>'); return; }
  if (sbState.ticketed) { sbWarn("ALREADY TICKETED - " + sbState.eticketNumber); return; }
  sbState.ticketed = true;
  sbState.invoiced = true;
  sbState.eticketNumber = "618-" + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10);
  const passengerCount = Math.max(sbState.names.length, 1);
  sbState.ticketNumbers = Array.from({ length: passengerCount }, (_, index) => index === 0
    ? sbState.eticketNumber.replace('-', '')
    : '618' + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10));
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
   XI — ignore/cancel current work
--------------------------------------------------------------------- */
function cmdIgnore() {
  sbState = sbEmptyState();
  sbPrint("PNR IGNORED - WORKAREA CLEARED");
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   XE<n> / XK<n> — delete a PNR segment by line number
   e.g. XE1, XK2
--------------------------------------------------------------------- */
function cmdSegmentCancel(raw) {
  const m = raw.match(/^X[EK](\d+)$/);
  if (!m) { sbWarn('FORMAT: XE<N>  e.g. XE1  (delete segment number N)'); return; }
  const idx = parseInt(m[1], 10) - 1;
  if (!sbState.booked.length) { sbWarn('NO SEGMENTS IN PNR'); return; }
  if (idx < 0 || idx >= sbState.booked.length) {
    sbWarn(`SEGMENT ${m[1]} NOT FOUND — PNR HAS ${sbState.booked.length} SEGMENT(S)`);
    return;
  }
  const removed = sbState.booked.splice(idx, 1)[0];
  sbPrint(`SEGMENT ${m[1]} CANCELLED: ${removed.al}${removed.fn} ${removed.date} ${removed.dep}${removed.arr}`);
  sbState.ended = false;
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   4/<text>  — OSI (Other Service Information)
   e.g.  4/MH FREQUENT FLYER 123456789
--------------------------------------------------------------------- */
function cmdOSI(raw) {
  const body = raw.replace(/^4\s*\/\s*/, '').trim();
  if (!body) { sbWarn('FORMAT: 4/<AIRLINE> <MESSAGE>  e.g. 4/BG FREQUENT FLYER NO 123456'); return; }
  if (!sbState.names.length) { sbWarn('MUST HAVE AT LEAST ONE NAME BEFORE OSI'); return; }
  const upper = body.toUpperCase();
  const carrier = sbState.booked[0]?.al || '1B';
  sbState.ssrEntries.push({ text: `OSI ${carrier} ${upper}`, paxRef: 1 });
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   5C/<text>  — General Remarks / free-text remarks field
   e.g.  5C/PLEASE ISSUE TICKET BEFORE 24SEP
--------------------------------------------------------------------- */
function cmdRemarks(raw) {
  const body = raw.replace(/^5C?\s*\/\s*/, '').trim();
  if (!body) { sbWarn('FORMAT: 5C/<REMARK TEXT>  e.g. 5C/PLEASE ISSUE BEFORE 20DEC'); return; }
  if (!sbState.remarks) sbState.remarks = [];
  sbState.remarks.push(body.toUpperCase());
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   *5 / *RM — display remarks
--------------------------------------------------------------------- */
function cmdDisplayRemarks() {
  if (!sbState.remarks || !sbState.remarks.length) { sbWarn('NO REMARKS IN PNR'); return; }
  sbPrint('GENERAL REMARKS');
  sbState.remarks.forEach((r, i) => sbPrint(` ${i + 1}.${r}`));
}

/* ---------------------------------------------------------------------
   VOID / WV<ticket_no>  — void a ticket (same-day only in real Sabre)
   e.g.  VOID, WV6181234567890
--------------------------------------------------------------------- */
function cmdVoidTicket(raw) {
  if (!sbState.ticketed || !sbState.eticketNumber) {
    sbWarn('NO TICKET ON FILE TO VOID — ISSUE A TICKET FIRST');
    return;
  }
  const ticketNo = (sbState.eticketNumber || '').replace('-', '');
  const inputNo = raw.replace(/^WV/i, '').replace(/^VOID/i, '').trim();
  if (inputNo && inputNo !== ticketNo && !sbState.ticketNumbers?.includes(inputNo)) {
    sbWarn(`TICKET ${inputNo} NOT FOUND — CURRENT TICKET: ${ticketNo}`);
    return;
  }
  sbState.voided = true;
  sbState.ticketed = false;
  sbState.invoiced = false;
  sbState.voidedTicketNo = ticketNo;
  sbPrint(`TICKET ${ticketNo} VOIDED`);
  sbPrint('VOID TRANSACTION COMPLETE');
  sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator} H M`);
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   RFND / REFUND — refund a voided or cancelled ticket
   (training simulation only — not connected to BSP/ARC)
--------------------------------------------------------------------- */
function cmdRefund(raw) {
  if (!sbState.voided && !sbState.ticketed) {
    sbWarn('NO TICKET ON FILE FOR REFUND — ISSUE OR VOID A TICKET FIRST');
    return;
  }
  const ticketNo = sbState.voidedTicketNo || (sbState.eticketNumber || '').replace('-', '');
  const fare = sbState.fareQuote;
  const penalty = Math.round((fare?.total || 0) * 0.10);
  const refundable = (fare?.total || 0) - penalty;
  sbPrint('REFUND CALCULATION');
  sbPrint(`TICKET: ${ticketNo}`);
  sbPrint(`TOTAL PAID   : BDT ${fare?.total || 0}`);
  sbPrint(`CANCEL PENALTY: BDT ${penalty} (10% TRAINING RATE)`);
  sbPrint(`REFUND AMOUNT : BDT ${refundable}`);
  sbPrint('REFUND PROCESSED - TRAINING SIMULATION ONLY');
  sbState.refunded = true;
  sbState.voided = false;
  sbState.ticketed = false;
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   REISSUE / WREISSUE — reissue ticket with new fare (training flow)
   In real Sabre: REISSUE after PQ is loaded for the changed itinerary
--------------------------------------------------------------------- */
function cmdReissue() {
  if (!sbState.ticketed && !sbState.voided) {
    sbWarn('NO TICKET ON FILE TO REISSUE — ISSUE A TICKET FIRST');
    return;
  }
  if (!sbState.fareQuote) {
    sbWarn('NO FARE QUOTE ON FILE — ENTER WPA <AIRLINE> AND PQ FIRST');
    return;
  }
  const oldTicketNo = sbState.eticketNumber || '';
  sbState.eticketNumber = '618-' + Math.floor(1000000000 + Math.random() * 8999999999).toString().slice(0, 10);
  const newTicketNo = sbState.eticketNumber.replace('-', '');
  sbState.ticketed = true;
  sbState.invoiced = true;
  sbState.voided = false;
  sbPrint('REISSUE TRANSACTION PROCESSED');
  sbPrint(`OLD TICKET: ${oldTicketNo.replace('-', '')}`);
  sbPrint(`NEW TICKET: ${newTicketNo}`);
  sbPrint(`FARE  BDT${sbState.fareQuote.base}  TAX  BDT${sbState.fareQuote.tax}  TOTAL  BDT${sbState.fareQuote.total}`);
  sbPrint('ETR MESSAGE PROCESSED');
  sbPrint(sbState.locator);
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   WC<n><STATUS>  — change segment status code manually
   e.g. WC1HK   → segment 1 set to HK
        WC2UC   → segment 2 set to UC (unable to confirm)
--------------------------------------------------------------------- */
function cmdChangeStatus(raw) {
  const m = raw.match(/^WC(\d+)([A-Z]{2})$/);
  if (!m) { sbWarn('FORMAT: WC<N><STATUS>  e.g. WC1HK  WC2UC'); return; }
  const idx = parseInt(m[1], 10) - 1;
  const newStatus = m[2].toUpperCase();
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

/* ---------------------------------------------------------------------
   WPQD / WPQD<n>  — delete stored price quote (PQ)
   e.g. WPQD, WPQD1
--------------------------------------------------------------------- */
function cmdPqDelete(raw) {
  if (!sbState.privateFare && !sbState.fareQuote) {
    sbWarn('NO PRICE QUOTE EXISTS TO DELETE');
    return;
  }
  sbState.privateFare = null;
  sbState.fareQuote = null;
  sbState.pqPriced = false;
  sbState.pqPending = false;
  sbState.pqStoredInPNR = false;
  sbPrint('PRICE QUOTE DELETED');
  sbPrint('*');
}

/* ---------------------------------------------------------------------
   QEP / QS<queue>  — place PNR on a queue
   e.g.  QEP  (end & place on queue)
         QS14 (place on queue 14)
         Q/   (queue count display)
--------------------------------------------------------------------- */
function cmdQueuePlace(raw) {
  const upper = raw.trim().toUpperCase();
  if (/^Q\/$/.test(upper)) {
    sbPrint('QUEUE COUNTS:');
    sbPrint(` Q  0  DEFAULT QUEUE      ${sbState.locator ? '1 PNR' : '0 PNR'}`);
    sbPrint(` Q 14  TICKETING QUEUE    ${sbState.ticketed ? '0 PNR' : (sbState.locator ? '1 PNR' : '0 PNR')}`);
    return;
  }
  if (!sbState.locator || !sbState.ended) {
    sbWarn('NO ACTIVE PNR — SAVE PNR WITH E OR ER FIRST');
    return;
  }
  const qNum = raw.match(/^QS(\d+)$/)?.[1] || raw.match(/^QEP(?:(\d+))?$/)?.[1] || '14';
  sbPrint(`PNR ${sbState.locator} PLACED ON QUEUE ${qNum}`);
  sbPrint(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator} H M`);
}

/* ---------------------------------------------------------------------
   CHANGE DOCS — modify existing DOCS SSR entry
   Format: 3DOCS/P/<COUNTRY>/<DOCNO>/<NATIONALITY>/<DOB>/<GENDER>/<EXPIRY>/<SURNAME>/<FIRST>-1.<PAX>
   Same as 3DOCS but replaces existing entry for that passenger
--------------------------------------------------------------------- */
function cmdChangeDocs(raw) {
  // Delegate to cmdSSR which already handles DOCS — it adds a new entry.
  // This wrapper first removes the old DOCS for the same paxRef, then re-adds.
  const body = raw.replace(/^3/, '').trim();
  const paxRef = Number(body.match(/-(?:1\.)?(\d+)$/)?.[1] || body.match(/\/P(\d+)$/i)?.[1] || 1);
  // Remove previous DOCS for this paxRef
  sbState.documents = sbState.documents.filter(d => d.paxRef !== paxRef);
  cmdSSR(raw); // re-use existing SSR/DOCS handler
  sbPrint('DOCS RECORD UPDATED');
}

/* ---------------------------------------------------------------------
   *PE / *PD — display passenger details (combined: names, phones, SSR)
--------------------------------------------------------------------- */
function cmdDisplayPassengerDetail() {
  sbPrint('PASSENGER DETAIL');
  if (sbState.names.length) {
    sbPrint('NAMES:');
    sbState.names.forEach((n, i) => sbPrint(` ${i + 1}.${n.raw} - ${n.paxType || 'ADT'}${n.dob ? '/' + n.dob : ''}`));
  }
  if (sbState.phones.length) {
    sbPrint('PHONES:');
    sbState.phones.forEach((p, i) => sbPrint(` ${i + 1}.${p.raw}`));
  }
  if (sbState.ssrEntries.length) {
    sbPrint('SSR:');
    sbState.ssrEntries.forEach((s, i) => sbPrint(` ${i + 1}.${typeof s === 'string' ? s : s.text}`));
  }
  if (sbState.documents.length) {
    sbPrint('DOCS:');
    sbState.documents.forEach((d, i) => {
      const pax = sbState.names[(d.paxRef || 1) - 1]?.raw || 'PASSENGER';
      sbPrint(` ${i + 1}.SSR DOCS ${d.carrier} HK1/${d.raw.replace(/^DOCS\//, '').replace(/-\d+\.\d+$/, '')}  1.${d.paxRef} ${pax}`);
    });
  }
  if (!sbState.names.length && !sbState.phones.length) sbWarn('NO PASSENGER DATA IN PNR');
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

  if (/^JR(?:\s*.*)?$/i.test(upper)) {
    if (typeof cmdFareShopJR === 'function') return cmdFareShopJR();
  }
  if (/^W\/-[A-Z][A-Z .'-]*$/.test(upper)) return cmdEncodeDecode(upper.slice(3));
  if (/^W\*BD$/.test(upper)) return cmdPrinterWorkArea();
  if (/^DSIV[A-Z0-9]+$/.test(upper)) return cmdPrinterAssign(upper);
  if (/^PTR\/[A-Z0-9]+$/.test(upper)) return cmdPrinterDesignate(upper);
  if (/^W[¥☨‡§]PQ\d+[¥☨‡§]ASQ[¥☨‡§]FINVAGT[¥☨‡§]K7$/.test(upper)) return cmdIssueTicket();
  if (/^WPA(?:\s*([A-Z0-9]{2})|\s+(.+))?$/.test(upper) || /^WP$/i.test(upper)) return cmdWpa(upper);
  if (/^PQ$/i.test(upper)) return cmdPq();
  if (/^\*PQ(?:\s*\d+)?$|^\*PQS$|^3PQ$/i.test(upper)) return cmdDisplayPq();
  if (/^1\d{2}[A-Z]{3}[A-Z]{6}$/.test(upper)) return cmdAvailability(upper);
  if (/^0[A-Z]\d+$/.test(upper)) return cmdSell(upper);
  if (/^-[A-Z]/.test(upper)) return cmdName(upper);
  if (/^9/.test(upper)) return cmdPhone(upper);
  if (/^6/.test(upper)) return cmdReceivedFrom(upper);
  if (/^7/.test(upper)) return cmdTicketingArrangement(upper);
  /* 3DOCS change (modify existing DOCS) — check BEFORE generic 3 handler */
  if (/^3DOCS\//.test(upper) && sbState.documents.length) return cmdChangeDocs(upper);
  if (/^3/.test(upper)) return cmdSSR(upper);
  if (/^4\//.test(upper)) return cmdOSI(upper);
  if (/^5C?\//.test(upper)) return cmdRemarks(upper);
  if (/^WPNCB$|^WPNI$/.test(upper)) return cmdPriceQuote();
  if (/^WPQD\d*$/.test(upper)) return cmdPqDelete(upper);
  if (/^WC\d+[A-Z]{2}$/.test(upper)) return cmdChangeStatus(upper);
  if (/^(VOID|WV[0-9A-Z]*)$/.test(upper)) return cmdVoidTicket(upper);
  if (/^(RFND|REFUND)$/.test(upper)) return cmdRefund(upper);
  if (/^(REISSUE|WREISSUE)$/.test(upper)) return cmdReissue();
  if (/^QEP\d*$|^QS\d+$|^Q\/$/.test(upper)) return cmdQueuePlace(upper);
  if (/^ER?$/.test(upper)) return cmdEndTransaction(upper === "ER");
  if (/^\*-$|^\*-ALL$|^\*N$/.test(upper)) return cmdDisplayName();
  if (/^\*I$|^\*ITN$/.test(upper)) return cmdDisplayItinerary();
  if (/^\*P$|^\*9$|^\*P9$/.test(upper)) return cmdDisplayPhone();
  if (/^\*7$|^\*P7$/.test(upper)) return cmdDisplayTicketing();
  if (/^\*6$|^\*P6$/.test(upper)) return cmdDisplayReceived();
  if (/^\*P3D$|^\*P4D$/.test(upper)) return cmdDisplayDocs();
  if (/^\*T$/.test(upper)) return cmdDisplayTicket();
  if (/^\*3$|^\*P3?$|^\*SSR$/.test(upper)) return cmdDisplaySSR();
  if (/^\*5$|^\*RM$/.test(upper)) return cmdDisplayRemarks();
  if (/^\*PE$|^\*PD$|^PD$/.test(upper)) return cmdDisplayPassengerDetail();
  if (/^\*ALL$|^OPEN$|^OPENPNR$/.test(upper)) return cmdOpenAllPNR();
  if (/^SHAREPNR$|^SHARE$/.test(upper)) return cmdSharePNR();
  if (/^\*A$|^\*R$|^\*$/.test(upper)) return cmdRedisplay();
  if (/^\*[A-Z0-9]{5,6}$/.test(upper)) return cmdRetrieve(upper);
  if (/^WTP?$/.test(upper)) return cmdIssueTicket();
  if (/^XE\d+$|^XK\d+$/.test(upper)) return cmdSegmentCancel(upper);
  if (/^IR$/.test(upper)) return cmdIgnoreRedisplay();
  if (/^I$|^IG$|^XI$/.test(upper)) return cmdIgnore();
  if (/^HELP$|^\?$/.test(upper)) return cmdHelp();

  sbWarn(`FORMAT INVALID - ${upper} NOT RECOGNIZED — TYPE HELP FOR COMMAND LIST`);
}

/* ---------------------------------------------------------------------
   HOOK INTO SHELL — replaces the placeholder sendCmd() from the shell
--------------------------------------------------------------------- */
function sendCmd() {
  const input = document.getElementById('cmdInput');
  const val = input.value.trim().replace(/«$/, '');
  if (!val) return;
  if (typeof sbRememberCommand === 'function') sbRememberCommand(val.toUpperCase());
  if (val.toUpperCase() === 'IR') {
    const term = document.getElementById('termArea');
    if (term) term.innerHTML = '';
  }
  sbEcho(val);
  // On the Sabre keyboard the key beside Enter is Cross of Lorraine (¥).
  // It joins entries, e.g. 6S¥ER¥IR, rather than being literal text.
  if (/^W[¥☨‡§]PQ\d+[¥☨‡§]ASQ[¥☨‡§]FINVAGT[¥☨‡§]K7$/i.test(val)) sbParse(val);
  else val.split(/[¥☨‡§]/).map(entry => entry.trim()).filter(Boolean).forEach(sbParse);
  input.value = '';
}
