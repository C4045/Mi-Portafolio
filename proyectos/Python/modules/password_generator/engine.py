"""
modules.password_generator.engine
====================================
Lógica de negocio del generador de contraseñas: generación
criptográficamente segura (usa ``secrets``, no ``random``), cálculo de
entropía y fortaleza, generación de contraseñas "pronunciables" y
persistencia de historial (solo se guarda un hash, nunca la contraseña
en texto plano, por seguridad).
"""

from __future__ import annotations

import hashlib
import logging
import math
import secrets
import string
from dataclasses import dataclass
from typing import Any

from core.database import db
from core.validators import ValidationError

logger = logging.getLogger(__name__)

CARACTERES_AMBIGUOS = set("Il1O0")
SIMBOLOS = "!@#$%^&*()-_=+[]{};:,.<>?"

VOCALES = "aeiou"
CONSONANTES = "bcdfghjklmnpqrstvwxyz"


@dataclass
class OpcionesGeneracion:
    longitud: int = 16
    incluir_mayus: bool = True
    incluir_minus: bool = True
    incluir_numeros: bool = True
    incluir_simbolos: bool = True
    excluir_ambiguos: bool = False


@dataclass
class ResultadoPassword:
    password: str
    entropia_bits: float
    fortaleza: str


class PasswordGeneratorEngine:
    """Genera contraseñas seguras y evalúa/registra su fortaleza."""

    NIVELES_FORTALEZA = [
        (28, "Muy débil"),
        (36, "Débil"),
        (60, "Aceptable"),
        (80, "Fuerte"),
        (math.inf, "Muy fuerte"),
    ]

    # Construcción del conjunto de caracteres
    @staticmethod
    def _construir_charset(opciones: OpcionesGeneracion) -> str:
        charset = ""
        if opciones.incluir_mayus:
            charset += string.ascii_uppercase
        if opciones.incluir_minus:
            charset += string.ascii_lowercase
        if opciones.incluir_numeros:
            charset += string.digits
        if opciones.incluir_simbolos:
            charset += SIMBOLOS

        if not charset:
            raise ValidationError("Selecciona al menos un tipo de carácter.")

        if opciones.excluir_ambiguos:
            charset = "".join(c for c in charset if c not in CARACTERES_AMBIGUOS)

        return charset

    # Generación
    def generar(self, opciones: OpcionesGeneracion, etiqueta: str = "", guardar: bool = True) -> ResultadoPassword:
        if not (4 <= opciones.longitud <= 128):
            raise ValidationError("La longitud debe estar entre 4 y 128 caracteres.")

        charset = self._construir_charset(opciones)
        password = self._generar_garantizando_variedad(charset, opciones)
        entropia = self._calcular_entropia(password, len(charset))
        fortaleza = self._clasificar_fortaleza(entropia)

        if guardar:
            self._guardar_en_historial(password, opciones.longitud, entropia, fortaleza, etiqueta)

        return ResultadoPassword(password=password, entropia_bits=entropia, fortaleza=fortaleza)

    def _generar_garantizando_variedad(self, charset: str, opciones: OpcionesGeneracion) -> str:
        """Genera con ``secrets`` (CSPRNG) y garantiza al menos un carácter de cada tipo elegido."""
        grupos = []
        if opciones.incluir_mayus:
            grupos.append(string.ascii_uppercase)
        if opciones.incluir_minus:
            grupos.append(string.ascii_lowercase)
        if opciones.incluir_numeros:
            grupos.append(string.digits)
        if opciones.incluir_simbolos:
            grupos.append(SIMBOLOS)

        if opciones.excluir_ambiguos:
            grupos = ["".join(c for c in g if c not in CARACTERES_AMBIGUOS) for g in grupos]
            grupos = [g for g in grupos if g]

        obligatorios = [secrets.choice(g) for g in grupos if g]
        restantes = max(opciones.longitud - len(obligatorios), 0)
        resto = [secrets.choice(charset) for _ in range(restantes)]

        password_lista = obligatorios + resto
        # Mezcla criptográficamente segura (Fisher-Yates con secrets)
        for i in range(len(password_lista) - 1, 0, -1):
            j = secrets.randbelow(i + 1)
            password_lista[i], password_lista[j] = password_lista[j], password_lista[i]

        return "".join(password_lista[: opciones.longitud])

    def generar_pronunciable(self, longitud: int = 12, guardar: bool = True) -> ResultadoPassword:
        """Genera una contraseña más fácil de recordar (alterna consonante/vocal)."""
        if not (6 <= longitud <= 64):
            raise ValidationError("La longitud debe estar entre 6 y 64 caracteres.")

        partes = []
        for i in range(longitud - 2):
            partes.append(secrets.choice(CONSONANTES if i % 2 == 0 else VOCALES))
        # Añade un número y un símbolo al final para mejorar la entropía
        partes.append(secrets.choice(string.digits))
        partes.append(secrets.choice("!@#$%"))
        password = "".join(partes)
        password = password[0].upper() + password[1:]

        charset_equivalente = CONSONANTES + VOCALES + string.digits + "!@#$%"
        entropia = self._calcular_entropia(password, len(charset_equivalente))
        fortaleza = self._clasificar_fortaleza(entropia)

        if guardar:
            self._guardar_en_historial(password, longitud, entropia, fortaleza, "pronunciable")

        return ResultadoPassword(password=password, entropia_bits=entropia, fortaleza=fortaleza)

    def generar_lote(self, opciones: OpcionesGeneracion, cantidad: int) -> list[ResultadoPassword]:
        if not (1 <= cantidad <= 100):
            raise ValidationError("La cantidad debe estar entre 1 y 100.")
        return [self.generar(opciones, etiqueta="lote", guardar=True) for _ in range(cantidad)]

    # Análisis de fortaleza
    @staticmethod
    def _calcular_entropia(password: str, tamano_charset: int) -> float:
        if tamano_charset <= 1:
            return 0.0
        return round(len(password) * math.log2(tamano_charset), 2)

    def _clasificar_fortaleza(self, entropia: float) -> str:
        for umbral, etiqueta in self.NIVELES_FORTALEZA:
            if entropia < umbral:
                return etiqueta
        return "Muy fuerte"

    # Historial (se guarda únicamente el hash, nunca la contraseña real)
    @staticmethod
    def _guardar_en_historial(
        password: str, longitud: int, entropia: float, fortaleza: str, etiqueta: str
    ) -> None:
        try:
            password_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
            db.insert(
                "password_historial",
                {
                    "etiqueta": etiqueta or "sin etiqueta",
                    "password_hash": password_hash,
                    "longitud": longitud,
                    "entropia_bits": entropia,
                    "fortaleza": fortaleza,
                },
            )
        except Exception:
            logger.exception("No se pudo guardar el registro en el historial de contraseñas.")

    @staticmethod
    def obtener_historial(limite: int = 100) -> list[dict[str, Any]]:
        return db.fetch_all("password_historial", limit=limite)

    @staticmethod
    def limpiar_historial() -> None:
        db.clear_table("password_historial")

    @staticmethod
    def obtener_estadisticas() -> dict[str, Any]:
        total = db.count("password_historial")
        historial = db.fetch_all("password_historial", limit=1000)
        if not historial:
            return {"total_generadas": 0, "entropia_promedio": 0.0, "fortaleza_mas_comun": "N/D"}

        entropias = [h["entropia_bits"] for h in historial]
        fortalezas = [h["fortaleza"] for h in historial]
        fortaleza_comun = max(set(fortalezas), key=fortalezas.count)

        return {
            "total_generadas": total,
            "entropia_promedio": round(sum(entropias) / len(entropias), 2),
            "fortaleza_mas_comun": fortaleza_comun,
        }
