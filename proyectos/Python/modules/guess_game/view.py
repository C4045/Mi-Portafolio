"""
modules.guess_game.view
=========================
Interfaz gráfica del juego de adivinanza: selector de dificultad,
medidor de temperatura (frío/tibio/caliente) con animación sutil de
color, barra de intentos restantes, tabla de mejores puntajes,
historial y exportación de resultados.
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
from modules.guess_game.engine import CONFIG_DIFICULTAD, Dificultad, GuessGameEngine

logger = logging.getLogger(__name__)

COLORES_TEMPERATURA = {
    "helado": "#3B82F6",
    "frío": "#5FA8E0",
    "tibio": "#F5A623",
    "caliente": "#F2711C",
    "quemando": "#2FA84F",
}

ETIQUETAS_DIFICULTAD = {
    Dificultad.FACIL: "🟢 Fácil (1-50)",
    Dificultad.NORMAL: "🟡 Normal (1-100)",
    Dificultad.DIFICIL: "🟠 Difícil (1-500)",
    Dificultad.EXPERTO: "🔴 Experto (1-1000)",
}


class GuessGameFrame(ctk.CTkFrame):
    def __init__(self, master, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        self.engine = GuessGameEngine()
        self._construir_ui()
        self._actualizar_estadisticas()
        self._actualizar_ranking()
        self._nueva_partida()

    # ------------------------------------------------------------------ #
    # UI
    # ------------------------------------------------------------------ #
    def _construir_ui(self) -> None:
        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(1, weight=2)
        self.grid_rowconfigure(0, weight=1)

        self._panel_juego().grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self._panel_lateral().grid(row=0, column=1, sticky="nsew")

    def _panel_juego(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, corner_radius=16)

        ctk.CTkLabel(panel, text="🎲 Adivina el Número", font=font(20, "bold")).pack(
            anchor="w", padx=20, pady=(20, 4)
        )

        fila_dificultad = ctk.CTkFrame(panel, fg_color="transparent")
        fila_dificultad.pack(fill="x", padx=20, pady=(0, 16))
        ctk.CTkLabel(fila_dificultad, text="Dificultad:", font=font(13, "bold")).pack(side="left")
        self.dificultad_menu = ctk.CTkOptionMenu(
            fila_dificultad, values=list(ETIQUETAS_DIFICULTAD.values()),
            command=self._on_cambiar_dificultad,
        )
        default_dif = config.get("guess_game", "dificultad_default", default="normal")
        self.dificultad_actual = Dificultad(default_dif)
        self.dificultad_menu.set(ETIQUETAS_DIFICULTAD[self.dificultad_actual])
        self.dificultad_menu.pack(side="left", padx=10)
        GhostButton(fila_dificultad, text="🔄 Nueva partida", command=self._nueva_partida).pack(
            side="right"
        )

        # Panel de estado (temperatura)
        self.temperatura_frame = ctk.CTkFrame(panel, corner_radius=12, height=90)
        self.temperatura_frame.pack(fill="x", padx=20, pady=(0, 16))
        self.temperatura_label = ctk.CTkLabel(
            self.temperatura_frame, text="🎯 ¡Adivina un número!", font=font(20, "bold")
        )
        self.temperatura_label.pack(expand=True, pady=24)

        # Barra de intentos
        fila_intentos = ctk.CTkFrame(panel, fg_color="transparent")
        fila_intentos.pack(fill="x", padx=20, pady=(0, 6))
        self.intentos_label = ctk.CTkLabel(fila_intentos, text="Intentos: 0 / 0", font=font(12))
        self.intentos_label.pack(anchor="w")
        self.intentos_barra = ctk.CTkProgressBar(panel, height=10, corner_radius=5)
        self.intentos_barra.set(0)
        self.intentos_barra.pack(fill="x", padx=20, pady=(0, 16))

        # Entrada
        fila_entrada = ctk.CTkFrame(panel, fg_color="transparent")
        fila_entrada.pack(fill="x", padx=20, pady=(0, 20))
        self.guess_entry = ctk.CTkEntry(
            fila_entrada, placeholder_text="Escribe tu número...", font=font(16), height=44
        )
        self.guess_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.guess_entry.bind("<Return>", lambda _e: self._intentar())
        PrimaryButton(fila_entrada, text="Adivinar", command=self._intentar, width=120).pack(side="left")

        GhostButton(panel, text="🏳️ Rendirse", command=self._rendirse).pack(
            anchor="w", padx=20, pady=(0, 20)
        )

        return panel

    def _panel_lateral(self) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(self, fg_color="transparent")
        panel.grid_rowconfigure(2, weight=1)
        panel.grid_columnconfigure(0, weight=1)

        stats_card = SectionCard(panel, "Estadísticas", "📊")
        stats_card.pack(fill="x", pady=(0, 10))
        stats_card.contenido.grid_columnconfigure((0, 1), weight=1)
        self.badge_partidas = StatBadge(stats_card.contenido, "0", "Partidas jugadas")
        self.badge_partidas.grid(row=0, column=0, sticky="nsew", padx=4, pady=(0, 6))
        self.badge_victorias = StatBadge(stats_card.contenido, "0%", "Tasa de victoria")
        self.badge_victorias.grid(row=0, column=1, sticky="nsew", padx=4, pady=(0, 6))
        self.badge_promedio = StatBadge(stats_card.contenido, "0", "Promedio intentos")
        self.badge_promedio.grid(row=1, column=0, sticky="nsew", padx=4)
        self.badge_mejor = StatBadge(stats_card.contenido, "0", "Mejor puntaje")
        self.badge_mejor.grid(row=1, column=1, sticky="nsew", padx=4)

        ranking_card = SectionCard(panel, "Mejores puntajes", "🏆")
        ranking_card.pack(fill="both", expand=True, pady=(0, 10))
        self.ranking_scroll = ctk.CTkScrollableFrame(ranking_card.contenido, fg_color="transparent")
        self.ranking_scroll.pack(fill="both", expand=True)

        acciones = ctk.CTkFrame(panel, fg_color="transparent")
        acciones.pack(fill="x")
        GhostButton(acciones, text="🗑️ Limpiar historial", command=self._limpiar_historial).pack(
            side="left", expand=True, fill="x", padx=(0, 4)
        )
        PrimaryButton(acciones, text="⬇️ Exportar", command=self._mostrar_menu_exportar).pack(
            side="left", expand=True, fill="x", padx=(4, 0)
        )
        return panel

    # ------------------------------------------------------------------ #
    # Lógica del juego
    # ------------------------------------------------------------------ #
    def _on_cambiar_dificultad(self, etiqueta_seleccionada: str) -> None:
        for dificultad, etiqueta in ETIQUETAS_DIFICULTAD.items():
            if etiqueta == etiqueta_seleccionada:
                self.dificultad_actual = dificultad
                config.set("guess_game", "dificultad_default", dificultad.value)
                break
        self._nueva_partida()

    def _nueva_partida(self) -> None:
        partida = self.engine.iniciar_partida(self.dificultad_actual)
        self.guess_entry.delete(0, "end")
        self.guess_entry.configure(
            placeholder_text=f"Número entre {partida.rango_min} y {partida.rango_max}"
        )
        self.temperatura_label.configure(text="🎯 ¡Adivina un número!", text_color=("#111111", "#F5F5F5"))
        self.temperatura_frame.configure(fg_color=("#F2F6FA", "#232334"))
        self.intentos_label.configure(text=f"Intentos: 0 / {partida.intentos_max}")
        self.intentos_barra.set(0)
        self.intentos_barra.configure(progress_color="#1F6AA5")
        self.guess_entry.focus_set()

    def _intentar(self) -> None:
        try:
            resultado = self.engine.intentar(self.guess_entry.get())
        except ValidationError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
            return

        self.guess_entry.delete(0, "end")
        partida = self.engine.partida
        color = COLORES_TEMPERATURA.get(resultado.temperatura, "#3B82F6")

        if resultado.gano:
            self.temperatura_label.configure(
                text=f"🎉 ¡Correcto! Puntaje: {resultado.puntaje}", text_color="white"
            )
            self.temperatura_frame.configure(fg_color="#2FA84F")
            notify(self.winfo_toplevel(), f"¡Ganaste con {partida.intentos_usados} intentos!", "success")
            self._actualizar_estadisticas()
            self._actualizar_ranking()
        elif resultado.juego_terminado:
            self.temperatura_label.configure(
                text=f"💀 Sin intentos. Era {partida.numero_secreto}", text_color="white"
            )
            self.temperatura_frame.configure(fg_color="#E5484D")
            notify(self.winfo_toplevel(), "Se acabaron los intentos.", "error")
            self._actualizar_estadisticas()
        else:
            direccion = "📈 Muy bajo" if resultado.pista == "muy_bajo" else "📉 Muy alto"
            self.temperatura_label.configure(
                text=f"{direccion} · {resultado.temperatura.capitalize()}", text_color="white"
            )
            self.temperatura_frame.configure(fg_color=color)

        self.intentos_label.configure(text=f"Intentos: {partida.intentos_usados} / {partida.intentos_max}")
        self.intentos_barra.set(partida.intentos_usados / partida.intentos_max)
        self.intentos_barra.configure(
            progress_color="#E5484D" if partida.intentos_usados / partida.intentos_max > 0.7 else "#1F6AA5"
        )

    def _rendirse(self) -> None:
        numero = self.engine.rendirse()
        if numero is not None:
            self.temperatura_label.configure(text=f"🏳️ El número era {numero}", text_color="white")
            self.temperatura_frame.configure(fg_color="#6B7280")
            self._actualizar_estadisticas()
            notify(self.winfo_toplevel(), "Partida abandonada.", "info")

    # ------------------------------------------------------------------ #
    # Estadísticas / ranking / exportación
    # ------------------------------------------------------------------ #
    def _actualizar_estadisticas(self) -> None:
        stats = self.engine.obtener_estadisticas()
        self.badge_partidas.actualizar(str(stats["total_partidas"]))
        self.badge_victorias.actualizar(f"{stats['tasa_victoria']:g}%")
        self.badge_promedio.actualizar(f"{stats['promedio_intentos']:g}")
        self.badge_mejor.actualizar(str(stats["mejor_puntaje"]))

    def _actualizar_ranking(self) -> None:
        for widget in self.ranking_scroll.winfo_children():
            widget.destroy()

        ranking = self.engine.obtener_mejores_puntajes(limite=10)
        if not ranking:
            ctk.CTkLabel(
                self.ranking_scroll, text="Aún no hay puntajes registrados.", font=font(12),
                text_color=("#6B7280", "#9CA3AF"),
            ).pack(pady=10)
            return

        medallas = ["🥇", "🥈", "🥉"]
        for idx, item in enumerate(ranking):
            medalla = medallas[idx] if idx < 3 else f"{idx + 1}."
            ctk.CTkLabel(
                self.ranking_scroll,
                text=f"{medalla}  {item['puntaje']} pts · {item['dificultad']} · {item['intentos']} intentos",
                font=font(12), anchor="w",
            ).pack(fill="x", pady=2)

    def _limpiar_historial(self) -> None:
        self.engine.limpiar_historial()
        self._actualizar_estadisticas()
        self._actualizar_ranking()
        notify(self.winfo_toplevel(), "Historial del juego limpiado.", "success")

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
        nombre = timestamped_filename("historial_juego", formato)
        destino = carpeta / nombre
        try:
            if formato == "csv":
                export_to_csv(datos, destino)
            elif formato == "xlsx":
                export_to_excel(datos, destino, titulo_hoja="Historial Juego")
            elif formato == "pdf":
                export_to_pdf(datos, destino, titulo="Historial del Juego de Adivinanza")
            notify(self.winfo_toplevel(), f"Exportado correctamente: {nombre}", "success")
        except ExportError as exc:
            notify(self.winfo_toplevel(), str(exc), "error")
        except Exception:
            logger.exception("Error inesperado al exportar historial del juego.")
            notify(self.winfo_toplevel(), "Error inesperado al exportar.", "error")
