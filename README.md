<p align="center">
  <a href="https://colectividapp.maytorena.xyz" target="blank"><img src="https://colectividapp.maytorena.xyz/assets/logo-BmwER1fG.png" width="120" alt="QCI Logo" /></a>
</p>

# COLECTIVIDAPI

API del proyecto QCI construida con NestJS, Prisma y PostgreSQL. Este documento describe cómo ejecutar el proyecto en desarrollo (incluyendo uso con Docker), los principales endpoints disponibles y un resumen de los modelos de base de datos.

---

## Requisitos

- Node.js >= 18
- npm >= 9
- Docker y Docker Compose (opcional para desarrollo)

## Variables de entorno

El proyecto usa las siguientes variables. Crea un archivo `.env` en la raíz con algo como lo siguiente:

```env
# API
PORT=3000
API_EXPOSE_PORT=3000

# Base de datos
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=qci
DB_EXPOSE_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_EXPOSE_PORT}/${DB_NAME}?schema=public

# MailDev (solo desarrollo)
MAIL_WEB_EXPOSE_PORT=1080
MAIL_EXPOSE_PORT=1025
```

Ajusta los valores según tu entorno. `DATABASE_URL` debe coincidir con la configuración de Prisma y de Docker.

---

## Ejecutar en desarrollo (sin Docker)

### Instalación

```bash
npm install
```

### Migraciones y seeder

1. Asegúrate de tener una base de datos PostgreSQL corriendo y que `DATABASE_URL` apunte a ella.
2. Ejecuta las migraciones de Prisma y genera el cliente:
   ```bash
   npx prisma migrate dev
   npx prisma db seed  # opcional, si quieres datos iniciales
   ```
3. Arranca la API en modo desarrollo:
   ```bash
   npm run start:dev
   ```
4. La API quedará disponible en `http://localhost:${PORT}` (por defecto `http://localhost:3000`).
5. La documentación Swagger estará en `http://localhost:${PORT}/api`.

## Ejecutar en desarrollo con Docker

Este repo incluye un `docker-compose.yml` con tres servicios: `qci-postgres` (PostgreSQL), `qci-api` (API) y `qci-mail` (MailDev).

- Levantar solo la base de datos:
  ```bash
  docker compose up -d qci-postgres
  ```
- Inicializar base de datos (migraciones/seed) desde tu máquina:
  ```bash
  npx prisma migrate dev
  npx prisma db seed  # opcional
  ```
- Levantar toda la pila (API + DB + MailDev):
  ```bash
  docker compose up --build
  ```

Notas:
- La API se expone por `API_EXPOSE_PORT` (por defecto 3000).
- PostgreSQL se expone por `DB_EXPOSE_PORT` (por defecto 5432).
- MailDev UI estará en `http://localhost:${MAIL_WEB_EXPOSE_PORT}`.

---

## Documentación y pruebas rápidas

- Swagger: `http://localhost:${PORT}/api`
- Salud rápida (si existe un endpoint de salud) y/o listar recursos en los endpoints públicos descritos abajo.

---

## Autenticación

- Autenticación mediante Bearer JWT. Añade el header `Authorization: Bearer <token>` en los endpoints protegidos.
- Obtén el token con el endpoint de login de `auth`.

