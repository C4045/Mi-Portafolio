"""
core.theme
===========
Constantes visuales y componentes de interfaz reutilizables para
mantener una identidad de diseño coherente y profesional en toda la
suite (paleta de colores, tipografías, tarjetas, botones, accesos
directos de teclado, escalado de accesibilidad).
"""

from __future__ import annotations

import customtkinter as ctk

from core.config_manager import config

# ---------------------------------------------------------------------- #
# Paleta y tipografía
# ---------------------------------------------------------------------- #
PALETTE = {
    "primary": "#1F6AA5",
    "primary_hover": "#144870",
    "success": "#2FA84F",
    "danger": "#E5484D",
    "warning": "#F5A623",
    "info": "#3B82F6",
    "surface_light": "#F2F6FA",
    "surface_dark": "#1E1E2E",
    "text_muted": ("#6B7280", "#9CA3AF"),
}

FONT_FAMILY = "Segoe UI"
FONT_TITLE = ("size", 24)
FONT_SUBTITLE = ("size", 15)
FONT_BODY = ("size", 13)


def font(size: int = 13, weight: str = "normal") -> ctk.CTkFont:
    return ctk.CTkFont(family=FONT_FAMILY, size=size, weight=weight)


# ---------------------------------------------------------------------- #
# Inicialización global del tema
# ---------------------------------------------------------------------- #
def aplicar_tema_global() -> None:
    """Aplica el modo de apariencia y el tema de color guardados en config."""
    ctk.set_appearance_mode(config.get("appearance_mode", default="dark"))
    ctk.set_default_color_theme(config.get("color_theme", default="blue"))
    try:
        ctk.set_widget_scaling(config.get("window_scaling", default=1.0))
        ctk.deactivate_automatic_dpi_awareness() if hasattr(
            ctk, "deactivate_automatic_dpi_awareness"
        ) else None
    except Exception:
        pass


def alternar_modo_oscuro() -> str:
    """Alterna entre modo claro/oscuro y persiste la preferencia."""
    actual = ctk.get_appearance_mode().lower()
    nuevo = "light" if actual == "dark" else "dark"
    ctk.set_appearance_mode(nuevo)
    config.set("appearance_mode", nuevo)
    return nuevo


# ---------------------------------------------------------------------- #
# Componentes reutilizables
# ---------------------------------------------------------------------- #
class SectionCard(ctk.CTkFrame):
    """Tarjeta con título, usada para agrupar secciones (historial, stats...)."""

    def __init__(self, master, titulo: str, icono: str = "", **kwargs) -> None:
        super().__init__(master, corner_radius=14, **kwargs)
        self.titulo_label = ctk.CTkLabel(
            self,
            text=f"{icono}  {titulo}".strip(),
            font=font(16, "bold"),
            anchor="w",
        )
        self.titulo_label.pack(fill="x", padx=16, pady=(14, 6))
        self.contenido = ctk.CTkFrame(self, fg_color="transparent")
        self.contenido.pack(fill="both", expand=True, padx=16, pady=(0, 14))


class PrimaryButton(ctk.CTkButton):
    """Botón de acción principal con estilo consistente en toda la suite."""

    def __init__(self, master, **kwargs) -> None:
        defaults = dict(
            corner_radius=10,
            height=40,
            font=font(14, "bold"),
            fg_color=PALETTE["primary"],
            hover_color=PALETTE["primary_hover"],
        )
        defaults.update(kwargs)
        super().__init__(master, **defaults)


class GhostButton(ctk.CTkButton):
    """Botón secundario de bajo énfasis (acciones no destructivas)."""

    def __init__(self, master, **kwargs) -> None:
        defaults = dict(
            corner_radius=10,
            height=36,
            font=font(13),
            fg_color="transparent",
            border_width=1,
        )
        defaults.update(kwargs)
        super().__init__(master, **defaults)


class StatBadge(ctk.CTkFrame):
    """Pequeño widget de estadística: valor grande + etiqueta descriptiva."""

    def __init__(self, master, valor: str, etiqueta: str, **kwargs) -> None:
        super().__init__(master, corner_radius=12, **kwargs)
        self.valor_label = ctk.CTkLabel(self, text=valor, font=font(22, "bold"))
        self.valor_label.pack(pady=(12, 0))
        self.etiqueta_label = ctk.CTkLabel(
            self, text=etiqueta, font=font(11), text_color=PALETTE["text_muted"]
        )
        self.etiqueta_label.pack(pady=(0, 12))

    def actualizar(self, valor: str) -> None:
        self.valor_label.configure(text=valor)


def crear_tooltip(widget: ctk.CTkBaseClass, texto: str) -> None:
    """Tooltip accesible simple al pasar el mouse (mejora la usabilidad)."""

    tooltip_window: dict[str, ctk.CTkToplevel | None] = {"win": None}

    def mostrar(_event=None):
        if tooltip_window["win"] is not None:
            return
        x = widget.winfo_rootx() + 12
        y = widget.winfo_rooty() + widget.winfo_height() + 6
        win = ctk.CTkToplevel(widget)
        win.overrideredirect(True)
        win.attributes("-topmost", True)
        etiqueta = ctk.CTkLabel(
            win, text=texto, font=font(11), fg_color=("#333333", "#111111"),
            text_color="white", corner_radius=6, padx=8, pady=4,
        )
        etiqueta.pack()
        win.geometry(f"+{x}+{y}")
        tooltip_window["win"] = win

    def ocultar(_event=None):
        if tooltip_window["win"] is not None:
            tooltip_window["win"].destroy()
            tooltip_window["win"] = None

    widget.bind("<Enter>", mostrar)
    widget.bind("<Leave>", ocultar)
