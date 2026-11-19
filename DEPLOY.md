# Guía Rápida de Despliegue en VPS — MuniEmprende San Roque

Documento operativo para el equipo de la **Dirección de Modernización** de la Municipalidad de San Roque.

---

## 1. Requisitos previos en el VPS

- **Docker** (`>= 24.x`) y **Docker Compose** (`v2`, comando `docker compose`)
- **Git**
- **Nginx** (opcional recomendado como *reverse proxy* HTTPS hacia `http://127.0.0.1:3000`)
- Proyecto de **Supabase Storage** con un bucket **público** llamado `muniemprende`

---

## 2. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO_GIT> /opt/muni-emprende
cd /opt/muni-emprende
```

---

## 3. Configurar las variables de entorno (`.env`)

Copiá la plantilla de ejemplo y editá los valores reales de producción:

```bash
cp .env.example .env
nano .env
```

### Variables obligatorias en `.env`:

```dotenv
# --- OPCIÓN A: Usando el PostgreSQL incluido en docker-compose (servicio "db") ---
POSTGRES_USER="muniemprende"
POSTGRES_PASSWORD="CAMBIAR_POR_PASSWORD_DB_FUERTE"
POSTGRES_DB="muniemprende"
DATABASE_URL="postgresql://muniemprende:CAMBIAR_POR_PASSWORD_DB_FUERTE@db:5432/muniemprende?schema=public"

# --- OPCIÓN B: Usando PostgreSQL externo o Supabase Database ---
# (Si usás una base externa, reemplazá DATABASE_URL por la cadena de conexión externa)
# DATABASE_URL="postgresql://usuario:password@host-externo:5432/nombre_db?schema=public"

# Secreto criptográfico para cookies de sesión JWT (mínimo 32 caracteres aleatorios)
# Podés generar uno con: openssl rand -hex 32
JWT_SECRET="PEGAR_AQUI_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES"

# Supabase Storage (bucket público: muniemprende)
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_de_supabase"

# Dominio oficial público del portal
NEXT_PUBLIC_APP_URL="https://muniemprende.sanroque.gob.ar"

# Credenciales iniciales de la cuenta maestra Superadmin (Dirección de Modernización)
SUPERADMIN_USERNAME="modernizacion"
SUPERADMIN_PASSWORD="CAMBIAR_POR_CLAVE_SEGURA_MIN_8_CARACTERES"
```

---

## 4. Construir y levantar los contenedores

Ejecutá Docker Compose en segundo plano:

```bash
docker compose up -d --build
```

> **Nota si usás una base de datos externa (Supabase / PostgreSQL fuera de Docker):**
> Podés levantar únicamente el contenedor web con:
> ```bash
> docker compose up -d --build --no-deps muniemprende-web
> ```

Verificá que los contenedores estén corriendo:

```bash
docker compose ps
```

---

## 5. Inicializar esquema de Base de Datos y crear el Superadmin

Una vez levantado el contenedor `muniemprende-web`, sincronizá el esquema de Prisma y ejecutá el seed inicial limpio de producción (crea el usuario Superadmin definido en `.env`, las 7 categorías oficiales y la configuración institucional base, **sin datos de prueba**):

### Ejecutando dentro del contenedor Docker (recomendado en el VPS):

```bash
# 1. Habilitar extensiones requeridas en PostgreSQL (unaccent y pg_trgm) y sincronizar esquema
docker compose exec muniemprende-web npx prisma db push

# (Alternativa usando el historial de migraciones versionadas)
# docker compose exec muniemprende-web npx prisma migrate deploy

# 2. Crear la cuenta maestra Superadmin y las 7 categorías oficiales
docker compose exec muniemprende-web npx prisma db seed
```

### (Opcional) Si ejecutás los comandos desde el host con Node.js instalado:

```bash
npx prisma db push
npx prisma db seed
```

---

## 6. Verificación y acceso al Panel Municipal

1. El portal público quedará disponible en `http://IP_DEL_VPS:3000` (o en el dominio configurado en Nginx).
2. Ingresá a `/login` con las credenciales `SUPERADMIN_USERNAME` y `SUPERADMIN_PASSWORD` configuradas en `.env`.
3. Desde una computadora (`>= 768px`), accedé a `/admin/configuracion` para verificar los números de WhatsApp oficiales de la Dirección de Empleo y del Área de Producción, fechas de próximas ferias y datos institucionales.

---

## 7. Comandos útiles de mantenimiento

- **Ver logs en vivo del portal:**
  ```bash
  docker compose logs -f muniemprende-web
  ```
- **Actualizar el portal tras un nuevo `git push`:**
  ```bash
  cd /opt/muni-emprende
  git pull
  docker compose up -d --build
  docker compose exec muniemprende-web npx prisma db push
  ```
