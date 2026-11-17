# MuniEmprende — Feria Digital de San Roque

Portal web oficial y aplicación híbrida (PWA + Android Wrapper) de la **Municipalidad de San Roque** (Dirección de Empleo y Emprendedores), diseñado para visibilizar la producción local y conectar directamente a vecinos con emprendedores y artesanos sanroqueños vía WhatsApp.

> **Modelo de vidriera comunitaria:** MuniEmprende no es un e-commerce. No maneja carritos, pasarelas de pago ni precios en base de datos; cada consulta comercial se coordina mano a mano entre el vecino y el emprendedor mediante enlaces prearmados de WhatsApp.

---

## Características Principales

### Catálogo Público Mobile-First
- **Landing Institucional (`/`):** Presentación comunitaria, filtros circulares por rubro, exhibición destacada de **Gastronomía Sanroqueña** y **Catálogo Destacado** equilibrado entre rubros, vista rápida de productos y sección de contacto institucional.
- **Catálogo Completo (`/catalogo`):** Grilla Masonry sin *Layout Shift* (`CLS = 0` usando dimensiones `width`/`height` persistidas en DB), filtros por categoría y buscador tolerante a tildes y errores tipográficos con PostgreSQL `unaccent` + `pg_trgm`.
- **Detalle de Producto (`/productos/[slug]`):** Galería WebP optimizada, descripción, ingredientes opcionales, perfil del emprendedor, metadatos OpenGraph para compartir en redes/WhatsApp y botón directo de contacto.

### Portal del Emprendedor (`/dashboard`, `/registro`, `/login`)
- Autenticación pensada para accesibilidad local mediante **nombre de usuario (`username`)** y contraseña (con correo electrónico opcional) mediante sesiones JWT HS256 en cookies `HttpOnly`.
- Registro con validación y normalización automática de número de WhatsApp argentino (`549 + área + número`) y botón de prueba en vivo.
- Alta de productos con procesamiento seguro de imágenes en servidor (validación por *magic bytes*, eliminación de metadatos EXIF y conversión a WebP `thumb` y `full` con `sharp`).
- Interruptor rápido **Disponible en Feria** (`APPROVED` ↔ `PAUSED`) con revalidación de caché e historial en auditoría.

### Centro de Comando y Auditoría Municipal (`/admin`)
- Cola de aprobación de emprendedores y productos pendientes, con **motivo obligatorio** en rechazos.
- Soporte en esquema para perfiles de confianza (`USER_TRUSTED` / `USER_NEW` e `isTrusted`).
- Estadísticas por rubro, padrón de emprendedores y visor de trazabilidad en `audit_logs`.

### PWA e Integración Móvil (Capacitor)
- Web App Manifest (`/manifest.webmanifest`) instalable desde el navegador.
- Plataforma nativa `android/` configurada con **Capacitor (`com.sanroque.muniemprende`)** en modo WebView apuntando al servidor Next.js en vivo.

---

## Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | Next.js `16.4.6` (App Router, Server Actions, Cache Components) + React `19` + TypeScript `5` |
| **Estilos e Íconos** | Tailwind CSS `4` + `lucide-react` |
| **Base de Datos** | PostgreSQL (`unaccent`, `pg_trgm`) |
| **ORM y Migraciones** | Prisma `7.10.1` (`@prisma/adapter-pg` + `pg`) |
| **Validación y Auth** | Zod `4`, `bcryptjs`, JWT HS256 (`HttpOnly`, `SameSite=Lax`) |
| **Imágenes** | `sharp` (WebP `thumb` 480px y `full` 1200px, strip EXIF) |
| **App Híbrida** | Capacitor `8.6.2` (`@capacitor/core`, `@capacitor/android`) |

---

## Estructura del Proyecto

