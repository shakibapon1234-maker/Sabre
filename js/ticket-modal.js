
// ============================================================
// GDS Training Hub - Electronic Ticket Receipt Modal Controller
// ============================================================
function renderTicketItinerary(ticketSegments){
  const el = document.getElementById('tktModalItinerary');
  if(!el) return;
  if(!Array.isArray(ticketSegments) || !ticketSegments.length){
    el.innerHTML = '<p style="color:#64748b;font-size:12px;margin:4px 0;">No segment itinerary recorded for this ticket.</p>';
    return;
  }
  el.innerHTML = '<table class="ticket-itinerary-table"><thead><tr><th>#</th><th>Flight</th><th>Class</th><th>Date</th><th>Route</th><th>Times</th><th>Status</th></tr></thead><tbody>' +
  ticketSegments.map(function(seg, i){
    const fn = (seg.carrier || seg.al || '') + ' ' + (seg.flightNumber || seg.fn || seg.number || '');
    const cls = seg.bookingClass || seg.class || seg.soldClass || 'Y';
    const date = seg.date || seg.fullDate || '—';
    const route = (seg.origin || seg.dep || '—') + ' → ' + (seg.destination || seg.arr || '—');
    const times = (seg.depart || seg.depTime || '—') + ' / ' + (seg.arrive || seg.arrTime || '—');
    const st = seg.status || 'HK1 (CONFIRMED)';
    return '<tr><td>' + (i+1) + '</td><td><strong>' + fn + '</strong></td><td>' + cls + '</td><td>' + date + '</td><td>' + route + '</td><td>' + times + '</td><td><span style="color:#16a34a;font-weight:600;">' + st + '</span></td></tr>';
  }).join('') + '</tbody></table>';
}

function openTicketModal(pax, tktNo, fare, flight, depDate, dest, origTkt, itinerary, pnrData){
  pnrData = pnrData || {};

  // Original Ticket row
  const origRow = document.getElementById('tktModalOrigRow');
  const origVal = document.getElementById('tktModalOrig');
  if(origRow && origVal){
    if(origTkt){ origVal.textContent = origTkt; origRow.style.display = 'flex'; }
    else { origRow.style.display = 'none'; }
  }

  // GDS PNR
  const pnrEl = document.getElementById('tktModalPNR');
  const pnrRow = document.getElementById('tktModalPNRRow');
  if(pnrEl){
    const loc = pnrData.locator || '';
    pnrEl.textContent = loc || '—';
    if(pnrRow) pnrRow.style.display = 'flex';
  }

  // Airline PNR
  const alPnrEl = document.getElementById('tktModalAirlinePNR');
  const alPnrRow = document.getElementById('tktModalAirlinePNRRow');
  if(alPnrEl && alPnrRow){
    let airlinePnr = pnrData.airlinePnr;
    if(!airlinePnr && Array.isArray(itinerary) && itinerary.length){
      const seg = itinerary[0];
      airlinePnr = seg.airlineLocator || seg.carrierLocator || null;
    }
    if(airlinePnr){ alPnrEl.textContent = airlinePnr; alPnrRow.style.display = 'flex'; }
    else { alPnrRow.style.display = 'none'; }
  }

  // Form of Payment
  const fopEl = document.getElementById('tktModalFOP');
  if(fopEl) fopEl.textContent = pnrData.fop || 'CASH';

  // Ticket Status
  const stEl = document.getElementById('tktModalStatus');
  if(stEl){
    const st = pnrData.status || 'OK';
    const stMap = { 'R': 'REFUNDED', 'E': 'EXCHANGED', 'V': 'VOIDED', 'OK': 'OPEN', 'O': 'OPEN' };
    stEl.textContent = stMap[st] || st;
    stEl.style.color = (st === 'R' || st === 'V') ? '#dc2626' : (st === 'E' ? '#d97706' : '#16a34a');
  }

  // Route
  const routeEl = document.getElementById('tktModalRoute');
  if(routeEl){
    if(Array.isArray(itinerary) && itinerary.length){
      const deps = itinerary.map(function(s){ return s.origin || s.dep; }).filter(Boolean);
      const lastArr = (itinerary[itinerary.length-1] || {}).destination || (itinerary[itinerary.length-1] || {}).arr;
      routeEl.textContent = [...deps, lastArr].filter(Boolean).join(' → ') || '—';
    } else { routeEl.textContent = '—'; }
  }

  if(document.getElementById('tktModalPax')) document.getElementById('tktModalPax').textContent = pax || 'PASSENGER';
  if(document.getElementById('tktModalNumber')) document.getElementById('tktModalNumber').textContent = tktNo || '—';
  if(document.getElementById('tktModalFare')) document.getElementById('tktModalFare').textContent = fare || '—';
  if(document.getElementById('tktModalFlight')) document.getElementById('tktModalFlight').textContent = flight || '—';
  if(document.getElementById('tktModalDate')) document.getElementById('tktModalDate').textContent = depDate || '—';
  if(document.getElementById('tktModalDest')) document.getElementById('tktModalDest').textContent = dest || '—';

  renderTicketItinerary(itinerary);
  const bd = document.getElementById('ticketModalBackdrop');
  if(bd) bd.classList.add('show');
}

function closeTicketModal(){
  const bd = document.getElementById('ticketModalBackdrop');
  if(bd) bd.classList.remove('show');
}

function printTicketReceipt(){
  const card = document.getElementById('ticketModalCard');
  const hideFare = document.getElementById('hideFareCheckbox');
  if(card) card.classList.toggle('hide-fare-on-print', Boolean(hideFare && hideFare.checked));
  window.print();
}
