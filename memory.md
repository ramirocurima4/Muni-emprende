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
   - **Pantalla 1 — Landing / Home (`/`):** La ruta raíz `/` es una **Landing/Home** institucional y boutique con márgenes amplios y carrusel de destacados:
     - **Header Institucional:** En el extremo izquierdo se ubica el logo municipal (`/logo.jpeg`) dimensionado con `object-contain` (`h-14 sm:h-16`) para que se lea nítidamente `'San Roque Municipio'` sin deformarse.
     - **Hero Section (Introducción):** Título `'Descubrí el talento de San Roque. Productos locales directo a tus manos'`, subtítulo breve sobre la vinculación directa vía WhatsApp y dos botones: `'Explorar Feria'` (hacia `/catalogo`) y `'Soy emprendedor'` (hacia `/registro`).
     - **Feed Deslizable (`Productos Destacados`):** Carrusel horizontal *swipeable* con tarjetas **sin bordes**, sombra orgánica amplia y muy suave (`shadow-2xl shadow-black/5`) para que la tarjeta flote y la foto salte a la vista, imagen ocupando el **60–70% superior** con bordes superiores redondeados, jerarquía de autoría clara debajo de la foto (subtítulo/etiqueta destacada con ícono sutil y el nombre del taller/emprendedor seguido del título del producto, **cero precios**) y un botón limpio de `'Contacto'` en la parte inferior de la tarjeta (fuera de la foto).
     - **Banner Institucional del Intendente:** Al final de la página (antes del footer), tira horizontal con escudo circular, `'INTENDENTE DE SAN ROQUE'` (mostaza/dorado `#9E8229`) y `'Cr. Raúl Pelozo'` (verde institucional `#0E4B27`).
   - **Pantalla 2 — El Catálogo Completo (`/catalogo`):** La grilla Masonry con barra de búsqueda (tolerante a tildes y errores leves con `unaccent` + `pg_trgm`) y filtros tipo pastilla (*pills*) por categorías oficiales se mueve a la ruta `/catalogo` (`CLS = 0`).
   - Vista de detalle de producto (`/productos/[slug]`) con galería de fotos, precio (o "Consultar"), descripción, perfil público del emprendedor y botón principal a WhatsApp.
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
- **Apps móviles nativas en Kotlin (Android) o Swift (iOS):** No se desarrollarán aplicaciones nativas para tiendas de aplicaciones (Google Play / App Store). Por directiva de la dirección municipal, **MuniEmprende funciona como una PWA (Progressive Web App)** instalable directamente desde el navegador del celular.

---

## 3. Stack Tecnológico Final

- **Runtime / Framework:** Next.js 16 (App Router) con TypeScript (monolito modular full-stack).
- **Arquitectura Móvil / Distribución:** **PWA (Progressive Web App)** con Web App Manifest (`src/app/manifest.ts` → `/manifest.webmanifest`, `display: 'standalone'`), metadatos mobile/iOS (`apple-mobile-web-app-capable`, `theme-color: '#0E4B27'`) e íconos de instalación (`192x192` y `512x512` en `/public`), prescindiendo por completo de desarrollos nativos en Kotlin/Swift.
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
- `ENTREPRENEUR`: Puede gestionar su perfil y sus propios productos. No accede al panel admin.
- `MODERATOR`: Empleado municipal de Modernización/Empleo. Puede aprobar/rechazar/suspender emprendedores y productos, y gestionar categorías.
- `ADMIN`: Superadministrador técnico/municipal. Todo lo de `MODERATOR` + gestión de usuarios moderadores.

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
   - Si un producto `APPROVED` cambia **precio**, actualiza su **fecha de vencimiento (`expires_at`)** o alterna entre `APPROVED` ↔ `PAUSED`, el cambio es **inmediato sin volver a `PENDING`** (se registra en `audit_logs`).
   - Si un producto `APPROVED` modifica **título, descripción, categoría o fotos**, vuelve automáticamente a `PENDING` para re-auditoría municipal.

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
  - **Ruta `/` (Landing / Home con Carrusel):** Vista con márgenes amplios, Header institucional con `logo.jpeg` en el extremo izquierdo, Hero introductorio (`Explorar Feria` → `/catalogo`, `Soy emprendedor` → `/registro`), carrusel horizontal deslizable de `Productos Destacados` (tarjetas **sin bordes**, sombra orgánica suave `shadow-2xl shadow-black/5`, foto en el 60–70% superior con bordes superiores redondeados, subtítulo de autoría del taller/emprendedor seguido del título del producto, **cero precios** y botón limpio `'Contacto'` en la parte inferior) y Banner Institucional del Intendente (`INTENDENTE DE SAN ROQUE` · `Cr. Raúl Pelozo`) antes del footer.
  - **Ruta `/catalogo` (Catálogo Completo con Grilla y Filtros):** La grilla Masonry balanceada (`CLS = 0`) junto con el buscador tolerante a tildes/errores y los filtros por rubro (*pills*) se ubican en `/catalogo`.
