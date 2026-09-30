/* =========================================================================
   SABRE TRAINING SIMULATOR — PNR STATE, RENDERING & TERMINAL I/O
   Independent educational tool — no affiliation with Sabre Corporation.
   ========================================================================= */

const SB_OFFICE = "3MUL";

/* ---------------------------------------------------------------------
   STATE — fresh on every load/refresh
--------------------------------------------------------------------- */
function sbEmptyState() {
  return {
    locator: null,
    officeId: SB_OFFICE,
    agentSine: "7H2Y",
    dateStamp: null,
    names: [],             // [{ raw, surname, first, title }]
    _availCache: null,      // last availability options shown (for sell)
    booked: [],             // sold segments in the PNR (flat list)
    phones: [],
    receivedFrom: null,
    ticketingArrangement: null,
    ssrEntries: [],
    documents: [],          // DOCS SSR entries (passport/APIS information)
    remarks: [],            // 5C/ general remark entries
    frequentFlyers: [],     // FF entries
    emails: [],             // PE passenger email entries
    salesRecords: [],       // Issued tickets for sales reports
    voidedRecords: [],      // Voided tickets for void reports
    printerId: null,        // ticket printer selected for this running session
    printerAssigned: false,
    printerDesignated: false,
    fareQuote: null,        // { base, tax, total, currency }
    privateFare: null,      // fare loaded through WPA <carrier> then PQ
    ticketed: false,
    eticketNumber: null,
    ticketNumbers: [],
    invoiced: false,
    voided: false,          // ticket was voided
    voidedTicketNo: null,   // ticket number that was voided
    refunded: false,        // refund was processed
    ended: false
  };
}
let sbState = sbEmptyState();
const SB_HISTORY_KEY = 'sabre_command_history';

