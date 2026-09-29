/* =========================================================================
   sb-fareshop.js  –  Sabre Fare Shop / Bargain Finder Mask (JR)
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
  const today = sbGetSabreDate();
  return `<div class="jr-leg-row">` +
    `<span class="jr-leg-idx">${n}</span>` +
    `<span class="jr-leg-conn"><input class="jr-inp jr-inp-sm" id="jrConn${n}" maxlength="1" value="O"></span>` +
    `<input class="jr-inp jr-inp-code" id="jrDst${n}" maxlength="3" value="${dstVal}" placeholder="">` +
    `<span class="jr-leg-star">${n===2?'*':''}</span>` +
    `<input class="jr-inp jr-inp-date" id="jrDate${n}" maxlength="5" value="${dateVal}" placeholder="">` +
    `<input class="jr-inp jr-inp-time" id="jrTime${n}" maxlength="8" value="${timeVal}">` +
    `<input class="jr-inp jr-inp-cxr" id="jrCxr${n}" maxlength="5" value="/ /">` +
    `<input class="jr-inp jr-inp-sm" id="jrCabin${n}" maxlength="1" value="Y">` +
    `</div>`;
}

/* ── main mask builder ───────────────────────────────────────────── */
function cmdFareShopJR() {
  const term = document.getElementById('termArea');
  if (!term) return;

  // Remove any existing mask first without wiping history
  const old = document.getElementById('sbJrMask');
  if (old) old.remove();

  // Echo the command into the existing history (don't clear)
  if (typeof sbEcho === 'function') sbEcho('JR');

  const today = sbGetSabreDate();

  // Calculate next day for leg 2 default
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const nextDay = `${String(d.getDate()).padStart(2,'0')}${months[d.getMonth()]}`;

  const wrap = document.createElement('div');
  wrap.id = 'sbJrMask';
  wrap.className = 'sb-jr-mask';

  wrap.innerHTML = `
<div class="jr-line jr-hdr">JR - DEPARTURE DATE</div>
<div class="jr-line jr-dash">------------------------------------------------------------------------</div>

<div class="jr-line">
  <span class="jr-lbl-w6">ACTION</span>
  <input class="jr-inp jr-inp-sm" id="jrAction" maxlength="1" value="" autofocus>
  <span class="jr-mid">P TO PRICE / C TO CANCEL MASK WS/PQ</span>
  <span class="jr-lbl-sm">N</span><input class="jr-inp jr-inp-sm" id="jrWsPq" maxlength="1" value="N">
  <span class="jr-lbl-sm">X</span><input class="jr-inp jr-inp-sm" id="jrX" maxlength="1" value="3">
</div>

<div class="jr-line">
  <span class="jr-lbl-w10">PRIORITY-PRICE</span>
  <input class="jr-inp jr-inp-sm" id="jrPrioPrice" maxlength="1" value="1">
  <span class="jr-mid">DIRECT/NON-STOP</span>
  <input class="jr-inp jr-inp-sm" id="jrDirect" maxlength="1" value="2">
  <span class="jr-lbl-sm">TIME</span>
  <input class="jr-inp jr-inp-sm" id="jrTimePrio" maxlength="1" value="3">
  <span class="jr-lbl-sm">CXR</span>
  <input class="jr-inp jr-inp-sm" id="jrCxrPrio" maxlength="1" value="4">
</div>

<div class="jr-line jr-col-hdr">
  <span class="jr-lbl-w4">FROM</span>
  <input class="jr-inp jr-inp-code" id="jrFromMain" maxlength="3" value="DAC">
  <span class="jr-col-h-date">DATE</span>
  <span class="jr-col-h-time">TIME/RANGE</span>
  <span class="jr-col-h-cxr">CARRIER</span>
  <span class="jr-col-h-cabin">CABIN</span>
</div>

<div class="jr-legs" id="jrLegsContainer">
  ${_jrLegRow(1,'SIN',today,'0700/¥-')}
  ${_jrLegRow(2,'DAC',nextDay,'/¥-')}
  ${_jrLegRow(3,'','','/¥-')}
  ${_jrLegRow(4,'','','/¥-')}
  ${_jrLegRow(5,'','','/¥-')}
  ${_jrLegRow(6,'','','/¥-')}
</div>

<div class="jr-line">
  <span class="jr-lbl-w9">MORE CITIES</span>
  <input class="jr-inp jr-inp-code" id="jrMoreCities" maxlength="3" value="">
  <span class="jr-spacer"></span>
  <span class="jr-mid2">ONLINE SERVICE ONLY</span>
  <input class="jr-inp jr-inp-sm" id="jrOnlineOnly" maxlength="1" value="N">
</div>

<div class="jr-line jr-dash">------------------------------------------------------------------------</div>

<div class="jr-line">
  <span class="jr-lbl-w9">MIN/MAX STAY</span>
  <input class="jr-inp jr-inp-sm" id="jrMinStay" maxlength="1" value="Y">
  <span class="jr-mid">REFUND/PEN</span>
  <input class="jr-inp jr-inp-sm" id="jrRefund" maxlength="1" value="Y">
  <span class="jr-mid">RES/TKT</span>
  <input class="jr-inp jr-inp-sm" id="jrResTkt" maxlength="1" value="Y">
  <span class="jr-mid">JUMP</span>
  <input class="jr-inp jr-inp-sm" id="jrJump" maxlength="1" value="">
</div>

<div class="jr-line">
  <span class="jr-lbl-w4">PSGR</span>
  <input class="jr-inp jr-inp-psgr" id="jrPsgr1" maxlength="4" value="1ADT">
  <input class="jr-inp jr-inp-psgr" id="jrPsgr2" maxlength="4" value="">
  <input class="jr-inp jr-inp-psgr" id="jrPsgr3" maxlength="4" value="">
  <span class="jr-spacer"></span>
  <span class="jr-mid">TKT DATE</span>
  <input class="jr-inp jr-inp-date" id="jrTktDate" maxlength="5" value="${today}">
</div>

<div class="jr-line">
  <span class="jr-lbl-w9">NON-PREF CXR</span>
  <input class="jr-inp jr-inp-cxr" id="jrNonPref" maxlength="5" value="/ /">
  <span class="jr-mid">CORP ID</span>
  <input class="jr-inp jr-inp-corp" id="jrCorpId" maxlength="8" value="">
  <span class="jr-mid">PV</span>
  <input class="jr-inp jr-inp-sm" id="jrPv" maxlength="1" value="">
  <span class="jr-mid">PL</span>
  <input class="jr-inp jr-inp-sm" id="jrPl" maxlength="1" value="">
</div>

<div class="jr-line">
  <span class="jr-lbl-w4">TPR</span>
  <input class="jr-inp jr-inp-sm" id="jrTpr" maxlength="1" value="N">
  <span class="jr-mid">TPR ID</span>
  <input class="jr-inp jr-inp-tprid" id="jrTprId" maxlength="16" value="">
  <span class="jr-mid">XO</span>
  <input class="jr-inp jr-inp-sm" id="jrXo" maxlength="1" value="">
</div>

<div class="jr-line">
  <span class="jr-lbl-w9">INSERT AFTER</span>
  <input class="jr-inp jr-inp-sm" id="jrInsertAfter" maxlength="2" value="">
  <span class="jr-mid">OR DELETE FROM</span>
  <input class="jr-inp jr-inp-sm" id="jrDeleteFrom" maxlength="2" value="">
  <span class="jr-mid">FOR</span>
  <input class="jr-inp jr-inp-sm" id="jrForSeg" maxlength="2" value="">
  <span class="jr-mid">SEGMENTS.</span>
</div>
`;

  term.appendChild(wrap);

  // Scroll so the JR mask header is visible at top
  const echoEl = term.querySelector('.line-echo:last-of-type');
  if (echoEl) {
    const termRect = term.getBoundingClientRect();
    const echoRect = echoEl.getBoundingClientRect();
    term.scrollTop = term.scrollTop + (echoRect.top - termRect.top);
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
  if (typeof sbPrint === 'function') sbPrint('JR MASK CANCELLED');
}

/* ── submit handler ──────────────────────────────────────────────── */
function sbHandleJrSubmit() {
  const act = (document.getElementById('jrAction')?.value || '').trim().toUpperCase();

  if (act === 'C') {
    sbCloseJrMask();
    return;
  }

  // Gather fields
  const origin   = (document.getElementById('jrFromMain')?.value  || 'DAC').trim().toUpperCase();
  const dst1     = (document.getElementById('jrDst1')?.value      || 'SIN').trim().toUpperCase();
  const dst2     = (document.getElementById('jrDst2')?.value      || '').trim().toUpperCase();
  const date1    = (document.getElementById('jrDate1')?.value      || sbGetSabreDate()).trim().toUpperCase();
  const date2    = (document.getElementById('jrDate2')?.value      || '').trim().toUpperCase();
  const cxrRaw   = (document.getElementById('jrCxr1')?.value       || '').replace(/[\/\s]/g, '').toUpperCase();
  const carrier  = cxrRaw || '';   // blank = all carriers (BFM style)
  const psgrRaw  = (document.getElementById('jrPsgr1')?.value      || '1ADT').trim().toUpperCase();

  // Remove mask from terminal (keep rest of history)
  const mask = document.getElementById('sbJrMask');
  if (mask) mask.remove();

  // Echo submitted command
  if (typeof sbEcho === 'function') sbEcho('JR P');

  // Determine if round-trip
  const isRT = dst2 && dst2 !== '';
  const tripLabel = isRT
    ? `${origin}-${dst1}-${dst2}`
    : `${origin}-${dst1}`;

  sbPrint(`BARGAIN FINDER MAX FARESHOP — DAC TO ${dst1} ON ${date1}`);
  sbPrint(`SEARCHING LOWEST AVAILABLE FARES FOR ${carrier ? 'CARRIER ' + carrier : 'ALL CARRIERS'}...`, 'line-warn');
  sbPrint('');

  // Generate synthetic BFM itinerary options matching Sabre screenshot style
  _sbRenderBfmResults(origin, dst1, date1, dst2 || '', date2, carrier, psgrRaw, isRT);
}

/* ── BFM results renderer ────────────────────────────────────────── */
function _sbRenderBfmResults(org, dst, date1, dst2, date2, reqCxr, psgrRaw, isRT) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const days   = ['','SUN','MON','TUE','WED','THU','FRI','SAT'];

  // Parse date into a real Date for day-of-week
  function parseDate(str) {
    if (!str || str.length < 5) return new Date();
    const dd  = parseInt(str.slice(0,2), 10);
    const mon = str.slice(2);
    const mi  = months.findIndex(m => m === mon);
    if (mi < 0) return new Date();
    const yr  = new Date().getFullYear();
    const d   = new Date(yr, mi, dd);
    return d;
  }

  function dayCode(str) {
    return days[parseDate(str).getDay() + 1] || 'MON';
  }

  // Choose airlines: if carrier specified use it, else pick a mix
  const ALL_AL = Object.keys(typeof SB_AIRLINES !== 'undefined' ? SB_AIRLINES : {});
  const carriers = reqCxr
    ? [reqCxr]
    : (ALL_AL.length ? ALL_AL.slice(0, 6) : ['AI','BG','SQ','MH','EK','QR']);

  // Deterministic pseudo-random from org+dst
  const seed = (org.charCodeAt(0) * 31 + dst.charCodeAt(0) * 17) & 0xffff;
  function prng(n) { return ((seed * 1103515245 + n * 12345) >>> 0) % 1000; }

  const printFare = t => sbPrint(t, 'fare-output');

  // Fare table
  const FARES = typeof SB_AIRLINES !== 'undefined'
    ? Object.fromEntries(Object.entries(SB_AIRLINES).map(([k, v]) => [k, (v.baseBdt || 37000) + Math.round(prng(k.charCodeAt(0)) * 20)]))
    : { AI: 51187, BG: 40730, SQ: 60245, MH: 44892, EK: 65435, QR: 64113 };

  const d1 = parseDate(date1);
  const d2 = date2 ? parseDate(date2) : null;

  // Build synthetic flights
  function makeFlight(al, fn, depDate, depCity, arrCity, depTm, arrTm, eq) {
    const dayOfWeek = depDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0,1);
    const dayFull   = depDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0,3);
    return { al, fn, depDate, depCity, arrCity, depTm, arrTm, eq, dayFull };
  }

  const options = [];
  carriers.slice(0, 6).forEach((al, i) => {
    const fnBase  = 100 + (prng(i) % 9) * 100 + (prng(i+1) % 99);
    const depTm   = String(5 + (prng(i+2) % 14)).padStart(2,'0') + String(prng(i+3) % 60).padStart(2,'0');
    const arrHr   = (parseInt(depTm.slice(0,2),10) + 2 + prng(i+4) % 6) % 24;
    const arrTm   = String(arrHr).padStart(2,'0') + String(prng(i+5) % 60).padStart(2,'0');
    const eq      = ['320','321','77W','738','359','32A','32N','319'][i % 8];

    const outLeg  = makeFlight(al, String(fnBase), d1, org, dst, depTm, arrTm, eq);
    const legs    = [outLeg];

    if (isRT && d2) {
      const dep2Tm = String(5 + (prng(i+6) % 14)).padStart(2,'0') + String(prng(i+7) % 60).padStart(2,'0');
      const arr2Hr = (parseInt(dep2Tm.slice(0,2),10) + 2 + prng(i+8) % 6) % 24;
      const arr2Tm = String(arr2Hr).padStart(2,'0') + String(prng(i+9) % 60).padStart(2,'0');
      const retLeg = makeFlight(al, String(fnBase + 1), d2, dst, dst2 || org, dep2Tm, arr2Tm, eq);
      legs.push(retLeg);
    }

    const base  = FARES[al] || 40000;
    const tax   = Math.round(base * 0.15);
    const total = base + tax;
    options.push({ legs, base, tax, total, al });
  });

  const paxCount = parseInt((psgrRaw.match(/\d+/) || ['1'])[0], 10) || 1;
  const paxType  = psgrRaw.replace(/\d/g, '') || 'ADT';

  options.forEach((opt, oi) => {
    printFare('');
    printFare(`ITINERARY OPTION ${oi + 1}`);
    opt.legs.forEach((leg, li) => {
      const dow = leg.depDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0,1);
      const dateStr = String(leg.depDate.getDate()).padStart(2,'0') + months[leg.depDate.getMonth()];
      printFare(
        `${li + 1} ${leg.al.padEnd(5)} ${leg.fn.padEnd(6)} ${dow} ${dateStr} ${String(leg.depDate.getDay() || 7).slice(0,1)} ${leg.depCity} ${leg.arrCity}  ${leg.depTm}  ${leg.arrTm}  ${leg.eq} 0 /E`
      );
    });

    const totalAll = opt.total * paxCount;
    printFare(`  ${paxCount}${paxType.padEnd(5)} ${String(opt.base).padEnd(10)} ${opt.base}`);
    printFare(`  TOTAL FARE - BDT     ${totalAll}`);
    printFare('');
    printFare('  FORM OF PAYMENT FEES PER TICKET MAY APPLY');
    printFare(`  ${paxType.toUpperCase()} - MAXIMUM AMOUNT PER PASSENGER -         0`);
  });
}