Ejemplo con `curl`:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"tu_identificador","password":"tu_password"}'
```
Respuesta esperada: `{ "access_token": "<JWT>", ... }` (ver detalles en Swagger).

---

## Endpoints principales

Los endpoints reales y sus DTOs están documentados en Swagger. Aquí un resumen por módulo:

### Auth
- POST `/auth/login` — Inicia sesión con `identifier` y `password`.
- POST `/auth/register` — Registra una cuenta. Campos: `identificador`, `password`, `correo?`, `nombre?`, `apellido?`, `usuarioId?`, `comunidadId?`.

### Usuarios
- GET `/usuarios/me` — Devuelve tu usuario/cuenta. Requiere Bearer.
- PUT `/usuarios/me` — Actualiza tu información. Requiere Bearer.
- POST `/usuarios` — Crea un `Usuario`. Requiere Bearer.
- GET `/usuarios/validate/identificador?identificador=...` — Valida disponibilidad de identificador.

### Comunidades
- POST `/comunidades` — Crea una comunidad. Requiere Bearer. El `cuentaId` se toma del token.
- GET `/comunidades` — Lista comunidades (filtros y paginación por query).
- GET `/comunidades/paginadas` — Lista paginada.
- GET `/comunidades/map` — Geo endpoint público (FeatureCollection). Query: `municipioId?`, `coloniaId?`, `creadorId?`, `nombre?`, `limit?`, `cursor?`, `categorias?` (separadas por coma). Con auth opcional para personalización.
- POST `/comunidades/recomendar` — Recomendaciones por KNN.
- POST `/comunidades/:id/unirse` — Unirse a una comunidad. Requiere Bearer.
- GET `/comunidades/:id` — Obtiene detalle (auth opcional).
- PUT `/comunidades/:id` — Actualiza. Requiere Bearer.
- DELETE `/comunidades/:id` — Elimina. Requiere Bearer.

### Propuestas
- POST `/propuestas` — Crea una propuesta. Requiere Bearer (el `creadorId` se toma del token).
- GET `/propuestas` — Lista propuestas.
- GET `/propuestas/:id` — Detalle (requiere Bearer).
- PUT `/propuestas/:id` — Actualiza. Requiere Bearer.
- DELETE `/propuestas/:id` — Elimina. Requiere Bearer.
- POST `/propuestas/:id/asistencia` — Crear asistencia a propuesta. Requiere Bearer.
- PUT `/propuestas/:id/asistencia` — Actualizar asistencia. Requiere Bearer.

### Ideas
- POST `/ideas` — Crea una idea.
- GET `/ideas` — Lista ideas.
- GET `/ideas/:id` — Detalle.
- PUT `/ideas/:id` — Actualiza. Requiere Bearer.
- POST `/ideas/:id/generar-propuesta` — Genera una propuesta desde una idea. Requiere Bearer.
- DELETE `/ideas/:id` — Elimina. Requiere Bearer.

### Actividades
- POST `/actividades` — Crea actividad. Requiere Bearer.
- GET `/actividades` — Lista actividades.
- GET `/actividades/:id` — Detalle.
- PUT `/actividades/:id` — Actualiza. Requiere Bearer.
- DELETE `/actividades/:id` — Elimina. Requiere Bearer.

### Colonias (Geo)
- GET `/colonias` — Devuelve FeatureCollection paginada de colonias con polígonos. Query: `municipioId?`, `limit?`, `cursor?`.

---

## Modelos de base de datos (Prisma)

Resumen de entidades principales. Revisa `prisma/schema.prisma` para definiciones completas y relaciones:

- Cuenta (`cuentas`): credenciales de acceso (`identificador`, `correo`, `password`) y relaciones con `Usuario` o `Comunidad`. También relación con elementos creados (propuestas, actividades) y asistencias.
- Usuario (`usuarios`): datos personales, relación 1–1 con `Cuenta`, dirección y carrera.
- Comunidad (`comunidades`): información general, polígono, categorías, creador (`Cuenta`), miembros y propuestas/ideas.
- ComunidadMiembro (`comunidad_miembros`): relación N–N entre `Comunidad` y `Cuenta`.
- Propuesta (`propuestas`): `titulo`, `descripcion`, `creadorId`, `comunidadId`, categorías, asistentes y actividades.
- Actividad (`actividades`): `nombre`, `descripcion`, `fecha` (obligatoria), `horario?`, `creadorId`, `propuestaId?`, categorías.
- Idea (`ideas`): propuesta preliminar, puede ligar a `Comunidad` y convertirse en `Propuesta`.
- Asistente (`asistentes`): asistencias a propuestas por `Cuenta`, con `estado` (`ME_INTERESA`, `ASISTIRE`, `NO_ME_INTERESA`).
- Categoria (`categorias`): categorías que pueden asociarse a `Actividad`, `Comunidad` o `Propuesta`.
- Direccion (`direcciones`), Colonia (`colonias`), Municipio (`municipios`): datos de ubicación. `Colonia` incluye `coordenadas` (GeoJSON).
- Carrera (`carreras`): catálogo de carreras para usuarios.
- Vistas/Soporte: `ViewDireccion` (vista), `Edicion` (auditoría simple de cambios).

---

## Scripts útiles

- `npm run start:dev` — iniciar en desarrollo (watch).
- `npm run build` — compilar a `dist`.
- `npm run start:prod` — iniciar desde `dist`.
- `npm run lint` — lint con ESLint/Prettier.
- `npx prisma studio` — UI para explorar la base de datos.

## Pruebas

```bash
npm run test
npm run test:e2e
npm run test:cov
```

---

## Despliegue

- La app expone Swagger en la ruta `/api` y escucha en el puerto `PORT`.
- Asegura configurar `DATABASE_URL` válida y ejecutar migraciones antes de iniciar.
- Puedes crear una imagen propia basada en el `Dockerfile.dev`/`Dockerfile` (si aplica) o adaptar tu pipeline.

---

## Soporte y contribución

- Usa issues y PRs para reportar bugs o proponer mejoras.
- Mantén el estilo del código con los scripts de lint/format.
