/**
 * LUKB Economic & Central Bank Dashboard Controller
 * Pure Vanilla JS - Standalone, robust normalization for user JSON formats
 */

// Global state
const DashboardState = {
  activeTab: 'macro',
  macroFilterCountry: 'all',
  selectedBanks: new Set(['SNB', 'EZB', 'Fed', 'BoE', 'BoJ']),
  cbView: 'table'
};

// All 10 tracked central banks configuration
const CENTRAL_BANKS_CONFIG = [
  { id: 'SNB', name: 'SNB (Schweiz)', bankKey: 'SNB', code: 'CH', defaultSelected: true },
  { id: 'EZB', name: 'EZB (Euroraum)', bankKey: 'EZB', code: 'EU', defaultSelected: true },
  { id: 'Fed', name: 'Fed (USA)', bankKey: 'Fed', code: 'US', defaultSelected: true },
  { id: 'BoE', name: 'BoE (UK)', bankKey: 'BoE', code: 'GB', defaultSelected: true },
  { id: 'BoJ', name: 'BoJ (Japan)', bankKey: 'BoJ', code: 'JP', defaultSelected: true },
  { id: 'BoC', name: 'BoC (Kanada)', bankKey: 'BoC', code: 'CA', defaultSelected: false },
  { id: 'RBA', name: 'RBA (Australien)', bankKey: 'RBA', code: 'AU', defaultSelected: false },
  { id: 'Norges Bank', name: 'Norges Bank (Norwegen)', bankKey: 'Norges Bank', code: 'NO', defaultSelected: false },
  { id: 'Riksbank', name: 'Riksbank (Schweden)', bankKey: 'Riksbank', code: 'SE', defaultSelected: false },
  { id: 'RBNZ', name: 'RBNZ (Neuseeland)', bankKey: 'RBNZ', code: 'NZ', defaultSelected: false }
];

// Country & Flag Code Mapping
const COUNTRY_MAP = {
  'schweiz': { code: 'ch', name: 'Schweiz' },
  'ch': { code: 'ch', name: 'Schweiz' },
  'deutschland': { code: 'de', name: 'Deutschland' },
  'de': { code: 'de', name: 'Deutschland' },
  'eurozone': { code: 'eu', name: 'Eurozone' },
  'euroraum': { code: 'eu', name: 'Euroraum' },
  'eu': { code: 'eu', name: 'Eurozone' },
  'usa': { code: 'us', name: 'USA' },
  'us': { code: 'us', name: 'USA' },
  'uk': { code: 'gb', name: 'UK' },
  'grossbritannien': { code: 'gb', name: 'UK' },
  'gb': { code: 'gb', name: 'UK' },
  'japan': { code: 'jp', name: 'Japan' },
  'jp': { code: 'jp', name: 'Japan' },
  'china': { code: 'cn', name: 'China' },
  'cn': { code: 'cn', name: 'China' },
  'indien': { code: 'in', name: 'Indien' },
  'in': { code: 'in', name: 'Indien' },
  'brasilien': { code: 'br', name: 'Brasilien' },
  'br': { code: 'br', name: 'Brasilien' },
  'russland': { code: 'ru', name: 'Russland' },
  'ru': { code: 'ru', name: 'Russland' },
  'kanada': { code: 'ca', name: 'Kanada' },
  'ca': { code: 'ca', name: 'Kanada' },
  'australien': { code: 'au', name: 'Australien' },
  'au': { code: 'au', name: 'Australien' },
  'norwegen': { code: 'no', name: 'Norwegen' },
  'no': { code: 'no', name: 'Norwegen' },
  'schweden': { code: 'se', name: 'Schweden' },
  'se': { code: 'se', name: 'Schweden' },
  'neuseeland': { code: 'nz', name: 'Neuseeland' },
  'nz': { code: 'nz', name: 'Neuseeland' },
  'welt': { code: 'world', name: 'Welt' },
  'world': { code: 'world', name: 'Welt' }
};

