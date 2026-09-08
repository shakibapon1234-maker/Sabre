/* =========================================================================
   SABRE TRAINING SIMULATOR — COMMAND HANDLERS + PARSER (Phase 1: to Issue)
   Independent educational tool — no affiliation with Sabre Corporation.
   Not connected to any live GDS.
   ========================================================================= */

/* ---------------------------------------------------------------------
   W/-XXX  — encode/decode a 3-letter city/airport code
--------------------------------------------------------------------- */
function cmdEncodeDecode(arg) {
  const code = arg.toUpperCase();
  const info = SB_AIRPORTS[code];
  if (info) { sbPrint(`${code}  ${info.city}/${info.name}/${info.country}`); return; }
  sbWarn(`UNABLE TO DECODE - ${code} NOT IN TRAINING DATABASE`);
}

/* ---------------------------------------------------------------------
   1N/1A  DDMMMCITYCITY — availability display (direct + connections)
--------------------------------------------------------------------- */
function cmdAvailability(raw) {
  const m = raw.match(/^1[NA](\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})$/);
  if (!m) { sbWarn("FORMAT: 1N<DDMMM><ORG><DST>  e.g. 1N25DECDACLHR"); return; }
  const [, date, org, dst] = m;

  if (org === dst) { sbWarn("ORIGIN AND DESTINATION CANNOT BE THE SAME"); return; }
  if (!SB_AIRPORTS[org] || !SB_AIRPORTS[dst]) {
    sbWarn(`UNABLE TO BUILD AVAILABILITY - ${(!SB_AIRPORTS[org] ? org : dst)} NOT IN TRAINING DATABASE`);
    return;
  }

  const options = sbGenerateAvailability(org, dst, date);
  if (!options) { sbWarn(`NO SERVICE FOUND ${org}${dst} ${date}`); return; }

  sbPrint(`** SABRE AVAILABILITY - ${org}${dst} ${date} 0000 **`);
  sbPrint(` ${org} ${dst} ${date}  F 0000  DIRECT/CONNECT`);
  options.forEach((opt, i) => {
    opt.legs.forEach((leg, li) => {
      const lineNo = li === 0 ? String(i + 1) : ' ';
      const dayOverTag = leg.dayOver ? `+${leg.dayOver}` : '';
      sbPrint(` ${lineNo} ${leg.al} ${leg.fn} ${leg.cls}  ${leg.dep} ${leg.arr} ${leg.depT} ${leg.arrT}${dayOverTag} ${date} E0 ${leg.eq} ${leg.day} 0`);
    });
    if (opt.legs.length > 1) sbPrint(`   CONNECTION VIA ${opt.legs[0].arr} — 2 SEGMENTS WILL BE SOLD TOGETHER`, 'line-warn');
  });

  sbState._availCache = options.map(opt => ({
    date, dep: opt.legs[0].dep, arr: opt.legs[opt.legs.length - 1].arr, legs: opt.legs
  }));
}

/* ---------------------------------------------------------------------
   0<CLASS><LINE> — sell from displayed availability (all legs of that
   option are booked; a connection therefore adds 2 PNR lines)
--------------------------------------------------------------------- */
function cmdSell(raw) {
  const m = raw.match(/^0([A-Z])(\d+)$/);
  if (!m) { sbWarn("FORMAT: 0<CLASS><LINE>  e.g. 0Y1"); return; }
  const [, cls, lineStr] = m;
  const line = parseInt(lineStr, 10);
  const cache = sbState._availCache;
  if (!cache) { sbWarn("NO AVAILABILITY DISPLAYED - USE 1N ENTRY FIRST"); return; }
  const opt = cache[line - 1];
  if (!opt) { sbWarn(`LINE ${line} NOT FOUND IN LAST AVAILABILITY DISPLAY`); return; }

  opt.legs.forEach(leg => {
    sbState.booked.push({
      al: leg.al, fn: leg.fn, cls, date: opt.date, dep: leg.dep, arr: leg.arr,
      status: "HK1", depT: leg.depT || "----", arrT: leg.arrT || "----",
      eq: leg.eq, day: leg.day, dayOver: leg.dayOver
    });
    const s = sbState.booked[sbState.booked.length - 1];
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    sbPrint(` ${sbState.booked.length} ${s.al} ${s.fn}${s.cls} ${s.date} ${s.day} ${s.dep}${s.arr} HK1 ${s.depT} ${s.arrT}${dayOverTag} E0 ${s.eq}`);
  });
}

