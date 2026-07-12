/* =========================================================
   storage.js — Persistencia en LocalStorage + migración
   Namespace: App.Storage
   ========================================================= */
(function (App) {
  'use strict';

  const KEYS = {
    reservas: 'hotel_v2_reservas',
    theme: 'hotel_v2_theme',
    counter: 'hotel_v2_counter',
    legacy: 'hotel_reservas', // formato de la versión anterior
  };

  function safeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('No se pudo leer', key, e);
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar', key, e);
      return false;
    }
  }

  function getTheme() {
    try { return localStorage.getItem(KEYS.theme); } catch (e) { return null; }
  }

  function setTheme(theme) {
    try { localStorage.setItem(KEYS.theme, theme); } catch (e) { /* noop */ }
  }

  function nextCounter() {
    const current = Number(safeGet(KEYS.counter)) || 0;
    const next = current + 1;
    safeSet(KEYS.counter, next);
    return next;
  }

  /**
   * Convierte reservas del formato antiguo (nombre, habitacion, fechaIngreso, noches, total)
   * al nuevo modelo enriquecido, para no perder datos existentes del usuario.
   */
  function migrateLegacy(roomCatalog) {
    const legacy = safeGet(KEYS.legacy);
    if (!Array.isArray(legacy) || legacy.length === 0) return [];
    const U = App.Utils;
    return legacy.map((old) => {
      const room = roomCatalog.find((r) => r.numero === Number(old.habitacion));
      const precio = room ? room.precio : 0;
      const noches = Number(old.noches) || 1;
      const fechaIngreso = old.fechaIngreso || U.todayISO();
      const fechaSalida = U.addDaysISO(fechaIngreso, noches);
      const subtotal = Number(old.total) || precio * noches;
      const impuesto = +(subtotal * 0.10).toFixed(2);
      return {
        codigo: `HTL-M${String(nextCounter()).padStart(4, '0')}`,
        guest: {
          nombre: old.nombre || 'Huésped',
          documento: '', telefono: '', email: '', huespedes: 1, notas: 'Importado del sistema anterior',
        },
        habitacion: Number(old.habitacion),
        fechaIngreso,
        fechaSalida,
        noches,
        precioNoche: precio,
        subtotal,
        impuestoPorcentaje: 10,
        impuesto,
        total: +(subtotal + impuesto).toFixed(2),
        estado: 'hospedado',
        historial: [{ estado: 'reservada', fecha: new Date().toISOString() }, { estado: 'hospedado', fecha: new Date().toISOString() }],
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      };
    });
  }

  function loadReservas(roomCatalog) {
    const existing = safeGet(KEYS.reservas);
    if (Array.isArray(existing)) return existing;
    // Primera carga: intentar migrar datos de la versión anterior
    const migrated = migrateLegacy(roomCatalog);
    if (migrated.length) saveReservas(migrated);
    return migrated;
  }

  function saveReservas(reservas) {
    return safeSet(KEYS.reservas, reservas);
  }

  App.Storage = {
    KEYS, getTheme, setTheme, nextCounter, loadReservas, saveReservas,
  };
})(window.App = window.App || {});
