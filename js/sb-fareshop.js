/* =========================================================================
   sb-fareshop.js  –  Sabre Fare Shop / Bargain Finder Mask (JR - CREATE)
   Matches Sabre Agency Workspace CERT exact layout.
   Triggered by command: JR
   Action P: Prices / shops itineraries
   Action C / Esc: Cancels the mask
   ========================================================================= */

function sbGetSabreDate() {
  const d = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  return `${day}${mon}`;
}

/* ── legRow helper ───────────────────────────────────────────────── */
function _jrLegRow(n, dstVal, dateVal, timeVal) {
  const star = n === 2 ? '*' : '';
  return `<div class="jr-line jr-leg-row">` +
    `<span class="jr-leg-idx">${n}</span>` +
    `<input class="jr-inp jr-inp-sm" id="jrConn${n}" maxlength="1" value="0">` +
    `<input class="jr-inp jr-inp-code" id="jrDst${n}" maxlength="3" value="${dstVal}">` +
    `<span class="jr-leg-star">${star}</span>` +
    `<input class="jr-inp jr-inp-date" id="jrDate${n}" maxlength="5" value="${dateVal}">` +
    `<input class="jr-inp jr-inp-time" id="jrTime${n}" maxlength="9" value="${timeVal}">` +
    `<input class="jr-inp jr-inp-cxr" id="jrCxr${n}" maxlength="5" value="/ /">` +
    `<input class="jr-inp jr-inp-sm" id="jrCabin${n}" maxlength="1" value="Y">` +
    `</div>`;
}

