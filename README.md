# MuniEmprende — Portal Oficial de Emprendedores de San Roque

Portal web oficial y aplicación híbrida (PWA + Android Capacitor WebView) desarrollado por la **Dirección de Modernización** para la **Dirección de Empleo y el Área de Producción de la Municipalidad de San Roque** (Corrientes, Argentina).

> **Modelo de vidriera comunitaria sin intermediarios:** MuniEmprende no es un e-commerce. No maneja precios, carritos ni pasarelas de pago; el vecino explora la producción local con sello de **Elaboración Sanroqueña** y se comunica directamente con cada emprendedor por **WhatsApp**.

---

## 1. Arquitectura Funcional y Roles del Portal

### Espacios del Portal
- **Portada Pública y Catálogo (`/`, `/catalogo`, `/productos/[slug]` y `/?emprendedor=[slug]`):**
  - Portada mobile-first con buscador tolerante a tildes y errores tipográficos (`unaccent` + `pg_trgm`), filtros circulares por rubro (ocultando categorías vacías), exhibición equitativa (**Gastronomía Sanroqueña** y **Catálogo Destacado**), vitrina de emprendimientos activos y **vidriera compartible individual** (`/?emprendedor=[slug]`).
  - Soporte para **productos individuales** y **combos / listas de variedades**, insignias de modalidad de entrega (*Retiro*, *Envío*, *En Feria*) y vista rápida con botón directo a WhatsApp.
- **Diarios Virtuales de Ferias (`/expo-emprendedores` y `/mercado-sanroqueno`):**
  - Dos portales diferenciados para la **Expo Emprendedores** (Dirección de Empleo) y el **Mercado Sanroqueño** (Área de Producción).
  - Muestran la próxima fecha, horario, lugar con acceso directo a Google Maps, botón de inscripción por WhatsApp específico de cada área y crónicas multi-foto o video corto (`.mp4`/`.webm`).
- **Panel Autogestionable de Emprendedores (`/mi-emprendimiento`, `/registro`, `/login`):**
  - Acceso simple mediante **nombre de usuario (`username`)** y contraseña (correo electrónico opcional) con sesiones JWT HS256 en cookies `HttpOnly`.
  - Gestión de identidad comercial (logo optimizado a WebP, WhatsApp normalizado `549...`, barrio, bio y modalidades de entrega), botón para **compartir la vidriera propia por WhatsApp**, asistente de carga de productos o combos en 3 pasos, interruptor rápido **Disponible / Agotado hoy** (`APPROVED` ↔ `PAUSED`) y acción **Activar para hoy · Subir arriba**.
- **Panel Administrativo Municipal (`/admin` — exclusivo escritorio `>= 768px`):**
  - `/admin`: Resumen ejecutivo y alertas de rubros sin oferta.
  - `/admin/moderacion`: Revisión y aprobación/rechazo (con motivo obligatorio) de productos pendientes.
  - `/admin/emprendedores`: Padrón general, habilitación de cuentas nuevas, asignación de perfil de confianza (`USER_NEW` ↔ `USER_TRUSTED`), suspensión, blanqueo de clave y exportación CSV.
  - `/admin/galeria`: Publicación de crónicas multi-foto y videos cortos para Expo Emprendedores y Mercado Sanroqueño.
  - `/admin/configuracion`: **Configuración institucional por áreas** en vivo (WhatsApp oficial de Dirección de Empleo y de Producción, fechas/horarios/lugares/Maps de próximas ferias, autoridad municipal y aviso legal del pie de página).
  - `/admin/metricas`, `/admin/actividad` y `/admin/usuarios`: Estadísticas por rubro, auditoría completa (`audit_logs`) y alta/gestión de usuarios municipales.

### Roles de Usuario
| Rol | Descripción | Acceso |
| :--- | :--- | :--- |
| `ADMIN` | Equipo de Modernización, Dirección de Empleo o Comunicación. Modera, administra usuarios, crónicas y configuración por áreas. | `/admin` |
| `USER_TRUSTED` | Emprendedor de confianza habilitado para publicar y editar productos directamente en estado `APPROVED` sin pasar por moderación previa. | `/mi-emprendimiento` |
| `USER_NEW` | Emprendedor nuevo (por defecto al registrarse). Sus altas y ediciones pasan a revisión (`PENDING`) hasta ser aprobadas por el municipio. | `/mi-emprendimiento` |
| `MODERATOR` | Rol reservado en esquema para futuras vistas de solo lectura (sin acceso operativo actual a `/admin`). | — |

