function sbClearTerminal() {
  const term = document.getElementById('termArea');
  if (term) {
    term.innerHTML = '<span class="ph">— কমান্ড টাইপ করে Send চাপুন —</span>';
  }
  const cmdInput = document.getElementById('cmdInput');
  if (cmdInput) {
    cmdInput.value = '';
    cmdInput.focus();
  }
}
window.sbClearTerminal = sbClearTerminal;

/* =========================================================================
   SABRE TRAINING SIMULATOR — UI INIT / SHELL WIRING
   Independent educational tool — no affiliation with Sabre Corporation.
   ========================================================================= */

let panelOpen = true;
function togglePanel() {
  panelOpen = !panelOpen;
  document.getElementById('sidePanel').classList.toggle('collapsed', !panelOpen);
}

function selectWs(letter) {
  document.querySelectorAll('.ws-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('ws' + letter)?.classList.add('active');
}

/* ---------------------------------------------------------------------
   COMMAND HELPER POPUP — quick-reference list of every Phase 1 entry,
   opened from the "🪄 Command Helper" button, the F-key bar's "⋮", or
   by typing HELP / ? in the terminal.
--------------------------------------------------------------------- */
const SB_HELP_ENTRIES = [
  /* Search & availability */
  { cmd: 'W/-DAC',            desc: 'Airport/city code decode' },
  { cmd: 'W/-DHAKA',          desc: 'Search airport by city name' },
  { cmd: 'W/-COUNTRIES',      desc: 'ISO country-code list' },
  { cmd: '120NOVDACBKK',      desc: 'Availability — DDMMM + ORG + DST' },
  { cmd: '0Y1',               desc: 'Sell — class + line number' },
  /* PNR build */
  { cmd: '-RAHMAN/ANIS MR',   desc: 'Name field (Adult)' },
  { cmd: '-RAHMAN/RIFAT CHD/15JAN15', desc: 'Name field (Child + DOB)' },
  { cmd: '-RAHMAN/BABY*I/20JAN25',    desc: 'Name field (Infant)' },
  { cmd: '9DAC 01700000000-A',desc: 'Phone field' },
  { cmd: '6SHAKIB',           desc: 'Received from' },
  { cmd: '7TAW-20DEC/',       desc: 'Ticketing arrangement / time limit' },
  { cmd: '3VGML/P1',          desc: 'SSR — meal request pax 1' },
  { cmd: '3CTCM/01700000000/P1', desc: 'SSR — mobile contact' },
  { cmd: '3CTCE/NAME//GMAIL.COM/P1', desc: 'SSR — email contact' },
  { cmd: '3DOCS/P/BD/A3863636/BD/20MAY95/M/30JUN32/RAHMAN/ANIS-1.1', desc: 'DOCS SSR — passport/APIS' },
  { cmd: '4/BG FREQUENT FLYER 123456', desc: 'OSI — Other Service Information' },
  { cmd: '5C/PLEASE ISSUE BEFORE 20DEC', desc: 'General remarks field' },
  /* Fare & PQ */
  { cmd: 'WPA MH',            desc: 'Load fare for carrier' },
  { cmd: 'PQ',                desc: 'Prepare Price Quote' },
  { cmd: '*PQ',               desc: 'Display stored PQ fare record' },
  { cmd: 'WPNCB',             desc: 'Price with booked carrier' },
  { cmd: 'WPQD',              desc: 'Delete stored Price Quote' },
  /* Save / retrieve / share */
  { cmd: 'E  /  ER',          desc: 'End transaction — save PNR (ER redisplays)' },
  { cmd: 'IR',                desc: 'Ignore & redisplay saved PNR' },
  { cmd: '*R',                desc: 'Redisplay current PNR' },
  { cmd: '*K7QZLM',           desc: 'Retrieve PNR by locator' },
  { cmd: '*ALL',              desc: 'List ALL saved PNRs' },
  { cmd: 'OPEN',              desc: 'Open / browse all saved PNRs' },
  { cmd: 'SHAREPNR',          desc: 'Share current PNR via URL + clipboard' },
  { cmd: 'XI',                desc: 'Ignore — clear workarea' },
  /* Printer & issue */
  { cmd: 'W*BD',              desc: 'Step 1: printer work area' },
  { cmd: 'DSIVE8C987',        desc: 'Step 2: assign printer ID' },
  { cmd: 'PTR/E8C987',        desc: 'Step 3: designate printer' },
  { cmd: 'WT  /  WTP',        desc: 'Issue e-ticket' },
  { cmd: '*T',                desc: 'Display issued ticket' },
  /* Post-ticketing */
  { cmd: 'VOID',              desc: 'Void issued ticket (same-day)' },
  { cmd: 'RFND',              desc: 'Process refund for voided ticket' },
  { cmd: 'REISSUE',           desc: 'Reissue ticket with new fare' },
  /* Segment & status */
  { cmd: 'XE1',               desc: 'Delete segment 1 from PNR' },
  { cmd: 'WC1HK',             desc: 'Change segment 1 status to HK' },
  { cmd: 'WC2UC',             desc: 'Change segment 2 status to UC (unable)' },
  /* Queue */
  { cmd: 'QEP',               desc: 'Place PNR on ticketing queue' },
  { cmd: 'QS14',              desc: 'Place PNR on queue 14' },
  { cmd: 'Q/',                desc: 'Queue count display' },
  /* Display */
  { cmd: '*N',                desc: 'Names display' },
  { cmd: '*I',                desc: 'Itinerary display' },
  { cmd: '*P',                desc: 'Phones display' },
  { cmd: '*7',                desc: 'Ticketing arrangement display' },
  { cmd: '*6',                desc: 'Received from display' },
  { cmd: '*SSR',              desc: 'SSR display' },
  { cmd: '*P3D',              desc: 'DOCS/passport display' },
  { cmd: '*5',                desc: 'Remarks display' },
  { cmd: '*PD',               desc: 'Passenger detail (combined)' },
];

function sbOpenCommandHelper() {
  const modal = document.getElementById('sbHelpModal');
  const list = document.getElementById('sbHelpList');
  if (!modal || !list) return;
  list.innerHTML = SB_HELP_ENTRIES.map(e =>
    `<div class="sb-help-row" onclick="sbUseHelpCmd('${e.cmd.replace(/'/g, "\\'")}')">
       <span class="sb-help-cmd">${e.cmd}</span>
       <span class="sb-help-desc">${e.desc}</span>
     </div>`
  ).join('');
  modal.classList.add('open');
}
function sbCloseCommandHelper() {
  document.getElementById('sbHelpModal')?.classList.remove('open');
}
function sbUseHelpCmd(cmd) {
  const input = document.getElementById('cmdInput');
  // entries like "E  /  ER" show two alternatives — insert the first one
  const first = cmd.split('/')[0].trim();
  if (input) { input.value = first; input.focus(); }
  sbCloseCommandHelper();
}

let sbSelectedHistoryIndex = -1;
function sbOpenHistory() {
  const modal = document.getElementById('sbHistoryModal');
  const list = document.getElementById('sbHistoryList');
  if (!modal || !list) return;
  const entries = sbCommandHistory.slice().reverse();
  sbSelectedHistoryIndex = entries.length ? 0 : -1;
  list.innerHTML = entries.length
    ? entries.map((command, index) => `<button type="button" class="sb-history-row${index === 0 ? ' selected' : ''}" data-index="${index}"><span>⌨</span>${command}</button>`).join('')
    : '<div class="sb-history-empty">NO COMMAND HISTORY</div>';
  list.querySelectorAll('.sb-history-row').forEach(row => row.addEventListener('click', () => {
    sbSelectedHistoryIndex = Number(row.dataset.index);
    list.querySelectorAll('.sb-history-row').forEach(item => item.classList.remove('selected'));
    row.classList.add('selected');
  }));
  modal.classList.add('open');
}
function sbCloseHistory() { document.getElementById('sbHistoryModal')?.classList.remove('open'); }
function sbUseHistory(sendNow) {
  const entries = sbCommandHistory.slice().reverse();
  const command = entries[sbSelectedHistoryIndex];
  if (!command) return;
  const input = document.getElementById('cmdInput');
  input.value = command;
  sbCloseHistory();
  if (sendNow) sendCmd(); else input.focus();
}

document.getElementById('cmdInput').addEventListener('keydown', e => {
  // Sabre keyboard equivalents: +/= is Display (*) and the quote/backslash
  // key immediately left of Enter is Cross of Lorraine (¥), the end-item key.
  if (e.code === 'Equal') {
    e.preventDefault();
    e.target.setRangeText('*', e.target.selectionStart, e.target.selectionEnd, 'end');
    return;
  }
  if (e.code === 'Quote' || e.code === 'Backslash') {
    e.preventDefault();
    e.target.setRangeText('¥', e.target.selectionStart, e.target.selectionEnd, 'end');
    return;
  }
  if (e.key === 'Enter') sendCmd();
  if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); sbRecallHistory(-1); }
  if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); sbRecallHistory(1); }
});
document.getElementById('cmdInput').addEventListener('input', e => {
  e.target.value = e.target.value.toUpperCase();
});
document.getElementById('historyBtn').addEventListener('click', sbOpenHistory);

// Capture the Sabre-style Alt+Arrow recall shortcut at window level too.
window.addEventListener('keydown', e => {
  if (!e.altKey) return;
  if (e.key === 'ArrowUp') { e.preventDefault(); sbRecallHistory(-1); }
  if (e.key === 'ArrowDown') { e.preventDefault(); sbRecallHistory(1); }
}, true);
