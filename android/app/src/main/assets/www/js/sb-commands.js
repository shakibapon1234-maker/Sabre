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
      carrier = after;
    } else if (after.length > 2) {
      const found = sbFindAirline(after);
      carrier = found ? found.code : after.slice(0, 2);
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
  sbState.fareQuote = {
    base: fare.baseBdt,
    tax: fare.tax,
    total: fare.total,
    currency: "BDT",
    pax: Math.max(sbState.names.length, 1)
  };

  // Fare load reply: keep the command echo above this reply and render the
  // host response as one compact block, like Sabre Agency Workspace.
  const printFare = text => sbPrint(text, 'fare-output');
  printFare('');
  printFare('          BASE FARE      EQUIV AMOUNT    TAXES/FEES/CHARGES');
  printFare(`1-        USD${fare.baseUsd.toFixed(2)}          BDT${fare.baseBdt}             BDT${fare.tax}XT      BDT${fare.total}ADT           TOTAL:   BDT${fare.total}`);
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
      base: sbState.privateFare.baseBdt,
      tax: sbState.privateFare.tax,
      total: sbState.privateFare.total,
      currency: "BDT",
      pax: Math.max(sbState.names.length, 1)
    };
  }

  const fare = sbState.privateFare;
  const paxName = sbState.names.length > 0
    ? (sbState.names[0].surname ? `${sbState.names[0].surname}/${sbState.names[0].first} ${sbState.names[0].title}`.trim() : sbState.names[0].raw)
    : 'APON/SHAKIB MR';

  // Exact Sabre Screenshot 2 output
  sbPrint('');
  sbPrint('FARE RECORD-ADT-AUTO PRICED      -ATPC');
  sbPrint('PQ 1                                    INPUT PTC - ADT');
  sbPrint('');
  sbPrint(` 1.1${paxName}`);
  sbPrint(`VALIDATING CARRIER - ${fare.carrier}`);
  sbPrint(` 1 O${fare.origin} ${fare.carrier} ${fare.flightNo}${fare.cls} ${fare.date} ${fare.depTime}  ${fare.fareBasis}       OK ${fare.date}${fare.date}25K`);
  sbPrint(`   ${fare.dest}`);
  sbPrint('');
  sbPrint('      BASE FARE       EQUIV AMT    TAXES/FEES/CHARGES       TOTAL');
  sbPrint(`      USD${fare.baseUsd.toFixed(2)}        BDT${fare.baseBdt}              ${fare.tax}XT     BDT${fare.total}`);
  sbPrint(' XT       500BD          4000UT              25000W         447E5');
  sbPrint('         4328YQ          1237P8              1237P7');
  sbPrint(fare.route);
  sbPrint('');
  sbPrint('NONEND-SUBJ TO PENALTY');
  sbPrint('');
  sbPrint('PRICING TRAILER MSG');
  sbPrint(`VALIDATING CARRIER SPECIFIED - ${fare.carrier}`);
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

  if (/^JR(?:\s*.*)?$/i.test(upper)) {
    if (typeof cmdFareShopJR === 'function') return cmdFareShopJR();
  }
  if (/^W\/-[A-Z][A-Z .'-]*$/.test(upper)) return cmdEncodeDecode(upper.slice(3));
  if (/^WPA(?:\s*([A-Z0-9]{2})|\s+(.+))?$/.test(upper) || /^WP$/i.test(upper)) return cmdWpa(upper);
  if (/^\*PQ(?:\s*\d+)?$|^\*PQS$|^3PQ$|^PQ$/i.test(upper)) return cmdDisplayPq();
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
  // On the Sabre keyboard the key beside Enter is Cross of Lorraine (¥).
  // It joins entries, e.g. 6S¥ER¥IR, rather than being literal text.
  val.split(/[¥☨‡]/).map(entry => entry.trim()).filter(Boolean).forEach(sbParse);
  input.value = '';
}