function getCountryMeta(countryStr) {
  if (!countryStr) return { code: 'world', name: '' };
  const key = countryStr.toLowerCase().trim();
  return COUNTRY_MAP[key] || { code: 'world', name: countryStr };
}

// Helper: Country Flags (Local SVG vector images)
function getCountryBadge(countryCode, countryName) {
  const code = (countryCode || 'world').toLowerCase();
  const flagPath = `assets/flags/${code}.svg`;
  return `
    <span class="flag-tag">
      <img src="${flagPath}" alt="${countryCode}" class="flag-img" loading="lazy" />
      <span>${countryName || ''}</span>
    </span>
  `;
}

// Helper: Format Date nicely in German
function formatDateDE(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('.')) return dateStr; // Already formatted e.g. "Mo, 07. Sep"
  const [y, m, d] = dateStr.split('-');
  if (!d) return dateStr;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${d}.${m}.${y}`;
}

// Helper: Format Month & Year in German
function formatMonthYearDE(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const y = parts[0];
  const m = parts[1] || '01';
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${monthName} ${y}`;
}

// Helper: Calculate ISO 8601 Calendar Week
function getISOWeek(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
}

// Helper: Calculate Relative Countdown Badge
function getRelativeTimeBadge(dateStr, todayStr) {
  if (!dateStr || !todayStr) return '';
  const [y1, m1, d1] = dateStr.split('-').map(Number);
  const [y2, m2, d2] = todayStr.split('-').map(Number);
  const target = new Date(y1, m1 - 1, d1);
  const today = new Date(y2, m2 - 1, d2);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `<span class="time-badge past">Vergangen</span>`;
  }
  if (diffDays === 0) {
    return `<span class="time-badge urgent">Heute</span>`;
  }
  if (diffDays === 1) {
    return `<span class="time-badge urgent">Morgen</span>`;
  }
  if (diffDays <= 7) {
    return `<span class="time-badge urgent">In ${diffDays} Tagen</span>`;
  }
  if (diffDays <= 14) {
    return `<span class="time-badge soon">In ~2 Wochen</span>`;
  }
  if (diffDays <= 45) {
    const weeks = Math.round(diffDays / 7);
    return `<span class="time-badge medium">In ${weeks} Wochen</span>`;
  }
  const months = Math.round(diffDays / 30.43);
  return `<span class="time-badge normal">In ${months} Monaten</span>`;
}

// -------------------------------------------------------------
// 1. RENDER MAKROKALENDER (Dynamic Country Filter & Day Grouping)
// -------------------------------------------------------------
let cachedMacroRawData = [];

function normalizeMacroData(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  let currentDatum = '';
  return raw.map(item => {
    const rawDate = item.Datum !== undefined ? item.Datum : (item.datum || '');
    if (rawDate && rawDate.trim() !== '') {
      currentDatum = rawDate.trim();
    }
    const rawTime = item.Zeit !== undefined ? item.Zeit : (item.uhrzeit || '');
    const rawLand = item.Land !== undefined ? item.Land : (item.land || '');
    const meta = getCountryMeta(rawLand || item.land_code);

    return {
      datumDisplay: currentDatum,
      datumRaw: rawDate,
      uhrzeit: rawTime,
      land: rawLand,
      land_code: meta.code.toUpperCase(),
      indikator: item.Indikator || item.indikator || '',
      periode: item.Periode || item.periode || '',
      vorher: item.Vorher !== undefined ? String(item.Vorher) : (item.vorher || ''),
      erwartung: item.Erwartung !== undefined ? String(item.Erwartung) : (item.erwartung || '')
    };
  });
}