function sbLoadCommandHistory() {
  try {
    const saved = localStorage.getItem(SB_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

let sbCommandHistory = sbLoadCommandHistory();
let sbHistoryIndex = sbCommandHistory.length;

function sbRememberCommand(command) {
  if (!command) return;
  sbCommandHistory.push(command);
  if (sbCommandHistory.length > 500) {
    sbCommandHistory = sbCommandHistory.slice(-500);
  }
  sbHistoryIndex = sbCommandHistory.length;
  try {
    localStorage.setItem(SB_HISTORY_KEY, JSON.stringify(sbCommandHistory));
  } catch (e) {}
}

function sbRecallHistory(direction) {
  const input = document.getElementById('cmdInput');
  if (!input || sbCommandHistory.length === 0) return;
  sbHistoryIndex = Math.max(0, Math.min(sbCommandHistory.length - 1, sbHistoryIndex + direction));
  input.value = sbCommandHistory[sbHistoryIndex];
  input.focus();
}

/* ---------------------------------------------------------------------
   RESET SESSION — used by the terminal shell and the Electron menu
   (Simulator > Reset Session)
--------------------------------------------------------------------- */
function sbResetSession() {
  sbState = sbEmptyState();
  const term = document.getElementById('termArea');
  if (term) term.innerHTML = '<span class="ph">— কমান্ড টাইপ করে Send চাপুন —</span>';
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   LESSON PNR — quick-load sample matching a finished booking
   (parallel to Amaduce's THAI_PNR / LESSON_PNR quick-load buttons)
--------------------------------------------------------------------- */
function sbLoadLessonPNR() {
  sbState = sbEmptyState();
  sbState.locator = "K7QZLM";
  sbState.dateStamp = "09SEP26/0930Z";
  sbState.names = [{ raw: "RAHMAN/ANIS MR", surname: "RAHMAN", first: "ANIS", title: "MR" }];
  sbState.booked = [
    { al: "BG", fn: "555", cls: "Y", date: "25DEC", dep: "DAC", arr: "SIN", status: "HK1",
      depT: "1659", arrT: "2059", eq: "739", day: "5" }
  ];
  sbState.phones = [{ raw: "DAC 01700000000-A" }];
  sbState.receivedFrom = "SHAKIB";
  sbState.ticketingArrangement = "TAW-20DEC/";
  sbState.ended = true;
  sbEcho("*K7QZLM");
  sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

function sbLoadReissuePracticePNR() {
  sbState = sbEmptyState();
  sbState.locator = "R8SU26";
  sbState.dateStamp = "01OCT26/0900Z";
  sbState.names = [{ raw: "RAHMAN/ANIS MR", surname: "RAHMAN", first: "ANIS", title: "MR", paxType: "ADT" }];
  sbState.booked = [{ al: "BG", fn: "555", cls: "Y", date: "25DEC", dep: "DAC", arr: "SIN", status: "HK1", depT: "1659", arrT: "2059", eq: "739", day: "5" }];
  sbState.phones = [{ raw: "DAC 01700000000-A" }];
  sbState.receivedFrom = "SHAKIB";
  sbState.ticketingArrangement = "TAW-20DEC/";
  sbState.fareQuote = { base: 34230, tax: 6500, total: 40730, currency: "BDT", pax: 1, breakdown: [{ index: 1, type: "ADT", base: 34230, tax: 6500, total: 40730 }] };
  sbState.privateFare = { carrier: "BG", carrierName: "BIMAN BANGLADESH", baseBdt: 34230, tax: 6500, total: 40730, fareBasis: "YEE1M" };
  sbState.ticketed = true;
  sbState.invoiced = true;
  sbState.eticketNumber = "618-9281928391";
  sbState.ticketNumbers = ["6189281928391"];
  sbState.ended = true;
  if (typeof sbPnrStorePut === "function") sbPnrStorePut(sbState);
  sbEcho("LOADREISSUE");
  sbPrint("REISSUE PRACTICE PNR LOADED - TICKET 6189281928391");
  sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   TERMINAL I/O HELPERS
--------------------------------------------------------------------- */
function sbEcho(cmd) {
  const term = document.getElementById('termArea');
  if (!term) return null;
  if (term.querySelector('.ph')) term.innerHTML = '';
  const echo = document.createElement('div');
  echo.className = /^WPA/.test(cmd.trim()) ? 'line-echo fare-command' : 'line-echo';
  const text = cmd.toUpperCase().trim();
  echo.textContent = text.endsWith('«') ? text : (text + '«');
  term.appendChild(echo);
  if (typeof window !== 'undefined') window._sbLastCommandEcho = echo;
  return echo;
}
function sbScrollToCommand(echo) {
  const term = document.getElementById('termArea');
  if (!term) return;
  const target = echo || (typeof window !== 'undefined' ? window._sbLastCommandEcho : null);
  if (!target) return;

  try {
    const termRect = term.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offsetDiff = targetRect.top - termRect.top;
    term.scrollTop = Math.max(0, term.scrollTop + offsetDiff);
  } catch (e) {
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
}
if (typeof window !== 'undefined') window.sbScrollToCommand = sbScrollToCommand;

function sbPrint(text, cls) {
  const term = document.getElementById('termArea');
  if (!term) return;
  const str = String(text ?? '');
  if (str.includes('\n')) {
    str.split('\n').forEach(sub => sbPrint(sub, cls));
    return;
  }
  const line = document.createElement('div');
  line.className = cls || (str === '*' ? 'line-display' : 'line-pnr');
  line.textContent = str || '\u00A0';
  term.appendChild(line);
  if (typeof window === 'undefined' || !window._sbSuppressScrollToBottom) {
    term.scrollTop = term.scrollHeight;
  }
}
function sbWarn(text) { sbPrint(text, 'line-warn'); }
function sbPrintSsrError(lines) {
  const term = document.getElementById('termArea');
  if (!term) return;
  const box = document.createElement('div');
  box.className = 'sb-ssr-error-box';
  box.innerHTML = `
    <div class="sb-ssr-error-icon">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="19" r="17" fill="#cc0000"/>
        <circle cx="19" cy="19" r="11" stroke="#ffffff" stroke-width="2.8" fill="none"/>
        <line x1="11" y1="27" x2="27" y2="11" stroke="#ffffff" stroke-width="2.8"/>
      </svg>
    </div>
    <div class="sb-ssr-error-text">
      ${lines.map(l => `<div>${l}</div>`).join('')}
    </div>
  `;
  term.appendChild(box);
  term.scrollTop = term.scrollHeight;
}

function sbPrintDcMessage() {
  const term = document.getElementById('termArea');
  if (!term) return;
  const box = document.createElement('div');
  box.className = 'sb-dc-msg-box';
  box.innerHTML = `
    <div class="sb-dc-msg-icon">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" fill="#0088cc"/>
        <circle cx="14" cy="8.5" r="1.8" fill="#ffffff"/>
        <rect x="12.5" y="12" width="3" height="9" rx="1" fill="#ffffff"/>
      </svg>
    </div>
    <div class="sb-dc-msg-text">
      <div style="font-weight:bold; color:#f0f4f8;">DIRECT CONNECT MESSAGES RECEIVED</div>
      <div style="color:#8fd0f0;">¥NO ITIN MSGS¥</div>
    </div>
  `;
  term.appendChild(box);
  term.scrollTop = term.scrollHeight;
}

/* ---------------------------------------------------------------------
   INTERACTIVE AVAILABILITY — arrow or any booking-class bucket opens a
   Sabre-style seat-hold panel for that flight.
--------------------------------------------------------------------- */
function sbRenderAvailabilityBoard(options, date) {
  const term = document.getElementById('termArea');
  if (!term) return;
  const days = ['', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const firstLeg = options[0]?.legs[0];
  const board = document.createElement('section');
  board.className = 'sb-avail-board';
  board.innerHTML = `<div class="sb-avail-header">${date} ${days[Number(firstLeg?.day)] || '---'} &nbsp; ${firstLeg?.dep || ''} ${options[0]?.legs.at(-1)?.arr || ''}</div>`;

  options.forEach((option, index) => {
    const leg = option.legs[0];
    const finalLeg = option.legs.at(-1);
    const isConnection = option.legs.length > 1;
    const line = index + 1;
    const classes = leg.cls.split(' ');
    const row = document.createElement('div');
    row.className = 'sb-avail-row';
    row.innerHTML = `
      <span class="sb-avail-num">${line}</span><span class="sb-avail-air">${leg.al}</span><span class="sb-avail-flight">${leg.fn}</span>
      <span class="sb-avail-classes"></span><span class="sb-avail-route">${leg.dep}&nbsp;&nbsp;${leg.arr}</span>
      <span class="sb-avail-time">${leg.depT}&nbsp;&nbsp;${leg.arrT}${leg.dayOver ? ` +${leg.dayOver}` : ''}</span>
      <span class="sb-avail-eq">${leg.eq}</span><button class="sb-avail-arrow" type="button" aria-label="Open seat hold">⌄</button>`;
    const classBox = row.querySelector('.sb-avail-classes');
    classes.forEach(bucket => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sb-class-bucket';
      button.textContent = bucket;
      button.addEventListener('click', () => sbOpenSeatHold(line, bucket.charAt(0), detail));
      classBox.appendChild(button);
    });

    const detail = document.createElement('div');
    detail.className = 'sb-seat-hold';
    detail.innerHTML = `
      <div class="sb-flight-detail">From: ${leg.dep} ${date} at ${leg.depT} &nbsp; To: ${finalLeg.arr} ${date} at ${finalLeg.arrT} ${isConnection ? `&nbsp; Connection: ${leg.arr}` : ''} &nbsp; Equipment: ${leg.eq}${isConnection ? ` / ${finalLeg.eq}` : ''}</div>
      <div class="sb-hold-controls"><label>Passengers <select class="sb-pax-count"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option></select></label><label>Class ${leg.dep}-${leg.arr} <select class="sb-hold-class">${classes.map(c => `<option value="${c.charAt(0)}">${c.charAt(0)}</option>`).join('')}</select></label><button class="sb-hold-sell" type="button">Sell</button><button class="sb-hold-close" type="button" aria-label="Close">⌃</button></div>`;
    detail.querySelector('.sb-hold-sell').addEventListener('click', () => {
      const cls = detail.querySelector('.sb-hold-class').value;
      const pax = detail.querySelector('.sb-pax-count').value;
      if (cmdSell(`0${cls}${line}`, Number(pax))) {
        detail.classList.remove('open');
        board.classList.add('sb-hold-locked');
      }
    });
    detail.querySelector('.sb-hold-close').addEventListener('click', () => detail.classList.remove('open'));
    row.querySelector('.sb-avail-arrow').addEventListener('click', () => sbOpenSeatHold(line, classes.find(c => c.startsWith('Y'))?.charAt(0) || classes[0].charAt(0), detail));
    board.appendChild(row);
    if (isConnection) {
      const onwardClasses = finalLeg.cls.split(' ');
      const onward = document.createElement('div');
      onward.className = 'sb-avail-row sb-onward-leg';
      onward.innerHTML = `
        <span class="sb-avail-num">↳</span><span class="sb-avail-air">${finalLeg.al}</span><span class="sb-avail-flight">${finalLeg.fn}</span>
        <span class="sb-avail-classes"></span><span class="sb-avail-route">${finalLeg.dep}&nbsp;&nbsp;${finalLeg.arr}</span>
        <span class="sb-avail-time">${finalLeg.depT}&nbsp;&nbsp;${finalLeg.arrT}${finalLeg.dayOver ? ` +${finalLeg.dayOver}` : ''}</span>
        <span class="sb-avail-eq">${finalLeg.eq}</span><button class="sb-avail-arrow" type="button" aria-label="Open seat hold">⌄</button>`;
      const onwardBox = onward.querySelector('.sb-avail-classes');
      onwardClasses.forEach(bucket => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sb-class-bucket';
        button.textContent = bucket;
        button.addEventListener('click', () => sbOpenSeatHold(line, bucket.charAt(0), detail));
        onwardBox.appendChild(button);
      });
      onward.querySelector('.sb-avail-arrow').addEventListener('click', () => sbOpenSeatHold(line, onwardClasses.find(c => c.startsWith('Y'))?.charAt(0) || onwardClasses[0].charAt(0), detail));
      board.appendChild(onward);
    }
    board.appendChild(detail);
  });
  term.appendChild(board);
  board.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function sbOpenSeatHold(line, bookingClass, detail) {
  document.querySelectorAll('.sb-seat-hold.open').forEach(panel => panel.classList.remove('open'));
  detail.querySelector('.sb-hold-class').value = bookingClass;
  detail.classList.add('open');
  detail.scrollIntoView({ block: 'nearest' });
}

function sbSyncSidePanel() {
  const pnrLine = document.getElementById('panelPnrLine');
  const msg = document.getElementById('panelMsg');
  if (pnrLine) {
    pnrLine.textContent = sbState.locator
      ? `${sbState.locator}.${sbState.officeId || '3MUL'}`
      : `${SB_OFFICE}.${SB_OFFICE}`;
  }
  if (msg) {
    msg.textContent = sbState.ticketed ? "TICKETED" : (sbState.locator ? "ACTIVE PNR" : "NO MESSAGE");
  }
  const tabA = document.querySelector('#wsA .code');
  if (tabA) {
    if (sbState.locator && sbState.names.length) {
      const firstPax = sbState.names[0];
      const pName = `${firstPax.surname || ''} ${firstPax.first || ''} ${firstPax.title || ''}`.trim() || firstPax.raw.replace('/', ' ');
      tabA.textContent = `${sbState.locator} - ${pName}`;
    } else {
      tabA.textContent = SB_OFFICE;
    }
  }
}

/* ---------------------------------------------------------------------
   RENDER — Sabre-style PNR display (*R format)
--------------------------------------------------------------------- */
function sbRenderPNR(isEr = false) {
  if (!sbState.locator && sbState.booked.length === 0) {
    return "NO ACTIVE PNR — SELL A SEGMENT AND ADD A NAME FIRST";
  }
  const lines = [];

  // Names with 1.1, 2.1 and infant 3.I/1... indexing matching Sabre screenshots
  const adtAndChd = [];
  const inf = [];
  let paxCounter = 1;

  (sbState.names || []).forEach((pax) => {
    if (pax.paxType === 'INF') {
      inf.push(pax);
    } else {
      adtAndChd.push({ pax, num: paxCounter++ });
    }
  });

  const nameParts = adtAndChd.map(({ pax, num }) => {
    const ageTag = (pax.paxType === 'CHD' && pax.age) ? `*C${pax.age}` : '';
    const title = pax.title ? ` ${pax.title}` : '';
    return `${num}.1${pax.surname}/${pax.first}${title}${ageTag}`;
  });

  if (nameParts.length) {
    lines.push(` ${nameParts.join('  ')}`);
  } else {
    lines.push(' 1.1NAME PENDING');
  }

  inf.forEach((pax) => {
    const ageTag = pax.age ? `*I${pax.age}` : '';
    const title = pax.title ? ` ${pax.title}` : '';
    lines.push(` ${paxCounter++}.I/1${pax.surname}/${pax.first}${title}${ageTag}`);
  });

  // Flight segments
  sbState.booked.forEach((s, i) => {
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    const st = sbState.locator ? s.status.replace(/^SS/, 'HK') : s.status;
    if (!s.dcLocator) s.dcLocator = sbRandomLocator();
    const directConnect = isEr ? `  /DC${s.al} /E` : `  /DC${s.al}*${s.dcLocator} /E`;
    lines.push(
      ` ${i + 1} ${s.al} ${s.fn}${s.cls} ${s.date} ${s.day} ${s.dep}${s.arr} ${st}  ${s.depT}  ${s.arrT}${dayOverTag}${directConnect}`
    );
  });

  // Ticketing arrangement
  if (sbState.ticketingArrangement) {
    lines.push("TKT/TIME LIMIT");
    lines.push(`  1.${sbState.ticketingArrangement}`);
  } else if (sbState.locator) {
    lines.push("TKT/TIME LIMIT");
    lines.push("  1.T-");
  }

  // Phones
  if (sbState.phones.length) {
    lines.push("PHONES");
    sbState.phones.forEach((p, i) => lines.push(`  ${i + 1}.${p.raw}`));
  }

  // General facts & SSR (matching Sabre screenshots 1 & 2)
  if (sbState.locator) {
    lines.push("PASSENGER DETAIL FIELD EXISTS - USE PD TO DISPLAY");
    lines.push("GENERAL FACTS");
    const mainAl = sbState.booked[0]?.al || 'SQ';
    const firstLeg = sbState.booked[0];
    const d = new Date();
    const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
    const dt = `${String(d.getDate()).padStart(2,'0')}${mon}`;

    let gfIdx = 1;

    // Check for child SSR
    const chdEntry = (sbState.ssrEntries || []).find(s => /CHLD/i.test(typeof s === 'string' ? s : (s.text || '')));
    if (chdEntry) {
      const txt = typeof chdEntry === 'string' ? chdEntry : chdEntry.text;
      const dobMatch = txt.match(/CHLD\/([A-Z0-9]+)/i);
      const dob = dobMatch ? dobMatch[1] : '11SEP19';
      lines.push(`  ${gfIdx++}.SSR CHLD ${mainAl} HK1/${dob}`);
    }

    // Check for infant SSR
    const infEntry = (sbState.ssrEntries || []).find(s => /INFT/i.test(typeof s === 'string' ? s : (s.text || '')));
    if (infEntry) {
      const txt = typeof infEntry === 'string' ? infEntry : infEntry.text;
      const parts = txt.replace(/^SSR\s+/i, '').replace(/^3?INFT\d*\/?/i, '').split('/');
      let infName = 'INFANT';
      let infDob = '02SEP25';
      if (parts.length >= 2) {
        infName = parts[0].trim();
        infDob = parts[1].split('-')[0].trim();
      }
      const dep = firstLeg ? firstLeg.dep : 'SIN';
      const arr = firstLeg ? firstLeg.arr : 'BKK';
      const fn = firstLeg ? String(firstLeg.fn).padStart(4, '0') : '0710';
      const fDate = firstLeg ? firstLeg.date : `${dt}`;
      const cls = firstLeg ? firstLeg.cls : 'B';
      const segTag = `${dep}${arr}${fn}${cls}${fDate}`;
      const status = isEr ? 'NN1' : 'KK1';
      lines.push(`  ${gfIdx++}.SSR INFT ${mainAl} ${status} ${segTag}/${infName}/${infDob}`);
    }

    // If IR screen: add ADTK and OTHS advisories exactly as in Screenshot 2
    if (!isEr) {
      const advDate = new Date(d.getTime() + 21 * 24 * 60 * 60 * 1000);
      const advMon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][advDate.getMonth()];
      const advDt = `${String(advDate.getDate()).padStart(2,'0')}${advMon}`;
      lines.push(`  ${gfIdx++}.SSR ADTK 1B TO ${mainAl} BY ${advDt} 2300 DAC TIME ZONE OTHERWISE WIL\n    L BE XLD`);
      lines.push(`  ${gfIdx++}.SSR OTHS 1B MISSING SSR CTCM MOBILE OR SSR CTCE EMAIL OR SS\n    R CTCR NON-CONSENT FOR ${mainAl}`);
    }

    // Any other custom SSR
    (sbState.ssrEntries || []).forEach(s => {
      const rawText = typeof s === 'string' ? s : (s.text || '');
      if (!/CHLD|INFT/i.test(rawText)) {
        lines.push(`  ${gfIdx++}.${rawText}`);
      }
    });
  }

  // Fare quote
  if (sbState.fareQuote) {
    const fq = sbState.fareQuote;
    lines.push(`FARE  ${fq.currency}${fq.base}  TAX ${fq.currency}${fq.tax}  TOTAL ${fq.currency}${fq.total}` +
      (fq.pax > 1 ? `  (${fq.pax} PAX)` : ''));
  }

  if (sbState.invoiced) {
    const fare = sbState.fareQuote;
    const ticketNo = (sbState.eticketNumber || '').replace('-', '');
    const carrier = sbState.privateFare?.carrier || sbState.booked[0]?.al || 'MH';
    const pax = sbState.names[0]?.raw || 'PASSENGER';
    lines.push('INVOICED');
    lines.push('PRICE QUOTE RECORD - AUTOPRICED');
    lines.push('SECURITY INFO EXISTS *P3D OR *P4D TO DISPLAY');
    lines.push('ACCOUNTING DATA');
    lines.push(` 1.  ${carrier}¥${ticketNo}/      7/      ${fare?.base || 0}/  ${fare?.tax || 0}/ONE/CA 1.1${pax}/1/F/E`);
  }

  // Received From
  if (sbState.receivedFrom) {
    lines.push(`RECEIVED FROM - ${sbState.receivedFrom}`);
  }

  // General Remarks
  if (sbState.remarks && sbState.remarks.length) {
    lines.push('GENERAL REMARKS');
    sbState.remarks.forEach((r, i) => lines.push(`  ${i + 1}.${r}`));
  }

  // Void / refund notices
  if (sbState.voided) {
    lines.push(`TICKET ${sbState.voidedTicketNo} - VOIDED`);
  }
  if (sbState.refunded) {
    lines.push('REFUND PROCESSED');
  }

  // Footer line matching 3MUL.3MUL*ATE 1218/29SEP26 RODXAE H M
  if (sbState.locator) {
    lines.push(`${sbState.officeId || '3MUL'}.${sbState.officeId || '3MUL'}*ATE ${sbSabreFooterStamp()} ${sbState.locator} H M`);
  } else {
    lines.push("*** NOT YET STORED — USE E TO END/SAVE ***");
  }

  return lines.join('\n');
}

/* ---------------------------------------------------------------------
   UTILITIES
--------------------------------------------------------------------- */
function sbSabreFooterStamp() {
  const d = new Date();
  const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  const time = `${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
  const date = `${String(d.getDate()).padStart(2,'0')}${mon}${String(d.getFullYear()).slice(2)}`;
  return `${time}/${date}`;
}
function sbRandomLocator() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function sbNowStamp() {
  const d = new Date();
  const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  return `${String(d.getDate()).padStart(2,'0')}${mon}${String(d.getFullYear()).slice(2)}/${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}Z`;
}
