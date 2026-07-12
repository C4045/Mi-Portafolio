/* =========================================================
   data.js — Catálogo de habitaciones, estado global y cálculos derivados
   Namespace: App.Data
   ========================================================= */
(function (App) {
  'use strict';

  const ROOM_CATALOG = [
    { numero: 101, tipo: 'Simple', precio: 50, piso: 1, capacidad: 1 },
    { numero: 102, tipo: 'Simple', precio: 50, piso: 1, capacidad: 1 },
    { numero: 201, tipo: 'Doble', precio: 80, piso: 2, capacidad: 2 },
    { numero: 202, tipo: 'Doble', precio: 80, piso: 2, capacidad: 2 },
    { numero: 301, tipo: 'Suite', precio: 120, piso: 3, capacidad: 4 },
  ];

  const ESTADOS = {
    reservada: { label: 'Reservada', color: 'amber', next: 'checkin' },
    checkin: { label: 'Check-In', color: 'slate', next: 'hospedado' },
    hospedado: { label: 'Hospedado', color: 'terracotta', next: 'checkout' },
    checkout: { label: 'Check-Out', color: 'slate', next: 'finalizada' },
    finalizada: { label: 'Finalizada', color: 'teal', next: null },
    cancelada: { label: 'Cancelada', color: 'muted', next: null },
  };

  const IMPUESTO_PORCENTAJE = 10;

  // Estado en memoria (sincronizado con LocalStorage)
  const state = {
    reservas: [],
    filtros: { texto: '', estado: 'todos', tipo: 'todos' },
    vista: 'panel', // panel | reservas | habitaciones | historial
  };

  function init() {
    state.reservas = App.Storage.loadReservas(ROOM_CATALOG);
  }

  function persist() {
    App.Storage.saveReservas(state.reservas);
  }

  function activeStatesExcluding(codes) {
    return state.reservas.filter((r) => !['cancelada'].includes(r.estado) && !codes.includes(r.codigo));
  }

  /** Estado ocupacional actual de una habitación: disponible | reservada | ocupada */
  function getRoomStatus(numero) {
    const relevantes = state.reservas.filter((r) => r.habitacion === numero && r.estado !== 'cancelada' && r.estado !== 'finalizada');
    if (relevantes.some((r) => r.estado === 'checkin' || r.estado === 'hospedado')) return 'ocupada';
    if (relevantes.some((r) => r.estado === 'reservada' || r.estado === 'checkout')) return 'reservada';
    return 'disponible';
  }

  function isRoomAvailable(numero, fechaIngreso, fechaSalida, excludeCodigo) {
    const U = App.Utils;
    const conflictivas = state.reservas.filter((r) =>
      r.habitacion === numero &&
      r.codigo !== excludeCodigo &&
      r.estado !== 'cancelada' && r.estado !== 'finalizada'
    );
    return !conflictivas.some((r) => U.overlaps(fechaIngreso, fechaSalida, r.fechaIngreso, r.fechaSalida));
  }

  function getStats() {
    const disponibles = ROOM_CATALOG.filter((r) => getRoomStatus(r.numero) === 'disponible').length;
    const ocupadas = ROOM_CATALOG.filter((r) => getRoomStatus(r.numero) === 'ocupada').length;
    const reservasActivas = state.reservas.filter((r) => !['cancelada', 'finalizada'].includes(r.estado)).length;
    const ingresos = state.reservas
      .filter((r) => r.estado !== 'cancelada')
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    return { disponibles, ocupadas, reservasActivas, ingresos, totalHabitaciones: ROOM_CATALOG.length };
  }

  function getRoom(numero) {
    return ROOM_CATALOG.find((r) => r.numero === Number(numero));
  }

  function getReservaByCodigo(codigo) {
    return state.reservas.find((r) => r.codigo === codigo);
  }

  App.Data = {
    ROOM_CATALOG, ESTADOS, IMPUESTO_PORCENTAJE, state,
    init, persist, getRoomStatus, isRoomAvailable, getStats, getRoom, getReservaByCodigo,
  };
})(window.App = window.App || {});
