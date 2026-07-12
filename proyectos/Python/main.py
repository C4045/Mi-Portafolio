"""
main.py
========
Punto de entrada de la Suite Python Pro. Presenta un hub de navegación
lateral estilo aplicación comercial, con acceso a los tres módulos
(Calculadora, Generador de Contraseñas, Juego de Adivinanza), un panel
de bienvenida, alternancia de modo oscuro/claro, escalado de fuente
(accesibilidad) y atajos de teclado.

Ejecutar con:
    python main.py
"""

from __future__ import annotations

import logging
import sys

import customtkinter as ctk

from core.config_manager import config
from core.logger_setup import setup_logging
from core.notifications import notify
from core.theme import aplicar_tema_global, alternar_modo_oscuro, font, GhostButton
from modules.calculadora.view import CalculadoraFrame
from modules.password_generator.view import PasswordGeneratorFrame
from modules.guess_game.view import GuessGameFrame

setup_logging()
logger = logging.getLogger(__name__)

APP_TITLE = "Suite Python Pro"
APP_VERSION = "2.0.0"

MODULOS = {
    "inicio": {"icono": "🏠", "titulo": "Inicio"},
    "calculadora": {"icono": "🧮", "titulo": "Calculadora"},
    "passwords": {"icono": "🔐", "titulo": "Contraseñas"},
    "juego": {"icono": "🎲", "titulo": "Adivinanza"},
}


