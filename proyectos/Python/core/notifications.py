"""
core.notifications
====================
Sistema de notificaciones tipo "toast" auto-desvanecientes, dibujadas
dentro de la propia ventana (no dependen de librerías nativas del SO,
por lo que funcionan igual en Windows, macOS y Linux). Se usan para dar
feedback inmediato al usuario (éxito, error, información) sin bloquear
la interfaz con un ``messagebox`` modal.
"""

from __future__ import annotations

from typing import Literal

import customtkinter as ctk

ToastType = Literal["success", "error", "info", "warning"]

_COLORES: dict[ToastType, tuple[str, str]] = {
    "success": ("#2FA84F", "#1E7B37"),
    "error": ("#E5484D", "#B4232B"),
    "info": ("#3B82F6", "#1E4FA0"),
    "warning": ("#F5A623", "#B67512"),
}

_ICONOS: dict[ToastType, str] = {
    "success": "✅",
    "error": "❌",
    "info": "ℹ️",
    "warning": "⚠️",
}


class Toast(ctk.CTkToplevel):
    """Ventana emergente sin bordes que se autodestruye tras un tiempo."""

    def __init__(
        self,
        parent: ctk.CTk | ctk.CTkToplevel,
        mensaje: str,
        tipo: ToastType = "info",
        duracion_ms: int = 2600,
    ) -> None:
        super().__init__(parent)
        self.overrideredirect(True)
        self.attributes("-topmost", True)
        try:
            self.attributes("-alpha", 0.0)
        except Exception:
            pass  # algunas plataformas no soportan transparencia de ventana

        color_claro, color_oscuro = _COLORES.get(tipo, _COLORES["info"])
        icono = _ICONOS.get(tipo, "ℹ️")

        frame = ctk.CTkFrame(
            self, corner_radius=10, fg_color=(color_claro, color_oscuro)
        )
        frame.pack(fill="both", expand=True)

        label = ctk.CTkLabel(
            frame,
            text=f"{icono}  {mensaje}",
            text_color="white",
            font=ctk.CTkFont(size=13, weight="bold"),
            padx=16,
            pady=10,
        )
        label.pack()

        self.update_idletasks()
        self._posicionar(parent)
        self._fade_in()
        self.after(duracion_ms, self._fade_out)

    def _posicionar(self, parent: ctk.CTk | ctk.CTkToplevel) -> None:
        ancho, alto = self.winfo_width(), self.winfo_height()
        px = parent.winfo_rootx() + parent.winfo_width() - ancho - 24
        py = parent.winfo_rooty() + parent.winfo_height() - alto - 24
        self.geometry(f"{ancho}x{alto}+{px}+{py}")

    def _fade_in(self, alpha: float = 0.0) -> None:
        alpha = min(alpha + 0.12, 0.96)
        try:
            self.attributes("-alpha", alpha)
        except Exception:
            return
        if alpha < 0.96:
            self.after(15, lambda: self._fade_in(alpha))

    def _fade_out(self, alpha: float = 0.96) -> None:
        alpha = max(alpha - 0.10, 0.0)
        try:
            self.attributes("-alpha", alpha)
        except Exception:
            self.destroy()
            return
        if alpha <= 0.0:
            self.destroy()
        else:
            self.after(15, lambda: self._fade_out(alpha))


def notify(
    parent: ctk.CTk | ctk.CTkToplevel,
    mensaje: str,
    tipo: ToastType = "info",
    duracion_ms: int = 2600,
) -> None:
    """Punto de entrada simple: ``notify(self, "Guardado", "success")``."""
    try:
        Toast(parent, mensaje, tipo, duracion_ms)
    except Exception:
        # Nunca debe romper el flujo de la app por un fallo puramente visual
        pass
