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
  { cmd: "W/-DHAKA", desc: "Search airport code by city or airport name" },
  { cmd: "W/-BANGLADESH", desc: "List training airports for a country" },
  { cmd: "W/-COUNTRIES", desc: "Show ISO country-code list" },
  { cmd: "120NOVDACBKK", desc: "Sabre availability — DDMMM + origin + destination" },
  { cmd: "W/-DAC", desc: "এয়ারপোর্ট/শহর কোড এনকোড-ডিকোড" },
  { cmd: "125DECDACLHR", desc: "এভেইলিবিলিটি — DDMMM + ORG + DST" },
  { cmd: "0Y1", desc: "সেল — ক্লাস + লাইন নম্বর (কানেকশন হলে ২ সেগমেন্ট বসবে)" },
  { cmd: "-RAHMAN/ANIS MR", desc: "নাম ফিল্ড (একাধিক প্যাসেঞ্জারের জন্য চেইন করে দিন)" },
  { cmd: "9DAC 01700000000-A", desc: "ফোন ফিল্ড" },
  { cmd: "6SHAKIB", desc: "রিসিভড ফ্রম" },
  { cmd: "7TAW-20DEC/", desc: "টিকেটিং অ্যারেঞ্জমেন্ট / টাইম লিমিট" },
  { cmd: "3VGML/1", desc: "স্পেশাল সার্ভিস রিকোয়েস্ট (ঐচ্ছিক)" },
  { cmd: "WPNCB", desc: "ফেয়ার কোট (WPNI-ও চলবে)" },
  { cmd: "E  /  ER", desc: "এন্ড ট্রানজেকশন — PNR সেভ (ER রিডিসপ্লেসহ)" },
  { cmd: "*R", desc: "PNR রিডিসপ্লে" },
  { cmd: "*K7QZLM", desc: "PNR রিট্রিভ — এই লেসন লোকেটর প্রি-লোডেড" },
  { cmd: "WT  /  WTP", desc: "ইলেকট্রনিক টিকিট ইস্যু" },
  { cmd: "XI", desc: "ইগনোর — ওয়ার্কএরিয়া ক্লিয়ার" }
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