function populateMacroCountryDropdown(data) {
  const select = document.getElementById('filter-macro-country');
  if (!select) return;

  // Extract unique countries
  const countriesMap = new Map();
  data.forEach(item => {
    if (item.land && item.land.trim() !== '') {
      const code = item.land_code || 'WORLD';
      if (!countriesMap.has(code)) {
        countriesMap.set(code, item.land.trim());
      }
    }
  });

  const currentVal = DashboardState.macroFilterCountry;

  // Sort country entries: CH first, then alphabetically
  const entries = Array.from(countriesMap.entries()).sort((a, b) => {
    if (a[0] === 'CH') return -1;
    if (b[0] === 'CH') return 1;
    return a[1].localeCompare(b[1], 'de');
  });

  let optionsHtml = '<option value="all">Alle Länder / Regionen</option>';
  entries.forEach(([code, name]) => {
    const isSelected = code === currentVal ? 'selected' : '';
    optionsHtml += `<option value="${code}" ${isSelected}>${name}</option>`;
  });

  select.innerHTML = optionsHtml;

  // Setup change event listener only once
  if (!select.dataset.listenerAttached) {
    select.dataset.listenerAttached = 'true';
    select.addEventListener('change', (e) => {
      DashboardState.macroFilterCountry = e.target.value;
      renderMacroCalendar(cachedMacroRawData, false);
    });
  }

  // Restore current selection
  if (currentVal !== 'all' && !countriesMap.has(currentVal)) {
    DashboardState.macroFilterCountry = 'all';
    select.value = 'all';
  } else {
    select.value = DashboardState.macroFilterCountry;
  }
}

function renderMacroCalendar(rawData, updateDropdown = true) {
  cachedMacroRawData = rawData || [];
  const container = document.getElementById('macro-table-container');
  if (!container) return;

  const data = normalizeMacroData(cachedMacroRawData);

  if (updateDropdown) {
    populateMacroCountryDropdown(data);
  }

  const filter = DashboardState.macroFilterCountry;

  let filtered = filter === 'all'
    ? data
    : data.filter(item => item.land_code === filter || item.land.toLowerCase() === filter.toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 32px; color: var(--text-muted);">
        Keine Konjunkturdaten für die gewählte Länderauswahl gefunden.
      </div>`;
    return;
  }

  let lastGroupDate = null;
  let lastGroupTime = null;

  const rowsHtml = filtered.map(item => {
    const isNewDay = item.datumDisplay !== lastGroupDate;
    if (isNewDay) {
      lastGroupDate = item.datumDisplay;
      lastGroupTime = null;
    }

    const isNewTime = item.uhrzeit && item.uhrzeit !== lastGroupTime;
    if (isNewTime) {
      lastGroupTime = item.uhrzeit;
    }

    const dateDisplay = isNewDay
      ? `<span class="day-badge">${item.datumDisplay}</span>`
      : `<span class="date-blank"></span>`;

    const timeDisplay = isNewTime
      ? `<span style="font-weight: 600; font-family: monospace; color: var(--text-dark);">${item.uhrzeit}</span>`
      : (item.uhrzeit ? `<span style="color: var(--text-muted); font-family: monospace;">${item.uhrzeit}</span>` : `<span class="time-blank"></span>`);

    const trClass = isNewDay ? 'new-day-row' : '';

    return `
      <tr class="${trClass}">
        <td style="white-space: nowrap; width: 140px;">${dateDisplay}</td>
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
          <th style="width: 140px;">Datum</th>
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
// 2. RENDER ZENTRALBANKEN (Normalizer for user cbs schema)
// -------------------------------------------------------------
let cachedCbEvents = [];

function normalizeCbData(raw) {
  if (!raw) return [];
  let list = [];

  if (Array.isArray(raw)) {
    if (raw.length > 0 && raw[0].zentralbanken) {
      list = raw[0].zentralbanken;
    } else if (raw.length > 0 && raw[0].zinsentscheide) {
      list = raw;
    } else if (raw.length > 0 && raw[0].datum) {
      return raw;
    }
  } else if (raw.zentralbanken) {
    list = raw.zentralbanken;
  }

  const events = [];
  list.forEach(item => {
    const rawAbk = item.abkuerzung || item.short || item.bank || '';
    const rawName = item.name || '';

    // Match configuration
    const matchedCfg = CENTRAL_BANKS_CONFIG.find(cfg =>
      cfg.id.toLowerCase() === rawAbk.toLowerCase() ||
      cfg.bankKey.toLowerCase() === rawAbk.toLowerCase() ||
      (rawAbk.includes('Fed') && cfg.id === 'Fed') ||
      (rawAbk === 'US Fed' && cfg.id === 'Fed') ||
      rawName.toLowerCase().includes(cfg.bankKey.toLowerCase()) ||
      rawName.toLowerCase().includes(cfg.id.toLowerCase())
    );

    const bankId = matchedCfg ? matchedCfg.id : rawAbk;
    const countryCode = matchedCfg ? matchedCfg.code : 'world';
    const dates = item.zinsentscheide || (item.datum ? [item.datum] : []);

    dates.forEach(dStr => {
      events.push({
        bank: bankId,
        short: bankId,
        name: rawName || (matchedCfg ? matchedCfg.name : bankId),
        land_code: countryCode,
        datum: dStr,
        uhrzeit: item.uhrzeit || '',
        typ: item.typ || 'Zinsentscheid',
        leitzins_aktuell: item.leitzins_aktuell || '',
        erwartung: item.erwartung || ''
      });
    });
  });

  return events;
}

function renderCentralBanks(rawData) {
  cachedCbEvents = normalizeCbData(rawData);
  const checkboxGrid = document.getElementById('cb-checkbox-grid');

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
        updateCentralBankViews();
      });
    });
  }

  initCbViewSwitch();
  updateCentralBankViews();
}

