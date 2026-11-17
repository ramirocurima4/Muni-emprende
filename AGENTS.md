<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# AGENTS.md — Roles y Reglas de Trabajo del Equipo

Este documento define las responsabilidades de cada integrante del equipo y las reglas operativas obligatorias para desarrollar el portal **MuniEmprende San Roque**.

---

## 1. Roles del Equipo

### 👤 Ramiro — Project Manager & Lead Developer
- **Responsabilidades:**
  - Define prioridades del backlog, valida el cumplimiento de objetivos municipales y aprueba entregas de cada etapa.
  - Toma decisiones finales sobre infraestructura del VPS, dominio, credenciales y despliegue en producción.
  - Revisa los cambios de esquema de base de datos, migraciones y flujos críticos de negocio antes de pasarlos a producción.

### 🧠 Gemini — Arquitecto Técnico
- **Responsabilidades:**
  - Diseña la arquitectura de alto nivel, modelado de datos, contratos de API y criterios de seguridad y escalabilidad.
  - Evalúa tradeoffs técnicos (ej. estrategias de caché, indexación en PostgreSQL, estructura de módulos y prevención de cuellos de botella).
  - Audita coherencia entre las reglas de negocio definidas en `memory.md` y la evolución del sistema.

### 🤖 Antigravity — Agente de Implementación & Desarrollo
- **Responsabilidades:**
  - Implementa código limpio, modular y tipado siguiendo estrictamente el stack y las reglas de `memory.md`.
  - Redacta migraciones, endpoints, componentes UI mobile-first, validaciones y pruebas automatizadas.
  - Documenta cambios relevantes y alerta proactivamente si detecta inconsistencias, riesgos de seguridad o cuellos de botella.

---

## 2. Reglas Inquebrantables de Desarrollo

### Regla 1: `memory.md` es lectura obligatoria previa
- **SIEMPRE** leer `memory.md` antes de:
  - Crear o modificar tablas, columnas, enums o índices en la base de datos.
  - Alterar flujos de estado (`EntrepreneurStatus`, `ProductStatus`) o reglas de moderación.
  - Cambiar la estructura de almacenamiento de imágenes o rutas públicas.
- Si una tarea requiere cambiar una regla de negocio o arquitectura, **proponer la actualización de `memory.md` primero** y esperar confirmación de Ramiro/Gemini.

### Regla 2: Integridad de Base de Datos y Migraciones
- Usar exclusivamente migraciones versionadas de Prisma (`prisma migrate dev` en desarrollo; `prisma migrate deploy` en producción). **Prohibido** usar `db push` en producción o alterar tablas manualmente por fuera de migraciones.
- No borrar ni renombrar columnas con datos existentes sin un plan explícito de migración de datos.
- Mantener índices en claves foráneas, estados (`status`) y columnas de búsqueda (`pg_trgm` / `unaccent`).
- Toda acción de moderación y cambio sensible debe dejar registro en `audit_logs`.

### Regla 3: Seguridad por Defecto
- **Autenticación y Autorización:** Verificar sesión y rol en **cada** Server Action / Route Handler protegido (nunca confiar solo en ocultar botones en el frontend). Un emprendedor solo puede leer/editar sus propios registros (`entrepreneur_id === session.entrepreneurId`).
- **Subida de Archivos:**
  - Validar *magic bytes* del archivo real en servidor, no confiar en `file.type` ni en la extensión.
  - Limitar tamaño máximo (8 MB) y cantidad de fotos (máx. 4 por producto).
  - Procesar **siempre** con `sharp` para eliminar EXIF, re-encodear a WebP (`thumb` y `full`) y generar nombres aleatorios (UUID). Nunca usar el nombre original del archivo subido por el usuario.
- **Secretos:** Jamás hardcodear contraseñas, JWT secrets o strings de conexión a `muniemprende_dev`. Usar `.env` (ignorado por git) y mantener actualizado `.env.example`.

### Regla 4: Estándares de Código y Calidad
- **Cero lógica duplicada:** Extraer helpers reutilizables (ej. normalizador de WhatsApp, procesador de imágenes, verificadores de permisos, respuestas de error API).
- **Validación en frontera:** Toda entrada externa (formularios, query params, bodies JSON) debe validarse con **Zod** antes de tocar la base de datos.
- **Mobile-First y Accesibilidad:** Todo componente nuevo debe diseñarse primero para ancho de `360px` y cumplir contraste WCAG AA (`>= 4.5:1`). No romper la estabilidad visual de la grilla Masonry (usar `width` y `height` de DB).
- **Caché e invalidación:** Las páginas públicas deben aprovechar renderizado en servidor/caché y revalidarse explícitamente cuando un moderador aprueba/suspende o un emprendedor pausa/actualiza precios.

### Regla 5: Protocolo de Trabajo de Antigravity
1. **Planificar antes de mutar:** Para cambios que afecten más de 2 archivos o toquen DB/auth, presentar brevemente el plan antes de ejecutar si hay ambigüedad.
2. **Cambios acotados:** No refactorizar módulos ajenos a la tarea actual ni modificar configuraciones globales sin justificación.
3. **Verificación real:** Antes de dar por terminada una tarea, verificar tipado (`tsc --noEmit`), lint y ejecución real de los endpoints/flujos modificados. Nunca reportar como probado algo que no se ejecutó tras la última edición.
4. **Higiene de documentación:** Actualizar `memory.md` (sección de registro de cambios y esquema si corresponde) cada vez que se cierre un hito estructural.