"""
core.validators
================
Validaciones robustas y evaluación segura de expresiones matemáticas,
compartidas por los distintos módulos. No se usa ``eval`` directamente
sobre entradas del usuario: se parsea con el módulo ``ast`` y solo se
permiten operaciones aritméticas explícitamente autorizadas.
"""

from __future__ import annotations

import ast
import operator
import math
from typing import Union

Number = Union[int, float]


class ValidationError(Exception):
    """Error de validación de datos de entrada del usuario."""


# ---------------------------------------------------------------------- #
# Validaciones numéricas y de texto genéricas
# ---------------------------------------------------------------------- #
def validar_numero(valor: str, campo: str = "valor") -> float:
    valor = (valor or "").strip().replace(",", ".")
    if not valor:
        raise ValidationError(f"El campo '{campo}' no puede estar vacío.")
    try:
        return float(valor)
    except ValueError as exc:
        raise ValidationError(f"'{valor}' no es un número válido para '{campo}'.") from exc


def validar_entero_en_rango(valor: str, minimo: int, maximo: int, campo: str = "valor") -> int:
    try:
        numero = int(float((valor or "").strip()))
    except ValueError as exc:
        raise ValidationError(f"'{valor}' no es un número entero válido para '{campo}'.") from exc
    if not (minimo <= numero <= maximo):
        raise ValidationError(f"'{campo}' debe estar entre {minimo} y {maximo}.")
    return numero


def validar_no_vacio(valor: str, campo: str = "campo") -> str:
    if not (valor or "").strip():
        raise ValidationError(f"El campo '{campo}' no puede estar vacío.")
    return valor.strip()


# ---------------------------------------------------------------------- #
# Evaluador seguro de expresiones aritméticas (para la calculadora)
# ---------------------------------------------------------------------- #
_OPERADORES_PERMITIDOS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_FUNCIONES_PERMITIDAS = {
    "sqrt": math.sqrt,
    "abs": abs,
    "round": round,
    "log": math.log10,
    "ln": math.log,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
}


def evaluar_expresion_segura(expresion: str) -> Number:
    """Evalúa una expresión aritmética simple sin usar ``eval`` inseguro.

    Soporta ``+ - * / ** %``, paréntesis, negativos y funciones básicas
    como ``sqrt``, ``log``, ``sin``, ``cos``, ``tan``.
    """
    expresion = (expresion or "").strip()
    if not expresion:
        raise ValidationError("La expresión no puede estar vacía.")

    try:
        arbol = ast.parse(expresion, mode="eval")
        resultado = _evaluar_nodo(arbol.body)
    except ZeroDivisionError as exc:
        raise ValidationError("No se puede dividir por cero.") from exc
    except (SyntaxError, TypeError, KeyError, ValueError) as exc:
        raise ValidationError(f"Expresión inválida: {expresion}") from exc

    if isinstance(resultado, complex):
        raise ValidationError("El resultado no es un número real.")
    return resultado


def _evaluar_nodo(nodo: ast.AST) -> Number:
    if isinstance(nodo, ast.Constant):
        if isinstance(nodo.value, (int, float)):
            return nodo.value
        raise ValidationError("Solo se permiten valores numéricos.")
    if isinstance(nodo, ast.BinOp) and type(nodo.op) in _OPERADORES_PERMITIDOS:
        izquierda = _evaluar_nodo(nodo.left)
        derecha = _evaluar_nodo(nodo.right)
        return _OPERADORES_PERMITIDOS[type(nodo.op)](izquierda, derecha)
    if isinstance(nodo, ast.UnaryOp) and type(nodo.op) in _OPERADORES_PERMITIDOS:
        return _OPERADORES_PERMITIDOS[type(nodo.op)](_evaluar_nodo(nodo.operand))
    if isinstance(nodo, ast.Call):
        nombre_funcion = getattr(nodo.func, "id", None)
        if nombre_funcion not in _FUNCIONES_PERMITIDAS:
            raise ValidationError(f"Función no permitida: {nombre_funcion}")
        argumentos = [_evaluar_nodo(arg) for arg in nodo.args]
        return _FUNCIONES_PERMITIDAS[nombre_funcion](*argumentos)
    raise ValidationError("Expresión contiene elementos no permitidos.")
