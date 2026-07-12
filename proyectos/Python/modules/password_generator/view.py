"""
modules.password_generator.view
==================================
Interfaz gráfica del generador de contraseñas: opciones configurables,
medidor visual de fortaleza/entropía, copiado al portapapeles con
autolimpieza temporizada, generación en lote, historial (sin exponer
contraseñas reales) y exportación de metadatos a CSV/Excel/PDF.
"""

from __future__ import annotations

import logging
from pathlib import Path

import customtkinter as ctk

from core.config_manager import config
from core.exporters import ExportError, export_to_csv, export_to_excel, export_to_pdf, timestamped_filename
from core.notifications import notify
from core.theme import PrimaryButton, GhostButton, SectionCard, StatBadge, font
from core.validators import ValidationError
from modules.password_generator.engine import OpcionesGeneracion, PasswordGeneratorEngine

logger = logging.getLogger(__name__)

COLORES_FORTALEZA = {
    "Muy débil": "#E5484D",
    "Débil": "#F5A623",
    "Aceptable": "#EAC54F",
    "Fuerte": "#2FA84F",
    "Muy fuerte": "#1F9D55",
}


class PasswordGeneratorFrame(ctk.CTkFrame):
    def __init__(self, master, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        self.engine = PasswordGeneratorEngine()
        self._timer_limpieza_id: str | None = None
        self._construir_ui()
        self._actualizar_historial()
        self._actualizar_estadisticas()

    # ------------------------------------------------------------------ #
    # UI
    # ------------------------------------------------------------------ #
    def _construir_ui(self) -> None:
        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(1, weight=2)
        self.grid_rowconfigure(0, weight=1)

        self._panel_generador().grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self._panel_lateral().grid(row=0, column=1, sticky="nsew")

    def _panel_generador(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, corner_radius=16)

        ctk.CTkLabel(panel, text="🔐 Generador de Contraseñas", font=font(20, "bold")).pack(
            anchor="w", padx=20, pady=(20, 4)
        )
        ctk.CTkLabel(
            panel, text="Contraseñas criptográficamente seguras (módulo secrets)",
            font=font(12), text_color=("#5B6B7C", "#9CA3AF"),
        ).pack(anchor="w", padx=20, pady=(0, 16))

        # Campo resultado
        resultado_frame = ctk.CTkFrame(panel, corner_radius=12, fg_color=("#EAF1F8", "#15151F"))
        resultado_frame.pack(fill="x", padx=20, pady=(0, 10))

        self.password_var = ctk.StringVar(value="")
        self.password_entry = ctk.CTkEntry(
            resultado_frame, textvariable=self.password_var, font=("Consolas", 20, "bold"),
            justify="center", border_width=0, fg_color="transparent", height=56, state="readonly",
        )
        self.password_entry.pack(fill="x", padx=14, pady=(14, 4))

        self.fortaleza_barra = ctk.CTkProgressBar(resultado_frame, height=10, corner_radius=5)
        self.fortaleza_barra.set(0)
        self.fortaleza_barra.pack(fill="x", padx=14, pady=(4, 4))

        self.fortaleza_label = ctk.CTkLabel(resultado_frame, text="Fortaleza: —", font=font(12, "bold"))
        self.fortaleza_label.pack(anchor="w", padx=14, pady=(0, 12))

        acciones_rapidas = ctk.CTkFrame(panel, fg_color="transparent")
        acciones_rapidas.pack(fill="x", padx=20, pady=(0, 12))
        GhostButton(acciones_rapidas, text="📋 Copiar", command=self._copiar).pack(
            side="left", expand=True, fill="x", padx=(0, 4)
        )
        GhostButton(acciones_rapidas, text="🔤 Pronunciable", command=self._generar_pronunciable).pack(
            side="left", expand=True, fill="x", padx=4
        )
        PrimaryButton(acciones_rapidas, text="🎲 Generar", command=self._generar).pack(
            side="left", expand=True, fill="x", padx=(4, 0)
        )

        # Opciones
        opciones_card = ctk.CTkFrame(panel, fg_color="transparent")
        opciones_card.pack(fill="both", expand=True, padx=20, pady=(4, 20))

        fila_longitud = ctk.CTkFrame(opciones_card, fg_color="transparent")
        fila_longitud.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(fila_longitud, text="Longitud:", font=font(13, "bold")).pack(side="left")
        self.longitud_var = ctk.IntVar(
            value=config.get("password_generator", "longitud_default", default=16)
        )
        self.longitud_label = ctk.CTkLabel(fila_longitud, text=str(self.longitud_var.get()), font=font(13))
        self.longitud_label.pack(side="right")
        self.longitud_slider = ctk.CTkSlider(
            fila_longitud, from_=4, to=64, number_of_steps=60,
            command=self._on_slider_longitud,
        )
        self.longitud_slider.set(self.longitud_var.get())
        self.longitud_slider.pack(side="left", fill="x", expand=True, padx=10)

        self.chk_mayus = ctk.CTkCheckBox(opciones_card, text="Mayúsculas (A-Z)")
        self.chk_mayus.select()
        self.chk_mayus.pack(anchor="w", pady=3)
        self.chk_minus = ctk.CTkCheckBox(opciones_card, text="Minúsculas (a-z)")
        self.chk_minus.select()
        self.chk_minus.pack(anchor="w", pady=3)
        self.chk_numeros = ctk.CTkCheckBox(opciones_card, text="Números (0-9)")
        self.chk_numeros.select()
        self.chk_numeros.pack(anchor="w", pady=3)
        self.chk_simbolos = ctk.CTkCheckBox(opciones_card, text="Símbolos (!@#$...)")
        self.chk_simbolos.select()
        self.chk_simbolos.pack(anchor="w", pady=3)
        self.chk_ambiguos = ctk.CTkCheckBox(opciones_card, text="Excluir caracteres ambiguos (I, l, 1, O, 0)")
        self.chk_ambiguos.pack(anchor="w", pady=3)

        fila_lote = ctk.CTkFrame(opciones_card, fg_color="transparent")
        fila_lote.pack(fill="x", pady=(12, 0))
        ctk.CTkLabel(fila_lote, text="Generar en lote:", font=font(13, "bold")).pack(side="left")
        self.cantidad_lote_entry = ctk.CTkEntry(fila_lote, width=60, placeholder_text="5")
        self.cantidad_lote_entry.pack(side="left", padx=8)
        GhostButton(fila_lote, text="Generar lote", command=self._generar_lote).pack(side="left", padx=4)

        return panel

    def _panel_lateral(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, fg_color="transparent")
        panel.grid_rowconfigure(1, weight=1)
        panel.grid_columnconfigure(0, weight=1)

        stats_card = SectionCard(panel, "Estadísticas", "📊")
        stats_card.pack(fill="x", pady=(0, 10))
        stats_card.contenido.grid_columnconfigure((0, 1), weight=1)
        self.badge_total = StatBadge(stats_card.contenido, "0", "Generadas")
        self.badge_total.grid(row=0, column=0, sticky="nsew", padx=4)
        self.badge_entropia = StatBadge(stats_card.contenido, "0", "Entropía media (bits)")
        self.badge_entropia.grid(row=0, column=1, sticky="nsew", padx=4)

        historial_card = SectionCard(panel, "Historial (metadatos)", "🕘")
        historial_card.pack(fill="both", expand=True)
        ctk.CTkLabel(
            historial_card.contenido,
            text="Por seguridad no se guarda la contraseña real, solo su huella.",
            font=font(10), text_color=("#6B7280", "#9CA3AF"), wraplength=260, justify="left",
        ).pack(anchor="w", pady=(0, 6))

        self.historial_scroll = ctk.CTkScrollableFrame(historial_card.contenido, fg_color="transparent")
        self.historial_scroll.pack(fill="both", expand=True)

        acciones = ctk.CTkFrame(historial_card.contenido, fg_color="transparent")
        acciones.pack(fill="x", pady=(10, 0))
        GhostButton(acciones, text="🗑️ Limpiar", command=self._limpiar_historial).pack(
            side="left", expand=True, fill="x", padx=(0, 4)
        )
        PrimaryButton(acciones, text="⬇️ Exportar", command=self._mostrar_menu_exportar).pack(
            side="left", expand=True, fill="x", padx=(4, 0)
        )
        return panel

    # ------------------------------------------------------------------ #
    # Eventos
    # ------------------------------------------------------------------ #
    def _on_slider_longitud(self, valor: float) -> None:
        self.longitud_var.set(int(valor))
        self.longitud_label.configure(text=str(int(valor)))

    def _leer_opciones(self) -> OpcionesGeneracion:
        return OpcionesGeneracion(
            longitud=self.longitud_var.get(),
            incluir_mayus=bool(self.chk_mayus.get()),
            incluir_minus=bool(self.chk_minus.get()),
            incluir_numeros=bool(self.chk_numeros.get()),
            incluir_simbolos=bool(self.chk_simbolos.get()),
            excluir_ambiguos=bool(self.chk_ambiguos.get()),
        )

    def _generar(self) -> None:
        try:
            resultado = self.engine.generar(self._leer_opciones())
            self._mostrar_resultado(resultado.password, resultado.entropia_bits, resultado.fortaleza)
            self._actualizar_historial()
            self._actualizar_estadisticas()
        except ValidationError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
        except Exception:
            logger.exception("Error al generar contraseña.")
            notify(self.winfo_toplevel(), "Error inesperado al generar la contraseña.", "error")

    def _generar_pronunciable(self) -> None:
        try:
            resultado = self.engine.generar_pronunciable(max(self.longitud_var.get(), 8))
            self._mostrar_resultado(resultado.password, resultado.entropia_bits, resultado.fortaleza)
            self._actualizar_historial()
            self._actualizar_estadisticas()
        except ValidationError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")

    def _generar_lote(self) -> None:
        texto_cantidad = self.cantidad_lote_entry.get().strip() or "5"
        try:
            cantidad = int(texto_cantidad)
            resultados = self.engine.generar_lote(self._leer_opciones(), cantidad)
            self._actualizar_historial()
            self._actualizar_estadisticas()
            notify(self.winfo_toplevel(), f"Se generaron {len(resultados)} contraseñas.", "success")
        except (ValueError, ValidationError) as exc:
            notify(self.winfo_toplevel(), str(exc) if isinstance(exc, ValidationError) else "Cantidad inválida.", "error")

    def _mostrar_resultado(self, password: str, entropia: float, fortaleza: str) -> None:
        self.password_entry.configure(state="normal")
        self.password_var.set(password)
        self.password_entry.configure(state="readonly")

        progreso = min(entropia / 100, 1.0)
        self.fortaleza_barra.set(progreso)
        color = COLORES_FORTALEZA.get(fortaleza, "#3B82F6")
        self.fortaleza_barra.configure(progress_color=color)
        self.fortaleza_label.configure(
            text=f"Fortaleza: {fortaleza}  ·  {entropia:g} bits de entropía", text_color=color
        )

    def _copiar(self) -> None:
        password = self.password_var.get()
        if not password:
            notify(self.winfo_toplevel(), "Genera una contraseña primero.", "warning")
            return
        self.clipboard_clear()
        self.clipboard_append(password)
        notify(self.winfo_toplevel(), "Contraseña copiada al portapapeles.", "success")

        segundos = config.get("password_generator", "auto_limpiar_portapapeles_seg", default=30)
        if self._timer_limpieza_id is not None:
            self.after_cancel(self._timer_limpieza_id)
        if segundos:
            self._timer_limpieza_id = self.after(int(segundos) * 1000, self._limpiar_portapapeles)

    def _limpiar_portapapeles(self) -> None:
        try:
            if self.clipboard_get() == self.password_var.get():
                self.clipboard_clear()
        except Exception:
            pass

    # ------------------------------------------------------------------ #
    # Historial / estadísticas / exportación
    # ------------------------------------------------------------------ #
    def _actualizar_historial(self) -> None:
        for widget in self.historial_scroll.winfo_children():
            widget.destroy()

        historial = self.engine.obtener_historial(limite=50)
        if not historial:
            ctk.CTkLabel(
                self.historial_scroll, text="Sin contraseñas generadas todavía.", font=font(12),
                text_color=("#6B7280", "#9CA3AF"),
            ).pack(pady=10)
            return

        for item in historial:
            color = COLORES_FORTALEZA.get(item["fortaleza"], "#3B82F6")
            fila = ctk.CTkFrame(self.historial_scroll, fg_color="transparent")
            fila.pack(fill="x", pady=2)
            ctk.CTkLabel(
                fila,
                text=f"● {item['longitud']} car. · {item['fortaleza']} · {item['fecha'][:16]}",
                font=font(11), text_color=color, anchor="w",
            ).pack(fill="x")

    def _actualizar_estadisticas(self) -> None:
        stats = self.engine.obtener_estadisticas()
        self.badge_total.actualizar(str(stats["total_generadas"]))
        self.badge_entropia.actualizar(f"{stats['entropia_promedio']:g}")

    def _limpiar_historial(self) -> None:
        self.engine.limpiar_historial()
        self._actualizar_historial()
        self._actualizar_estadisticas()
        notify(self.winfo_toplevel(), "Historial de contraseñas limpiado.", "success")

    def _mostrar_menu_exportar(self) -> None:
        historial = self.engine.obtener_historial(limite=1000)
        if not historial:
            notify(self.winfo_toplevel(), "No hay datos para exportar.", "warning")
            return

        menu = ctk.CTkToplevel(self)
        menu.title("Exportar historial")
        menu.geometry("300x180")
        menu.resizable(False, False)
        menu.grab_set()

        ctk.CTkLabel(menu, text="Elige un formato de exportación", font=font(14, "bold")).pack(pady=(16, 8))
        for etiqueta, formato in (("📄 CSV", "csv"), ("📊 Excel", "xlsx"), ("🧾 PDF", "pdf")):
            PrimaryButton(
                menu, text=etiqueta, command=lambda f=formato: self._exportar(historial, f, menu)
            ).pack(fill="x", padx=24, pady=6)

    def _exportar(self, datos: list[dict], formato: str, ventana: ctk.CTkToplevel) -> None:
        ventana.destroy()
        # Se excluye el hash crudo del reporte visible por prolijidad, se mantiene el resto de metadatos
        datos_exportables = [
            {k: v for k, v in fila.items() if k != "password_hash"} for fila in datos
        ]
        carpeta = Path(config.get("last_export_dir", default="exports"))
        nombre = timestamped_filename("historial_passwords", formato)
        destino = carpeta / nombre
        try:
            if formato == "csv":
                export_to_csv(datos_exportables, destino)
            elif formato == "xlsx":
                export_to_excel(datos_exportables, destino, titulo_hoja="Historial Passwords")
            elif formato == "pdf":
                export_to_pdf(datos_exportables, destino, titulo="Historial del Generador de Contraseñas")
            notify(self.winfo_toplevel(), f"Exportado correctamente: {nombre}", "success")
        except ExportError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
        except Exception:
            logger.exception("Error inesperado al exportar historial de contraseñas.")
            notify(self.winfo_toplevel(), "Error inesperado al exportar.", "error")
