"""
modules.calculadora.view
==========================
Interfaz gráfica moderna de la calculadora construida con
CustomTkinter: pantalla de expresión completa, teclado numérico,
funciones científicas básicas, memoria, historial interactivo
(clic para reutilizar), estadísticas y exportación CSV/Excel/PDF.
"""

from __future__ import annotations

import logging
from pathlib import Path

import customtkinter as ctk

from core.config_manager import config
from core.exporters import ExportError, export_to_csv, export_to_excel, export_to_pdf, timestamped_filename
from core.notifications import notify
from core.theme import PrimaryButton, GhostButton, SectionCard, StatBadge, font, crear_tooltip
from core.validators import ValidationError
from modules.calculadora.engine import CalculadoraEngine

logger = logging.getLogger(__name__)

BOTONES_LAYOUT = [
    ["C", "⌫", "%", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["±", "0", ".", "="],
]

BOTONES_CIENTIFICOS = ["sqrt(", "(", ")", "**2", "MC", "MR", "M+", "M-"]


class CalculadoraFrame(ctk.CTkFrame):
    """Vista completa de la calculadora, lista para insertarse en cualquier ventana."""

    def __init__(self, master, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        self.engine = CalculadoraEngine()
        self._construir_ui()
        self._actualizar_historial()
        self._actualizar_estadisticas()

    # Construcción de la interfaz
    def _construir_ui(self) -> None:
        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(1, weight=2)
        self.grid_rowconfigure(0, weight=1)

        self._construir_panel_calculadora().grid(
            row=0, column=0, sticky="nsew", padx=(0, 10), pady=0
        )
        self._construir_panel_lateral().grid(row=0, column=1, sticky="nsew")

    def _construir_panel_calculadora(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, corner_radius=16)
        panel.grid_rowconfigure(1, weight=1)
        panel.grid_columnconfigure(0, weight=1)

        # Pantalla de expresión / resultado
        pantalla = ctk.CTkFrame(panel, corner_radius=12, fg_color=("#EAF1F8", "#15151F"))
        pantalla.pack(fill="x", padx=16, pady=(16, 10))

        self.entrada_var = ctk.StringVar()
        self.entrada = ctk.CTkEntry(
            pantalla,
            textvariable=self.entrada_var,
            font=font(28, "bold"),
            justify="right",
            border_width=0,
            fg_color="transparent",
            height=64,
        )
        self.entrada.pack(fill="x", padx=14, pady=(10, 0))
        self.entrada.bind("<Return>", lambda _e: self._calcular())
        self.entrada.focus_set()

        self.resultado_label = ctk.CTkLabel(
            pantalla, text="Memoria: 0", font=font(12), anchor="e", text_color=("#5B6B7C", "#8B93A6")
        )
        self.resultado_label.pack(fill="x", padx=14, pady=(0, 10))

        # Botones científicos
        fila_cientifica = ctk.CTkFrame(panel, fg_color="transparent")
        fila_cientifica.pack(fill="x", padx=16, pady=(0, 6))
        for texto in BOTONES_CIENTIFICOS:
            btn = GhostButton(
                fila_cientifica, text=texto, width=60,
                command=lambda t=texto: self._pulsar(t),
            )
            btn.pack(side="left", expand=True, fill="x", padx=3)

        # Teclado principal
        teclado = ctk.CTkFrame(panel, fg_color="transparent")
        teclado.pack(fill="both", expand=True, padx=16, pady=(0, 16))
        for i in range(len(BOTONES_LAYOUT)):
            teclado.grid_rowconfigure(i, weight=1)
        for j in range(4):
            teclado.grid_columnconfigure(j, weight=1)

        for fila_idx, fila in enumerate(BOTONES_LAYOUT):
            for col_idx, texto in enumerate(fila):
                estilo = self._estilo_boton(texto)
                btn = ctk.CTkButton(
                    teclado,
                    text=texto,
                    font=font(18, "bold"),
                    corner_radius=12,
                    command=lambda t=texto: self._pulsar(t),
                    **estilo,
                )
                btn.grid(row=fila_idx, column=col_idx, sticky="nsew", padx=5, pady=5)

        return panel

    @staticmethod
    def _estilo_boton(texto: str) -> dict:
        if texto == "=":
            return {"fg_color": "#1F6AA5", "hover_color": "#144870"}
        if texto in ("C", "⌫"):
            return {"fg_color": "#E5484D", "hover_color": "#B4232B"}
        if texto in ("/", "*", "-", "+", "%", "±"):
            return {"fg_color": ("#D8E3EE", "#2B2B3A"), "text_color": ("#111111", "#F5F5F5")}
        return {"fg_color": ("#F2F6FA", "#232334"), "text_color": ("#111111", "#F5F5F5")}

    def _construir_panel_lateral(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, fg_color="transparent")
        panel.grid_rowconfigure(1, weight=1)
        panel.grid_columnconfigure(0, weight=1)

        # Estadísticas
        stats_card = SectionCard(panel, "Estadísticas", "📊")
        stats_card.pack(fill="x", pady=(0, 10))
        stats_card.contenido.grid_columnconfigure((0, 1), weight=1)
        self.badge_total = StatBadge(stats_card.contenido, "0", "Cálculos realizados")
        self.badge_total.grid(row=0, column=0, sticky="nsew", padx=4)
        self.badge_promedio = StatBadge(stats_card.contenido, "0", "Promedio resultados")
        self.badge_promedio.grid(row=0, column=1, sticky="nsew", padx=4)

        # Historial
        historial_card = SectionCard(panel, "Historial", "🕘")
        historial_card.pack(fill="both", expand=True)

        self.historial_scroll = ctk.CTkScrollableFrame(
            historial_card.contenido, fg_color="transparent"
        )
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

    # Interacción
    def _pulsar(self, tecla: str) -> None:
        acciones_especiales = {
            "C": self._limpiar_pantalla,
            "⌫": self._borrar_ultimo,
            "=": self._calcular,
            "±": self._invertir_signo,
            "MC": lambda: (self.engine.memoria_limpiar(), self._refrescar_memoria()),
            "MR": lambda: self.entrada_var.set(self.entrada_var.get() + str(self.engine.memoria_recuperar())),
            "M+": self._memoria_sumar_actual,
            "M-": self._memoria_restar_actual,
        }
        if tecla in acciones_especiales:
            acciones_especiales[tecla]()
            return

        mapa_simbolos = {"%": "%", "sqrt(": "sqrt("}
        self.entrada_var.set(self.entrada_var.get() + mapa_simbolos.get(tecla, tecla))
        self.entrada.icursor("end")

    def _limpiar_pantalla(self) -> None:
        self.entrada_var.set("")

    def _borrar_ultimo(self) -> None:
        self.entrada_var.set(self.entrada_var.get()[:-1])

    def _invertir_signo(self) -> None:
        texto = self.entrada_var.get()
        if texto.startswith("-"):
            self.entrada_var.set(texto[1:])
        elif texto:
            self.entrada_var.set(f"-({texto})")

    def _memoria_sumar_actual(self) -> None:
        try:
            self.engine.memoria_sumar(self._valor_actual_o_error())
            self._refrescar_memoria()
        except ValidationError:
            pass

    def _memoria_restar_actual(self) -> None:
        try:
            self.engine.memoria_restar(self._valor_actual_o_error())
            self._refrescar_memoria()
        except ValidationError:
            pass

    def _valor_actual_o_error(self) -> float:
        from core.validators import evaluar_expresion_segura
        return float(evaluar_expresion_segura(self.entrada_var.get()))

    def _refrescar_memoria(self) -> None:
        self.resultado_label.configure(text=f"Memoria: {self.engine.memoria:g}")

    def _calcular(self) -> None:
        expresion = self.entrada_var.get()
        try:
            guardar = config.get("calculadora", "guardar_historial", default=True)
            resultado = self.engine.calcular(expresion, guardar_historial=guardar)
            self.entrada_var.set(self._formatear_numero(resultado.resultado))
            self._actualizar_historial()
            self._actualizar_estadisticas()
        except ValidationError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
        except Exception:
            logger.exception("Error inesperado al calcular.")
            notify(self.winfo_toplevel(), "Ocurrió un error inesperado.", "error")

    @staticmethod
    def _formatear_numero(valor: float) -> str:
        decimales = config.get("calculadora", "decimales", default=4)
        if valor == int(valor):
            return str(int(valor))
        return f"{valor:.{decimales}f}".rstrip("0").rstrip(".")

    # Historial / estadísticas / exportación
    def _actualizar_historial(self) -> None:
        for widget in self.historial_scroll.winfo_children():
            widget.destroy()

        historial = self.engine.obtener_historial(limite=50)
        if not historial:
            ctk.CTkLabel(
                self.historial_scroll, text="Sin cálculos todavía.", font=font(12),
                text_color=("#6B7280", "#9CA3AF"),
            ).pack(pady=10)
            return

        for item in historial:
            fila = ctk.CTkFrame(self.historial_scroll, fg_color="transparent")
            fila.pack(fill="x", pady=2)
            texto = f"{item['expresion']} = {item['resultado']}"
            boton = ctk.CTkButton(
                fila, text=texto, anchor="w", fg_color="transparent",
                hover_color=("#E5EEF6", "#26263A"), font=font(12),
                command=lambda e=item["expresion"]: self.entrada_var.set(e),
            )
            boton.pack(fill="x")
            crear_tooltip(boton, "Clic para reutilizar esta expresión")

    def _actualizar_estadisticas(self) -> None:
        stats = self.engine.obtener_estadisticas()
        self.badge_total.actualizar(str(stats["total_calculos"]))
        self.badge_promedio.actualizar(f"{stats['promedio_resultado']:g}")

    def _limpiar_historial(self) -> None:
        self.engine.limpiar_historial()
        self._actualizar_historial()
        self._actualizar_estadisticas()
        notify(self.winfo_toplevel(), "Historial de la calculadora limpiado.", "success")

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
        carpeta = Path(config.get("last_export_dir", default="exports"))
        nombre = timestamped_filename("historial_calculadora", formato)
        destino = carpeta / nombre
        try:
            if formato == "csv":
                export_to_csv(datos, destino)
            elif formato == "xlsx":
                export_to_excel(datos, destino, titulo_hoja="Historial Calculadora")
            elif formato == "pdf":
                export_to_pdf(datos, destino, titulo="Historial de la Calculadora")
            notify(self.winfo_toplevel(), f"Exportado correctamente: {nombre}", "success")
        except ExportError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
        except Exception:
            logger.exception("Error inesperado al exportar historial de calculadora.")
            notify(self.winfo_toplevel(), "Error inesperado al exportar.", "error")
