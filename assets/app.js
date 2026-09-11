/**
 * LUKB Economic & Central Bank Dashboard Controller
 * Pure Vanilla JS - No external dependencies
 */

// Global state
const DashboardState = {
  activeTab: 'macro',
  macroFilterCountry: 'all',
  selectedBanks: new Set(['SNB', 'EZB', 'Fed', 'BoE', 'BoJ'])
};

// All 10 tracked central banks configuration
const CENTRAL_BANKS_CONFIG = [
  { id: 'SNB', name: 'SNB (Schweiz)', bankKey: 'SNB', code: 'CH', defaultSelected: true },
  { id: 'EZB', name: 'EZB (Euroraum)', bankKey: 'EZB', code: 'EU', defaultSelected: true },
  { id: 'Fed', name: 'Fed (USA)', bankKey: 'Fed', code: 'US', defaultSelected: true },
  { id: 'BoE', name: 'BoE (UK)', bankKey: 'Bank of England', code: 'GB', defaultSelected: true },
  { id: 'BoJ', name: 'BoJ (Japan)', bankKey: 'Bank of Japan', code: 'JP', defaultSelected: true },
  { id: 'BoC', name: 'Bank of Canada', bankKey: 'Bank of Canada', code: 'CA', defaultSelected: false },
  { id: 'RBA', name: 'Bank of Australia', bankKey: 'Bank of Australia', code: 'AU', defaultSelected: false },
  { id: 'Norges Bank', name: 'Norges Bank', bankKey: 'Norges Bank', code: 'NO', defaultSelected: false },
  { id: 'Riksbank', name: 'Swedish Riksbank', bankKey: 'Swedish Riksbank', code: 'SE', defaultSelected: false },
  { id: 'RBNZ', name: 'RBNZ (Neuseeland)', bankKey: 'RBNZ', code: 'NZ', defaultSelected: false }
];

// Helper: Country Flags (Local SVG vector images)
function getCountryBadge(countryCode, countryName) {
  const code = (countryCode || 'world').toLowerCase();
  const flagPath = `assets/flags/${code}.svg`;
  return `
    <span class="flag-tag">
      <img src="${flagPath}" alt="${countryCode}" class="flag-img" loading="lazy" />
      <span>${countryName}</span>
    </span>
  `;
}

// Helper: Format Date nicely in German
function formatDateDE(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${d}.${m}.${y}`;
}

// Helper: Format Month & Year in German
function formatMonthYearDE(dateStr) {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${monthName} ${y}`;
}

