/* =========================================================================
   sb-fareshop.js  –  Sabre Fare Shop / Bargain Finder Mask (JR - CREATE)
   Exact interactive terminal mask from Sabre Agency Workspace.
   Triggered by command: JR
   Action P: Prices/shops itineraries
   Action C / Esc / Clear: Cancels the mask and returns to terminal
   ========================================================================= */

function sbGetSabreDate() {
  const d = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  return `${day}${mon}`;
}

function cmdFareShopJR() {
  const term = document.getElementById('termArea');
  if (!term) return;

  const todayStr = sbGetSabreDate();

  // Create the JR - CREATE mask wrapper
  const wrap = document.createElement('div');
  wrap.id = 'sbJrMask';
  wrap.className = 'sb-jr-mask';

  wrap.innerHTML = `
    <div class="jr-header-line">JR - CREATE</div>
    <div class="jr-dash-line">--------------------------------------------------------------------------------</div>

    <div class="jr-row jr-row-action">
      <span class="jr-lbl">ACTION</span>
      <input class="jr-inp jr-inp-action" id="jrAction" maxlength="1" value="" autofocus placeholder="P/C">
      <span class="jr-txt">P TO PRICE / C TO CANCEL MASK WS/PQ</span>
      <input class="jr-inp jr-inp-1" id="jrWsPq" maxlength="1" value="N">
      <span class="jr-txt">X</span>
      <input class="jr-inp jr-inp-1" id="jrX" maxlength="1" value="3">
    </div>

    <div class="jr-row jr-row-priority">
      <span class="jr-txt">PRIORITY-PRICE</span>
      <input class="jr-inp jr-inp-1" id="jrPrioPrice" maxlength="1" value="1">
      <span class="jr-txt">DIRECT/NON-STOP</span>
      <input class="jr-inp jr-inp-1" id="jrDirect" maxlength="1" value="2">
      <span class="jr-txt">TIME</span>
      <input class="jr-inp jr-inp-1" id="jrTimePrio" maxlength="1" value="3">
      <span class="jr-txt">CXR</span>
      <input class="jr-inp jr-inp-1" id="jrCxrPrio" maxlength="1" value="4">
    </div>

    <div class="jr-tbl-header">
      <span class="col-head col-from">FROM</span>
      <input class="jr-inp jr-inp-code col-from-box" id="jrFromMain" maxlength="3" value="DAC" placeholder="DAC">
      <span class="col-head col-date">DATE</span>
      <span class="col-head col-time">TIME/RANGE</span>
      <span class="col-head col-cxr">CARRIER</span>
      <span class="col-head col-cabin">CABIN</span>
    </div>

    <div class="jr-legs">
      <!-- Leg 1 -->
      <div class="jr-leg-row">
        <span class="leg-idx">1</span>
        <input class="jr-inp jr-inp-1" id="jrConn1" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst1" maxlength="3" value="KUL" placeholder="DST">
        <input class="jr-inp jr-inp-date" id="jrDate1" maxlength="5" value="${todayStr}">
        <input class="jr-inp jr-inp-time" id="jrTime1" maxlength="7" value="0700/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr1" maxlength="5" value="/ /" placeholder="MH">
        <input class="jr-inp jr-inp-1" id="jrCabin1" maxlength="1" value="Y">
      </div>
      <!-- Leg 2 -->
      <div class="jr-leg-row">
        <span class="leg-idx">2</span>
        <input class="jr-inp jr-inp-1" id="jrConn2" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst2" maxlength="3" value="">
        <input class="jr-inp jr-inp-date" id="jrDate2" maxlength="5" value="">
        <input class="jr-inp jr-inp-time" id="jrTime2" maxlength="7" value="/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr2" maxlength="5" value="/ /">
        <input class="jr-inp jr-inp-1" id="jrCabin2" maxlength="1" value="Y">
      </div>
      <!-- Leg 3 -->
      <div class="jr-leg-row">
        <span class="leg-idx">3</span>
        <input class="jr-inp jr-inp-1" id="jrConn3" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst3" maxlength="3" value="">
        <input class="jr-inp jr-inp-date" id="jrDate3" maxlength="5" value="">
        <input class="jr-inp jr-inp-time" id="jrTime3" maxlength="7" value="/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr3" maxlength="5" value="/ /">
        <input class="jr-inp jr-inp-1" id="jrCabin3" maxlength="1" value="Y">
      </div>
      <!-- Leg 4 -->
      <div class="jr-leg-row">
        <span class="leg-idx">4</span>
        <input class="jr-inp jr-inp-1" id="jrConn4" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst4" maxlength="3" value="">
        <input class="jr-inp jr-inp-date" id="jrDate4" maxlength="5" value="">
        <input class="jr-inp jr-inp-time" id="jrTime4" maxlength="7" value="/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr4" maxlength="5" value="/ /">
        <input class="jr-inp jr-inp-1" id="jrCabin4" maxlength="1" value="Y">
      </div>
      <!-- Leg 5 -->
      <div class="jr-leg-row">
        <span class="leg-idx">5</span>
        <input class="jr-inp jr-inp-1" id="jrConn5" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst5" maxlength="3" value="">
        <input class="jr-inp jr-inp-date" id="jrDate5" maxlength="5" value="">
        <input class="jr-inp jr-inp-time" id="jrTime5" maxlength="7" value="/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr5" maxlength="5" value="/ /">
        <input class="jr-inp jr-inp-1" id="jrCabin5" maxlength="1" value="Y">
      </div>
      <!-- Leg 6 -->
      <div class="jr-leg-row">
        <span class="leg-idx">6</span>
        <input class="jr-inp jr-inp-1" id="jrConn6" maxlength="1" value="0">
        <input class="jr-inp jr-inp-code" id="jrDst6" maxlength="3" value="">
        <input class="jr-inp jr-inp-date" id="jrDate6" maxlength="5" value="">
        <input class="jr-inp jr-inp-time" id="jrTime6" maxlength="7" value="/¥-">
        <input class="jr-inp jr-inp-cxr" id="jrCxr6" maxlength="5" value="/ /">
        <input class="jr-inp jr-inp-1" id="jrCabin6" maxlength="1" value="Y">
      </div>
    </div>

    <div class="jr-row jr-row-more">
      <span class="jr-txt">MORE CITIES</span>
      <input class="jr-inp jr-inp-code" id="jrMoreCities" maxlength="3" value="">
      <span class="jr-txt" style="margin-left:auto;">ONLINE SERVICE ONLY</span>
      <input class="jr-inp jr-inp-1" id="jrOnlineOnly" maxlength="1" value="N">
    </div>

    <div class="jr-dash-line">--------------------------------------------------------------------------------</div>

    <div class="jr-row jr-row-rules">
      <span class="jr-txt">MIN/MAX STAY</span>
      <input class="jr-inp jr-inp-1" id="jrMinStay" maxlength="1" value="Y">
      <span class="jr-txt">REFUND/PEN</span>
      <input class="jr-inp jr-inp-1" id="jrRefund" maxlength="1" value="Y">
      <span class="jr-txt">RES/TKT</span>
      <input class="jr-inp jr-inp-1" id="jrResTkt" maxlength="1" value="Y">
      <span class="jr-txt">JUMP</span>
      <input class="jr-inp jr-inp-1" id="jrJump" maxlength="1" value="">
    </div>

    <div class="jr-row jr-row-psgr">
      <span class="jr-txt">PSGR</span>
      <input class="jr-inp jr-inp-psgr" id="jrPsgr1" maxlength="4" value="1ADT">
      <input class="jr-inp jr-inp-psgr" id="jrPsgr2" maxlength="4" value="">
      <input class="jr-inp jr-inp-psgr" id="jrPsgr3" maxlength="4" value="">
      <input class="jr-inp jr-inp-psgr" id="jrPsgr4" maxlength="4" value="">
      <span class="jr-txt" style="margin-left:auto;">TKT DATE</span>
      <input class="jr-inp jr-inp-date" id="jrTktDate" maxlength="5" value="${todayStr}">
    </div>

    <div class="jr-row jr-row-cxr">
      <span class="jr-txt">NON-PREF CXR</span>
      <input class="jr-inp jr-inp-cxr" id="jrNonPref" maxlength="5" value="/ /">
      <span class="jr-txt">CORP ID</span>
      <input class="jr-inp jr-inp-corp" id="jrCorpId" maxlength="8" value="">
      <span class="jr-txt">PV</span>
      <input class="jr-inp jr-inp-1" id="jrPv" maxlength="1" value="">
      <span class="jr-txt">PL</span>
      <input class="jr-inp jr-inp-1" id="jrPl" maxlength="1" value="">
    </div>

    <div class="jr-row jr-row-tpr">
      <span class="jr-txt">TPR</span>
      <input class="jr-inp jr-inp-1" id="jrTpr" maxlength="1" value="N">
      <span class="jr-txt">TPR ID</span>
      <input class="jr-inp jr-inp-tprid" id="jrTprId" maxlength="16" value="">
      <span class="jr-txt">XO</span>
      <input class="jr-inp jr-inp-1" id="jrXo" maxlength="1" value="">
    </div>

    <div class="jr-row jr-row-segments">
      <span class="jr-txt">INSERT AFTER</span>
      <input class="jr-inp jr-inp-1" id="jrInsertAfter" maxlength="2" value="">
      <span class="jr-txt">OR DELETE FROM</span>
      <input class="jr-inp jr-inp-1" id="jrDeleteFrom" maxlength="2" value="">
      <span class="jr-txt">FOR</span>
      <input class="jr-inp jr-inp-1" id="jrForSeg" maxlength="2" value="">
      <span class="jr-txt">SEGMENTS.</span>
    </div>
  `;

  term.appendChild(wrap);
  term.scrollTop = term.scrollHeight;

  // Auto focus ACTION input
  const act = document.getElementById('jrAction');
  if (act) {
    act.focus();
    act.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sbHandleJrSubmit();
      }
    });
  }

  // Handle Enter key across all JR inputs
  wrap.querySelectorAll('.jr-inp').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
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