---

## 2. Stack Tecnológico

- **Framework:** Next.js 16 (App Router, `output: "standalone"`, Cache Components, Server Actions) + React 19 + TypeScript 5
- **Estilos e Íconos:** Tailwind CSS 4 + `lucide-react`
- **Base de Datos y ORM:** PostgreSQL 16 (`unaccent`, `pg_trgm`) + Prisma 7 (`@prisma/adapter-pg`)
- **Almacenamiento Multimedia:** Supabase Storage (bucket público `muniemprende`) + procesamiento en servidor con `sharp` (WebP `_thumb` y `_full`, strip EXIF y validación por *magic bytes*)
- **Validación y Seguridad:** Zod 4, `bcryptjs` (12 rondas) y JWT HS256 en cookies `HttpOnly`
- **App Híbrida / Móvil:** PWA (`/manifest.webmanifest`) + Capacitor 8 (`android/`, `com.sanroque.muniemprende`)
- **Producción:** Docker multi-etapa (`Dockerfile` + `docker-compose.yml`)

---

## 3. Cómo Levantar el Proyecto en Desarrollo Local

### Requisitos previos
- **Node.js** `>= 20` y **npm**
- **PostgreSQL** `>= 14` (local o vía Docker)

### Pasos rápidos

```bash
# 1. Clonar e instalar dependencias
git clone <URL_DEL_REPOSITORIO_GIT>
cd muni-emprende
npm install

# 2. Copiar plantilla de variables de entorno y completar valores
cp .env.example .env

# 3. Sincronizar esquema en PostgreSQL (habilita unaccent y pg_trgm)
npx prisma db push

# 4. Cargar base limpia de producción (Superadmin + 7 categorías + configuración base)
npx prisma db seed

# 5. Iniciar entorno de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 4. Cómo Correr la Demo Completa (`npm run demo:load`)

Para presentaciones institucionales, capacitaciones o pruebas integrales sin alterar el seed limpio de producción (`prisma/seed.ts`), el proyecto cuenta con el script separado [`prisma/seed-demo.ts`](prisma/seed-demo.ts).

### Cargar los datos de demostración

```bash
# Asegurate de tener el esquema aplicado y tu .env configurado
npx prisma db push
npm run demo:load
```

**¿Qué carga `npm run demo:load`?**
- Verifica la cuenta maestra **Superadmin** leyendo `SUPERADMIN_USERNAME` y `SUPERADMIN_PASSWORD` desde `.env` (fallback `modernizacion` / `SanRoque2026!`).
- Configura `SystemConfig` y `FairConfig` con fechas próximas realistas en **Plaza Libertad** y números de WhatsApp de prueba.
- Crea **6 emprendimientos ficticios de San Roque** (5 aprobados + 1 pendiente para probar la moderación).
- Crea **12 productos variados** con fotos reales de Unsplash (Gastronomía, Artesanías, Textil e Indumentaria y Vivero), incluyendo **4 combos con variedades (`isCombo: true`)** y **1 producto marcado como `PAUSED` (*Agotado hoy*)**.
- Publica **4 crónicas de feria** estilo diario digital (**2** en `/expo-emprendedores` y **2** en `/mercado-sanroqueno`).

### Usuarios de prueba creados por la Demo

Podés ingresar en [`/login`](http://localhost:3000/login) con cualquiera de estas cuentas:

| Usuario (`username`) | Contraseña | Rol / Estado | Emprendimiento / Uso en Demo |
| :--- | :--- | :--- | :--- |
| `SUPERADMIN_USERNAME` *(por defecto `modernizacion`)* | `SUPERADMIN_PASSWORD` *(por defecto `SanRoque2026!`)* | `ADMIN` | Acceso completo al panel `/admin` y `/admin/configuracion` |
| `sabores_del_rio` | `Emprendedor2026!` | `USER_TRUSTED` · `APPROVED` | **Sabores del Río** (Barrio Norte) — combos gastronómicos y 1 producto `PAUSED` (*Agotado hoy*) |
| `artesanias_ibera` | `Emprendedor2026!` | `USER_TRUSTED` · `APPROVED` | **Artesanías Iberá** (Centro) — mates, materas y tablas de algarrobo |
| `huerta_sanroquena` | `Emprendedor2026!` | `USER_TRUSTED` · `APPROVED` | **Huerta Sanroqueña** (Barrio Sur) — bolsones de verdura, huevos y vivero |
| `dulces_abuela` | `Emprendedor2026!` | `USER_NEW` · `APPROVED` | **Dulces de la Abuela** (Barrio Estación) — dulces regionales y combo dulcero (prueba flujo de moderación al crear productos) |
| `textil_correntino` | `Emprendedor2026!` | `USER_TRUSTED` · `APPROVED` | **Textil Correntino** (Barrio San Cayetano) — telar e indumentaria bordada |
| `nuevo_puesto_sr` | `Emprendedor2026!` | `USER_NEW` · `PENDING` | **Nuevo Puesto San Roque** (Barrio San José) — cuenta **pendiente** para probar la aprobación en `/admin/emprendedores` |

### Volver a dejar la base limpia para Producción (`npm run demo:clean`)

Cuando termines la presentación y quieras eliminar por completo todos los datos ficticios (dejando únicamente al **Superadmin**, las **7 categorías oficiales** y la **configuración institucional base**):

```bash
npm run demo:clean
```

> Este comando ejecuta `npx prisma db push --force-reset && npx prisma db seed`. **Precaución:** reinicia todas las tablas de la base de datos apuntada por `DATABASE_URL`; nunca ejecutarlo sobre una base con datos reales de emprendedores en producción.

---

## 5. Despliegue en Producción (VPS + Docker)

El proyecto está empaquetado con **Next.js Standalone** y **Docker multi-etapa** ([`Dockerfile`](Dockerfile) + [`docker-compose.yml`](docker-compose.yml)). Para la guía operativa completa paso a paso, consultá **[`DEPLOY.md`](DEPLOY.md)**.

### Resumen rápido de despliegue en el VPS

1. **Configurar `.env`** a partir de [`.env.example`](.env.example):
   - `DATABASE_URL`: cadena de conexión a PostgreSQL (contenedor `db` local o servidor externo/Supabase).
   - `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres (`openssl rand -hex 32`).
   - `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: credenciales del proyecto Supabase con bucket público `muniemprende`.
   - `NEXT_PUBLIC_APP_URL`: URL pública oficial (ej. `https://muniemprende.sanroque.gob.ar`).
   - `SUPERADMIN_USERNAME` y `SUPERADMIN_PASSWORD`: credenciales iniciales de la cuenta maestra de Modernización.
   - *(Opcional si usás el servicio `db` de Docker)*: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

2. **Construir y levantar el portal con Docker Compose:**

```bash
docker compose up -d --build
```

3. **Inicializar esquema y crear el Superadmin de producción:**

```bash
docker compose exec muniemprende-web npx prisma db push
docker compose exec muniemprende-web npx prisma db seed
```

---

## 6. Scripts Disponibles (`package.json`)

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Levanta el servidor de desarrollo local (`http://localhost:3000`) |
| `npm run build` | Compila el build de producción (`output: "standalone"`) |
| `npm run start` | Inicia el servidor Next.js compilado |
| `npm run lint` | Ejecuta ESLint sobre el código fuente |
| `npm run db:seed` | Ejecuta el seed limpio de producción (`prisma/seed.ts`) |
| `npm run demo:load` | Carga datos de demostración completos (`prisma/seed-demo.ts`) |
| `npm run demo:clean` | Resetea la DB y ejecuta el seed limpio de producción |
| `npx tsc --noEmit` | Verifica tipado estricto de TypeScript |

---

## Uso Institucional

Desarrollado por la **Dirección de Modernización — Municipalidad de San Roque** (Corrientes, Argentina). Para decisiones de arquitectura y reglas de negocio, consultar [`memory.md`](memory.md) y [`AGENTS.md`](AGENTS.md).
