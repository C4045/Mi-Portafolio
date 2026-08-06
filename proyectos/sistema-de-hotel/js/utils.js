(function (App) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');

  /** 'YYYY-MM-DD' -> Date a mediodía local (evita corrimientos por huso horario) */
  function parseISODate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function addDaysISO(iso, days) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function nightsBetween(inISO, outISO) {
    const a = parseISODate(inISO);
    const b = parseISODate(outISO);
    if (!a || !b) return 0;
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : 0;
  }

  function formatDateLong(iso) {
    if (!iso) return '—';
    const d = parseISODate(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateShort(iso) {
    if (!iso) return '—';
    const d = parseISODate(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function formatDateTime(isoStamp) {
    if (!isoStamp) return '—';
    const d = new Date(isoStamp);
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatCurrency(n) {
    const num = Number(n) || 0;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }

  function overlaps(startA, endA, startB, endB) {
    const aS = parseISODate(startA), aE = parseISODate(endA);
    const bS = parseISODate(startB), bE = parseISODate(endB);
    return aS < bE && bS < aE;
  }

  function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** Escapa texto para insertar de forma segura en innerHTML */
  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function initials(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '—';
  }

  App.Utils = {
    parseISODate, todayISO, addDaysISO, nightsBetween,
    formatDateLong, formatDateShort, formatDateTime, formatCurrency,
    overlaps, debounce, uid, esc, initials, pad,
  };
})(window.App = window.App || {});