/* ---------------------------------------------------------------------
   -SURNAME/FIRST MR  — name field (chain multiple entries for group PNRs)
--------------------------------------------------------------------- */
function cmdName(raw) {
  const body = raw.replace(/^-/, '').trim();
  const nm = body.match(/^([A-Z' -]+)\/([A-Z' ]+)\s+(MR|MRS|MS|MSTR|MISS|DR)?$/i);
  if (!nm) { sbWarn("FORMAT: -SURNAME/FIRSTNAME MR"); return; }
  sbState.names.push({ raw: body.toUpperCase(), surname: nm[1].trim(), first: nm[2].trim(), title: (nm[3] || '').toUpperCase() });
  sbPrint(` ${sbState.names.length}.${body.toUpperCase()}`);
}

/* ---------------------------------------------------------------------
   9<CITY><NUMBER>-<TYPE>  — phone field
--------------------------------------------------------------------- */
function cmdPhone(raw) {
  const body = raw.replace(/^9/, '').trim();
  if (!body) { sbWarn("FORMAT: 9DAC 01XXXXXXXXX-A"); return; }
  sbState.phones.push({ raw: body.toUpperCase() });
  sbPrint(` ${sbState.phones.length}.${body.toUpperCase()}`);
}

/* ---------------------------------------------------------------------
   6<NAME>  — received from field
--------------------------------------------------------------------- */
function cmdReceivedFrom(raw) {
  const body = raw.replace(/^6/, '').trim();
  if (!body) { sbWarn("FORMAT: 6<AGENT/PASSENGER NAME>"); return; }
  sbState.receivedFrom = body.toUpperCase();
  sbPrint(`RECEIVED FROM - ${sbState.receivedFrom}`);
}

/* ---------------------------------------------------------------------
   7TAW-DDMMM/  — ticketing arrangement / time limit
--------------------------------------------------------------------- */
function cmdTicketingArrangement(raw) {
  const body = raw.replace(/^7/, '').trim();
  if (!body) { sbWarn("FORMAT: 7TAW-DDMMM/  e.g. 7TAW-20DEC/"); return; }
  sbState.ticketingArrangement = body.toUpperCase();
  sbPrint(`TKT/TIME LIMIT`);
  sbPrint(` 1.${sbState.ticketingArrangement}`);
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
  sbPrint(` ${sbState.ssrEntries.length} SSR ${body.toUpperCase()}`);
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
  }
  sbState.ended = true;
  sbPrint(`${sbState.locator} HAS BEEN QUEUED TO 3MUL.3MUL`);
  if (redisplay) sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   *R — redisplay current PNR
--------------------------------------------------------------------- */
function cmdRedisplay() {
  sbPrint(sbRenderPNR());
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

  if (/^W\/-[A-Z]{3}$/.test(upper)) return cmdEncodeDecode(upper.slice(3));
  if (/^1[NA]\d{2}[A-Z]{3}[A-Z]{6}$/.test(upper)) return cmdAvailability(upper);
  if (/^0[A-Z]\d+$/.test(upper)) return cmdSell(upper);
  if (/^-[A-Z]/.test(upper)) return cmdName(upper);
  if (/^9[A-Z]/.test(upper)) return cmdPhone(upper);
  if (/^6[A-Z]/.test(upper)) return cmdReceivedFrom(upper);
  if (/^7[A-Z]/.test(upper)) return cmdTicketingArrangement(upper);
  if (/^3[A-Z]/.test(upper)) return cmdSSR(upper);
  if (/^WPNCB$|^WPNI$/.test(upper)) return cmdPriceQuote();
  if (/^ER?$/.test(upper)) return cmdEndTransaction(upper === "ER");
  if (/^\*R$/.test(upper)) return cmdRedisplay();
  if (/^\*[A-Z0-9]*$/.test(upper)) return cmdRetrieve(upper);
  if (/^WTP?$/.test(upper)) return cmdIssueTicket();
  if (/^XI$/.test(upper)) return cmdIgnore();
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
  sbEcho(val);
  sbParse(val);
  input.value = '';
}