function sbCloseJrMask() {
  const mask = document.getElementById('sbJrMask');
  if (mask) mask.remove();
  sbPrint('JR MASK CANCELLED');
}

function sbHandleJrSubmit() {
  const act = (document.getElementById('jrAction')?.value || '').trim().toUpperCase();

  if (act === 'C') {
    sbCloseJrMask();
    return;
  }

  // Default or Action P: Price / Fare Shop
  const origin = (document.getElementById('jrFromMain')?.value || 'DAC').trim().toUpperCase();
  const dst = (document.getElementById('jrDst1')?.value || 'KUL').trim().toUpperCase();
  const date = (document.getElementById('jrDate1')?.value || sbGetSabreDate()).trim().toUpperCase();
  const carrierRaw = (document.getElementById('jrCxr1')?.value || '').replace(/[\/\s]/g, '').toUpperCase();
  const carrier = carrierRaw || 'MH';

  const mask = document.getElementById('sbJrMask');
  if (mask) mask.remove();

  sbEcho(`JR P`);
  sbPrint(`BARGAIN FINDER MAX FARESHOP — ${origin} TO ${dst} ON ${date}`);
  sbPrint(`SEARCHING LOWEST AVAILABLE FARES FOR CARRIER ${carrier}...`, 'line-warn');

  // Trigger Availability for that pair
  const availCmd = `1${date}${origin}${dst}`;
  if (typeof cmdAvailability === 'function') {
    cmdAvailability(availCmd);
  }

  // Price fare with carrier
  setTimeout(() => {
    if (typeof cmdWpa === 'function') {
      cmdWpa(`WPA${carrier}`);
    }
  }, 300);
}