// -------------------------------------------------------------
// 1. RENDER MAKROKALENDER (With Day Grouping & Time Deduplication)
// -------------------------------------------------------------
function renderMacroCalendar(data) {
  const container = document.getElementById('macro-table-container');
  if (!container) return;

  const filter = DashboardState.macroFilterCountry;
  let filtered = filter === 'all' 
    ? [...data]
    : data.filter(item => item.land_code === filter || (filter === 'CH' && item.land === 'Schweiz'));

  // Sort by date and time
  filtered.sort((a, b) => {
    if (a.datum !== b.datum) return a.datum.localeCompare(b.datum);
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 32px; color: var(--text-muted);">
        Keine Konjunkturdaten für die gewählte Länderauswahl gefunden.
      </div>`;
    return;
  }

  let lastDate = null;
  let lastTime = null;

  const rowsHtml = filtered.map(item => {
    const isNewDay = item.datum !== lastDate;
    if (isNewDay) {
      lastDate = item.datum;
      lastTime = null; // reset time for new day
    }

    const isNewTime = item.uhrzeit !== lastTime;
    if (isNewTime) {
      lastTime = item.uhrzeit;
    }

    const dateDisplay = isNewDay
      ? `<span class="day-badge">${formatDateDE(item.datum)}</span>`
      : `<span class="date-blank"></span>`;

    const timeDisplay = isNewTime
      ? `<span style="font-weight: 600; font-family: monospace; color: var(--text-dark);">${item.uhrzeit}</span>`
      : `<span class="time-blank"></span>`;

    const trClass = isNewDay ? 'new-day-row' : '';

    return `
      <tr class="${trClass}">
        <td style="white-space: nowrap; width: 150px;">${dateDisplay}</td>
        <td style="width: 80px; text-align: left;">${timeDisplay}</td>
        <td style="width: 140px;">${getCountryBadge(item.land_code, item.land)}</td>
        <td style="font-weight: 600; color: var(--lukb-blue-900);">
          ${item.indikator}
        </td>
        <td style="color: var(--text-muted); width: 90px;">${item.periode}</td>
        <td class="num" style="color: var(--text-muted); width: 90px;">${item.vorher}</td>
        <td class="num" style="font-weight: 700; color: var(--lukb-berry-600); width: 100px;">${item.erwartung}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="lukb-table">
      <thead>
        <tr>
          <th style="width: 150px;">Datum</th>
          <th style="width: 80px;">Uhrzeit</th>
          <th style="width: 140px;">Land</th>
          <th>Indikator</th>
          <th style="width: 90px;">Periode</th>
          <th class="num" style="width: 90px;">Vorher</th>
          <th class="num" style="width: 100px;">Erwartung</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// 2. RENDER ZENTRALBANKEN (System Date Filter, Default Sort, Checkboxes)
// -------------------------------------------------------------
function renderCentralBanks(data) {
  const checkboxGrid = document.getElementById('cb-checkbox-grid');
  const cardGrid = document.getElementById('cb-next-meetings');
  const tableContainer = document.getElementById('cb-table-container');

  // Today ISO date string (e.g. "2026-09-11")
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter out past meetings (system date is filter)
  const futureData = data.filter(d => d.datum >= todayStr);

  // Sort default by date and time ascending
  futureData.sort((a, b) => {
    if (a.datum !== b.datum) return a.datum.localeCompare(b.datum);
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });

  // Render Checkboxes (if not already rendered)
  if (checkboxGrid && checkboxGrid.children.length === 0) {
    checkboxGrid.innerHTML = CENTRAL_BANKS_CONFIG.map(cfg => {
      const isChecked = DashboardState.selectedBanks.has(cfg.id);
      return `
        <label class="cb-checkbox-label ${isChecked ? 'is-checked' : ''}" data-bank-id="${cfg.id}">
          <input type="checkbox" value="${cfg.id}" ${isChecked ? 'checked' : ''} />
          <span>${cfg.name}</span>
        </label>
      `;
    }).join('');

    // Attach checkbox event listeners
    checkboxGrid.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const bankId = e.target.value;
        const label = e.target.closest('.cb-checkbox-label');
        if (e.target.checked) {
          DashboardState.selectedBanks.add(bankId);
          label.classList.add('is-checked');
        } else {
          DashboardState.selectedBanks.delete(bankId);
          label.classList.remove('is-checked');
        }
        renderCentralBankCardsAndTable(futureData);
      });
    });
  }

  renderCentralBankCardsAndTable(futureData);
}