/* ── main mask builder ───────────────────────────────────────────── */
function cmdFareShopJR() {
  const term = document.getElementById('termArea');
  if (!term) return;

  // If mask already on screen, re-focus ACTION
  const existing = document.getElementById('sbJrMask');
  if (existing) {
    const actInp = document.getElementById('jrAction');
    if (actInp) actInp.focus();
    existing.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }

  // Echo the command without clearing existing history
  if (typeof sbEcho === 'function') sbEcho('JR');

  const today = sbGetSabreDate();

  const wrap = document.createElement('div');
  wrap.id = 'sbJrMask';
  wrap.className = 'sb-jr-mask';

  // Build rows matching Live Sabre CERT screenshot 1 (media_1790725086897.png) exactly
  wrap.innerHTML = `
<div class="jr-line jr-hdr"> JR - CREATE</div>
<div class="jr-line jr-dash"> --------------------------------------------------------------------------------</div>
<div class="jr-line">
  <span class="jr-lbl-w6">ACTION</span>
  <input class="jr-inp jr-inp-sm" id="jrAction" maxlength="1" value="" autofocus>
  <span style="margin: 0 4px;">P TO PRICE / C TO CANCEL MASK WS/PQ</span>
  <span style="margin-left: 10px;">N</span><input class="jr-inp jr-inp-sm" id="jrWsPq" maxlength="1" value="N">
  <span style="margin-left: 6px;">X</span><input class="jr-inp jr-inp-sm" id="jrX" maxlength="1" value="3">
</div>
<div class="jr-line">
  <span class="jr-lbl-w10">PRIORITY-PRICE</span>
  <input class="jr-inp jr-inp-sm" id="jrPrioPrice" maxlength="1" value="1">
  <span style="margin: 0 4px 0 10px;">DIRECT/NON-STOP</span>
  <input class="jr-inp jr-inp-sm" id="jrDirect" maxlength="1" value="2">
  <span style="margin: 0 4px 0 10px;">TIME</span>
  <input class="jr-inp jr-inp-sm" id="jrTimePrio" maxlength="1" value="3">
  <span style="margin: 0 4px 0 10px;">CXR</span>
  <input class="jr-inp jr-inp-sm" id="jrCxrPrio" maxlength="1" value="4">
</div>
<div class="jr-line jr-col-hdr">
  <span class="jr-lbl-w4">FROM</span>
  <input class="jr-inp jr-inp-code" id="jrFromMain" maxlength="3" value="">
  <span class="jr-col-h-date">DATE</span>
  <span class="jr-col-h-time">TIME/RANGE</span>
  <span class="jr-col-h-cxr">CARRIER</span>
  <span class="jr-col-h-cabin">CABIN</span>
</div>
<div class="jr-legs" id="jrLegsContainer">
  ${_jrLegRow(1, '', today, '0700 /¥-')}
  ${_jrLegRow(2, '', '', '    /¥-')}
  ${_jrLegRow(3, '', '', '    /¥-')}
  ${_jrLegRow(4, '', '', '    /¥-')}
  ${_jrLegRow(5, '', '', '    /¥-')}
  ${_jrLegRow(6, '', '', '    /¥-')}
</div>
<div class="jr-line">
  <span class="jr-lbl-w9">MORE CITIES</span>
  <input class="jr-inp jr-inp-code" id="jrMoreCities" maxlength="3" value="">
  <span style="flex: 1;"></span>
  <span style="margin-right: 6px;">ONLINE SERVICE ONLY</span>
  <input class="jr-inp jr-inp-sm" id="jrOnlineOnly" maxlength="1" value="N">
</div>
<div class="jr-line jr-dash"> --------------------------------------------------------------------------------</div>
<div class="jr-line">
  <span class="jr-lbl-w9">MIN/MAX STAY</span>
  <input class="jr-inp jr-inp-sm" id="jrMinStay" maxlength="1" value="Y">
  <span style="margin: 0 4px 0 10px;">REFUND/PEN</span>
  <input class="jr-inp jr-inp-sm" id="jrRefund" maxlength="1" value="Y">
  <span style="margin: 0 4px 0 10px;">RES/TKT</span>
  <input class="jr-inp jr-inp-sm" id="jrResTkt" maxlength="1" value="Y">
  <span style="margin: 0 4px 0 10px;">JUMP</span>
  <input class="jr-inp jr-inp-sm" id="jrJump" maxlength="1" value="">
</div>
<div class="jr-line">
  <span class="jr-lbl-w4">PSGR</span>
  <input class="jr-inp jr-inp-psgr" id="jrPsgr1" maxlength="4" value="1ADT">
  <input class="jr-inp jr-inp-psgr" id="jrPsgr2" maxlength="4" value="">
  <input class="jr-inp jr-inp-psgr" id="jrPsgr3" maxlength="4" value="">
  <input class="jr-inp jr-inp-psgr" id="jrPsgr4" maxlength="4" value="">
  <span style="flex: 1;"></span>
  <span style="margin-right: 6px;">TKT DATE</span>
  <input class="jr-inp jr-inp-date" id="jrTktDate" maxlength="5" value="${today}">
</div>
<div class="jr-line">
  <span class="jr-lbl-w9">NON-PREF CXR</span>
  <input class="jr-inp jr-inp-cxr" id="jrNonPref" maxlength="5" value="/ /">
  <span style="margin: 0 4px 0 10px;">CORP ID</span>
  <input class="jr-inp jr-inp-corp" id="jrCorpId" maxlength="8" value="">
  <span style="margin: 0 4px 0 10px;">PV</span>
  <input class="jr-inp jr-inp-sm" id="jrPv" maxlength="1" value="">
  <span style="margin: 0 4px 0 10px;">PL</span>
  <input class="jr-inp jr-inp-sm" id="jrPl" maxlength="1" value="">
</div>
<div class="jr-line">
  <span class="jr-lbl-w4">TPR</span>
  <input class="jr-inp jr-inp-sm" id="jrTpr" maxlength="1" value="N">
  <span style="margin: 0 4px 0 10px;">TPR ID</span>
  <input class="jr-inp jr-inp-tprid" id="jrTprId" maxlength="16" value="">
  <span style="margin: 0 4px 0 10px;">XO</span>
  <input class="jr-inp jr-inp-sm" id="jrXo" maxlength="1" value="">
</div>
<div class="jr-line">
  <span class="jr-lbl-w9">INSERT AFTER</span>
  <input class="jr-inp jr-inp-sm" id="jrInsertAfter" maxlength="2" value="">
  <span style="margin: 0 4px 0 8px;">OR DELETE FROM</span>
  <input class="jr-inp jr-inp-sm" id="jrDeleteFrom" maxlength="2" value="">
  <span style="margin: 0 4px 0 8px;">FOR</span>
  <input class="jr-inp jr-inp-sm" id="jrForSeg" maxlength="2" value="">
  <span style="margin-left: 4px;">SEGMENTS.</span>
</div>
`;

  term.appendChild(wrap);

  // Position mask at top of view initially
  if (typeof sbScrollToCommand === 'function') {
    sbScrollToCommand(wrap);
  } else {
    wrap.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  // Auto-focus ACTION input
  const act = document.getElementById('jrAction');
  if (act) setTimeout(() => act.focus(), 50);

  // Handle Enter / Esc across all inputs in the mask
  wrap.querySelectorAll('.jr-inp').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sbHandleJrSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        sbCloseJrMask();
      }
    });
  });
}

