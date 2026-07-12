# 🐍 Suite Python Pro

Suite de escritorio profesional que agrupa tres herramientas —
**Calculadora**, **Generador de Contraseñas** y **Juego de Adivinanza**—
en una sola aplicación con interfaz gráfica moderna (CustomTkinter),
persistencia en SQLite, estadísticas, historial, exportación de datos
y modo oscuro.

Este proyecto es el resultado de refactorizar tres scripts de consola
sueltos (`calculadora.py`, `generador de contraseñas.py`,
`juego de adivinanza.py`) hacia una **arquitectura modular** lista para
producción y portafolio.

## ✨ Características

- **Interfaz gráfica moderna** con CustomTkinter: modo oscuro/claro,
  tarjetas, animaciones sutiles (fade in/out de notificaciones),
  escalado de fuente para accesibilidad y atajos de teclado.
- **Arquitectura modular**: capa `core/` compartida (config, base de
  datos, exportación, validación, tema, notificaciones) reutilizada
  por los tres módulos en `modules/`, sin código duplicado.
- **Persistencia real** en SQLite (`data/suite.db`) para historial de
  cálculos, contraseñas (solo se guarda el hash, nunca el valor real)
  y partidas del juego.
- **Configuración persistente** en `data/config.json` (tema, idioma,
  preferencias por módulo).
- **Validación robusta**: la calculadora evalúa expresiones con un
  parser seguro basado en `ast` (nunca `eval` directo sobre input del
  usuario); el generador de contraseñas usa `secrets` (CSPRNG).
- **Estadísticas** por módulo (totales, promedios, tasas de victoria,
  mejor puntaje, entropía media, etc.).
- **Exportación de datos** a **CSV**, **Excel (.xlsx)** y **PDF** desde
  cualquier módulo.
- **Notificaciones tipo toast** no bloqueantes con animación de
  aparición/desvanecimiento.
- **Funciones adicionales**:
  - Calculadora: memoria (M+/M-/MR/MC), funciones científicas
    (`sqrt`, potencias, `%`), historial interactivo (clic para
    reutilizar una expresión anterior).
  - Contraseñas: modo "pronunciable", generación en lote, medidor de
    fortaleza/entropía, copia al portapapeles con autolimpieza
    temporizada.
  - Juego: 4 niveles de dificultad, sistema de pistas
    frío/tibio/caliente, puntaje según intentos y tiempo, tabla de
    mejores puntajes (leaderboard).

## 📁 Estructura del proyecto

```
suite_python_pro/
├── main.py                      # Punto de entrada / hub de navegación
├── requirements.txt
├── core/                        # Capa compartida (sin duplicación)
│   ├── config_manager.py        # Configuración persistente (JSON)
│   ├── database.py              # Acceso a SQLite (CRUD genérico)
│   ├── exporters.py             # Exportación CSV / Excel / PDF
│   ├── validators.py            # Validación + evaluador seguro de expresiones
│   ├── notifications.py         # Notificaciones tipo toast
│   ├── theme.py                 # Paleta, componentes UI reutilizables
│   └── logger_setup.py          # Logging rotativo a archivo + consola
├── modules/
│   ├── calculadora/
│   │   ├── engine.py             # Lógica pura (testeable, sin GUI)
│   │   └── view.py                # Interfaz gráfica
│   ├── password_generator/
│   │   ├── engine.py
│   │   └── view.py
│   └── guess_game/
│       ├── engine.py
│       └── view.py
├── data/                         # config.json y suite.db (se crean en el primer arranque)
├── exports/                      # Archivos exportados (CSV/Excel/PDF)
└── logs/                         # Logs rotativos de la aplicación
```

## 🚀 Instalación y ejecución

```bash
# 1. Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Ejecutar la aplicación
python main.py
```

## ⌨️ Atajos de teclado

| Atajo      | Acción                    |
|------------|---------------------------|
| `Ctrl+1`   | Ir a Calculadora          |
| `Ctrl+2`   | Ir a Generador de Contraseñas |
| `Ctrl+3`   | Ir a Juego de Adivinanza  |
| `Ctrl+D`   | Alternar modo oscuro/claro |
| `Esc`      | Volver a Inicio           |

## 🔒 Notas de seguridad

- El generador de contraseñas usa el módulo `secrets` (generador
  criptográficamente seguro), **no** `random`.
- En el historial de contraseñas solo se guarda un **hash SHA-256**,
  nunca la contraseña en texto plano.
- La calculadora nunca usa `eval()` sobre texto del usuario: las
  expresiones se analizan con el módulo `ast` y solo se permiten
  operadores y funciones explícitamente autorizados.

## 🧩 Extender la suite

Gracias a la arquitectura modular, añadir una nueva herramienta implica:

1. Crear `modules/nueva_herramienta/engine.py` (lógica pura).
2. Crear `modules/nueva_herramienta/view.py` (`CTkFrame` reutilizando
   `core.theme`, `core.notifications`, `core.exporters`).
3. Registrar la vista en el diccionario `MODULOS` y en
   `_crear_vista()` de `main.py`.

No es necesario tocar el resto del código: la capa `core/` ya resuelve
configuración, base de datos, exportación, tema y notificaciones.

## 📦 Requisitos

- Python 3.10+
- `customtkinter`, `openpyxl`, `reportlab` (ver `requirements.txt`)
