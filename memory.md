# MEMORY.md — Portal Emprendedores Municipalidad de San Roque

> **Fuente de verdad del proyecto.** Todo cambio en base de datos, arquitectura, flujos de negocio o diseño debe consultarse aquí primero y actualizar este documento si la decisión cambia.

---

## 1. Contexto y Visión del Producto
Portal web oficial de la **Municipalidad de San Roque** para visibilizar y digitalizar la feria de emprendedores locales.

- **Modelo de negocio:** Vidriera / catálogo público municipal sin intermediación comercial. **No es un e-commerce**: no existen carritos de compra, gestión de envíos, facturación ni pasarelas de pago.
- **Flujo de venta:** El vecino explora productos desde su celular, elige uno y presiona el botón principal de contacto, que abre **WhatsApp** (`https://wa.me/549...`) con un mensaje prearmado dirigido al emprendedor para coordinar la venta mano a mano.
- **Responsabilidad legal:** El portal debe mostrar de forma visible un descargo indicando que la Municipalidad solo brinda el espacio de difusión y no interviene en precios, transacciones, entregas ni garantías.

---

## 2. Alcance del MVP (v1.0)

### Incluido en MVP
1. **Ecosistema Frontal en 2 Pantallas (Mobile-First + Desktop Inmersivo):**
   - **Pantalla 1 — Landing / Home (`/`):** La ruta raíz `/` es una **Landing/Home** institucional sobre fondo crema muy suave (`#FDFBF7`) con márgenes amplios y paleta oficial de la Dirección de Empleo y Emprendedores:
     - **Header Institucional:** Cabecera con fondo celeste claro institucional (`brand-sky-light`), logo municipal (`/logo.jpeg`) en el extremo izquierdo dimensionado con `object-contain` (`h-14 sm:h-16`) para que se lea nítidamente `'San Roque Municipio'` sin deformarse.
     - **Hero Editorial (`Catálogo Oficial Comunitario`):** Título `'Impulsando el talento de San Roque'`, subtítulo con `'Elaboración Sanroqueña'` (sin menciones a `'Certificado'` / `'Certificación Municipal'`) y botones `'Explorar Feria'` (verde vibrante hacia `/catalogo`) y `'Soy emprendedor'` (acento cálido hacia `/registro`).
     - **Categorías Visuales (`CategoryVisualFilters`):** Tira de filtros circulares con íconos vectoriales de trazo fino (`lucide-react`: `LayoutGrid` Todos, `ChefHat` Gastronomía, `Hammer` Artesanías, `Spool` Textil, `Laptop` Tecnología, `Sprout` Vivero, `Wrench` Servicios, `Store` Otras) que enlazan directo al catálogo filtrado.
     - **Exhibición Equitativa (`HomeProductShowcase.tsx`):** Bloque destacado `'Gastronomía Sanroqueña'` (urgencia de venta diaria con pastilla `'Hecho en San Roque'` y enlace `'Ver todo →'`) seguido de `'Catálogo Destacado'` (equilibrio tipográfico y protagonismo igualitario para artesanos, textileros, viveros y tecnología bajo `'Sello Local'`), con modal de vista rápida (`Sello Local`, `Descripción`, `Elaboración Sanroqueña` y botón directo `'Contactar por WhatsApp'`).
     - **Sección 'Sumate a Nosotros' (`JoinUsSection.tsx`):** Bloque institucional con fondo verde vibrante (`brand-green`), acentos cálidos en amarillo/naranja, texto de invitación a productores y emprendedores (`'¿Querés ser parte de MuniEmprende? Invitamos a productores y emprendedores a formar parte de nuestra plataforma digital. Te brindamos un espacio virtual y el acompañamiento de nuestro equipo.'`) y botón prominente `'Comunicate al 3794 819378'` enlazado a WhatsApp (`https://wa.me/5493794819378`).
     - **Banner Institucional del Intendente:** Al final de la página (antes del footer), tira horizontal con escudo circular, `'INTENDENTE DE SAN ROQUE'` (acento cálido) y `'Cr. Raúl Pelozo'` (verde institucional).
   - **Pantalla 2 — El Catálogo Completo (`/catalogo`):** La grilla Masonry con barra de búsqueda (tolerante a tildes y errores leves con `unaccent` + `pg_trgm`) y filtros visuales por categorías oficiales con íconos vectoriales redondos (`CategoryVisualFilters`) se ubica en `/catalogo` (`CLS = 0`).
   - Vista de detalle de producto (`/productos/[slug]`) con galería de fotos, descripción, ingredientes (opcional), perfil público del emprendedor y botón principal a WhatsApp (**sin precios**).
   - Vista de perfil público del emprendedor con todos sus productos aprobados.
   - Meta tags OpenGraph dinámicos (`og:title`, `og:description`, `og:image`) para previsualización correcta al compartir links en WhatsApp/redes.
