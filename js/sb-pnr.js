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
    fareQuote: null,        // { base, tax, total, currency }
    ticketed: false,
    eticketNumber: null,
    ended: false
  };
}
let sbState = sbEmptyState();
let sbCommandHistory = [];
let sbHistoryIndex = -1;

function sbRememberCommand(command) {
  if (sbCommandHistory.at(-1) !== command) sbCommandHistory.push(command);
  sbHistoryIndex = sbCommandHistory.length;
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
  echo.className = 'line-echo';
  echo.textContent = cmd.toUpperCase();
  term.appendChild(echo);
}
function sbPrint(text, cls) {
  const term = document.getElementById('termArea');
  const line = document.createElement('div');
  line.className = cls || 'line-ok';
  line.textContent = text;
  term.appendChild(line);
  term.appendChild(document.createElement('br'));
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
      <span class="sb-avail-num">${line}</span><span class="sb-avail-air">${isConnection ? `${leg.al}/${finalLeg.al}` : leg.al}</span><span class="sb-avail-flight">${leg.fn}</span>
      <span class="sb-avail-classes"></span><span class="sb-avail-route">${leg.dep}&nbsp;&nbsp;${leg.arr}</span>
      <span class="sb-avail-time">${leg.depT}&nbsp;&nbsp;${leg.arrT}${leg.dayOver ? ` +${leg.dayOver}` : ''}</span>
      <span class="sb-avail-eq">${leg.eq}${isConnection ? `<small>VIA ${leg.arr}</small>` : ''}</span><button class="sb-avail-arrow" type="button" aria-label="Open seat hold">⌄</button>`;
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
    board.append(row, detail);
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
  if (!pnrLine || !msg) return;
  pnrLine.textContent = sbState.locator
    ? `${sbState.locator}.${sbState.officeId}`
    : `${SB_OFFICE}.${SB_OFFICE}`;
  msg.textContent = sbState.ticketed ? "TICKETED" : (sbState.locator ? "ACTIVE PNR" : "NO MESSAGE");
}

/* ---------------------------------------------------------------------
   RENDER — Sabre-style PNR display (*R format)
--------------------------------------------------------------------- */
function sbRenderPNR() {
  if (!sbState.locator && sbState.booked.length === 0) {
    return "NO ACTIVE PNR — SELL A SEGMENT AND ADD A NAME FIRST";
  }
  const lines = [];
  lines.push(sbState.names.length
    ? sbState.names.map((n, i) => `${i + 1}.${n.raw}`).join('  ')
    : '1.NAME PENDING');
  sbState.booked.forEach((s, i) => {
    const dayOverTag = s.dayOver ? `+${s.dayOver}` : '';
    lines.push(
      ` ${i + 1} ${s.al} ${s.fn}${s.cls} ${s.date} ${s.day} ${s.dep}${s.arr} ${s.status} ` +
      `${s.depT} ${s.arrT}${dayOverTag} ${s.date} E  0  ${s.eq}`
    );
  });
  if (sbState.phones.length) {
    lines.push("PHONES");
    sbState.phones.forEach((p, i) => lines.push(` ${i + 1}.${p.raw}`));
  }
  if (sbState.ticketingArrangement) {
    lines.push("TKT/TIME LIMIT");
    lines.push(` 1.${sbState.ticketingArrangement}`);
  }
  if (sbState.ssrEntries.length) {
    lines.push("SPECIAL SERVICE REQUEST");
    sbState.ssrEntries.forEach((s, i) => lines.push(` ${i + 1} ${s}`));
  }
  if (sbState.fareQuote) {
    const fq = sbState.fareQuote;
    lines.push(`FARE  ${fq.currency}${fq.base}  TAX ${fq.currency}${fq.tax}  TOTAL ${fq.currency}${fq.total}` +
      (fq.pax > 1 ? `  (${fq.pax} PAX)` : ''));
  }
  if (sbState.receivedFrom) lines.push(`RECEIVED FROM - ${sbState.receivedFrom}`);
  if (sbState.ticketed) {
    lines.push(`ET ${sbState.eticketNumber}  ${sbState.names[0]?.raw || ''}`);
  }
  lines.push(sbState.locator ? `${sbState.locator}  ${sbState.officeId}  ${sbState.dateStamp || ''}` : "*** NOT YET STORED — USE E TO END/SAVE ***");
  return lines.join('\n');
}

/* ---------------------------------------------------------------------
   UTILITIES
--------------------------------------------------------------------- */
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
