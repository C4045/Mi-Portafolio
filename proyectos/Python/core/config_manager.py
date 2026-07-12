"""
core.config_manager
====================
Gestión centralizada y persistente de la configuración de la suite.

La configuración se guarda en ``data/config.json`` y se carga una única
vez por ejecución gracias al patrón Singleton, evitando lecturas de
disco repetidas y garantizando que todos los módulos compartan el
mismo estado (tema, idioma, últimas preferencias, etc.).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "data" / "config.json"

DEFAULT_CONFIG: dict[str, Any] = {
    "appearance_mode": "dark",       # "dark" | "light" | "system"
    "color_theme": "blue",           # tema de color base de CustomTkinter
    "window_scaling": 1.0,
    "font_scaling": 1.0,
    "notifications_enabled": True,
    "sound_enabled": False,
    "last_export_dir": str(BASE_DIR / "exports"),
    "calculadora": {
        "decimales": 4,
        "guardar_historial": True,
    },
    "password_generator": {
        "longitud_default": 16,
        "incluir_mayus": True,
        "incluir_minus": True,
        "incluir_numeros": True,
        "incluir_simbolos": True,
        "excluir_ambiguos": False,
        "auto_limpiar_portapapeles_seg": 30,
    },
    "guess_game": {
        "dificultad_default": "normal",
    },
}


class ConfigManager:
    """Singleton responsable de cargar, exponer y persistir la configuración."""

    _instance: "ConfigManager | None" = None
    _lock = Lock()

    def __new__(cls) -> "ConfigManager":
        with cls._lock:
            if cls._instance is None:
                instance = super().__new__(cls)
                instance._data = instance._load()
                cls._instance = instance
        return cls._instance

    # ------------------------------------------------------------------ #
    # Carga / persistencia
    # ------------------------------------------------------------------ #
    def _load(self) -> dict[str, Any]:
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        if CONFIG_PATH.exists():
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                merged = self._deep_merge(DEFAULT_CONFIG, data)
                return merged
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning("Config corrupta, se regenera por defecto: %s", exc)
        return json.loads(json.dumps(DEFAULT_CONFIG))  # copia profunda

    def save(self) -> None:
        try:
            CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(CONFIG_PATH, "w", encoding="utf-8") as fh:
                json.dump(self._data, fh, indent=4, ensure_ascii=False)
        except OSError as exc:
            logger.error("No se pudo guardar la configuración: %s", exc)

    @staticmethod
    def _deep_merge(base: dict, override: dict) -> dict:
        """Combina recursivamente ``override`` sobre una copia de ``base``."""
        result = json.loads(json.dumps(base))
        for key, value in override.items():
            if isinstance(value, dict) and isinstance(result.get(key), dict):
                result[key] = ConfigManager._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    # ------------------------------------------------------------------ #
    # API pública
    # ------------------------------------------------------------------ #
    def get(self, *keys: str, default: Any = None) -> Any:
        """Obtiene un valor anidado. Ej: ``config.get("password_generator", "longitud_default")``."""
        node: Any = self._data
        for key in keys:
            if isinstance(node, dict) and key in node:
                node = node[key]
            else:
                return default
        return node

    def set(self, *keys_and_value: Any, persist: bool = True) -> None:
        """Establece un valor anidado. El último argumento es el valor.

        Ej: ``config.set("password_generator", "longitud_default", 20)``
        """
        *keys, value = keys_and_value
        if not keys:
            raise ValueError("Se requiere al menos una clave")
        node = self._data
        for key in keys[:-1]:
            node = node.setdefault(key, {})
        node[keys[-1]] = value
        if persist:
            self.save()

    @property
    def data(self) -> dict[str, Any]:
        return self._data


# Instancia global de conveniencia
config = ConfigManager()