function initCbViewSwitch() {
  const btnTable = document.getElementById('cb-view-table-btn');
  const btnCal = document.getElementById('cb-view-cal-btn');
  const btnTimeline = document.getElementById('cb-view-timeline-btn');

  const tableSec = document.getElementById('cb-view-table');
  const calSec = document.getElementById('cb-view-calendar');
  const timelineSec = document.getElementById('cb-view-timeline');

  const setView = (viewName) => {
    DashboardState.cbView = viewName;
    if (btnTable) btnTable.classList.toggle('active', viewName === 'table');
    if (btnCal) btnCal.classList.toggle('active', viewName === 'calendar');
    if (btnTimeline) btnTimeline.classList.toggle('active', viewName === 'timeline');

    if (tableSec) tableSec.style.display = viewName === 'table' ? 'block' : 'none';
    if (calSec) calSec.style.display = viewName === 'calendar' ? 'block' : 'none';
    if (timelineSec) timelineSec.style.display = viewName === 'timeline' ? 'block' : 'none';
  };

  if (btnTable && !btnTable.dataset.initialized) {
    btnTable.dataset.initialized = 'true';
    btnTable.addEventListener('click', () => setView('table'));
  }

  if (btnCal && !btnCal.dataset.initialized) {
    btnCal.dataset.initialized = 'true';
    btnCal.addEventListener('click', () => setView('calendar'));
  }

  if (btnTimeline && !btnTimeline.dataset.initialized) {
    btnTimeline.dataset.initialized = 'true';
    btnTimeline.addEventListener('click', () => setView('timeline'));
  }
}

function updateCentralBankViews() {
  const todayStr = new Date().toISOString().slice(0, 10);
  renderCentralBankTable(cachedCbEvents, todayStr);
  renderCentralBankCalendar(cachedCbEvents, todayStr);
  renderCentralBankTimeline(cachedCbEvents, todayStr);
}

