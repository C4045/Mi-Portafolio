/**
 * utils.js
 * Funciones puras y utilidades reutilizadas por el resto de módulos.
 */
const Utils = (function () {
  function uid() {
    return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function debounce(fn, wait = 200) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /** Devuelve la fecha de hoy en formato YYYY-MM-DD (zona horaria local). */
  function todayISO() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function parseISODate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /**
   * Convierte una fecha ISO (YYYY-MM-DD) en una etiqueta corta y humana,
   * junto con metadatos sobre si está vencida / es hoy / es mañana.
   */
  function formatDueDate(iso, isCompleted) {
    if (!iso) return null;

    const target = parseISODate(iso);
    const today = parseISODate(todayISO());
    const diffDays = Math.round((target - today) / 86400000);

    let label;
    if (diffDays === 0) label = 'Hoy';
    else if (diffDays === 1) label = 'Mañana';
    else if (diffDays === -1) label = 'Ayer';
    else if (diffDays > 1 && diffDays <= 6) label = DIAS_SEMANA[target.getDay()];
    else label = `${target.getDate()} ${MESES[target.getMonth()]}`;

    const isOverdue = !isCompleted && diffDays < 0;
    if (isOverdue) {
      label = diffDays === -1 ? 'Venció ayer' : `Venció · ${label}`;
    }

    return { label, isOverdue, diffDays };
  }

  const PRIORITY_WEIGHT = { alta: 0, media: 1, baja: 2 };
  const PRIORITY_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };

  const CHIP_COUNT = 8;
  function categoryChipIndex(category) {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    }
    return hash % CHIP_COUNT;
  }

  return {
    uid,
    escapeHtml,
    debounce,
    todayISO,
    parseISODate,
    formatDueDate,
    PRIORITY_WEIGHT,
    PRIORITY_LABEL,
    categoryChipIndex,
  };
})();