class SuitePythonPro(ctk.CTk):
    """Ventana principal: barra lateral de navegación + área de contenido."""

    def __init__(self) -> None:
        super().__init__()
        self.title(f"{APP_TITLE} — v{APP_VERSION}")
        self.geometry("1180x760")
        self.minsize(980, 640)

        self._frames_cache: dict[str, ctk.CTkFrame] = {}
        self._frame_actual: str | None = None

        self._construir_layout()
        self._configurar_atajos_teclado()
        self.mostrar_vista("inicio")

        self.protocol("WM_DELETE_WINDOW", self._al_cerrar)

    # ------------------------------------------------------------------ #
    # Layout general
    # ------------------------------------------------------------------ #
    def _construir_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._construir_barra_lateral()

        self.contenedor = ctk.CTkFrame(self, fg_color="transparent")
        self.contenedor.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.contenedor.grid_rowconfigure(0, weight=1)
        self.contenedor.grid_columnconfigure(0, weight=1)

    def _construir_barra_lateral(self) -> None:
        barra = ctk.CTkFrame(self, width=220, corner_radius=0)
        barra.grid(row=0, column=0, sticky="nsew")
        barra.grid_propagate(False)
        barra.grid_rowconfigure(6, weight=1)

        ctk.CTkLabel(
            barra, text=f"🐍 {APP_TITLE}", font=font(18, "bold")
        ).grid(row=0, column=0, padx=20, pady=(26, 2), sticky="w")
        ctk.CTkLabel(
            barra, text=f"versión {APP_VERSION}", font=font(11),
            text_color=("#5B6B7C", "#9CA3AF"),
        ).grid(row=1, column=0, padx=20, pady=(0, 24), sticky="w")

        self._botones_nav: dict[str, ctk.CTkButton] = {}
        for idx, (clave, info) in enumerate(MODULOS.items(), start=2):
            btn = ctk.CTkButton(
                barra,
                text=f"  {info['icono']}   {info['titulo']}",
                anchor="w",
                font=font(14),
                height=44,
                corner_radius=10,
                fg_color="transparent",
                hover_color=("#E5EEF6", "#26263A"),
                command=lambda c=clave: self.mostrar_vista(c),
            )
            btn.grid(row=idx, column=0, padx=14, pady=4, sticky="ew")
            self._botones_nav[clave] = btn

        # Pie de la barra lateral: accesibilidad + modo oscuro
        pie = ctk.CTkFrame(barra, fg_color="transparent")
        pie.grid(row=7, column=0, padx=14, pady=18, sticky="ew")

        fila_zoom = ctk.CTkFrame(pie, fg_color="transparent")
        fila_zoom.pack(fill="x", pady=(0, 8))
        ctk.CTkLabel(fila_zoom, text="Tamaño de texto", font=font(11)).pack(anchor="w")
        GhostButton(fila_zoom, text="A-", width=40, command=lambda: self._ajustar_escala(-0.1)).pack(
            side="left", padx=(0, 4)
        )
        GhostButton(fila_zoom, text="A+", width=40, command=lambda: self._ajustar_escala(0.1)).pack(
            side="left"
        )

        self.boton_tema = GhostButton(
            pie, text="🌗 Cambiar tema", command=self._alternar_tema
        )
        self.boton_tema.pack(fill="x")

    def _configurar_atajos_teclado(self) -> None:
        self.bind("<Control-1>", lambda _e: self.mostrar_vista("calculadora"))
        self.bind("<Control-2>", lambda _e: self.mostrar_vista("passwords"))
        self.bind("<Control-3>", lambda _e: self.mostrar_vista("juego"))
        self.bind("<Control-d>", lambda _e: self._alternar_tema())
        self.bind("<Escape>", lambda _e: self.mostrar_vista("inicio"))

    # ------------------------------------------------------------------ #
    # Navegación
    # ------------------------------------------------------------------ #
    def mostrar_vista(self, clave: str) -> None:
        for frame in self._frames_cache.values():
            frame.grid_forget()

        if clave not in self._frames_cache:
            self._frames_cache[clave] = self._crear_vista(clave)

        self._frames_cache[clave].grid(row=0, column=0, sticky="nsew")
        self._frame_actual = clave
        self._resaltar_boton_activo(clave)

    def _resaltar_boton_activo(self, clave: str) -> None:
        for nombre, boton in self._botones_nav.items():
            if nombre == clave:
                boton.configure(fg_color=("#D8E8F8", "#1F3A52"))
            else:
                boton.configure(fg_color="transparent")

    def _crear_vista(self, clave: str) -> ctk.CTkFrame:
        constructores = {
            "inicio": self._vista_inicio,
            "calculadora": lambda: CalculadoraFrame(self.contenedor),
            "passwords": lambda: PasswordGeneratorFrame(self.contenedor),
            "juego": lambda: GuessGameFrame(self.contenedor),
        }
        try:
            return constructores[clave]()
        except Exception:
            logger.exception("Error al construir la vista '%s'", clave)
            frame_error = ctk.CTkFrame(self.contenedor, fg_color="transparent")
            ctk.CTkLabel(
                frame_error, text="⚠️ No se pudo cargar este módulo.", font=font(16, "bold")
            ).pack(pady=40)
            return frame_error

    def _vista_inicio(self) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(self.contenedor, fg_color="transparent")
        ctk.CTkLabel(
            frame, text="Bienvenido a Suite Python Pro", font=font(28, "bold")
        ).pack(anchor="w", pady=(10, 4))
        ctk.CTkLabel(
            frame,
            text="Tres herramientas profesionales en una sola aplicación de escritorio.",
            font=font(14), text_color=("#5B6B7C", "#9CA3AF"),
        ).pack(anchor="w", pady=(0, 24))

        tarjetas = ctk.CTkFrame(frame, fg_color="transparent")
        tarjetas.pack(fill="x")
        tarjetas.grid_columnconfigure((0, 1, 2), weight=1, uniform="cards")

        datos_tarjetas = [
            ("🧮", "Calculadora", "Operaciones básicas y científicas con historial.", "calculadora"),
            ("🔐", "Contraseñas", "Generador seguro con análisis de fortaleza.", "passwords"),
            ("🎲", "Adivinanza", "Juego con dificultades y tabla de puntajes.", "juego"),
        ]
        for col, (icono, titulo, descripcion, clave) in enumerate(datos_tarjetas):
            tarjeta = ctk.CTkFrame(tarjetas, corner_radius=16, height=180)
            tarjeta.grid(row=0, column=col, sticky="nsew", padx=8)
            ctk.CTkLabel(tarjeta, text=icono, font=font(36)).pack(pady=(24, 8))
            ctk.CTkLabel(tarjeta, text=titulo, font=font(16, "bold")).pack()
            ctk.CTkLabel(
                tarjeta, text=descripcion, font=font(11), wraplength=180, justify="center",
                text_color=("#5B6B7C", "#9CA3AF"),
            ).pack(pady=(4, 14), padx=10)
            GhostButton(tarjeta, text="Abrir →", command=lambda c=clave: self.mostrar_vista(c)).pack(
                pady=(0, 16)
            )

        atajos_info = ctk.CTkLabel(
            frame,
            text="Atajos: Ctrl+1 Calculadora · Ctrl+2 Contraseñas · Ctrl+3 Adivinanza · Ctrl+D Modo oscuro",
            font=font(11), text_color=("#5B6B7C", "#9CA3AF"),
        )
        atajos_info.pack(anchor="w", pady=(30, 0))

        return frame

    # ------------------------------------------------------------------ #
    # Preferencias
    # ------------------------------------------------------------------ #
    def _alternar_tema(self) -> None:
        nuevo_modo = alternar_modo_oscuro()
        notify(self, f"Modo {('oscuro' if nuevo_modo == 'dark' else 'claro')} activado.", "info")

    def _ajustar_escala(self, delta: float) -> None:
        actual = config.get("window_scaling", default=1.0)
        nueva = max(0.8, min(1.5, round(actual + delta, 2)))
        config.set("window_scaling", nueva)
        ctk.set_widget_scaling(nueva)
        notify(self, f"Escala de texto: {int(nueva * 100)}%", "info")

    def _al_cerrar(self) -> None:
        logger.info("Cerrando Suite Python Pro.")
        config.save()
        self.destroy()


def main() -> None:
    try:
        aplicar_tema_global()
        app = SuitePythonPro()
        app.mainloop()
    except Exception:
        logger.exception("Error fatal al iniciar la aplicación.")
        sys.exit(1)


if __name__ == "__main__":
    main()
