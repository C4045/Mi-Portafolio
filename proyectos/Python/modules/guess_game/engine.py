"""
modules.guess_game.engine
============================
Lógica de negocio del juego de adivinanza: niveles de dificultad,
sistema de pistas "frío/tibio/caliente", cálculo de puntaje según
intentos y tiempo, y persistencia de historial/estadísticas (incluye
una tabla de mejores puntajes).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from core.database import db
from core.validators import ValidationError, validar_entero_en_rango
import secrets

logger = logging.getLogger(__name__)


class Dificultad(Enum):
    FACIL = "facil"
    NORMAL = "normal"
    DIFICIL = "dificil"
    EXPERTO = "experto"


CONFIG_DIFICULTAD: dict[Dificultad, dict[str, int]] = {
    Dificultad.FACIL: {"rango_min": 1, "rango_max": 50, "intentos_max": 12},
    Dificultad.NORMAL: {"rango_min": 1, "rango_max": 100, "intentos_max": 10},
    Dificultad.DIFICIL: {"rango_min": 1, "rango_max": 500, "intentos_max": 10},
    Dificultad.EXPERTO: {"rango_min": 1, "rango_max": 1000, "intentos_max": 8},
}


@dataclass
class EstadoPartida:
    dificultad: Dificultad
    numero_secreto: int
    rango_min: int
    rango_max: int
    intentos_max: int
    intentos_usados: int = 0
    inicio: float = field(default_factory=time.monotonic)
    terminada: bool = False
    gano: bool = False
    historial_intentos: list[int] = field(default_factory=list)


@dataclass
class ResultadoIntento:
    pista: str  # "muy_bajo" | "muy_alto" | "correcto"
    temperatura: str  # "helado" | "frío" | "tibio" | "caliente" | "quemando"
    intentos_restantes: int
    juego_terminado: bool
    gano: bool
    puntaje: int | None = None


class GuessGameEngine:
    """Controla el ciclo de vida de una partida del juego de adivinanza."""

    def __init__(self) -> None:
        self.partida: EstadoPartida | None = None

    # ------------------------------------------------------------------ #
    # Ciclo de vida de la partida
    # ------------------------------------------------------------------ #
    def iniciar_partida(self, dificultad: Dificultad) -> EstadoPartida:
        cfg = CONFIG_DIFICULTAD[dificultad]
        numero_secreto = secrets.randbelow(cfg["rango_max"] - cfg["rango_min"] + 1) + cfg["rango_min"]
        self.partida = EstadoPartida(
            dificultad=dificultad,
            numero_secreto=numero_secreto,
            rango_min=cfg["rango_min"],
            rango_max=cfg["rango_max"],
            intentos_max=cfg["intentos_max"],
        )
        logger.debug("Nueva partida iniciada (%s)", dificultad.value)
        return self.partida

    def intentar(self, valor_texto: str) -> ResultadoIntento:
        if self.partida is None or self.partida.terminada:
            raise ValidationError("No hay una partida activa. Inicia una nueva.")

        numero = validar_entero_en_rango(
            valor_texto, self.partida.rango_min, self.partida.rango_max, campo="número"
        )

        partida = self.partida
        partida.intentos_usados += 1
        partida.historial_intentos.append(numero)

        distancia = abs(numero - partida.numero_secreto)
        rango_total = partida.rango_max - partida.rango_min or 1
        proporcion = distancia / rango_total

        if numero == partida.numero_secreto:
            partida.terminada = True
            partida.gano = True
            puntaje = self._calcular_puntaje(partida)
            self._guardar_en_historial(partida, resultado="victoria", puntaje=puntaje)
            return ResultadoIntento(
                pista="correcto", temperatura="quemando",
                intentos_restantes=partida.intentos_max - partida.intentos_usados,
                juego_terminado=True, gano=True, puntaje=puntaje,
            )

        pista = "muy_bajo" if numero < partida.numero_secreto else "muy_alto"
        temperatura = self._calcular_temperatura(proporcion)
        intentos_restantes = partida.intentos_max - partida.intentos_usados

        if intentos_restantes <= 0:
            partida.terminada = True
            partida.gano = False
            self._guardar_en_historial(partida, resultado="derrota", puntaje=0)
            return ResultadoIntento(
                pista=pista, temperatura=temperatura, intentos_restantes=0,
                juego_terminado=True, gano=False, puntaje=0,
            )

        return ResultadoIntento(
            pista=pista, temperatura=temperatura, intentos_restantes=intentos_restantes,
            juego_terminado=False, gano=False,
        )

    def rendirse(self) -> int | None:
        if self.partida is None or self.partida.terminada:
            return None
        self.partida.terminada = True
        self.partida.gano = False
        self._guardar_en_historial(self.partida, resultado="abandono", puntaje=0)
        return self.partida.numero_secreto

    @staticmethod
    def _calcular_temperatura(proporcion: float) -> str:
        if proporcion < 0.03:
            return "quemando"
        if proporcion < 0.08:
            return "caliente"
        if proporcion < 0.20:
            return "tibio"
        if proporcion < 0.45:
            return "frío"
        return "helado"

    @staticmethod
    def _calcular_puntaje(partida: EstadoPartida) -> int:
        duracion = time.monotonic() - partida.inicio
        base = 1000
        penalizacion_intentos = (partida.intentos_usados - 1) * 40
        penalizacion_tiempo = min(duracion * 2, 300)
        bonus_dificultad = {
            Dificultad.FACIL: 1.0,
            Dificultad.NORMAL: 1.3,
            Dificultad.DIFICIL: 1.7,
            Dificultad.EXPERTO: 2.2,
        }[partida.dificultad]
        puntaje = max(base - penalizacion_intentos - penalizacion_tiempo, 50) * bonus_dificultad
        return int(round(puntaje))

    # ------------------------------------------------------------------ #
    # Persistencia
    # ------------------------------------------------------------------ #
    @staticmethod
    def _guardar_en_historial(partida: EstadoPartida, resultado: str, puntaje: int) -> None:
        try:
            duracion = round(time.monotonic() - partida.inicio, 2)
            db.insert(
                "juego_historial",
                {
                    "dificultad": partida.dificultad.value,
                    "numero_secreto": partida.numero_secreto,
                    "intentos": partida.intentos_usados,
                    "duracion_seg": duracion,
                    "resultado": resultado,
                    "puntaje": puntaje,
                },
            )
        except Exception:
            logger.exception("No se pudo guardar la partida en el historial.")

    @staticmethod
    def obtener_historial(limite: int = 100) -> list[dict[str, Any]]:
        return db.fetch_all("juego_historial", limit=limite)

    @staticmethod
    def obtener_mejores_puntajes(limite: int = 10) -> list[dict[str, Any]]:
        return db.raw_query(
            "SELECT * FROM juego_historial WHERE resultado = 'victoria' "
            "ORDER BY puntaje DESC LIMIT ?",
            (limite,),
        )

    @staticmethod
    def limpiar_historial() -> None:
        db.clear_table("juego_historial")

    @staticmethod
    def obtener_estadisticas() -> dict[str, Any]:
        total = db.count("juego_historial")
        victorias = db.count("juego_historial", where="resultado = 'victoria'")
        historial = db.fetch_all("juego_historial", limit=1000)

        if not historial:
            return {
                "total_partidas": 0, "victorias": 0, "tasa_victoria": 0.0,
                "promedio_intentos": 0.0, "mejor_puntaje": 0,
            }

        intentos_totales = [h["intentos"] for h in historial]
        mejor_puntaje = max((h["puntaje"] for h in historial), default=0)

        return {
            "total_partidas": total,
            "victorias": victorias,
            "tasa_victoria": round((victorias / total) * 100, 1) if total else 0.0,
            "promedio_intentos": round(sum(intentos_totales) / len(intentos_totales), 1),
            "mejor_puntaje": mejor_puntaje,
        }
