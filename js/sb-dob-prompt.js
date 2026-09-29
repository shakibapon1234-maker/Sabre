/* =====================================================================
   SABRE TRAINING SIMULATOR — CHD / INF DOB AUTO PROMPT (小孩嬰兒生日)
   Matches Sabre Agency Workspace CERT prompt for Child and Infant DOB
===================================================================== */

let _sbDobPendingEr = false;

function sbIsAutoPromptDobEnabled() {
  const v = localStorage.getItem('sb_auto_prompt_dob');
  return v === null ? true : v === 'true';
}

function sbToggleAutoPromptDob(enabled) {
  localStorage.setItem('sb_auto_prompt_dob', enabled ? 'true' : 'false');
}

function sbFormatDob(val) {
  if (!val) return '';
  val = String(val).trim().toUpperCase();

  // If from <input type="date"> e.g. 2017-09-14
  const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const y = isoMatch[1].slice(2);
    const m = months[parseInt(isoMatch[2], 10) - 1] || 'JAN';
    const d = isoMatch[3];
    return `${d}${m}${y}`;
  }

  // If DDMMMYY: 14SEP17 or 1SEP17
  const ddmmyy = val.match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if (ddmmyy) {
    return `${ddmmyy[1].padStart(2, '0')}${ddmmyy[2]}${ddmmyy[3]}`;
  }

  return val;
}

function sbOpenChdInfPrompt(isPendingEr = false) {
  _sbDobPendingEr = Boolean(isPendingEr);

  const modal = document.getElementById('sbChdInfModal');
  if (!modal) return;

  const children = (sbState.names || []).filter(n => n.paxType === 'CHD');
  const infants = (sbState.names || []).filter(n => n.paxType === 'INF');

  if (!children.length && !infants.length) return;

  // Sync auto prompt checkbox
  const autoChk = document.getElementById('sbDobAutoPromptChk');
  if (autoChk) autoChk.checked = sbIsAutoPromptDobEnabled();

  // Child Section
  const chdSec = document.getElementById('sbDobChildSection');
  const chdBody = document.getElementById('sbDobChildTbody');
  if (children.length && chdSec && chdBody) {
    chdSec.style.display = 'block';
    chdBody.innerHTML = '';
    children.forEach((c) => {
      const paxIndex = sbState.names.indexOf(c) + 1;
      const paxRef = `${paxIndex}.1`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="sb-dob-chk" checked></td>
        <td><input type="text" class="sb-dob-inp-box sb-chd-pax-name" value="${paxRef}" style="width:55px; text-align:center;"></td>
        <td><input type="text" class="sb-dob-inp-box sb-chd-pax-type" value="CHLD" style="width:55px; text-align:center;"></td>
        <td>
          <div style="display:inline-flex; align-items:center; gap:2px;">
            <input type="text" class="sb-dob-inp-box sb-chd-dob" value="" placeholder="" maxlength="7" style="width:125px; text-transform:uppercase; font-family:var(--font-mono); font-weight:700; text-align:center;">
            <button type="button" class="sb-dob-cal-btn" title="Pick Date" onclick="sbTriggerDatePicker(this)" style="background:none; border:none; cursor:pointer; font-size:14px; padding:0 3px;">📅</button>
            <input type="date" class="sb-dob-hidden-date" style="display:none;" onchange="sbOnDatePicked(this)">
          </div>
        </td>
      `;
      chdBody.appendChild(tr);
    });
  } else if (chdSec) {
    chdSec.style.display = 'none';
  }

  // Infant Section
  const infSec = document.getElementById('sbDobInfantSection');
  const infBody = document.getElementById('sbDobInfantTbody');
  if (infants.length && infSec && infBody) {
    infSec.style.display = 'block';
    infBody.innerHTML = '';

    // Build adult options for dropdown
    const adults = (sbState.names || []).map((n, i) => ({
      name: n,
      ref: `${i + 1}.1`,
      isAdult: n.paxType !== 'CHD' && n.paxType !== 'INF'
    })).filter(a => a.isAdult);

    const adultOptions = adults.length
      ? adults.map(a => `<option value="${a.ref}">${a.ref}</option>`).join('')
      : '<option value="1.1">1.1</option>';

    // Build segment checkboxes
    const bookedSegs = sbState.booked || [];
    let segItemsHtml = '';
    if (bookedSegs.length > 0) {
      bookedSegs.forEach((_, sIdx) => {
        segItemsHtml += `<label class="sb-dob-seg-sub"><input type="checkbox" class="sb-dob-seg-item" data-seg="${sIdx + 1}" checked> ${sIdx + 1}.</label>`;
      });
    } else {
      segItemsHtml = `<label class="sb-dob-seg-sub"><input type="checkbox" class="sb-dob-seg-item" data-seg="1" checked> 1.</label>`;
    }

    infants.forEach((inf) => {
      const fullName = `${inf.surname}/${inf.first} ${inf.title}`.trim();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="sb-dob-chk" checked></td>
        <td><input type="text" class="sb-dob-inp-box sb-inf-pax-name" value="${fullName}" style="width:160px; font-weight:bold;"></td>
        <td><input type="text" class="sb-dob-inp-box sb-inf-pax-type" value="INFT" style="width:50px; text-align:center;"></td>
        <td>
          <select class="sb-dob-pax-select" style="height:22px; font-size:12px; border:1px solid #7f9db9; width:55px;">
            ${adultOptions}
          </select>
        </td>
        <td>
          <div style="display:inline-flex; align-items:center; gap:2px;">
            <input type="text" class="sb-dob-inp-box sb-inf-dob" value="" placeholder="" maxlength="7" style="width:125px; text-transform:uppercase; font-family:var(--font-mono); font-weight:700; text-align:center;">
            <button type="button" class="sb-dob-cal-btn" title="Pick Date" onclick="sbTriggerDatePicker(this)" style="background:none; border:none; cursor:pointer; font-size:14px; padding:0 3px;">📅</button>
            <input type="date" class="sb-dob-hidden-date" style="display:none;" onchange="sbOnDatePicked(this)">
          </div>
        </td>
        <td class="sb-dob-seg-col">
          <div class="sb-dob-seg-box">
            <label class="sb-dob-seg-row">
              All Seg <input type="checkbox" class="sb-dob-allseg" onchange="sbToggleAllSeg(this)">
            </label>
            ${segItemsHtml}
          </div>
        </td>
      `;
      infBody.appendChild(tr);
    });
  } else if (infSec) {
    infSec.style.display = 'none';
  }

  // Attach Enter key support to inputs
  modal.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sbSendChdInfDob();
      }
    });
  });

  modal.style.display = 'block';
  sbInitDraggableModal(modal);
}

