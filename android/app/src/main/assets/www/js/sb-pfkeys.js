/* =========================================================
   sb-pfkeys.js  –  Sabre PF Keys (macro/shortcut) system
   Slots: F1–F24, 0–9, A–Z  (60 total)
   Commands chained with *Enter separator
   ========================================================= */

const SB_PF_STORAGE = 'sabre_pfkeys_v1';

// All 60 key slot definitions
const SB_PF_SLOTS = [
  ...Array.from({length:24}, (_,i) => ({id:`f${i+1}`, label:`F${i+1}`})),
  ...Array.from({length:10}, (_,i) => ({id:`n${i}`,   label:`${i}`})),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => ({id:`k${c}`, label:c}))
];

let sbPfCurrentKey = 'f1';

/* ---------- storage helpers ---------- */
function sbPfLoad() {
  try { return JSON.parse(localStorage.getItem(SB_PF_STORAGE) || '{}'); }
  catch { return {}; }
}
function sbPfSave(data) {
  localStorage.setItem(SB_PF_STORAGE, JSON.stringify(data));
}

/* ---------- open / close ---------- */
function sbOpenPfKeys() {
  document.getElementById('sbPfModal').style.display = 'flex';
  sbPfRenderKeyboard();
  sbPfSelectKey(sbPfCurrentKey || 'f1');
}
function sbClosePfKeys() {
  document.getElementById('sbPfModal').style.display = 'none';
}

/* ---------- select a key for editing ---------- */
function sbPfSelectKey(id) {
  sbPfCurrentKey = id;
  const data = sbPfLoad();
  const entry = data[id] || {};
  document.getElementById('sbPfLabel').value = entry.label || '';
  document.getElementById('sbPfDesc').value  = entry.desc  || '';
  document.getElementById('sbPfCmd').value   = entry.cmd   || '';
  document.querySelectorAll('.pf-key-chip').forEach(el =>
    el.classList.toggle('pf-selected', el.dataset.id === id)
  );
}

/* ---------- render keyboard grid ---------- */
function sbPfRenderKeyboard() {
  const data = sbPfLoad();
  const grid = document.getElementById('sbPfKeyGrid');
  grid.innerHTML = '';

  // F1–F12
  grid.appendChild(sbPfMakeRow(SB_PF_SLOTS.slice(0, 12), data));
  // F13–F24
  grid.appendChild(sbPfMakeRow(SB_PF_SLOTS.slice(12, 24), data));
  // 0–9 + A–B
  grid.appendChild(sbPfMakeRow(SB_PF_SLOTS.slice(24, 36), data));
  // C–N
  grid.appendChild(sbPfMakeRow(SB_PF_SLOTS.slice(36, 48), data));
  // O–Z
  grid.appendChild(sbPfMakeRow(SB_PF_SLOTS.slice(48, 60), data));
}

function sbPfMakeRow(slots, data) {
  const row = document.createElement('div');
  row.className = 'pf-row';
  slots.forEach(slot => {
    const chip = document.createElement('div');
    chip.className = 'pf-key-chip';
    chip.dataset.id = slot.id;
    const entry = data[slot.id];
    chip.innerHTML =
      `<span class="pf-chip-key">${slot.label}.</span>` +
      `<span class="pf-chip-lbl">${entry ? escHtml(entry.label) : ''}</span>`;
    chip.onclick = () => sbPfSelectKey(slot.id);
    if (slot.id === sbPfCurrentKey) chip.classList.add('pf-selected');
    row.appendChild(chip);
  });
  return row;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ---------- Add *Enter button ---------- */
function sbPfAddEnter() {
  const ta = document.getElementById('sbPfCmd');
  const pos = ta.selectionStart;
  const val = ta.value;
  const ins = '*Enter\n';
  ta.value = val.slice(0, pos) + ins + val.slice(pos);
  ta.selectionStart = ta.selectionEnd = pos + ins.length;
  ta.focus();
}

/* ---------- Save current key ---------- */
function sbPfSaveKey() {
  if (!sbPfCurrentKey) return;
  const label = document.getElementById('sbPfLabel').value.trim();
  const desc  = document.getElementById('sbPfDesc').value.trim();
  const cmd   = document.getElementById('sbPfCmd').value.trim();
  const data  = sbPfLoad();
  if (!label && !cmd) {
    delete data[sbPfCurrentKey];
  } else {
    data[sbPfCurrentKey] = { label, desc, cmd };
  }
  sbPfSave(data);
  sbPfRenderKeyboard();
  sbPfUpdateFkeyBar();
  const btn = document.getElementById('sbPfSaveBtn');
  btn.textContent = 'Saved ✓';
  setTimeout(() => { btn.textContent = 'Save'; }, 1400);
}

/* ---------- Run a PF key (execute its command chain) ---------- */
async function sbPfRunKey(id) {
  const data  = sbPfLoad();
  const entry = data[id];
  if (!entry || !entry.cmd.trim()) return;

  // Split on *Enter (with optional surrounding whitespace/newlines)
  const commands = entry.cmd
    .split(/\*Enter[\r\n]*/i)
    .map(c => c.trim())
    .filter(Boolean);

  for (const cmd of commands) {
    if (typeof sbEcho  === 'function') sbEcho(cmd);
    if (typeof sbParse === 'function') sbParse(cmd);
    // Small delay between chained commands so terminal can render
    await new Promise(r => setTimeout(r, 350));
  }
}

/* ---------- Update the fkey-bar strip ---------- */
function sbPfUpdateFkeyBar() {
  const bar  = document.getElementById('fkeyBar');
  if (!bar) return;
  const data = sbPfLoad();

  // Clear existing chips (keep the ⋮ more button placeholder)
  bar.innerHTML = '';

  // Show the first 6 F-keys that have a label assigned
  let shown = 0;
  for (const slot of SB_PF_SLOTS) {
    if (shown >= 6) break;
    const entry = data[slot.id];
    if (!entry || !entry.label) continue;
    const chip = document.createElement('div');
    chip.className = 'fkey-chip';
    chip.textContent = `${slot.label}. ${entry.label}`;
    chip.title = entry.desc || entry.cmd || '';
    chip.onclick = () => sbPfRunKey(slot.id);
    bar.appendChild(chip);
    shown++;
  }

  // ⋮ more button always at end
  const more = document.createElement('div');
  more.className = 'fkey-more';
  more.textContent = '⋮';
  more.title = 'PF Keys';
  more.onclick = sbOpenPfKeys;
  bar.appendChild(more);
}

/* ---------- init on load ---------- */
window.addEventListener('DOMContentLoaded', () => {
  sbPfUpdateFkeyBar();
});