// 2A. TABELLEN-ANSICHT
function renderCentralBankTable(events, todayStr) {
  const tableContainer = document.getElementById('cb-table-container');
  if (!tableContainer) return;

  const filtered = events.filter(d => DashboardState.selectedBanks.has(d.bank));
  const futureData = filtered.filter(d => d.datum >= todayStr);

  futureData.sort((a, b) => {
    if (a.datum !== b.datum) return a.datum.localeCompare(b.datum);
    return a.bank.localeCompare(b.bank);
  });

  if (futureData.length === 0) {
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Keine anstehenden Zinstermine für die aktuell ausgewählten Zentralbanken vorhanden.
      </div>`;
    return;
  }

  const monthCounts = {};
  futureData.forEach(item => {
    const mKey = item.datum.slice(0, 7);
    monthCounts[mKey] = (monthCounts[mKey] || 0) + 1;
  });

  let lastMonthKey = null;
  let rowsHtml = '';

  futureData.forEach(item => {
    const currentMonthKey = item.datum.slice(0, 7);
    if (currentMonthKey !== lastMonthKey) {
      lastMonthKey = currentMonthKey;
      const count = monthCounts[currentMonthKey];
      const countText = count === 1 ? '1 Termin' : `${count} Termine`;
      rowsHtml += `
        <tr class="month-group-row">
          <td colspan="5">
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
        <td style="color: var(--text-dark); font-size: 13px;">${item.name}</td>
        <td style="font-weight: 600; white-space: nowrap; width: 150px;">${formatDateDE(item.datum)}</td>
        <td class="center" style="width: 80px;"><span class="kw-badge">KW ${getISOWeek(item.datum)}</span></td>
        <td style="width: 140px; text-align: right;">${getRelativeTimeBadge(item.datum, todayStr)}</td>
      </tr>
    `;
  });

  tableContainer.innerHTML = `
    <table class="lukb-table">
      <thead>
        <tr>
          <th style="width: 140px;">Zentralbank</th>
          <th>Institution</th>
          <th style="width: 150px;">Datum</th>
          <th class="center" style="width: 80px;">Woche</th>
          <th style="width: 140px; text-align: right;">Fälligkeit</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

// 2B. KALENDER-ANSICHT
function renderCentralBankCalendar(events, todayStr) {
  const container = document.getElementById('cb-calendar-container');
  if (!container) return;

  const currentMonthKey = todayStr.slice(0, 7);
  const filtered = events.filter(d => DashboardState.selectedBanks.has(d.bank));

  const allQuarters = [
    { name: 'Q1 2026', months: ['2026-01', '2026-02', '2026-03'] },
    { name: 'Q2 2026', months: ['2026-04', '2026-05', '2026-06'] },
    { name: 'Q3 2026', months: ['2026-07', '2026-08', '2026-09'] },
    { name: 'Q4 2026', months: ['2026-10', '2026-11', '2026-12'] },
    { name: 'Q1 2027', months: ['2027-01', '2027-02', '2027-03'] },
    { name: 'Q2 2027', months: ['2027-04', '2027-05', '2027-06'] },
    { name: 'Q3 2027', months: ['2027-07', '2027-08', '2027-09'] },
    { name: 'Q4 2027', months: ['2027-10', '2027-11', '2027-12'] }
  ];

  const activeQuarters = allQuarters.filter(q => {
    const lastMonth = q.months[q.months.length - 1];
    return lastMonth >= currentMonthKey;
  });

  if (activeQuarters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Keine aktuellen oder anstehenden Quartale verfügbar.
      </div>`;
    return;
  }

  const quartersHtml = activeQuarters.map(q => {
    const monthCardsHtml = q.months.map(mKey => {
      const isPastMonth = mKey < currentMonthKey;
      const isCurrentMonth = mKey === currentMonthKey;

      let cardClass = 'cb-month-card';
      if (isCurrentMonth) cardClass += ' is-current-month';
      else if (isPastMonth) cardClass += ' is-past-month';

      const monthEvents = filtered.filter(d => d.datum.startsWith(mKey));
      monthEvents.sort((a, b) => a.datum.localeCompare(b.datum));

      let eventsListHtml = '';
      if (monthEvents.length === 0) {
        eventsListHtml = `<div class="cb-no-events">Keine Zinsentscheide</div>`;
      } else {
        eventsListHtml = monthEvents.map(ev => {
          const isPastMeeting = isPastMonth || (isCurrentMonth && ev.datum < todayStr);
          const evClass = isPastMeeting ? 'cb-calendar-event is-past-meeting' : 'cb-calendar-event';
          return `
            <div class="${evClass}">
              <div class="cb-cal-top">
                <span class="cb-cal-bank">${getCountryBadge(ev.land_code, ev.bank)}</span>
                <span class="cb-cal-date">${formatDateDE(ev.datum)}</span>
              </div>
              <div class="cb-cal-sub" style="margin-top: 3px; font-size: 11px; color: var(--text-muted);">
                <span>${ev.name}</span>
              </div>
            </div>
          `;
        }).join('');
      }

      const countBadge = monthEvents.length > 0 
        ? `<span class="month-badge-count">${monthEvents.length === 1 ? '1 Termin' : monthEvents.length + ' Termine'}</span>` 
        : '';

      return `
        <div class="${cardClass}">
          <div class="cb-month-card-header">
            <span class="cb-month-card-title">${formatMonthYearDE(mKey + '-01')}</span>
            ${countBadge}
          </div>
          <div class="cb-month-card-body">
            ${eventsListHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cb-quarter-row">
        <div class="cb-calendar-grid">
          ${monthCardsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = quartersHtml;
}

// 2C. ZEITSTRAHL-ANSICHT (Timeline variant: proportional month widths, past 30 days highlighted)
function renderCentralBankTimeline(events, todayStr) {
  const container = document.getElementById('cb-timeline-container');
  if (!container) return;

  const filtered = events.filter(d => DashboardState.selectedBanks.has(d.bank));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Keine Zentralbanken ausgewählt. Bitte oben gewünschte Notenbanken aktivieren.
      </div>`;
    return;
  }

  // 1. Calculate Timeline Range:
  // Today - 30 days
  const today = new Date(todayStr + 'T00:00:00');
  const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Start from the 1st of the month of (today - 30 days)
  const startYear = past30.getFullYear();
  const startMonth = past30.getMonth(); // 0-11
  const startDate = new Date(startYear, startMonth, 1);

  // End at 2027-12-31
  const endYear = 2027;
  const endMonth = 11;
  const endDate = new Date(endYear, 11, 31);

  // Build list of months with exact day counts
  const months = [];
  let curY = startYear;
  let curM = startMonth;
  while (curY < endYear || (curY === endYear && curM <= endMonth)) {
    const daysInM = new Date(curY, curM + 1, 0).getDate();
    const monthKey = `${curY}-${String(curM + 1).padStart(2, '0')}`;
    const monthName = formatMonthYearDE(`${monthKey}-01`);
    const shortName = `${monthName.slice(0, 3)} '${String(curY).slice(2)}`;
    months.push({
      year: curY,
      month: curM,
      days: daysInM,
      key: monthKey,
      label: shortName,
      fullLabel: monthName
    });
    curM++;
    if (curM > 11) {
      curM = 0;
      curY++;
    }
  }

  const totalDays = months.reduce((acc, m) => acc + m.days, 0);
  const pxPerDay = 3.2; // Proportional width factor (30 days ~ 96px, 31 days ~ 99px, 28 days ~ 90px)
  const totalWidthPx = Math.round(totalDays * pxPerDay);

  // Calculate Today X position
  const daysFromStartToToday = (today - startDate) / (1000 * 60 * 60 * 24);
  const todayX = Math.round(daysFromStartToToday * pxPerDay);

  const currentMonthKey = todayStr.slice(0, 7);

  // Month header columns
  const headerMonthsHtml = months.map(m => {
    const w = Math.round(m.days * pxPerDay);
    const isPast = m.key < currentMonthKey;
    const isCurrent = m.key === currentMonthKey;
    let cls = 'cb-timeline-month-col';
    if (isCurrent) cls += ' is-current';
    else if (isPast) cls += ' is-past';

    return `<div class="${cls}" style="width: ${w}px; min-width: ${w}px;" title="${m.fullLabel}">${m.label}</div>`;
  }).join('');

  // Background month columns for lanes
  const laneBgMonthsHtml = months.map(m => {
    const w = Math.round(m.days * pxPerDay);
    const isPast = m.key < currentMonthKey;
    let cls = 'cb-timeline-lane-month-bg';
    if (isPast) cls += ' is-past';
    return `<div class="${cls}" style="width: ${w}px; min-width: ${w}px;"></div>`;
  }).join('');

  // Selected central banks in order
  const activeBankConfigs = CENTRAL_BANKS_CONFIG.filter(cfg => DashboardState.selectedBanks.has(cfg.id));

  // Determine next upcoming meeting for special visual accent
  const futureSorted = filtered.filter(d => d.datum >= todayStr).sort((a, b) => a.datum.localeCompare(b.datum));
  const nextMeetingKey = futureSorted.length > 0 ? `${futureSorted[0].bank}_${futureSorted[0].datum}` : '';

  // Rows for each central bank
  const rowsHtml = activeBankConfigs.map(cfg => {
    const bankEvents = filtered.filter(d => d.bank === cfg.id);

    const nodesHtml = bankEvents.map(ev => {
      const evDate = new Date(ev.datum + 'T00:00:00');
      if (evDate < startDate || evDate > endDate) return '';

      const daysDiff = (evDate - startDate) / (1000 * 60 * 60 * 24);
      const leftPx = Math.round(daysDiff * pxPerDay);
      const isPast = ev.datum < todayStr;
      const isNext = `${ev.bank}_${ev.datum}` === nextMeetingKey;

      let nodeCls = 'cb-timeline-node';
      if (isPast) nodeCls += ' is-past-node';
      else if (isNext) nodeCls += ' is-next-meeting';

      const dayOfMonth = ev.datum.split('-')[2];

      const relativeCountdown = !isPast ? getRelativeTimeBadge(ev.datum, todayStr).replace(/<[^>]*>/g, '') : 'Bereits stattgefunden';

      return `
        <div class="${nodeCls}" style="left: ${leftPx}px;">
          <span>${dayOfMonth}.</span>
          <div class="cb-timeline-tooltip">
            <strong style="color: #FFFFFF;">${ev.bank}</strong> (${cfg.name})<br/>
            <span>🗓️ ${formatDateDE(ev.datum)}</span>
            <br/><span style="color: ${isPast ? '#94A3B8' : '#FDF2F7'}; font-weight: 700;">${relativeCountdown}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cb-timeline-row">
        <div class="cb-timeline-bank-label">
          ${getCountryBadge(cfg.code, cfg.id)}
        </div>
        <div class="cb-timeline-lane" style="width: ${totalWidthPx}px; min-width: ${totalWidthPx}px;">
          <div class="cb-timeline-lane-bg">${laneBgMonthsHtml}</div>
          <div class="cb-timeline-guide-line"></div>
          ${nodesHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="cb-timeline-legend" style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px; font-size: 12px; color: var(--text-dark); flex-wrap: wrap;">
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 12px; height: 12px; background-color: var(--lukb-berry-600); display: inline-block;"></span>
        <strong>Nächster Zinsentscheid</strong>
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 12px; height: 12px; background-color: var(--lukb-blue-700); display: inline-block;"></span>
        <span>Anstehende Entscheide</span>
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 12px; height: 12px; background-color: #94A3B8; opacity: 0.65; display: inline-block;"></span>
        <span>Vergangene Entscheide (letzte 30 Tage)</span>
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 12px; height: 2px; background-color: var(--lukb-berry-600); display: inline-block;"></span>
        <span>Heute-Linie</span>
      </span>
      <span style="margin-left: auto; color: var(--text-muted); font-size: 11.5px;">
        ↔️ Horizontal scrollbar
      </span>
    </div>

    <div class="cb-timeline-wrapper" id="cb-timeline-scroll-wrapper">
      <div class="cb-timeline-inner" style="width: calc(160px + ${totalWidthPx}px);">
        <div class="cb-timeline-header-row">
          <div class="cb-timeline-corner">Zentralbank</div>
          <div class="cb-timeline-months-container" style="width: ${totalWidthPx}px; min-width: ${totalWidthPx}px;">
            ${headerMonthsHtml}
            <div class="cb-timeline-today-line" style="left: ${todayX}px;">
              <span class="cb-timeline-today-flag">Heute</span>
            </div>
          </div>
        </div>
        <div style="position: relative;">
          ${rowsHtml}
          <div class="cb-timeline-today-line" style="left: calc(160px + ${todayX}px); top: 0; bottom: 0;"></div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 3. RENDER PROGNOSEN (Normalizer for user json format)
// -------------------------------------------------------------
function normalizeForecasts(raw) {
  if (!raw) return null;
  if (raw.daten && raw.jahre) return raw;

  if (!Array.isArray(raw)) return null;

  // Extract years dynamically from keys
  const yearSet = new Set();
  raw.forEach(row => {
    Object.keys(row).forEach(k => {
      if (/^\d{4}$/.test(k)) yearSet.add(k);
    });
  });
  const jahre = Array.from(yearSet).sort();

  // Pivot by geo
  const geoMap = new Map();
  raw.forEach(row => {
    const geo = row.geo;
    if (!geo) return;
    if (!geoMap.has(geo)) {
      const meta = getCountryMeta(geo);
      geoMap.set(geo, {
        land: geo,
        land_code: meta.code.toUpperCase(),
        bip: {},
        inflation: {}
      });
    }
    const target = geoMap.get(geo);
    const varType = (row.var || '').toUpperCase();

    jahre.forEach(y => {
      if (row[y] !== undefined && row[y] !== null) {
        if (varType === 'BIP' || varType === 'GDP') {
          target.bip[y] = parseFloat(row[y]);
        } else if (varType === 'CPI' || varType === 'INFLATION') {
          target.inflation[y] = parseFloat(row[y]);
        }
      }
    });
  });

  return {
    jahre: jahre.length > 0 ? jahre : ['2025', '2026', '2027'],
    daten: Array.from(geoMap.values())
  };
}

function renderForecasts(raw) {
  const container = document.getElementById('forecasts-table-container');
  if (!container) return;

  const forecastObj = normalizeForecasts(raw);
  if (!forecastObj || !forecastObj.daten || forecastObj.daten.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Keine Prognosedaten verfügbar.
      </div>`;
    return;
  }

  const years = forecastObj.jahre;

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
// TAB SWITCHING & QUICK ACTIONS
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
    }
  } catch (e) {
    console.error('Fehler beim Laden von makro_kalender.json:', e);
  }
  renderMacroCalendar(macroData, true);

  // 2. Load Central Bank Meetings Data
  let cbData = [];
  try {
    const res = await fetch('data/zentralbanken.json');
    if (res.ok) {
      cbData = await res.json();
    }
  } catch (e) {
    console.error('Fehler beim Laden von zentralbanken.json:', e);
  }
  renderCentralBanks(cbData);
  initCbQuickActions(cbData);

  // 3. Load Forecasts Data
  let forecastData = null;
  try {
    const res = await fetch('data/prognosen.json');
    if (res.ok) {
      forecastData = await res.json();
    }
  } catch (e) {
    console.error('Fehler beim Laden von prognosen.json:', e);
  }
  if (forecastData) {
    renderForecasts(forecastData);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