function sbCloseChdInfPrompt() {
  const modal = document.getElementById('sbChdInfModal');
  if (modal) modal.style.display = 'none';
}

function sbToggleMinChdInfPrompt() {
  const body = document.querySelector('#sbChdInfModal .sb-dob-body');
  if (body) {
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }
}

function sbFillDobExample(type) {
  if (type === 'CHD') {
    const inputs = document.querySelectorAll('#sbDobChildTbody .sb-chd-dob');
    inputs.forEach(inp => inp.value = '11SEP19');
  } else if (type === 'INF') {
    const inputs = document.querySelectorAll('#sbDobInfantTbody .sb-inf-dob');
    inputs.forEach(inp => inp.value = '02SEP25');
  }
}

function sbTriggerDatePicker(btn) {
  const hiddenDate = btn.parentElement.querySelector('.sb-dob-hidden-date');
  if (hiddenDate) {
    if (typeof hiddenDate.showPicker === 'function') {
      hiddenDate.showPicker();
    } else {
      hiddenDate.focus();
    }
  }
}

function sbOnDatePicked(inp) {
  const formatted = sbFormatDob(inp.value);
  const textInp = inp.parentElement.querySelector('.sb-dob-inp-box');
  if (textInp && formatted) {
    textInp.value = formatted;
  }
}

function sbToggleAllSeg(allChk) {
  const container = allChk.closest('.sb-dob-seg-box');
  if (!container) return;
  const itemChks = container.querySelectorAll('.sb-dob-seg-item');
  itemChks.forEach(chk => {
    chk.checked = allChk.checked;
  });
}