- **Dirección Estética Premium Institucional (con contraste accesible WCAG AA >= 4.5:1):**
  - Fondo principal: Crema cálido suave (`#F6F3EC`)
  - Superficie de tarjetas: Blanco / Marfil (`#FFFFFF` / `#FDFBF7`) **sin bordes** en el carrusel de destacados
  - Sombras: **Sombras orgánicas amplias y muy suaves** (`shadow-2xl shadow-black/5`) con elevación suave en hover (`-translate-y-1.5`)
  - Verde Institucional Principal (San Roque Municipio / CTAs / Nombre Intendente): `#0E4B27` / `#145231` (hover `#0A381D`) con texto blanco `#FFFFFF`
  - Dorado / Mostaza Institucional (Leyenda `INTENDENTE DE SAN ROQUE` / Detalles de acento): `#9E8229` / `#B5892E` y superficie suave `#F7EFE0` con texto `#5C430E`
  - Acento secundario verde (Tags suaves): `#E6F0EA` con texto `#0E4B27`
  - Texto principal: Carbón bosque (`#1C2420`)
  - Texto secundario: Pizarra cálido (`#525E57`)

---

## 6. Modelo de Datos Conceptual (Referencia Base)
> Antes de modificar tablas o columnas, validar contra `prisma/schema.prisma` y actualizar esta sección.

- `users`: `id`, `email` (unique), `password_hash`, `role` (`ENTREPRENEUR` | `MODERATOR` | `ADMIN`), `is_active`, `created_at`, `updated_at`.
- `entrepreneurs`: `id`, `user_id` (unique FK), `business_name`, `slug` (unique), `owner_name`, `whatsapp_number`, `neighborhood`, `bio`, `avatar_path`, `status` (`EntrepreneurStatus`), `rejection_reason`, `approved_at`, `approved_by`, `created_at`, `updated_at`.
- `categories`: `id`, `name`, `slug` (unique), `sort_order`, `is_active`.
- `products`: `id`, `entrepreneur_id` (FK), `category_id` (FK), `title`, `slug` (unique), `description`, `price_ars` (Decimal/Int nullable si es "A consultar"), `status` (`ProductStatus`), `rejection_reason`, `last_price_update_at`, `expires_at` (DateTime nullable para caducidad), `approved_at`, `approved_by`, `created_at`, `updated_at`.
- `product_images`: `id`, `product_id` (FK), `relative_path`, `width`, `height`, `sort_order`, `is_primary`, `created_at`.
- `audit_logs`: `id`, `actor_user_id` (FK), `entity_type`, `entity_id`, `action`, `metadata` (JSONB), `created_at`.

---

## 7. Features Futuros / Backlog

### 7.1 Sistema de Permisos Diferenciales (Emprendedores de Confianza)
- **Contexto:** Por la dinámica de un pueblo como San Roque, hay vecinos de trayectoria a los que no se les debe auditar cada cambio.
- **Regla:** Se debe agregar en el futuro un campo tipo flag (ej. `isTrusted` o `autoApprove`) en el modelo del Emprendedor (`entrepreneurs`). Los perfiles que el `ADMIN` marque con este permiso especial saltarán la cola de moderación, y sus productos/ediciones pasarán directamente a estado `APPROVED`.

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