/* ── close mask ──────────────────────────────────────────────────── */
function sbCloseJrMask() {
  const mask = document.getElementById('sbJrMask');
  if (mask) mask.remove();
  const results = document.getElementById('sbJrResults');
  if (results) results.remove();
  if (typeof sbPrint === 'function') sbPrint('JR MASK CANCELLED');
}

/* ── submit handler ──────────────────────────────────────────────── */
function sbHandleJrSubmit() {
  const act = (document.getElementById('jrAction')?.value || '').trim().toUpperCase();

  if (act === 'C') {
    sbCloseJrMask();
    return;
  }

  // Gather fields with intelligent fallback if user left blank
  const origin   = (document.getElementById('jrFromMain')?.value  || 'DAC').trim().toUpperCase();
  const dst1     = (document.getElementById('jrDst1')?.value      || 'SIN').trim().toUpperCase();
  const dst2     = (document.getElementById('jrDst2')?.value      || '').trim().toUpperCase();
  const date1    = (document.getElementById('jrDate1')?.value      || sbGetSabreDate()).trim().toUpperCase();
  const date2    = (document.getElementById('jrDate2')?.value      || '').trim().toUpperCase();
  const cxrRaw   = (document.getElementById('jrCxr1')?.value       || '').replace(/[\/\s]/g, '').toUpperCase();
  const carrier  = cxrRaw || '';
  const psgrRaw  = (document.getElementById('jrPsgr1')?.value      || '1ADT').trim().toUpperCase();

  // IMPORTANT: DO NOT REMOVE THE MASK!
  // In Live Sabre, the mask remains in place with all typed inputs!
  const actInp = document.getElementById('jrAction');
  if (actInp && !actInp.value) actInp.value = 'P';

  // Get or create the results area directly below the mask
  let resArea = document.getElementById('sbJrResults');
  if (!resArea) {
    resArea = document.createElement('div');
    resArea.id = 'sbJrResults';
    resArea.className = 'jr-results-area';
    const mask = document.getElementById('sbJrMask');
    if (mask && mask.parentNode) {
      mask.parentNode.insertBefore(resArea, mask.nextSibling);
    } else {
      document.getElementById('termArea')?.appendChild(resArea);
    }
  }

  // Clear previous results content
  resArea.innerHTML = '';

  const isRT = Boolean(dst2 && dst2 !== '');
  _sbRenderBfmResultsInContainer(resArea, origin, dst1, date1, dst2, date2, carrier, psgrRaw, isRT);

  // SCROLL IMMEDIATELY SO ITINERARY OPTION 1 IS AT THE TOP OF THE SCREEN!
  // Exactly matching Live Sabre screenshot media_1790726488183.png
  setTimeout(() => {
    if (typeof sbScrollToCommand === 'function') {
      sbScrollToCommand(resArea);
    } else {
      resArea.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, 10);
}

/* ── BFM results renderer matching Screenshot (media_1790726488183.png) ── */
function _sbRenderBfmResultsInContainer(container, org, dst, date1, dst2, date2, reqCxr, psgrRaw, isRT) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dayLetters = ['S','M','T','W','Q','F','S']; // Sunday=S, Monday=M, Tue=T, Wed=W, Thu=Q, Fri=F, Sat=S

  function parseDate(str) {
    if (!str || str.length < 5) return new Date();
    const dd  = parseInt(str.slice(0,2), 10);
    const mon = str.slice(2);
    const mi  = months.findIndex(m => m === mon);
    if (mi < 0) return new Date();
    const yr  = new Date().getFullYear();
    return new Date(yr, mi, dd);
  }

  const d1 = parseDate(date1);
  const d2 = date2 ? parseDate(date2) : new Date(d1.getTime() + 24*3600*1000);

  const paxCount = parseInt((psgrRaw.match(/\d+/) || ['1'])[0], 10) || 1;
  const paxType  = psgrRaw.replace(/\d/g, '') || 'ADT';

  const preferredCarriers = reqCxr ? [reqCxr] : ['AI', 'AI', 'BS', 'SQ', 'BG', 'MH'];

  const sampleOptions = [
    {
      carrier: preferredCarriers[0] || 'AI',
      legs: isRT ? [
        { seg: 1, al: 'AI', fn: '238', cls: 'S', d: d1, org: org, dst: 'DEL', dt: '1510', at: '1730', eq: '320', stops: 0 },
        { seg: 1, al: 'AI', fn: '2115', cls: 'S', d: new Date(d1.getTime() + 24*3600*1000), org: 'DEL', dst: dst, dt: '0340', at: '1210', eq: '321', stops: 0 },
        { seg: 2, al: 'AI', fn: '2108', cls: 'S', d: d2, org: dst, dst: 'BOM', dt: '1940', at: '2325', eq: '321', stops: 0 },
        { seg: 2, al: 'AI', fn: '2183', cls: 'Q', d: new Date(d2.getTime() + 24*3600*1000), org: 'BOM', dst: dst2 || org, dt: '0720', at: '1045', eq: '32N', stops: 0 }
      ] : [
        { seg: 1, al: 'AI', fn: '238', cls: 'S', d: d1, org: org, dst: 'DEL', dt: '1510', at: '1730', eq: '320', stops: 0 },
        { seg: 1, al: 'AI', fn: '2115', cls: 'S', d: new Date(d1.getTime() + 24*3600*1000), org: 'DEL', dst: dst, dt: '0340', at: '1210', eq: '321', stops: 0 }
      ],
      fare: 28018
    },
    {
      carrier: 'AI',
      legs: isRT ? [
        { seg: 1, al: 'AI', fn: '238', cls: 'S', d: d1, org: org, dst: 'DEL', dt: '1510', at: '1730', eq: '320', stops: 0 },
        { seg: 1, al: 'AI', fn: '2380', cls: 'S', d: d1, org: 'DEL', dst: dst, dt: '2235', at: '0700', eq: '321', stops: 0 },
        { seg: 2, al: 'AI', fn: '2383', cls: 'S', d: d2, org: dst, dst: 'DEL', dt: '2300', at: '0230', eq: '321', stops: 0 },
        { seg: 2, al: 'AI', fn: '227', cls: 'Q', d: new Date(d2.getTime() + 24*3600*1000), org: 'DEL', dst: dst2 || org, dt: '1110', at: '1410', eq: '320', stops: 0 }
      ] : [
        { seg: 1, al: 'AI', fn: '238', cls: 'S', d: d1, org: org, dst: 'DEL', dt: '1510', at: '1730', eq: '320', stops: 0 },
        { seg: 1, al: 'AI', fn: '2380', cls: 'S', d: d1, org: 'DEL', dst: dst, dt: '2235', at: '0700', eq: '321', stops: 0 }
      ],
      fare: 28018
    },
    {
      carrier: 'BS',
      legs: isRT ? [
        { seg: 1, al: 'BS', fn: '307', cls: 'S', d: d1, org: org, dst: dst, dt: '2215', at: '0430', eq: '738', stops: 0 },
        { seg: 2, al: 'BS', fn: '308', cls: 'S', d: d2, org: dst, dst: dst2 || org, dt: '0530', at: '0745', eq: '738', stops: 0 }
      ] : [
        { seg: 1, al: 'BS', fn: '307', cls: 'S', d: d1, org: org, dst: dst, dt: '2215', at: '0430', eq: '738', stops: 0 }
      ],
      fare: 33044
    },
    {
      carrier: 'SQ',
      legs: isRT ? [
        { seg: 1, al: 'SQ', fn: '447', cls: 'V', d: d1, org: org, dst: dst, dt: '2355', at: '0605', eq: '78X', stops: 0 },
        { seg: 2, al: 'SQ', fn: '446', cls: 'V', d: d2, org: dst, dst: dst2 || org, dt: '2035', at: '2240', eq: '78X', stops: 0 }
      ] : [
        { seg: 1, al: 'SQ', fn: '447', cls: 'V', d: d1, org: org, dst: dst, dt: '2355', at: '0605', eq: '78X', stops: 0 }
      ],
      fare: 46250
    }
  ];

    // Store options in global & state so 0J1 / 01J1 sell command works
  window._sbBfmOptions = sampleOptions;
  if (typeof sbState !== 'undefined') {
    sbState._bfmOptions = sampleOptions;
  }

  let outHtml = '';

  sampleOptions.forEach((opt, idx) => {
    outHtml += `<div class="jr-opt-block" onclick="sbSellBfmOption(${idx + 1}, ${paxCount})" style="margin-bottom: 16px; cursor: pointer;" title="Click to hold/sell Option ${idx + 1} (Command: 0J${idx + 1} or 0${paxCount}J${idx + 1})">`;
    outHtml += `<div class="jr-opt-title" style="font-weight: 700; color: #ffffff; margin-bottom: 3px; font-size: 14px;">ITINERARY OPTION ${idx + 1} <span style="font-size: 11px; font-weight: normal; color: #0d9488; margin-left: 10px;">[01J${idx + 1} TO HOLD]</span></div>`;

    opt.legs.forEach(leg => {
      const dtStr = String(leg.d.getDate()).padStart(2, '0') + months[leg.d.getMonth()];
      const dayLet = dayLetters[leg.d.getDay()];
      leg.dtStr = dtStr;
      leg.dayLet = dayLet;
      outHtml += `<div class="jr-flight-line" style="font-family: inherit; font-size: 13.5px; line-height: 1.5; color: #cfd6e0; white-space: pre;">` +
        ` ${leg.seg} ${leg.al.padEnd(3)} ${leg.fn.padStart(5)}  ${leg.cls} ${dtStr} ${dayLet}  ${leg.org.padEnd(4)} ${leg.dst.padEnd(4)} ${leg.dt}  ${leg.at} ${leg.eq} ${leg.stops} /E` +
        `</div>`;
    });

    const singleFare = opt.fare;
    const totalFare = singleFare * paxCount;
    outHtml += `<div class="jr-fare-line" style="margin-top: 2px; font-family: inherit; font-size: 13.5px; line-height: 1.5; color: #cfd6e0; white-space: pre;">` +
      `    ${paxCount}${paxType.padEnd(4)}  ${String(singleFare).padEnd(9)} ${totalFare}\n` +
      ` TOTAL FARE - BDT    ${totalFare}\n\n` +
      `FORM OF PAYMENT FEES PER TICKET MAY APPLY\n` +
      ` ${paxType.toUpperCase()} - MAXIMUM AMOUNT PER PASSENGER -        0` +
      `</div>`;

    outHtml += `</div>`;
  });

  container.innerHTML = outHtml;
}

/* ── Sell / Hold Segment from BFM / FareShop (0J1, 01J1, 02J1) ── */
function sbSellBfmOption(optIndex, qty) {
  if (qty === undefined) qty = 1;
  const options = window._sbBfmOptions || (typeof sbState !== 'undefined' ? sbState._bfmOptions : null);
  if (!options || !options[optIndex - 1]) {
    if (typeof sbWarn === 'function') sbWarn('NO ITINERARY OPTIONS AVAILABLE - RUN FARESHOP/JR FIRST');
    return false;
  }
  const opt = options[optIndex - 1];
  if (typeof sbState === 'undefined') return false;

  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAYNUM = [1,2,3,4,5,6,7]; // Sabre day: 1=Sun,2=Mon,...,7=Sat

  function getDateStr(leg) {
    if (leg.dtStr) return leg.dtStr;
    if (leg.d) return String(leg.d.getDate()).padStart(2,'0') + MON[leg.d.getMonth()];
    return '30DEC';
  }
  function getDayNum(leg) {
    if (leg.dayLet) {
      const map = {S:1,M:2,T:3,W:4,Q:5,F:6};
      return map[leg.dayLet] || 3;
    }
    if (leg.d) { const d = leg.d.getDay(); return d === 0 ? 1 : d + 1; }
    return 3;
  }

  const legs = opt.legs;
  const al = opt.carrier || legs[0].al;
  const org = legs[0].org;

  // ── Fare calculations ────────────────────────────────────────────────────
  const totalBdt = opt.fare;
  const usdFare  = Math.round(totalBdt / 123.65 * 100) / 100;
  const equivBdt = Math.round(usdFare * 123.65);
  const taxBD    = 500;
  const taxUT    = 4000;
  const taxXT    = Math.max(totalBdt - equivBdt - taxBD - taxUT, 0);

  const FARE_BASIS = { AI:'SU3YXSDC', BS:'SBDSGO', SQ:'VU3XSDC', MH:'SHB6XSDC', MU:'VU3YXSDC', UL:'SHB6XSDC', BG:'SBDSGO' };
  const fareBasis = FARE_BASIS[al] || (legs[0].cls + 'BDSGO');

  // ── 1. PSGR / CXR block ──────────────────────────────────────────────────
  sbPrint('PSGR TYPE  ADT - 01');
  sbPrint('     CXR RES DATE  FARE BASIS      NVB    NVA    BG');
  sbPrint(' ' + org);
  legs.forEach(function(leg, i) {
    const isLast = (i === legs.length - 1);
    const prefix = isLast ? ' ' : 'X';
    const city   = leg.dst;
    const date   = getDateStr(leg);
    sbPrint(prefix + city + ' ' + leg.al + '  ' + leg.cls + '   ' + date + ' ' + fareBasis.padEnd(14) + '  ' + date + ' ' + date + ' 30K');
  });

  // ── 2. FARE / TAX / TOTAL ────────────────────────────────────────────────
  sbPrint('FARE  USD ' + String(usdFare.toFixed(2)).padStart(9) + ' EQUIV BDT   ' + String(equivBdt).padStart(8));
  sbPrint('TAX   BDT   ' + String(taxBD).padStart(6) + 'BD BDT   ' + String(taxUT).padStart(7) + 'UT BDT   ' + String(taxXT).padStart(7) + 'XT');
  sbPrint('TOTAL BDT  ' + totalBdt);
  sbPrint('ADT-01  ' + fareBasis);

  // ── 3. Routing line ──────────────────────────────────────────────────────
  var routeLine = ' ' + org;
  legs.forEach(function(leg, i) {
    if (i < legs.length - 1) {
      routeLine += ' ' + leg.al + ' X/' + leg.dst;
    } else {
      routeLine += ' ' + leg.al + ' ' + leg.dst;
    }
  });
  routeLine += usdFare.toFixed(2) + 'NUC' + usdFare.toFixed(2) + 'END ROE1.00';
  sbPrint(routeLine);

  // ── 4. XT taxes / ENDOS / ATTN ──────────────────────────────────────────
  sbPrint('XT BDT25000W BDT447E5 BDT414YR BDT1237P8 BDT1237P7');
  var startSeg = sbState.booked.length + 1;
  var endSeg   = startSeg + legs.length - 1;
  var segRef   = legs.length > 1 ? startSeg + '/' + endSeg : String(startSeg);
  sbPrint('ENDOS*SEG' + segRef + '*NON-END/CHANGE/CANCELLATION/NO-SHOW/PENALTY MAY');
  sbPrint('ENDOS*APPLY/AS PER FARE RULES');
  sbPrint('RATE USED 1USD-123.65BDT');
  sbPrint('ATTN*VALIDATING CARRIER - ' + al);
  sbPrint('ATTN*AIR EXTRAS AVAILABLE - SEE WP*AE');
  sbPrint('ATTN*BAGGAGE INFO AVAILABLE - SEE WP*BAG');

  // ── 5. Add new legs to sbState.booked (NN1 = pending) ───────────────────
  legs.forEach(function(leg) {
    sbState.booked.push({
      al:      leg.al,
      fn:      leg.fn,
      cls:     leg.cls,
      date:    getDateStr(leg),
      dep:     leg.org,
      arr:     leg.dst,
      status:  'NN1',
      depT:    leg.dt,
      arrT:    leg.at,
      eq:      leg.eq,
      day:     getDayNum(leg),
      dayOver: 0
    });
  });

  // ── 6. Print full itinerary ───────────────────────────────────────────────
  sbState.booked.forEach(function(s, i) {
    var n = i + 1;
    if (s.al === 'ARNK') {
      sbPrint(' ' + n + '   ARNK');
      return;
    }
    var fn4  = String(s.fn).padStart(4, ' ');
    var deps = (s.dep + s.arr).padEnd(6);
    var dc   = '/DC' + s.al;
    var isNN = (s.status === 'NN1');
    var line = ' ' + n + ' ' + s.al + fn4 + s.cls + ' ' + s.date + ' ' + s.day + ' ' + deps + ' ' + s.status + '  ' + s.depT + '  ' + s.arrT;
    if (isNN) {
      sbPrint(line);
      sbPrint('                                                   /PENDING /E');
    } else {
      sbPrint(line + '  ' + dc + ' /E');
    }
  });

  // ── 7. Store fare quote ───────────────────────────────────────────────────
  if (typeof sbBuildFareQuote === 'function' && typeof sbGetFareForCarrier === 'function') {
    var f = sbGetFareForCarrier(al);
    f.total    = opt.fare;
    f.baseBdt  = equivBdt;
    f.tax      = totalBdt - equivBdt;
    sbState.privateFare  = f;
    sbState.pqPriced     = true;
    sbState.fareQuote    = sbBuildFareQuote(f);
  }

  return true;
}

if (typeof window !== 'undefined') {
  window.cmdFareShopJR = cmdFareShopJR;
  window.sbHandleJrSubmit = sbHandleJrSubmit;
  window.sbCloseJrMask = sbCloseJrMask;
  window.sbSellBfmOption = sbSellBfmOption;
}