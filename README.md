# StartGG Manager

Gestor web para torneos de Smash Ultimate que se conecta a start.gg. Pensado para que organizadores y competidores sigan sus sets de forma sencilla: iniciar partidas, reportar resultados y ver el estado de cada ronda.

## Que ofrece
- Ver eventos activos y navegar a sus sets.
- Iniciar un set y seguirlo con control de RPS, bans y formato best-of.
- Registrar y enviar el resultado para que lo revise un administrador.
- Consultar estados claros: en progreso, enviado, aprobado o rechazado.

## Como funciona
1) Elige un evento y abre la lista de sets disponibles.
2) Si eres participante o admin, inicia el set y registra cada juego (etapa, ganador, stocks).
3) Envía el reporte para que un admin lo valide.
4) Revisa el estado del set desde el dashboard: en progreso, pendiente de revision, aprobado o rechazado.

## Acceso
La aplicacion es web: basta con abrir el enlace publico que se proporcione (ej. dominio o GitHub Pages) y autenticarte con tu cuenta de start.gg. Desde alli veras tu panel con eventos y sets disponibles.

## Roles
- Administrador: puede iniciar sets, revisar y aprobar o rechazar reportes.
- Competidor: puede iniciar y reportar sus propios sets, y ver su estado.

## Estructura del proyecto
```
startgg_manager/
├── backend/    # API y logica de sets/reportes
└── frontend/   # SPA para admin/competidores
```