2. **Portal del Emprendedor:**
   - Registro y login propio (cookies `HttpOnly`).
   - Perfil editable (nombre comercial/emprendimiento, rubro, barrio/zona, descripción breve, número de WhatsApp normalizado con botón de prueba, foto/logo opcional).
   - Alta, edición y pausa rápida de productos (máx. 4 fotos por producto).
   - Visualización de estado de aprobación y motivo de rechazo cuando corresponda.
3. **Panel de Auditoría Municipal (Modernización / Empleo):**
   - Cola de **emprendedores pendientes** de habilitación.
   - Cola de **productos pendientes** de aprobación.
   - Acciones: Aprobar, Rechazar (con **motivo obligatorio** visible para el emprendedor) o Suspender.
   - Gestión de categorías oficiales.
   - Registro de auditoría (`audit_logs`) de acciones de moderación y cambios sensibles.

### Explícitamente FUERA del MVP
- Carrito de compras, checkout o pasarelas de pago (MercadoPago, etc.).
- Chat interno dentro de la plataforma.
- Sistema de reseñas/estrellas públicas entre vecinos.
- Geolocalización en mapa en tiempo real.
- **Apps móviles nativas puras desde cero en Kotlin (Android) o Swift (iOS):** No se desarrollarán aplicaciones nativas independientes en Kotlin/Swift desde cero. **MuniEmprende funciona como una PWA / App Híbrida empaquetada con Capacitor en modo WebView (Wrapper)** (`com.sanroque.muniemprende`), consumiendo el servidor Next.js en vivo para conservar SSR, Server Actions, Middleware y base de datos en tiempo real.

---

## 3. Stack Tecnológico Final

