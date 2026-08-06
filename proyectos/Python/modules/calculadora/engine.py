"""
modules.calculadora.engine
============================
Lógica de negocio de la calculadora, totalmente independiente de la
interfaz gráfica (esto permite reutilizarla, testearla o exponerla vía
CLI/API sin tocar el código de la GUI). Incluye memoria (M+/M-/MR/MC),
historial persistente en SQLite y estadísticas de uso.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from core.database import db
from core.validators import ValidationError, evaluar_expresion_segura

logger = logging.getLogger(__name__)


@dataclass
class ResultadoCalculo:
    expresion: str
    resultado: float


class CalculadoraEngine:
    """Encapsula el estado de la calculadora (memoria) y sus operaciones."""

    def __init__(self) -> None:
        self._memoria: float = 0.0

    # Operación principal
    def calcular(self, expresion: str, guardar_historial: bool = True) -> ResultadoCalculo:
        """Evalúa una expresión matemática de forma segura y la registra."""
        resultado = evaluar_expresion_segura(expresion)
        resultado = round(float(resultado), 10)
        if guardar_historial:
            self._guardar_en_historial(expresion, resultado)
        return ResultadoCalculo(expresion=expresion, resultado=resultado)

    @staticmethod
    def _guardar_en_historial(expresion: str, resultado: float) -> None:
        try:
            db.insert(
                "calculadora_historial",
                {"expresion": expresion, "resultado": str(resultado)},
            )
        except Exception:
            logger.exception("No se pudo guardar el cálculo en el historial.")

    # Memoria (M+, M-, MR, MC)
    def memoria_sumar(self, valor: float) -> None:
        self._memoria += valor

    def memoria_restar(self, valor: float) -> None:
        self._memoria -= valor

    def memoria_recuperar(self) -> float:
        return self._memoria

    def memoria_limpiar(self) -> None:
        self._memoria = 0.0

    @property
    def memoria(self) -> float:
        return self._memoria

    # Historial / estadísticas
    @staticmethod
    def obtener_historial(limite: int = 100) -> list[dict[str, Any]]:
        return db.fetch_all("calculadora_historial", limit=limite)

    @staticmethod
    def limpiar_historial() -> None:
        db.clear_table("calculadora_historial")

    @staticmethod
    def obtener_estadisticas() -> dict[str, Any]:
        total = db.count("calculadora_historial")
        historial = db.fetch_all("calculadora_historial", limit=1000)
        if not historial:
            return {"total_calculos": 0, "promedio_resultado": 0.0, "ultimo_calculo": None}

        resultados_numericos = []
        for fila in historial:
            try:
                resultados_numericos.append(float(fila["resultado"]))
            except (TypeError, ValueError):
                continue

        promedio = (
            sum(resultados_numericos) / len(resultados_numericos)
            if resultados_numericos
            else 0.0
        )
        return {
            "total_calculos": total,
            "promedio_resultado": round(promedio, 4),
            "ultimo_calculo": historial[0] if historial else None,
        }
