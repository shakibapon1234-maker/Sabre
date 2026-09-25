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
    booked: [],             // sold segments in the PNR (flat list — a
                             // connection contributes 2 consecutive entries)
    phones: [],
    receivedFrom: null,
    ticketingArrangement: null,
    ssrEntries: [],
    documents: [],          // DOCS SSR entries (passport/APIS information)
    printerId: null,        // ticket printer selected for this running session
    printerAssigned: false,
    printerDesignated: false,
    fareQuote: null,        // { base, tax, total, currency }
    privateFare: null,      // fare loaded through WPA <carrier> then PQ
    ticketed: false,
    eticketNumber: null,
    invoiced: false,
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
  sbEcho("*K7QZLM");
  sbPrint(sbRenderPNR());
  sbSyncSidePanel();
}

/* ---------------------------------------------------------------------
   TERMINAL I/O HELPERS
--------------------------------------------------------------------- */
function sbEcho(cmd) {
  const term = document.getElementById('termArea');
  if (term.querySelector('.ph')) term.innerHTML = '';
  const echo = document.createElement('div');
  echo.className = /^WPA/.test(cmd.trim()) ? 'line-echo fare-command' : 'line-echo';
  const text = cmd.toUpperCase().trim();
  echo.textContent = text.endsWith('«') ? text : (text + '«');
  term.appendChild(echo);
}
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
  term.scrollTop = term.scrollHeight;
}
function sbWarn(text) { sbPrint(text, 'line-warn'); }

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
  term.scrollTop = term.scrollHeight;
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
      ? `${sbState.locator}.${sbState.officeId}`
      : `${SB_OFFICE}.${SB_OFFICE}`;
  }
  if (msg) {
    msg.textContent = sbState.ticketed ? "TICKETED" : (sbState.locator ? "ACTIVE PNR" : "NO MESSAGE");
  }
  const tabA = document.querySelector('#wsA .code');
  if (tabA) {
    if (sbState.locator && sbState.names.length) {
      const pName = sbState.names[0].raw.replace('/', ' ');
      tabA.textContent = `QIG ${sbState.locator} - ${pName}`;
    } else {
      tabA.textContent = SB_OFFICE;
    }
  }
}

/* ---------------------------------------------------------------------
   RENDER — Sabre-style PNR display (*R format)
--------------------------------------------------------------------- */
function sbRenderPNR() {
  if (!sbState.locator && sbState.booked.length === 0) {
    return "NO ACTIVE PNR — SELL A SEGMENT AND ADD A NAME FIRST";
  }
  const lines = [];

  // Names with 1.1 indexing
  if (sbState.names.length) {
    lines.push(sbState.names.map((n, i) => ` 1.${i + 1}${n.raw}`).join('  '));
  } else {
    lines.push(' 1.1NAME PENDING');
  }

  // Flight segments
  sbState.booked.forEach((s, i) => {
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    const st = sbState.locator ? s.status.replace(/^SS/, 'HK') : s.status;
    const directConnect = `  /DC${s.al}*${sbRandomLocator()} /E`;
    lines.push(
      ` ${i + 1} ${s.al} ${s.fn}${s.cls} ${s.date} ${s.day} ${s.dep}${s.arr} ${st}  ${s.depT}  ${s.arrT}${dayOverTag}${directConnect}`
    );
  });

  // Ticketing arrangement
  if (sbState.ticketingArrangement) {
    lines.push("TKT/TIME LIMIT");
    lines.push(` 1.${sbState.ticketingArrangement}`);
  }

  // Phones
  if (sbState.phones.length) {
    lines.push("PHONES");
    sbState.phones.forEach((p, i) => lines.push(` ${i + 1}.${p.raw}`));
  }

  // General facts & SSR (automatic advisory in Sabre)
  if (sbState.locator) {
    lines.push("PASSENGER DETAIL FIELD EXISTS - USE PD TO DISPLAY");
    lines.push("GENERAL FACTS");
    if (sbState.ssrEntries.length || sbState.documents.length) {
      sbState.ssrEntries.forEach((s, i) => lines.push(` ${i + 1}.${s}`));
      sbState.documents.forEach((doc, i) => {
        const pax = sbState.names[0]?.raw || 'PASSENGER';
        const docText = doc.raw.replace(/^DOCS\//, '').replace(/-\d+\.\d+$/, '');
        lines.push(` ${sbState.ssrEntries.length + i + 1}.SSR DOCS ${doc.carrier} HK1/${docText}  1.1 ${pax}`);
      });
    } else {
      const mainAl = sbState.booked[0]?.al || '1B';
      const d = new Date();
      const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
      const dt = `${String(d.getDate()).padStart(2,'0')}${mon}`;
      lines.push(" 1.SSR OTHS 1B 270799072759 - SHORT TTL DUE TO MISSING CTCE/CTCM");
      lines.push(` 2.SSR ADTK 1B TO ${mainAl} BY ${dt} 0601 ZZZ TIME ZONE OTHERWISE WILL BE XLD`);
      lines.push(` 3.SSR OTHS 1B MISSING SSR CTCM MOBILE OR SSR CTCE EMAIL OR SSR CTCR NON-CONSENT FOR ${mainAl}`);
    }
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

  // Footer line matching 3MUL.3MUL*ATW 0059/24SEP26 PUYPQE H M
  if (sbState.locator) {
    lines.push(`${sbState.officeId}.${sbState.officeId}*ATW ${sbSabreFooterStamp()} ${sbState.locator} H M`);
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
