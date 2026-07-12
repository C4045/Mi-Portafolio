"""
core.database
=============
Capa de persistencia basada en SQLite, compartida por todos los módulos
de la suite. Centraliza la conexión, la creación del esquema y expone
operaciones CRUD genéricas y seguras (parametrizadas contra inyección
SQL), evitando así duplicar lógica de acceso a datos en cada proyecto.
"""

from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Iterator

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "suite.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS calculadora_historial (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    expresion       TEXT NOT NULL,
    resultado       TEXT NOT NULL,
    fecha           TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS password_historial (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    etiqueta        TEXT,
    password_hash   TEXT NOT NULL,
    longitud        INTEGER NOT NULL,
    entropia_bits   REAL NOT NULL,
    fortaleza       TEXT NOT NULL,
    fecha           TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS juego_historial (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    dificultad      TEXT NOT NULL,
    numero_secreto  INTEGER NOT NULL,
    intentos        INTEGER NOT NULL,
    duracion_seg    REAL NOT NULL,
    resultado       TEXT NOT NULL,
    puntaje         INTEGER NOT NULL,
    fecha           TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
"""


class Database:
    """Wrapper ligero sobre sqlite3 con manejo de errores y contexto seguro."""

    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_schema()

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        try:
            yield conn
            conn.commit()
        except sqlite3.Error as exc:
            conn.rollback()
            logger.exception("Error de base de datos: %s", exc)
            raise
        finally:
            conn.close()

    def _initialize_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(SCHEMA)
        logger.debug("Esquema de base de datos verificado en %s", self.db_path)

    # ------------------------------------------------------------------ #
    # Operaciones genéricas
    # ------------------------------------------------------------------ #
    def insert(self, table: str, values: dict[str, Any]) -> int:
        """Inserta una fila y devuelve su ``id`` autogenerado."""
        columns = ", ".join(values.keys())
        placeholders = ", ".join("?" for _ in values)
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        with self._connect() as conn:
            cursor = conn.execute(query, tuple(values.values()))
            return cursor.lastrowid

    def fetch_all(
        self, table: str, order_by: str = "id DESC", limit: int | None = None
    ) -> list[dict[str, Any]]:
        query = f"SELECT * FROM {table} ORDER BY {order_by}"
        if limit is not None:
            query += f" LIMIT {int(limit)}"
        with self._connect() as conn:
            rows = conn.execute(query).fetchall()
            return [dict(row) for row in rows]

    def fetch_one(self, table: str, row_id: int) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute(
                f"SELECT * FROM {table} WHERE id = ?", (row_id,)
            ).fetchone()
            return dict(row) if row else None

    def delete(self, table: str, row_id: int) -> None:
        with self._connect() as conn:
            conn.execute(f"DELETE FROM {table} WHERE id = ?", (row_id,))

    def clear_table(self, table: str) -> None:
        with self._connect() as conn:
            conn.execute(f"DELETE FROM {table}")

    def count(self, table: str, where: str = "1=1", params: Iterable[Any] = ()) -> int:
        query = f"SELECT COUNT(*) AS total FROM {table} WHERE {where}"
        with self._connect() as conn:
            row = conn.execute(query, tuple(params)).fetchone()
            return int(row["total"]) if row else 0

    def raw_query(self, query: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
        """Permite consultas de agregación/estadísticas ad-hoc de forma segura."""
        with self._connect() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
            return [dict(row) for row in rows]


# Instancia global compartida por toda la suite
db = Database()