function sbSendChdInfDob() {
  const commandsToRun = [];

  // Child commands: 3CHLD/<DOB>-<paxRef> e.g. 3CHLD/11SEP19-2.1
  const chdRows = document.querySelectorAll('#sbDobChildTbody tr');
  for (const tr of chdRows) {
    const chk = tr.querySelector('.sb-dob-chk');
    if (chk && !chk.checked) continue;
    const nameInp = tr.querySelector('.sb-chd-pax-name');
    const dobInp = tr.querySelector('.sb-chd-dob');
    const dobVal = dobInp?.value?.trim();
    if (!dobVal) {
      alert('PLEASE ENTER DATE OF BIRTH (DDMMMYY)');
      if (dobInp) dobInp.focus();
      return;
    }
    const dob = sbFormatDob(dobVal);
    if (typeof sbCalculateAgeFromDob === 'function') {
      const aInfo = sbCalculateAgeFromDob(dob);
      if (aInfo && (aInfo.years < 2 || aInfo.years >= 12)) {
        alert('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        sbPrint('VERIFY AGE - CHILD MUST BE 02-11 YEARS');
        if (dobInp) dobInp.focus();
        return;
      }
    }
    const paxRef = nameInp?.value?.trim() || '2.1';
    commandsToRun.push(`3CHLD/${dob}-${paxRef}`);
  }

  // Infant commands: 3INFT1/<NAME>/<DOB>-<adultRef> e.g. 3INFT1/KHDAN/ALDFI MSTR/02SEP25-1.1
  const infRows = document.querySelectorAll('#sbDobInfantTbody tr');
  for (const tr of infRows) {
    const chk = tr.querySelector('.sb-dob-chk');
    if (chk && !chk.checked) continue;
    const nameInp = tr.querySelector('.sb-inf-pax-name');
    const dobInp = tr.querySelector('.sb-inf-dob');
    const dobVal = dobInp?.value?.trim();
    if (!dobVal) {
      alert('PLEASE ENTER DATE OF BIRTH (DDMMMYY)');
      if (dobInp) dobInp.focus();
      return;
    }
    const dob = sbFormatDob(dobVal);
    if (typeof sbCalculateAgeFromDob === 'function') {
      const aInfo = sbCalculateAgeFromDob(dob);
      if (aInfo && (aInfo.totalMonths >= 24 || aInfo.years >= 2)) {
        alert('VERIFY AGE - INFANT MUST BE UNDER 2 YEARS');
        sbPrint('INFANT AGE DATA REQUIRED USE *I1/I01-*I23.NOT ENT BGNG WITH');
        if (dobInp) dobInp.focus();
        return;
      }
    }
    const name = nameInp?.value?.trim() || 'INFANT';
    const select = tr.querySelector('.sb-dob-pax-select');
    const adultRef = (select && select.value) ? select.value : '1.1';

    const checkedSeg = tr.querySelector('.sb-dob-seg-item:checked');
    const allSegChk = tr.querySelector('.sb-dob-allseg');
    let segPrefix = '1';
    if (checkedSeg) {
      segPrefix = checkedSeg.getAttribute('data-seg') || '1';
    } else if (allSegChk && allSegChk.checked) {
      segPrefix = '1';
    }

    commandsToRun.push(`3INFT${segPrefix}/${name}/${dob}-${adultRef}`);
  }

  // Close prompt
  sbCloseChdInfPrompt();

  // Clear receivedFrom so user must do 6<NAME> again
  sbState.receivedFrom = null;

  // Execute all SSR commands so terminal outputs matches Screenshot 3
  commandsToRun.forEach(cmd => {
    sbEcho(cmd);
    sbParse(cmd);
  });
}

function sbInitDraggableModal(modal) {
  const header = modal.querySelector('.sb-dob-titlebar');
  if (!header || header._dragBound) return;
  header._dragBound = true;

  let isDragging = false;
  let startX, startY, origLeft, origTop;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = modal.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    modal.style.right = 'auto';
    modal.style.left = `${origLeft}px`;
    modal.style.top = `${origTop}px`;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    modal.style.left = `${Math.max(10, origLeft + dx)}px`;
    modal.style.top = `${Math.max(10, origTop + dy)}px`;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
}