```text
├── prisma/
│   ├── schema.prisma          # Modelos, enums e índices GIN (pg_trgm)
│   ├── migrations/            # Migraciones SQL versionadas
│   └── seed.ts                # Datos iniciales (ADMIN, categorías, productos demo + WebP)
├── public/                    # Logos municipales, banner e íconos PWA
├── android/                   # Proyecto nativo Android (Capacitor WebView wrapper)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing / Home institucional
│   │   ├── catalogo/          # Catálogo público completo con búsqueda y filtros
│   │   ├── productos/[slug]/  # Detalle público y OpenGraph
│   │   ├── login/ y registro/ # Acceso y alta de emprendedores por username
│   │   ├── dashboard/         # Panel privado del emprendedor
│   │   ├── admin/             # Panel de moderación y auditoría municipal
│   │   ├── uploads/[...path]/ # Servidor de imágenes locales en desarrollo
│   │   └── actions/           # Server Actions (auth, moderación, productos)
│   ├── components/            # Componentes UI (home, catalog, auth, dashboard, admin, layout)
│   ├── lib/                   # DB pool/singleton, sesiones, catálogo, Zod, WhatsApp, sharp
│   └── middleware.ts          # Protección de rutas por rol (/dashboard y /admin)
├── capacitor.config.ts
└── tailwind.config.ts
```

---

## Cómo Levantar el Proyecto en Local

### 1. Requisitos previos
- **Node.js** 20 o superior y **npm**
- **PostgreSQL** 14+ corriendo localmente

### 2. Clonar e instalar dependencias

```bash
git clone https://github.com/ramirocurima4/muni-emprende.git
cd muni-emprende
npm install
```

### 3. Crear la base de datos en PostgreSQL
Creá la base de datos local (por defecto `muniemprende_dev`). Las extensiones `pg_trgm` y `unaccent` se habilitan automáticamente en la migración inicial, siempre que el usuario de conexión tenga permisos para crearlas (o podés habilitarlas previamente como superusuario):

```sql
CREATE DATABASE muniemprende_dev;
```

### 4. Configurar variables de entorno
Copiá el archivo de ejemplo y completá tus credenciales locales:

```bash
cp .env.example .env
```

Variables definidas en [`.env.example`](.env.example):

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/muniemprende_dev?schema=public"
JWT_SECRET="cambiar_por_un_secreto_aleatorio_seguro_de_al_menos_32_caracteres"
UPLOAD_DIR="./storage/uploads"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_ADMIN_PASSWORD="MuniSanRoque2026!"
SEED_DEMO_PASSWORD="EmprendeSanRoque2026!"
```

### 5. Aplicar migraciones y cargar datos de prueba (Seed)

```bash
npx prisma migrate deploy
npm run db:seed
```

El script `npm run db:seed` crea:
- El usuario administrador municipal.
- Las 7 categorías oficiales (`Gastronomía`, `Artesanías y Decoración`, `Textil e Indumentaria`, `Tecnología y Servicios Digitales`, `Vivero y Jardinería`, `Oficios y Servicios`, `Otras`).
- Un emprendedor de prueba aprobado y 5 productos de ejemplo con variantes WebP generadas automáticamente en `UPLOAD_DIR`.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Usuarios de Prueba (Seed de Desarrollo)

Después de correr `npm run db:seed`, podés iniciar sesión en [`/login`](http://localhost:3000/login) con:

| Rol | Usuario (`username`) | Contraseña por defecto (`.env.example`) | Ruta destino |
| :--- | :--- | :--- | :--- |
| **Admin Municipal** | `modernizacion` | `MuniSanRoque2026!` *(o `SEED_ADMIN_PASSWORD`)* | `/admin` |
| **Emprendedor Demo** | `feria.donroque` | `EmprendeSanRoque2026!` *(o `SEED_DEMO_PASSWORD`)* | `/dashboard` |

---

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia Next.js en modo desarrollo |
| `npm run build` | Compila el build de producción |
| `npm run start` | Ejecuta el servidor en modo producción |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm run db:seed` | Ejecuta el seed idempotente en PostgreSQL |
| `npx tsc --noEmit` | Verifica el tipado estricto de TypeScript |
| `npx prisma validate` | Valida el archivo `prisma/schema.prisma` |

---

## Licencia y Uso Institucional

Proyecto desarrollado para la **Municipalidad de San Roque — Dirección de Empleo y Emprendedores** (Corrientes, Argentina).
