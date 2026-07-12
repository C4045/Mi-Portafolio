/* =========================================================
   export.js — Exportación a PDF y Excel
   Namespace: App.Export
   ========================================================= */
(function (App) {
  'use strict';

  const U = () => App.Utils;
  const D = () => App.Data;

  function filasReservas(reservas) {
    return reservas.map((r) => ({
      Código: r.codigo,
      Huésped: r.guest.nombre,
      Documento: r.guest.documento,
      Habitación: r.habitacion,
      Tipo: D().getRoom(r.habitacion)?.tipo || '',
      Ingreso: U().formatDateShort(r.fechaIngreso),
      Salida: U().formatDateShort(r.fechaSalida),
      Noches: r.noches,
      Subtotal: r.subtotal,
      Impuesto: r.impuesto,
      Total: r.total,
      Estado: D().ESTADOS[r.estado]?.label || r.estado,
    }));
  }

  function exportarExcel(reservas, nombreArchivo = 'reservas-hotel.xlsx') {
    if (typeof XLSX === 'undefined') {
      App.UI.toast('No se pudo cargar el motor de Excel. Verifica tu conexión.', 'error');
      return;
    }
    const filas = filasReservas(reservas);
    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    ];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reservas');
    XLSX.writeFile(libro, nombreArchivo);
    App.UI.toast('Excel exportado correctamente.', 'success');
  }

  function exportarPDF(reservas, nombreArchivo = 'reservas-hotel.pdf') {
    if (typeof window.jspdf === 'undefined') {
      App.UI.toast('No se pudo cargar el motor de PDF. Verifica tu conexión.', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Reporte de Reservas — Hotel Dashboard', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, 21);

    const filas = filasReservas(reservas);
    const columnas = Object.keys(filas[0] || {
      Código: '', Huésped: '', Documento: '', Habitación: '', Tipo: '', Ingreso: '', Salida: '', Noches: '', Subtotal: '', Impuesto: '', Total: '', Estado: '',
    });

    doc.autoTable({
      startY: 27,
      head: [columnas],
      body: filas.map((f) => columnas.map((c) => f[c])),
      styles: { fontSize: 8, cellPadding: 2.2 },
      headStyles: { fillColor: [24, 32, 43], textColor: 255 },
      alternateRowStyles: { fillColor: [246, 242, 233] },
      margin: { left: 14, right: 14 },
    });

    const stats = D().getStats();
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Ingresos totales: ${U().formatCurrency(stats.ingresos)}   |   Reservas activas: ${stats.reservasActivas}   |   Habitaciones disponibles: ${stats.disponibles}/${stats.totalHabitaciones}`, 14, finalY);

    doc.save(nombreArchivo);
    App.UI.toast('PDF exportado correctamente.', 'success');
  }

  App.Export = { exportarExcel, exportarPDF };
})(window.App = window.App || {});