function renderCentralBankCardsAndTable(futureData) {
  const cardGrid = document.getElementById('cb-next-meetings');
  const tableContainer = document.getElementById('cb-table-container');

  // Filter by selected bank checkboxes
  const filteredData = futureData.filter(d => {
    // Check if bank matches any selected bank config
    const matchedCfg = CENTRAL_BANKS_CONFIG.find(cfg => cfg.bankKey === d.bank || cfg.id === d.short || cfg.id === d.bank);
    if (!matchedCfg) return false;
    return DashboardState.selectedBanks.has(matchedCfg.id);
  });

  // 1. Render Mini Cards for Next Meetings of selected banks
  if (cardGrid) {
    const selectedBankIds = Array.from(DashboardState.selectedBanks);
    const nextMeetings = selectedBankIds.map(bankId => {
      const cfg = CENTRAL_BANKS_CONFIG.find(c => c.id === bankId);
      if (!cfg) return null;
      const bankItems = futureData.filter(d => d.bank === cfg.bankKey || d.short === cfg.id);
      return bankItems.length > 0 ? bankItems[0] : null;
    }).filter(Boolean);

    // Sort next meetings by date
    nextMeetings.sort((a, b) => a.datum.localeCompare(b.datum));

    if (nextMeetings.length === 0) {
      cardGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: var(--text-muted); font-size: 13px;">Keine Zentralbanken ausgewählt.</div>`;
    } else {
      cardGrid.innerHTML = nextMeetings.map(item => `
        <div class="cb-mini-card">
          <div class="header">
            <span class="bank-code">${getCountryBadge(item.land_code, item.bank)}</span>
            <span class="meeting-date">${formatDateDE(item.datum)}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-dark); margin: 4px 0 8px 0; font-weight: 500;">
            ${item.typ}
          </div>
          <div class="rate-info">
            <span>Aktuell: <strong class="rate-val">${item.leitzins_aktuell}</strong></span>
            <span>Erwartet: <strong class="rate-val" style="color: var(--lukb-berry-600);">${item.erwartung}</strong></span>
          </div>
        </div>
      `).join('');
    }
  }

  // 2. Render Full Schedule Table
  if (tableContainer) {
    if (filteredData.length === 0) {
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--text-muted);">
          Keine anstehenden Zinstermine für die aktuell ausgewählten Zentralbanken vorhanden.
        </div>`;
      return;
    }

    // Calculate counts per month for badges
    const monthCounts = {};
    filteredData.forEach(item => {
      const mKey = item.datum.slice(0, 7);
      monthCounts[mKey] = (monthCounts[mKey] || 0) + 1;
    });

    let lastMonthKey = null;
    let rowsHtml = '';

    filteredData.forEach(item => {
      const currentMonthKey = item.datum.slice(0, 7);
      if (currentMonthKey !== lastMonthKey) {
        lastMonthKey = currentMonthKey;
        const count = monthCounts[currentMonthKey];
        const countText = count === 1 ? '1 Termin' : `${count} Termine`;
        rowsHtml += `
          <tr class="month-group-row">
            <td colspan="7">
              <div class="month-group-title">
                <span>🗓️ ${formatMonthYearDE(item.datum)}</span>
                <span class="month-badge-count">${countText}</span>
              </div>
            </td>
          </tr>
        `;
      }

      rowsHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--lukb-blue-900); width: 140px;">
            ${getCountryBadge(item.land_code, item.bank)}
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">${item.name}</td>
          <td style="font-weight: 600; white-space: nowrap; width: 140px;">${formatDateDE(item.datum)}</td>
          <td style="color: var(--text-muted); font-family: monospace; width: 80px;">${item.uhrzeit}</td>
          <td>${item.typ}</td>
          <td class="num" style="font-weight: 600; width: 110px;">${item.leitzins_aktuell}</td>
          <td class="num" style="font-weight: 700; color: var(--lukb-berry-600); width: 110px;">${item.erwartung}</td>
        </tr>
      `;
    });

    tableContainer.innerHTML = `
      <table class="lukb-table">
        <thead>
          <tr>
            <th style="width: 140px;">Zentralbank</th>
            <th>Vollständiger Name</th>
            <th style="width: 140px;">Datum</th>
            <th style="width: 80px;">Uhrzeit</th>
            <th>Art des Entscheids / Publikation</th>
            <th class="num" style="width: 110px;">Leitzins akt.</th>
            <th class="num" style="width: 110px;">Konsensus</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }
}

// -------------------------------------------------------------
// 3. RENDER PROGNOSEN (Full dynamic table for 10 regions & 3 years)
// -------------------------------------------------------------
function renderForecasts(forecastObj) {
  const container = document.getElementById('forecasts-table-container');
  if (!container) return;

  if (!forecastObj || !forecastObj.daten || forecastObj.daten.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Keine Prognosedaten verfügbar.
      </div>`;
    return;
  }

  const years = forecastObj.jahre || ['2025', '2026', '2027'];

  const theadHtml = `
    <thead>
      <tr>
        <th style="width: 25%;">Land / Region</th>
        <th class="center" colspan="${years.length}" style="background-color: var(--lukb-blue-100); border-left: 2px solid #CBD5E1; color: var(--lukb-blue-900); width: 37.5%;">
          Reales BIP-Wachstum (%)
        </th>
        <th class="center" colspan="${years.length}" style="background-color: #F8EBF2; color: var(--lukb-berry-800); border-left: 2px solid #CBD5E1; width: 37.5%;">
          Inflation / CPI (%)
        </th>
      </tr>
      <tr>
        <th style="background-color: var(--lukb-blue-50); width: 25%;"></th>
        ${years.map(y => `<th style="background-color: var(--lukb-blue-50); width: 12.5%; text-align: center; color: var(--lukb-blue-900); font-weight: 700;">${y}</th>`).join('')}
        ${years.map(y => `<th style="background-color: #FDF4F8; width: 12.5%; text-align: center; color: var(--lukb-berry-800); font-weight: 700;">${y}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tbodyHtml = forecastObj.daten.map(row => {
    const isSpecial = row.land === 'Schweiz' || row.land === 'Welt';
    const rowBg = row.land === 'Schweiz' 
      ? 'style="background-color: #F8FAFD; font-weight: 600;"' 
      : (row.land === 'Welt' ? 'style="background-color: #FAFCFE; font-weight: 600;"' : '');

    const bipCells = years.map((y, idx) => {
      const val = row.bip[y] !== undefined ? row.bip[y] : 0;
      const isNeg = val < 0;
      const width = Math.min(Math.max(Math.abs(val) * 4.2, 4), 45);
      const barClass = isNeg ? 'metric-bar negative' : 'metric-bar';
      const valClass = isNeg ? 'val-highlight negative' : 'val-highlight';
      return `
        <td style="text-align: left; width: 12.5%; border-left: ${idx === 0 ? '2px solid #CBD5E1' : 'none'};">
          <div class="metric-bar-container">
            <span class="${barClass}" style="width: ${width}px;" title="${val.toFixed(1)}%"></span>
            <span class="${valClass}">${val.toFixed(1)}%</span>
          </div>
        </td>
      `;
    }).join('');

    const infCells = years.map((y, idx) => {
      const val = row.inflation[y] !== undefined ? row.inflation[y] : 0;
      const isNeg = val < 0;
      const width = Math.min(Math.max(Math.abs(val) * 3.8, 4), 45);
      const barClass = isNeg ? 'metric-bar negative' : 'metric-bar berry';
      const valClass = isNeg ? 'val-highlight negative' : 'val-highlight';
      const colorStyle = isNeg ? '' : 'style="color: var(--lukb-berry-700);"';
      return `
        <td style="text-align: left; width: 12.5%; border-left: ${idx === 0 ? '2px solid #CBD5E1' : 'none'};">
          <div class="metric-bar-container">
            <span class="${barClass}" style="width: ${width}px;" title="${val.toFixed(1)}%"></span>
            <span class="${valClass}" ${colorStyle}>${val.toFixed(1)}%</span>
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr ${rowBg}>
        <td style="font-weight: ${isSpecial ? '700' : '500'}; width: 25%;">${getCountryBadge(row.land_code, row.land)}</td>
        ${bipCells}
        ${infCells}
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="lukb-table" style="table-layout: fixed; width: 100%;">
      ${theadHtml}
      <tbody>
        ${tbodyHtml}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// TAB SWITCHING
// -------------------------------------------------------------
function initTabs() {
  const tabs = document.querySelectorAll('.lukb-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      DashboardState.activeTab = target;

      const sections = ['section-macro', 'section-cb', 'section-forecasts'];
      sections.forEach(secId => {
        const el = document.getElementById(secId);
        if (!el) return;
        if ((target === 'macro' && secId === 'section-macro') ||
            (target === 'cb' && secId === 'section-cb') ||
            (target === 'forecasts' && secId === 'section-forecasts')) {
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
    });
  });
}

// Quick action buttons for Central Bank checkboxes
function initCbQuickActions(cbData) {
  const btnAll = document.getElementById('cb-select-all');
  const btnDefault = document.getElementById('cb-select-default');
  const btnNone = document.getElementById('cb-select-none');

  if (btnAll) {
    btnAll.addEventListener('click', () => {
      CENTRAL_BANKS_CONFIG.forEach(cfg => DashboardState.selectedBanks.add(cfg.id));
      updateCheckboxUI();
      renderCentralBanks(cbData);
    });
  }

  if (btnDefault) {
    btnDefault.addEventListener('click', () => {
      DashboardState.selectedBanks.clear();
      CENTRAL_BANKS_CONFIG.filter(c => c.defaultSelected).forEach(c => DashboardState.selectedBanks.add(c.id));
      updateCheckboxUI();
      renderCentralBanks(cbData);
    });
  }

  if (btnNone) {
    btnNone.addEventListener('click', () => {
      DashboardState.selectedBanks.clear();
      updateCheckboxUI();
      renderCentralBanks(cbData);
    });
  }
}

function updateCheckboxUI() {
  const checkboxGrid = document.getElementById('cb-checkbox-grid');
  if (!checkboxGrid) return;
  checkboxGrid.querySelectorAll('.cb-checkbox-label').forEach(label => {
    const bankId = label.getAttribute('data-bank-id');
    const chk = label.querySelector('input[type="checkbox"]');
    if (DashboardState.selectedBanks.has(bankId)) {
      label.classList.add('is-checked');
      if (chk) chk.checked = true;
    } else {
      label.classList.remove('is-checked');
      if (chk) chk.checked = false;
    }
  });
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------
async function initDashboard() {
  initTabs();

  // 1. Load Macro Calendar Data
  let macroData = [];
  try {
    const res = await fetch('data/makro_kalender.json');
    if (res.ok) {
      macroData = await res.json();
    } else {
      macroData = window.DATA_MAKRO || [];
    }
  } catch (e) {
    macroData = window.DATA_MAKRO || [];
  }
  renderMacroCalendar(macroData);

  const macroCountryFilter = document.getElementById('filter-macro-country');
  if (macroCountryFilter) {
    macroCountryFilter.addEventListener('change', (e) => {
      DashboardState.macroFilterCountry = e.target.value;
      renderMacroCalendar(macroData);
    });
  }

  // 2. Load Central Bank Meetings Data
  let cbData = [];
  try {
    const res = await fetch('data/zentralbanken.json');
    if (res.ok) {
      cbData = await res.json();
    } else {
      cbData = window.DATA_CB || [];
    }
  } catch (e) {
    cbData = window.DATA_CB || [];
  }
  renderCentralBanks(cbData);
  initCbQuickActions(cbData);

  // 3. Load Forecasts Data
  let forecastData = null;
  try {
    const res = await fetch('data/prognosen.json');
    if (res.ok) {
      forecastData = await res.json();
    } else {
      forecastData = window.DATA_PROGNOSEN || null;
    }
  } catch (e) {
    forecastData = window.DATA_PROGNOSEN || null;
  }
  if (!forecastData && window.DATA_PROGNOSEN) {
    forecastData = window.DATA_PROGNOSEN;
  }
  if (forecastData) {
    renderForecasts(forecastData);
  }
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
