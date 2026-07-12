/* =========================================================
   reservations.js — Lógica de negocio de reservas
   Namespace: App.Reservations
   ========================================================= */
(function (App) {
  'use strict';

  const D = () => App.Data;
  const U = () => App.Utils;

  function generarCodigo() {
    const n = App.Storage.nextCounter();
    const year = new Date().getFullYear().toString().slice(-2);
    return `HTL-${year}${String(n).padStart(4, '0')}`;
  }

  function calcularTotales(precioNoche, noches) {
    const subtotal = +(precioNoche * noches).toFixed(2);
    const impuesto = +(subtotal * (D().IMPUESTO_PORCENTAJE / 100)).toFixed(2);
    const total = +(subtotal + impuesto).toFixed(2);
    return { subtotal, impuesto, total };
  }

  /**
   * Valida los datos de una reserva nueva o editada.
   * @returns {string[]} lista de errores (vacía si es válida)
   */
  function validar({ nombre, documento, habitacion, fechaIngreso, fechaSalida, huespedes }, excludeCodigo) {
    const errores = [];
    if (!nombre || nombre.trim().length < 2) errores.push('El nombre del huésped es obligatorio (mínimo 2 caracteres).');
    if (!documento || documento.trim().length < 3) errores.push('El documento de identidad es obligatorio.');
    if (!habitacion) errores.push('Debes seleccionar una habitación.');
    if (!fechaIngreso) errores.push('La fecha de ingreso es obligatoria.');
    if (!fechaSalida) errores.push('La fecha de salida es obligatoria.');

    if (fechaIngreso && fechaSalida) {
      const noches = U().nightsBetween(fechaIngreso, fechaSalida);
      if (noches < 1) errores.push('La fecha de salida debe ser posterior a la fecha de ingreso.');
    }

    const room = D().getRoom(habitacion);
    if (room && huespedes && Number(huespedes) > room.capacidad) {
      errores.push(`La habitación ${room.numero} admite hasta ${room.capacidad} huésped(es).`);
    }

    if (habitacion && fechaIngreso && fechaSalida && errores.length === 0) {
      const disponible = D().isRoomAvailable(Number(habitacion), fechaIngreso, fechaSalida, excludeCodigo);
      if (!disponible) errores.push('La habitación ya está ocupada en ese rango de fechas. Elige otras fechas u otra habitación.');
    }
    return errores;
  }

  function crear(payload) {
    const errores = validar(payload);
    if (errores.length) return { ok: false, errores };

    const room = D().getRoom(payload.habitacion);
    const noches = U().nightsBetween(payload.fechaIngreso, payload.fechaSalida);
    const { subtotal, impuesto, total } = calcularTotales(room.precio, noches);
    const now = new Date().toISOString();

    const reserva = {
      codigo: generarCodigo(),
      guest: {
        nombre: payload.nombre.trim(),
        documento: payload.documento.trim(),
        telefono: (payload.telefono || '').trim(),
        email: (payload.email || '').trim(),
        huespedes: Number(payload.huespedes) || 1,
        notas: (payload.notas || '').trim(),
      },
      habitacion: Number(payload.habitacion),
      fechaIngreso: payload.fechaIngreso,
      fechaSalida: payload.fechaSalida,
      noches,
      precioNoche: room.precio,
      subtotal, impuesto, total,
      impuestoPorcentaje: D().IMPUESTO_PORCENTAJE,
      estado: 'reservada',
      historial: [{ estado: 'reservada', fecha: now }],
      creadoEn: now,
      actualizadoEn: now,
    };

    D().state.reservas.unshift(reserva);
    D().persist();
    return { ok: true, reserva };
  }

  function editar(codigo, payload) {
    const reserva = D().getReservaByCodigo(codigo);
    if (!reserva) return { ok: false, errores: ['No se encontró la reserva.'] };

    const errores = validar(payload, codigo);
    if (errores.length) return { ok: false, errores };

    const room = D().getRoom(payload.habitacion);
    const noches = U().nightsBetween(payload.fechaIngreso, payload.fechaSalida);
    const { subtotal, impuesto, total } = calcularTotales(room.precio, noches);

    Object.assign(reserva, {
      guest: {
        nombre: payload.nombre.trim(),
        documento: payload.documento.trim(),
        telefono: (payload.telefono || '').trim(),
        email: (payload.email || '').trim(),
        huespedes: Number(payload.huespedes) || 1,
        notas: (payload.notas || '').trim(),
      },
      habitacion: Number(payload.habitacion),
      fechaIngreso: payload.fechaIngreso,
      fechaSalida: payload.fechaSalida,
      noches,
      precioNoche: room.precio,
      subtotal, impuesto, total,
      actualizadoEn: new Date().toISOString(),
    });

    D().persist();
    return { ok: true, reserva };
  }

  function cambiarEstado(codigo, nuevoEstado) {
    const reserva = D().getReservaByCodigo(codigo);
    if (!reserva) return { ok: false, errores: ['No se encontró la reserva.'] };
    reserva.estado = nuevoEstado;
    reserva.actualizadoEn = new Date().toISOString();
    reserva.historial.push({ estado: nuevoEstado, fecha: reserva.actualizadoEn });
    D().persist();
    return { ok: true, reserva };
  }

  function cancelar(codigo) {
    return cambiarEstado(codigo, 'cancelada');
  }

  function avanzarEstado(codigo) {
    const reserva = D().getReservaByCodigo(codigo);
    if (!reserva) return { ok: false, errores: ['No se encontró la reserva.'] };
    const meta = D().ESTADOS[reserva.estado];
    if (!meta || !meta.next) return { ok: false, errores: ['Esta reserva ya llegó a su estado final.'] };
    return cambiarEstado(codigo, meta.next);
  }

  function eliminar(codigo) {
    const idx = D().state.reservas.findIndex((r) => r.codigo === codigo);
    if (idx === -1) return { ok: false };
    D().state.reservas.splice(idx, 1);
    D().persist();
    return { ok: true };
  }

  App.Reservations = { generarCodigo, calcularTotales, validar, crear, editar, cambiarEstado, cancelar, avanzarEstado, eliminar };
})(window.App = window.App || {});