- **Runtime / Framework:** Next.js 16 (App Router) con TypeScript (monolito modular full-stack).
- **Arquitectura Móvil / Distribución:** **PWA / App Híbrida con Capacitor en modo WebView (Wrapper)** (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` v8.6.2; `capacitor.config.ts` con `appId: 'com.sanroque.muniemprende'`, `appName: 'MuniEmprende'`, `server: { url: 'https://muniemprende.sanroque.gob.ar', cleartext: true }`; plataforma `android/` generada), consumiendo el servidor Next.js en vivo para conservar SSR, Server Actions, Middleware y PostgreSQL. Se mantiene además el Web App Manifest (`src/app/manifest.ts` → `/manifest.webmanifest`, `display: 'standalone'`), metadatos mobile/iOS (`apple-mobile-web-app-capable`, `theme-color: '#3D7A1E'`) e íconos (`192x192` y `512x512` en `/public`). En `next.config.ts` se mantiene `images: { unoptimized: true }` sin `output: 'export'`.
- **Base de datos:** PostgreSQL (instancia local `muniemprende_dev` en desarrollo) con extensiones `unaccent` y `pg_trgm`.
- **ORM y Migraciones:** Prisma ORM (`prisma/schema.prisma` como definición estricta del esquema).
- **Validación:** Zod (compartido entre formularios/API).
- **UI / Estilos:** Tailwind CSS + componentes accesibles (shadcn/ui / Radix) para formularios y panel admin.
- **Procesamiento de Imágenes:** `sharp` (conversión a WebP, strip de EXIF, generación de `thumb` y `full`, lectura de `width`/`height`).
- **Autenticación:** Sesiones con JWT firmado en cookies `HttpOnly`, `SameSite=Lax`, `Secure` en producción; hashing de contraseñas con `argon2` o `bcryptjs`.
- **Infraestructura VPS (Producción):** Nginx (reverse proxy + servidor directo de estáticos `/uploads/`) + Node.js (`next build` standalone con `systemd`/`PM2`) + PostgreSQL local.

---

## 4. Reglas de Negocio Críticas

### 4.1 Roles de Usuario
- `USER_NEW` *(por defecto)*: Emprendedor nuevo; sus altas y ediciones de productos requieren aprobación municipal (`ProductStatus.PENDING`). No accede al panel admin.
- `USER_TRUSTED`: Emprendedor de confianza habilitado para auto-publicación; sus productos pueden pasar directamente a `APPROVED` sin pasar por la cola previa de moderación. No accede al panel admin.
- `ENTREPRENEUR`: Rol legado equivalente a `USER_NEW` mantenido por compatibilidad con sesiones y registros existentes durante la transición.
- `MODERATOR`: Rol reservado (sin acceso al panel `/admin` desde 2026-11-18). Se puede crear desde `/admin/usuarios` pero hoy no habilita ninguna pantalla de gestión; queda disponible para un futuro panel de solo lectura.
- `ADMIN`: Empleado/a de la Dirección de Empleo y Emprendedores o de Comunicación. **Único rol con acceso a `/admin`** (verificado en middleware, en cada página y en cada Server Action contra el estado vivo en PostgreSQL: rol `ADMIN` + `is_active`). Modera productos y emprendimientos, asigna confianza (`USER_NEW` ↔ `USER_TRUSTED`), suspende cuentas, crea usuarios de cualquier clase, blanquea contraseñas y administra la Galería de Expos.
- **`/admin` es solo para computadora:** por debajo de 768px (`md`) se muestra una pantalla amable que indica que la gestión se hace desde una PC (el bloqueo es de experiencia de uso; la seguridad la dan el rol y las verificaciones en servidor).
- **Contraseñas del equipo municipal:** las genera exclusivamente el sistema (`crypto.randomInt`, alfabeto sin caracteres ambiguos), se hashean con bcrypt (12 rondas) y se muestran **una sola vez** a quien administra. No hay cambio obligatorio al ingresar ni autoservicio de recuperación. El blanqueo no invalida JWT ya emitidos (vencen a los 7 días); suspender o desactivar sí bloquea el panel en la siguiente petición.

### 4.2 Máquina de Estados y Auditoría (Regla de Oro)
1. **Emprendedores (`EntrepreneurStatus`):**
   - `PENDING`: Estado inicial al registrarse. Sus productos **no son visibles** públicamente aunque estén aprobados.
   - `APPROVED`: Habilitado por un moderador. Sus productos aprobados se muestran en el catálogo.
   - `REJECTED`: Rechazado con motivo explícito. Puede corregir su perfil y reenviar a revisión.
   - `SUSPENDED`: Dado de baja temporalmente por la Municipalidad; oculta automáticamente todos sus productos públicos.

2. **Productos (`ProductStatus` y Caducidad `expires_at`):**
   - `PENDING`: Todo producto nuevo entra aquí. No es visible al público.
   - `APPROVED`: Visible en el catálogo público siempre que el emprendedor esté `APPROVED` y que `expires_at` sea `null` o mayor a la fecha/hora actual (`expires_at > now()`).
   - `PAUSED`: Pausado manualmente por el emprendedor (ej. sin stock). Oculto al público.
   - `REJECTED`: Rechazado por moderación con **motivo obligatorio**. El emprendedor puede editarlo para volver a `PENDING`.
   - `SUSPENDED`: Ocultado por un moderador por incumplimiento.
   - **Caducidad (`expires_at`):** Pensado para productos perecederos o de elaboración diaria (gastronomía/ofertas del día). Todas las consultas del catálogo público deben filtrar obligatoriamente por `status = 'APPROVED'` y `(expires_at IS NULL OR expires_at > now())`.

3. **Regla anti-cuello de botella en ediciones:**
   - Si un producto `APPROVED` actualiza su **fecha de vencimiento (`expires_at`)** o alterna entre `APPROVED` ↔ `PAUSED`, el cambio es **inmediato sin volver a `PENDING`** (se registra en `audit_logs`).
   - Si un producto `APPROVED` modifica **título, descripción, ingredientes, categoría o fotos** —y el emprendedor no es `USER_TRUSTED` / `isTrusted`—, vuelve automáticamente a `PENDING` para re-auditoría municipal.
   - **Regla estricta sin precios:** El catálogo y la base de datos no almacenan ni exhiben precios (`Product` carece de columnas de precio). Toda consulta comercial se coordina directamente vía WhatsApp.

### 4.3 Reglas de WhatsApp
- Los números se almacenan normalizados en formato E.164 argentino sin el `+` para `wa.me`: `549` + código de área (sin `0`) + número local (sin `15`).
- El mensaje prearmado debe incluir el nombre del producto y la referencia al portal municipal, URL-encoded de forma segura. Ejemplo:
  `Hola [Emprendedor]! Vi tu producto "[Nombre Producto]" en el portal de Emprendedores de San Roque y quería consultarte.`

### 4.4 Reglas de Imágenes y Storage (WebP en VPS)
- **Ubicación física:** Directorio configurado por variable de entorno `UPLOAD_DIR` (fuera del repositorio git, ej. `/var/data/muniemprende/uploads` en prod o `./storage/uploads` en dev).
- **Ruta en DB:** Se guarda únicamente la **ruta relativa** (ej. `products/2026/11/<uuid>`), nunca URLs absolutas ni rutas del sistema operativo.
- **Variantes obligatorias al subir:**
  - `thumb`: Ancho máx. 480px, WebP calidad ~78, sin EXIF.
  - `full`: Ancho máx. 1200px, WebP calidad ~82, sin EXIF.
- **Dimensiones obligatorias en DB:** Se deben persistir `width` y `height` reales (del `full` o ratio equivalente) en la tabla de imágenes de producto para renderizar contenedores con `aspect-ratio` sin Layout Shift (CLS = 0).
- **Seguridad:** Validar *magic bytes* reales (solo JPEG, PNG, WebP, HEIC/AVIF si aplica), límite máximo de subida 8 MB por archivo, máximo 4 imágenes por producto. Re-encodear siempre con `sharp` antes de escribir a disco.
- **Servicio en producción:** Nginx sirve `/uploads/*` directamente desde disco con `Cache-Control: public, max-age=31536000, immutable` (el backend Node.js solo sirve la subida en desarrollo o vía ruta dedicada en dev).

---

## 5. Lineamientos UI/UX y Accesibilidad
- **Enfoque:** Mobile-first estricto (diseño pensado para pantallas de 360px-414px como App nativa y conexión 4G), escalando en desktop a contenedores amplios e inmersivos (`max-w-6xl`) con márgenes generosos y respiración visual.
- **Arquitectura de Vistas:**
  - **Ruta `/` (Landing / Home):** Vista con márgenes amplios sobre fondo crema suave (`#FDFBF7`), Header institucional en celeste claro (`brand-sky-light`) con `logo.jpeg` en el extremo izquierdo, Hero editorial (`Impulsando el talento de San Roque` · `Elaboración Sanroqueña`), filtros visuales circulares de rubros (`CategoryVisualFilters.tsx` con vectores de trazo fino de `lucide-react`), exhibición equitativa (`HomeProductShowcase.tsx`: bloque `Gastronomía Sanroqueña` + grilla `Catálogo Destacado` con mismo peso tipográfico y modal de vista rápida con `Sello Local`), sección institucional `'Sumate a Nosotros'` (`JoinUsSection.tsx` con fondo verde vibrante y CTA WhatsApp `3794 819378`) y Banner Institucional del Intendente (`INTENDENTE DE SAN ROQUE` · `Cr. Raúl Pelozo`) antes del footer.
  - **Ruta `/catalogo` (Catálogo Completo con Grilla y Filtros):** La grilla Masonry balanceada (`CLS = 0`) junto con el buscador tolerante a tildes/errores y los filtros visuales circulares por rubro (`CategoryVisualFilters.tsx`) se ubican en `/catalogo`.
- **Dirección de Arte Institucional Oficial (basada en el material gráfico de la Dirección de Empleo y Emprendedores / Producción de San Roque — contraste accesible WCAG AA >= 4.5:1, configurada en `tailwind.config.ts` y `src/app/globals.css`):**
  - **Fondo general de lectura (anti-blanco genérico):** Crema muy suave (`brand-cream`: `#FDFBF7`)
  - **Superficie de tarjetas:** Blanco cálido limpio (`brand-surface`: `#FFFFFF`) **sin bordes** con sombras suaves (`shadow-lg shadow-black/[0.04]` / `shadow-2xl shadow-black/5`)
  - **Terminología oficial en UI:** Prohibido usar `'Certificado'` o `'Certificación Municipal'`; usar siempre **`'Elaboración Sanroqueña'`** o **`'Sello Local'`**.
  - **Sombras:** **Sombras orgánicas amplias y muy suaves** (`shadow-2xl shadow-black/5`) con elevación suave en hover (`-translate-y-1.5`)
  - **Verde Vibrante Institucional (Principal — CTAs, Sección Sumate a Nosotros, Nombre Intendente):** `brand-green` `#3D7A1E` (contraste `5.24:1` con texto blanco `#FFFFFF`), `brand-green-vibrant` `#559125` (gráficos y acentos), `brand-green-hover` `#2E6115`, `brand-green-dark` `#244F10`, `brand-green-soft` `#E7F3DC` y `brand-green-sage` `#C4D9A2`
  - **Amarillo / Naranja Cálido Institucional (Acentos — Badges, "Todos los rubros", Íconos de categorías):** `brand-amber` `#F5A623` (contraste `> 6.7:1` con texto oscuro `#18261C`), `brand-amber-hover` `#E09112`, `brand-amber-gold` `#F7B500`, `brand-amber-soft` `#FEF3DC` y `brand-amber-text` `#8A4F00`
  - **Celeste Claro Institucional (Cabeceras, Fondos Secundarios y Etiquetas):** `brand-sky` `#7498D0`, `brand-sky-light` `#DCE9F9`, `brand-sky-tint` `#EDF4FC` y `brand-sky-dark` `#1F4478`
  - **Texto principal:** Carbón bosque (`brand-ink`: `#18261C`)
  - **Texto secundario:** Pizarra cálido (`brand-muted`: `#4E5D52`)

---

## 6. Modelo de Datos Conceptual (Referencia Base)
> Antes de modificar tablas o columnas, validar contra `prisma/schema.prisma` y actualizar esta sección.

- `users`: `id`, `username` (unique, obligatorio para login), `email` (unique, nullable/opcional), `password_hash`, `role` (`USER_NEW` | `USER_TRUSTED` | `ENTREPRENEUR` | `MODERATOR` | `ADMIN`, por defecto `USER_NEW`), `is_active`, `created_at`, `updated_at`.
- `entrepreneurs`: `id`, `user_id` (unique FK), `business_name`, `slug` (unique), `owner_name`, `whatsapp_number`, `neighborhood`, `bio`, `avatar_path`, `is_trusted` (Boolean, por defecto `false`), `status` (`EntrepreneurStatus`), `rejection_reason`, `approved_at`, `approved_by`, `created_at`, `updated_at`.
- `categories`: `id`, `name`, `slug` (unique), `sort_order`, `is_active`.
- `products`: `id`, `entrepreneur_id` (FK), `category_id` (FK), `title`, `slug` (unique), `description`, `ingredients` (Text nullable, opcional), `status` (`ProductStatus`), `rejection_reason`, `expires_at` (DateTime nullable para caducidad), `approved_at`, `approved_by`, `created_at`, `updated_at`. *(Sin campos de precios).*
- `product_images`: `id`, `product_id` (FK), `relative_path`, `width`, `height`, `sort_order`, `is_primary`, `created_at`.
- `expo_photos` *(2026-11-18)*: `id`, `relative_path` (WebP `thumb`/`full` en `expos/AAAA/MM/<uuid>`), `width`, `height`, `event_date` (`DATE`, fecha de la Expo), `caption` (descripción corta, máx. 200), `is_published` (por defecto `true`), `uploaded_by` (FK `users`, `SET NULL`), `created_at`, `updated_at`. Alimenta la sección pública **"Expo Emprendedores"** de la portada sin depender de programación. Índice `(is_published, event_date DESC)`.
- `audit_logs`: `id`, `actor_user_id` (FK), `entity_type` (`USER` | `ENTREPRENEUR` | `PRODUCT` | `CATEGORY` | `EXPO_PHOTO`), `entity_id`, `action`, `metadata` (JSONB), `created_at`.

---

## 7. Features Futuros / Backlog

### 7.1 Sistema de Permisos Diferenciales (Emprendedores de Confianza)
- **Contexto:** Por la dinámica de un pueblo como San Roque, hay vecinos de trayectoria a los que no se les debe auditar cada cambio.
- **Estado en esquema (2026-11-18):** Soporte incorporado en `prisma/schema.prisma` (`UserRole.USER_TRUSTED` / `USER_NEW` y `Entrepreneur.isTrusted`) y conectado en la lógica de alta y edición de productos del panel `/mi-emprendimiento` (`USER_NEW` envía a revisión `PENDING`; `USER_TRUSTED` / `isTrusted` publica directo en `APPROVED`). La asignación de confianza se hace desde `/admin/emprendedores` (2026-11-18).

### 7.2 Medición de consultas por WhatsApp (estructura documentada, NO implementada)
- **Decisión (2026-11-18):** por ahora no se registran los clics al botón de contacto. `/admin/metricas` muestra el indicador como "todavía no se mide".
- **Estructura prevista:** tabla `contact_clicks` (`id`, `product_id` FK `SET NULL`, `entrepreneur_id` FK, `source` = `home` | `catalogo` | `detalle`, `created_at`; **sin datos personales** ni IP), con índices `(entrepreneur_id, created_at)` y `(product_id, created_at)`. Se registraría con `navigator.sendBeacon` a un Route Handler liviano justo antes de abrir `wa.me`, para no demorar el contacto. Requiere migración versionada y aprobación previa.

---

## 8. Decisiones y Registro de Cambios
- **[2026-11-13] Fundación:** Definido stack Next.js App Router (TS) + PostgreSQL + Prisma + Tailwind + Sharp + Nginx. Establecida regla de aprobación inmediata para cambio de precio/pausa y generación dual de WebP (`thumb` + `full`) con registro de dimensiones en DB.
- **[2026-11-13] Esquema y Migración Inicial (`20261113130919_init`):** Creado `prisma/schema.prisma` y aplicada la migración inicial sobre `muniemprende_dev` con Prisma 7.10.1 (`@prisma/adapter-pg`), extensiones `unaccent` y `pg_trgm`, tablas (`users`, `entrepreneurs`, `categories`, `products`, `product_images`, `audit_logs`), enums (`user_role`, `entrepreneur_status`, `product_status`, `audit_entity_type`) e índices GIN (`gin_trgm_ops`) sobre `products.title` y `entrepreneurs.business_name`.
- **[2026-11-13] Singleton DB y Seed Inicial:** Implementado `src/lib/db.ts` reutilizando `pg.Pool` y `PrismaClient` en `globalThis` en desarrollo. Creado y ejecutado `prisma/seed.ts` con usuario `ADMIN` (`modernizacion@munisanroque.ar`), 7 categorías oficiales (incluyendo `'Otras'`), 1 emprendedor aprobado y 5 productos con imágenes WebP (`_thumb.webp` y `_full.webp`) de distintas proporciones para la grilla Masonry.
- **[2026-11-13] Catálogo Público Mobile-First y Servidor de Imágenes Dev:** Implementado Route Handler `/uploads/[...path]` con protección contra path traversal para servir `.webp` en desarrollo, helpers `src/lib/images.ts` y `src/lib/whatsapp.ts`, consultas cacheadas con validación Zod y búsqueda `unaccent` + `pg_trgm` (`src/lib/catalog.ts`), grilla Masonry balanceada sin CLS (`MasonryCatalogGrid.tsx`, `ProductCard.tsx`) y vista de detalle `/productos/[slug]` con metadatos OpenGraph.
- **[2026-11-13] Caducidad de Productos (`20261113134626_add_product_expiration`):** Agregada columna opcional `expires_at` (`DateTime?`) e índice `(status, expires_at)` en `products`. Actualizadas todas las consultas públicas (`src/lib/catalog.ts`) para exigir `status = APPROVED` y `(expires_at IS NULL OR expires_at > now())`, e incorporados los badges visuales `"Vence hoy"` (<= 24h) y `"Oferta temporal"` (> 24h) en las tarjetas y vista de detalle.
- **[2026-11-13] Autenticación, Sesiones JWT y Middleware de Protección:** Implementado módulo de sesiones con JWT HS256 (Web Crypto API) en cookie `HttpOnly` (`SameSite=Lax`, `Secure` en producción) en `src/lib/session.ts`, esquemas Zod en `src/lib/validations/auth.ts`, Server Actions (`registerEntrepreneurAction`, `loginAction`, `logoutAction`) en `src/app/actions/auth.ts`, protección por rol en `src/middleware.ts` (`/dashboard` para `ENTREPRENEUR` y `/admin` para `MODERATOR`/`ADMIN`) y vistas mobile-first `/login`, `/registro`, `/dashboard` y `/admin`.
- **[2026-11-13] Panel de Moderación Municipal y Auditoría Estricta:** Implementadas Server Actions (`approveEntrepreneurAction`, `rejectEntrepreneurAction`, `approveProductAction`, `rejectProductAction`) en `src/app/actions/moderation.ts` con validación Zod (`src/lib/validations/moderation.ts`), transacciones Prisma con registro obligatorio en `audit_logs` e invalidación de caché (`revalidatePath` + `updateTag`). Construido el Centro de Comando en `/admin` (`AdminCommandCenter.tsx`, `ModerationRowActions.tsx`) con bloque superior de KPIs, sistema de pestañas (`Moderación`, `Estadísticas y Rubros`, `Auditoría / Quién hizo qué`), distribución porcentual por las 7 categorías, padrón general de emprendedores, visor filtrable de `audit_logs` y navegación contextual de sesión en el Header (`HeaderAuthNav.tsx`).
- **[2026-11-15] Maquetación de Landing/Home Institucional (`/`) y Separación de Catálogo (`/catalogo`):** Incorporados los logos oficiales en `public/logo.jpeg`, `public/logo-san-roque.png` y `public/banner-intendente.png`. Reestructurada la ruta `/` como Landing/Home con márgenes amplios, Header institucional (`logo.jpeg` en el extremo izquierdo dimensionado para leer `'San Roque Municipio'` sin deformación), Hero con CTAs (`Explorar Feria` → `/catalogo`, `Soy emprendedor` → `/registro`), carrusel horizontal deslizable de `Productos Destacados` con tarjetas **sin bordes**, sombra orgánica suave (`shadow-2xl shadow-black/5`), foto ocupando el 60–70% superior con bordes superiores redondeados, jerarquía de autoría del taller/emprendedor debajo de la foto seguida del título del producto (**cero precios**), botón limpio de `'Contacto'` en la parte inferior y Banner Institucional del Intendente (`INTENDENTE DE SAN ROQUE` · `Cr. Raúl Pelozo`) antes del footer. Trasladada la grilla Masonry completa con buscador y filtros por rubro a `/catalogo`.
- **[2026-11-16] Panel del Emprendedor Mobile-First (`/dashboard`) e Interruptor Rápido de Feria:** Rediseñada la vista privada `/dashboard/page.tsx` con enfoque mobile-first: cabecera con nombre del emprendimiento, título `'Mis Productos'`, badge de estado (`'Cuenta Verificada y Activa'` / `'En Revisión'`), contador simple de `'Productos Publicados'` (sin métricas de visitas), botón destacado full-width `'+ Cargar Nuevo Producto'` y lista vertical `'Mis Publicaciones'` con miniatura, título (sin precio) e interruptor táctil `'Disponible en Feria'` (`ProductAvailabilitySwitch.tsx`). Implementada la validación Zod (`src/lib/validations/product.ts`) y la Server Action `toggleProductAvailabilityAction` (`src/app/actions/products.ts`) para alternar productos aprobados entre `APPROVED` y `PAUSED` con verificación de propiedad, registro obligatorio en `audit_logs` (incluyendo `entrepreneurId`) e invalidación de caché y rutas públicas (`updateTag` + `revalidatePath`).
- **[2026-11-16] Catálogo Boutique sin Precios, Skeleton Loaders y Alta de Producto (`createProductAction`):** Actualizado `ProductCard.tsx` y `/catalogo/page.tsx` para unificar el diseño de tarjetas premium sin bordes (`bg-white shadow-2xl shadow-black/5`), sin precios, con jerarquía de autoría y botón directo a WhatsApp. Creados los `loading.tsx` (`src/app/loading.tsx`, `src/app/catalogo/loading.tsx`, `src/app/dashboard/loading.tsx`, `src/app/admin/loading.tsx`) con esqueletos `animate-pulse` fieles a cada vista. Implementada `createProductAction` en `src/actions/products.ts` (con helper de procesamiento seguro de imágenes `src/lib/server/image-upload.ts` —validación de *magic bytes*, strip EXIF, variantes WebP `thumb`/`full` vía `sharp`— y `bodySizeLimit: "10mb"` en `next.config.ts`) para dar de alta productos sin precio en estado obligatorio `PENDING`, registrar `CREATE_PRODUCT_PENDING` en `audit_logs` e invalidar `/dashboard` y `/admin`.
- **[2026-11-16] Giro Arquitectónico a PWA (Progressive Web App):** Por directiva de la dirección municipal, se establece que la plataforma opera como una **PWA instalable** sin pasar por tiendas de aplicaciones y **no se desarrollarán apps nativas en Kotlin ni Swift**. Implementado `src/app/manifest.ts` (`name: 'MuniEmprende - Feria Digital de San Roque'`, `short_name: 'MuniEmprende'`, `display: 'standalone'`, `theme_color: '#0E4B27'`, `background_color: '#F6F3EC'`), inyectados los metadatos y `viewport` de PWA en `src/app/layout.tsx` (`manifest`, `theme-color`, `apple-mobile-web-app-capable`, `appleWebApp` e `icons`) y generados los placeholders `/public/icon-192x192.png` y `/public/icon-512x512.png` listos para ser reemplazados por los íconos oficiales definitivos.
- **[2026-11-17] Evolución a PWA / App Híbrida con Capacitor (Android — Modo WebView Wrapper):** Instalados `@capacitor/core`, `@capacitor/android` y `@capacitor/cli` (v8.6.2) y generada la plataforma nativa `android/`. Tras validar que la exportación estática (`output: 'export'`) es incompatible con el monolito actual (SSR, Server Actions, Middleware, `cookies()` y PostgreSQL), se adoptó la estrategia de **WebView (Wrapper)** consumiendo el servidor Next.js en vivo: eliminado `output: 'export'` de `next.config.ts` (manteniendo `images: { unoptimized: true }`) y configurado `capacitor.config.ts` (`appId: 'com.sanroque.muniemprende'`, `appName: 'MuniEmprende'`, sin `webDir` y con `server: { url: 'https://muniemprende.sanroque.gob.ar', cleartext: true }`).
- **[2026-11-17] Nueva Dirección de Arte Institucional, Diseño Aprobado de Home (`/`), Equilibrio de Rubros y Sección 'Sumate a Nosotros':** Basada en el material gráfico oficial de la Dirección de Empleo y Emprendedores y el layout aprobado en Stitch. Creado `tailwind.config.ts` (vinculado vía `@config` en `src/app/globals.css`) con la paleta institucional: verde vibrante (`brand-green`: `#3D7A1E` / `#559125`), acentos amarillo/naranja cálido (`brand-amber`: `#F5A623` / `#F7B500`), celeste claro (`brand-sky`: `#7498D0` / `#DCE9F9` / `#EDF4FC`) y fondo crema muy suave (`brand-cream`: `#FDFBF7`). Instalado `lucide-react` e implementado `CategoryVisualFilters.tsx` con vectores de trazo fino (`ChefHat`, `Hammer`, `Spool`, `Laptop`, `Sprout`, `Wrench`, `Store`, `LayoutGrid`) en `/` y `/catalogo`. Creado `HomeProductShowcase.tsx` (y `getHomeShowcaseData` en `src/lib/catalog.ts`) con el bloque `'Gastronomía Sanroqueña'` y `'Catálogo Destacado'` con peso tipográfico y protagonismo equitativo entre rubros, más modal de vista rápida con `'Sello Local'` / `'Elaboración Sanroqueña'` (eliminando cualquier referencia a `'Certificado'`). Creado `JoinUsSection.tsx` en `/` con fondo verde institucional y botón `'Comunicate al 3794 819378'` enlazado a WhatsApp (`https://wa.me/5493794819378`). Actualizados `layout.tsx`, `manifest.ts`, `HeaderAuthNav.tsx`, `ProductCard.tsx`, `productos/[slug]/page.tsx` y skeletons.
- **[2026-11-17] Evolución de Esquema DB (Permisos Diferenciales, Ingredientes y Cero Precios):** Actualizados `memory.md` y `prisma/schema.prisma`, y aplicadas las migraciones versionadas `20261117111200_add_user_roles_and_ingredients` y `20261117111201_update_roles_and_remove_prices` sobre `muniemprende_dev`: agregados `USER_TRUSTED` y `USER_NEW` (nuevo valor por defecto en `User.role`) al enum `UserRole`, incorporado `isTrusted` (`is_trusted`, índice `(status, is_trusted)`) en `Entrepreneur`, agregado campo opcional `ingredients` (`Text`) en `Product` y eliminadas las columnas de precio `priceArs` (`price_ars`) y `lastPriceUpdateAt` (`last_price_update_at`) junto con sus referencias residuales en `src/lib/catalog.ts`, `src/app/admin/page.tsx`, `src/components/admin/AdminCommandCenter.tsx`, `src/app/productos/[slug]/page.tsx` y `prisma/seed.ts`.
- **[2026-11-17] Refactorización Visual de Navbar y Footer Institucional:** Unificados los accesos de cuenta pública en `HeaderAuthNav.tsx` en el botón secundario `'Acceso Emprendedores'`; integrado el escudo municipal transparente `/logo-san-roque.png` en `layout.tsx` sobre cabecera crema con `mix-blend-mode: multiply` y filtro celeste/azulino monocromático (`.municipal-shield-sky`); creado `src/components/layout/Footer.tsx` en verde oscuro institucional (`bg-brand-green-dark`) con escudo en blanco puro (`brightness-0 invert`), enlaces útiles, contacto WhatsApp de la Dirección de Empleo (`3794 819378`), aviso legal y la tarjeta superior del `'Intendente de San Roque · Cr. Raúl Pelozo'` en tono celeste pastel (`bg-brand-sky-tint`).
- **[2026-11-17] Autenticación por Nombre de Usuario (`username`) y Email Opcional (`20261117112800_add_username_and_optional_email`):** Modificado el modelo `User` en `prisma/schema.prisma` para incorporar `username` (`String @unique`, obligatorio, con backfill automático sobre usuarios existentes) y volver `email` opcional (`String? @unique`), manteniendo `whatsappNumber` estrictamente obligatorio en `Entrepreneur`. Actualizados `src/lib/validations/auth.ts`, `src/lib/session.ts`, `src/app/actions/auth.ts`, `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/components/layout/HeaderAuthNav.tsx`, `src/app/admin/page.tsx` y `prisma/seed.ts`.
- **[2026-11-18] Panel del Emprendedor (`/mi-emprendimiento`) y Endpoints Prisma:** Implementado el nuevo panel mobile-first `/mi-emprendimiento` (con redirección de compatibilidad desde `/dashboard`, actualización de `middleware.ts`, `HeaderAuthNav.tsx` y `auth.ts`) con paleta celeste pastel (`#E8F1F8`), amarillo suave (`#FEF3DC`) y verde institucional (`#3D7A1E`). Incluye: (1) sección `Identidad de mi Emprendimiento` con subida de logo/foto optimizada en cliente vía Canvas (`src/lib/client/image-compress.ts`) y edición rápida de nombre, WhatsApp obligatorio, barrio y descripción; (2) botón gigante `Subir Nuevo Producto` con asistente en 3 pasos (foto comprimida en cliente, título y rubro sin precios, descripción e ingredientes condicionales solo para Gastronomía) y flujo diferencial `USER_NEW` (`PENDING` + cartel amarillo) vs `USER_TRUSTED` (publicación directa `APPROVED`); (3) tarjetas de control `Mis Productos Publicados` con estado (`Publicado` / `En revisión` / `Agotado hoy`), interruptor grande `Disponible / Agotado hoy` y acciones `Editar` y `Eliminar`. Conectado a los Route Handlers Prisma (`/api/mi-emprendimiento/perfil`, `/api/mi-emprendimiento/productos`, `/api/mi-emprendimiento/productos/[id]`, `/api/mi-emprendimiento/productos/[id]/disponibilidad`) con validación Zod, *magic bytes* + `sharp` WebP, `audit_logs` e invalidación de caché pública.
- **[2026-11-18] Nuevo Panel de Administración (`/admin`) y Galería de Expos (`20261118135058_add_expo_photos`):** Rediseñado `/admin` exclusivamente para `ADMIN` (verificado contra el estado vivo en PostgreSQL en `requireAdmin`/`requireAdminPage`, `middleware.ts` sin bloqueos por JWT desactualizado y `HeaderAuthNav.tsx` leyendo el rol vivo) con diseño exclusivo desktop (`md:block` + aviso amable en `< 768px`) y navegación lateral en 7 rutas: `/admin` (resumen ejecutivo y alertas de rubros vacíos), `/admin/moderacion` (vista previa de tarjeta pública + aprobar, pedir corrección o pausar), `/admin/emprendedores` (búsqueda sin tildes, filtros, cambio `USER_NEW` ↔ `USER_TRUSTED`, suspensión/reactivación, blanqueo rápido de contraseña y exportación CSV), `/admin/galeria` (tabla `expo_photos`, subida WebP en `expos/` para Prensa y sección `Expo Emprendedores` en la portada pública `/`), `/admin/metricas` (oferta por rubro, evolución semanal, exportación CSV de productos y estado documentado para WhatsApp), `/admin/actividad` (historial legible de `audit_logs`) y `/admin/usuarios` (alta de usuarios de cualquier rol con clave temporal generada en servidor y control de acceso del equipo).
