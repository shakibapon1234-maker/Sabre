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

  // Clear previous output so mask starts right at the top
  term.innerHTML = '';
  sbEcho('JR');

  const todayStr = sbGetSabreDate();

  const wrap = document.createElement('div');
  wrap.id = 'sbJrMask';
  wrap.className = 'sb-jr-mask';

  wrap.innerHTML = `
    <div class="jr-header-line">JR - CREATE</div>
    <div class="jr-dash-line">--------------------------------------------------------------------------------</div>

    <div class="jr-row">
      <span style="min-width: 58px;">ACTION</span>
      <input class="jr-inp" style="width: 28px; margin-right: 6px;" id="jrAction" maxlength="1" value="" autofocus>
      <span>P TO PRICE / C TO CANCEL MASK WS/PQ</span>
      <input class="jr-inp" style="width: 24px; margin-left: 20px;" id="jrWsPq" maxlength="1" value="N">
      <span style="margin-left: 6px;">X</span>
      <input class="jr-inp" style="width: 24px; margin-left: 6px;" id="jrX" maxlength="1" value="3">
    </div>

    <div class="jr-row">
      <span>PRIORITY-PRICE</span>
      <input class="jr-inp" style="width: 24px;" id="jrPrioPrice" maxlength="1" value="1">
      <span style="margin-left: 12px;">DIRECT/NON-STOP</span>
      <input class="jr-inp" style="width: 24px;" id="jrDirect" maxlength="1" value="2">
      <span style="margin-left: 12px;">TIME</span>
      <input class="jr-inp" style="width: 24px;" id="jrTimePrio" maxlength="1" value="3">
      <span style="margin-left: 12px;">CXR</span>
      <input class="jr-inp" style="width: 24px;" id="jrCxrPrio" maxlength="1" value="4">
    </div>

    <div class="jr-row" style="margin-top: 6px; color: #8b99ad; font-size: 11.5px; font-weight: 700;">
      <span style="width: 44px; color: #cfd6e0;">FROM</span>
      <input class="jr-inp" style="width: 44px; margin-right: 18px;" id="jrFromMain" maxlength="3" value="DAC">
      <span style="width: 58px; text-align: center;">DATE</span>
      <span style="width: 78px; text-align: center;">TIME/RANGE</span>
      <span style="width: 56px; text-align: center;">CARRIER</span>
      <span style="width: 24px; text-align: center;">CABIN</span>
    </div>

    <div class="jr-legs">
      <!-- Leg 1 -->
      <div class="jr-leg-row">
        <span class="leg-idx">1</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn1" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst1" maxlength="3" value="KUL">
        <input class="jr-inp" style="width: 58px;" id="jrDate1" maxlength="5" value="${todayStr}">
        <input class="jr-inp" style="width: 78px;" id="jrTime1" maxlength="7" value="0700/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr1" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin1" maxlength="1" value="Y">
      </div>
      <!-- Leg 2 -->
      <div class="jr-leg-row">
        <span class="leg-idx">2</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn2" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst2" maxlength="3" value="">
        <input class="jr-inp" style="width: 58px;" id="jrDate2" maxlength="5" value="">
        <input class="jr-inp" style="width: 78px;" id="jrTime2" maxlength="7" value="/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr2" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin2" maxlength="1" value="Y">
      </div>
      <!-- Leg 3 -->
      <div class="jr-leg-row">
        <span class="leg-idx">3</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn3" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst3" maxlength="3" value="">
        <input class="jr-inp" style="width: 58px;" id="jrDate3" maxlength="5" value="">
        <input class="jr-inp" style="width: 78px;" id="jrTime3" maxlength="7" value="/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr3" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin3" maxlength="1" value="Y">
      </div>
      <!-- Leg 4 -->
      <div class="jr-leg-row">
        <span class="leg-idx">4</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn4" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst4" maxlength="3" value="">
        <input class="jr-inp" style="width: 58px;" id="jrDate4" maxlength="5" value="">
        <input class="jr-inp" style="width: 78px;" id="jrTime4" maxlength="7" value="/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr4" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin4" maxlength="1" value="Y">
      </div>
      <!-- Leg 5 -->
      <div class="jr-leg-row">
        <span class="leg-idx">5</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn5" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst5" maxlength="3" value="">
        <input class="jr-inp" style="width: 58px;" id="jrDate5" maxlength="5" value="">
        <input class="jr-inp" style="width: 78px;" id="jrTime5" maxlength="7" value="/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr5" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin5" maxlength="1" value="Y">
      </div>
      <!-- Leg 6 -->
      <div class="jr-leg-row">
        <span class="leg-idx">6</span>
        <input class="jr-inp" style="width: 24px;" id="jrConn6" maxlength="1" value="0">
        <input class="jr-inp" style="width: 44px;" id="jrDst6" maxlength="3" value="">
        <input class="jr-inp" style="width: 58px;" id="jrDate6" maxlength="5" value="">
        <input class="jr-inp" style="width: 78px;" id="jrTime6" maxlength="7" value="/¥-">
        <input class="jr-inp" style="width: 56px;" id="jrCxr6" maxlength="5" value="/ /">
        <input class="jr-inp" style="width: 24px;" id="jrCabin6" maxlength="1" value="Y">
      </div>
    </div>

    <div class="jr-row" style="margin-top: 4px;">
      <span>MORE CITIES</span>
      <input class="jr-inp" style="width: 44px; margin-left: 6px;" id="jrMoreCities" maxlength="3" value="">
      <span style="margin-left: 80px;">ONLINE SERVICE ONLY</span>
      <input class="jr-inp" style="width: 24px; margin-left: 6px;" id="jrOnlineOnly" maxlength="1" value="N">
    </div>

    <div class="jr-dash-line">--------------------------------------------------------------------------------</div>

    <div class="jr-row">
      <span>MIN/MAX STAY</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrMinStay" maxlength="1" value="Y">
      <span style="margin-left: 16px;">REFUND/PEN</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrRefund" maxlength="1" value="Y">
      <span style="margin-left: 16px;">RES/TKT</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrResTkt" maxlength="1" value="Y">
      <span style="margin-left: 16px;">JUMP</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrJump" maxlength="1" value="">
    </div>

    <div class="jr-row">
      <span style="width: 44px;">PSGR</span>
      <input class="jr-inp" style="width: 54px;" id="jrPsgr1" maxlength="4" value="1ADT">
      <input class="jr-inp" style="width: 44px;" id="jrPsgr2" maxlength="4" value="">
      <input class="jr-inp" style="width: 44px;" id="jrPsgr3" maxlength="4" value="">
      <input class="jr-inp" style="width: 44px;" id="jrPsgr4" maxlength="4" value="">
      <span style="margin-left: 40px;">TKT DATE</span>
      <input class="jr-inp" style="width: 58px; margin-left: 6px;" id="jrTktDate" maxlength="5" value="${todayStr}">
    </div>

    <div class="jr-row">
      <span>NON-PREF CXR</span>
      <input class="jr-inp" style="width: 56px; margin-left: 4px;" id="jrNonPref" maxlength="5" value="/ /">
      <span style="margin-left: 16px;">CORP ID</span>
      <input class="jr-inp" style="width: 74px; margin-left: 4px;" id="jrCorpId" maxlength="8" value="">
      <span style="margin-left: 16px;">PV</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrPv" maxlength="1" value="">
      <span style="margin-left: 16px;">PL</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrPl" maxlength="1" value="">
    </div>

    <div class="jr-row">
      <span>TPR</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrTpr" maxlength="1" value="N">
      <span style="margin-left: 16px;">TPR ID</span>
      <input class="jr-inp" style="width: 140px; margin-left: 4px;" id="jrTprId" maxlength="16" value="">
      <span style="margin-left: 16px;">XO</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrXo" maxlength="1" value="">
    </div>

    <div class="jr-row">
      <span>INSERT AFTER</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrInsertAfter" maxlength="2" value="">
      <span style="margin-left: 10px;">OR DELETE FROM</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrDeleteFrom" maxlength="2" value="">
      <span style="margin-left: 10px;">FOR</span>
      <input class="jr-inp" style="width: 24px; margin-left: 4px;" id="jrForSeg" maxlength="2" value="">
      <span style="margin-left: 10px;">SEGMENTS.</span>
    </div>
  `;

  term.appendChild(wrap);
  term.scrollTop = 0; // Keep at top

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

  // Handle Enter / Esc keys across all JR inputs
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
