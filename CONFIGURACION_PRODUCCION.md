# 🚀 Configuración de EcoTrade para Producción (Prisma + PostgreSQL)

EcoTrade en este repositorio corre con **Node/Express** y persiste datos con **Prisma + PostgreSQL** (no MongoDB). El archivo [env-example.txt](env-example.txt) ya refleja esto con `DATABASE_URL`.

## ✅ Requisitos

- Una base de datos PostgreSQL (recomendado: **Supabase**)
- Un secreto JWT fuerte para producción (`JWT_SECRET`)
- Configurar CORS en backend (`CORS_ORIGINS`)

## 1) Base de datos (Supabase recomendado)

1. Crea un proyecto en Supabase
2. Obtén el connection string de Postgres (Settings → Database → Connection string)
3. Configura `DATABASE_URL` (con SSL si tu proveedor lo requiere)

Ejemplo (no copies tal cual, cambia credenciales y host):

```bash
DATABASE_URL=postgresql://usuario:password@host:5432/db?schema=public
```

## 2) Variables de entorno (backend)

Para local:

```powershell
copy env-example.txt .env
```

Variables importantes:

- `DATABASE_URL`: conexión a PostgreSQL
- `JWT_SECRET`: obligatorio en producción (sin esto la API no inicia)
- `CORS_ORIGINS`: lista separada por comas con dominios permitidos (ej: `https://tu-frontend.vercel.app`)
- `NODE_ENV=production`
- `DEMO_MODE=false` (no usar en producción)

## 3) Preparar el esquema en la DB (Prisma)

Antes de levantar en producción, aplica el esquema de Prisma a tu base de datos.

Opciones típicas:

- Recomendado para producción/CI (con control de cambios): `npx prisma migrate deploy`
- Alternativa (rápida, sin historial de migraciones): `npx prisma db push`

🛡️ Importante: por seguridad, el build de Vercel en este repo **ya no ejecuta** `prisma db push` en producción por defecto.

- Si querés habilitarlo explícitamente (no recomendado para producción), setea `PRISMA_DB_PUSH=true`.
- Si `PRISMA_DB_PUSH` no está seteado, el schema NO se aplica automáticamente durante el build.

Nota: el backend devuelve un error claro si faltan tablas/relaciones.

## 3.1) EcoCoins Ledger: backfill (una sola vez)

Si vas a usar el historial basado en `EcoCoinLedger` (auditoría/contabilidad), después de aplicar el schema en la DB (con `db push` o migración) podés ejecutar un **backfill idempotente** que crea entradas para:

- Transacciones (`Transaction`) con `ecoCoinsBuyer/ecoCoinsSeller`
- Submissions de reciclaje (`RecyclingSubmission`) aprobadas con `rewards.totalEcoCoins`

Comandos típicos (staging/producción):

```bash
# 1) Aplicar schema (crea la tabla EcoCoinLedger e índices)
npx prisma db push

# 2) Asegurar cliente Prisma actualizado
npx prisma generate

# 3) Ejecutar backfill (idempotente: se puede re-ejecutar)
npm run ecocoins:backfill-ledger

# (opcional) Solo simular inserciones
npm run ecocoins:backfill-ledger -- --dry-run
```

Notas:

- El script **no modifica** `User.ecoCoins` (solo crea entradas de ledger). Si necesitás reconciliar balances históricos, definimos una estrategia aparte.
- El backfill usa `skipDuplicates` y constraints únicas; es seguro re-ejecutarlo.

## 4) Deploy en Vercel

Este repo ya incluye configuración serverless en [api/index.js](api/index.js) + [vercel.json](vercel.json).

En Vercel configura Environment Variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS` (tu dominio de frontend)
- `NODE_ENV=production`
- `DEMO_MODE=false`

Bootstrap inicial (una sola vez):

- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_USERNAME`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_COUNTRY` (opcional)

Luego ejecutar: `npm run bootstrap:superadmin` y, si querés, eliminar `SUPER_ADMIN_PASSWORD` del entorno.

Si ya tenías usuarios `accountType=company` creados antes de agregar `Company/CompanyMember`, ejecuta una vez:

- `npm run backfill:companies`

Este script es idempotente: crea `Company` + membership owner faltantes, y asocia `RecyclingPoint`/`Product` a `companyId` cuando corresponde.

Si usas Supabase Auth/Storage desde backend, agrega también:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (solo backend)
- `SUPABASE_STORAGE_BUCKET`

## 5) Frontend (Vite)

En el proyecto `frontend/` define `VITE_API_URL` apuntando a tu API:

```bash
VITE_API_URL=https://tu-api.vercel.app/api
```

Build local:

```bash
npm run frontend:build
```

## 🧩 Nota sobre scripts legacy

Los scripts `npm run init-db` / `npm run reset-db` eran inicializadores históricos basados en Mongo/Mongoose y **no aplican** al stack Prisma/PostgreSQL actual.

- En este repo están **deshabilitados** a propósito para evitar ejecuciones accidentales.
- El código legacy quedó archivado en `backend/legacy-mongoose/scripts/initDatabase_legacy_mongoose.js` solo como referencia.

Para producción, el “init” correcto es aplicar Prisma (`migrate deploy`/`db push`) y luego crear el admin inicial con `npm run bootstrap:superadmin`.

## 🔧 Troubleshooting rápido

- Error `JWT_SECRET no está configurado`: define `JWT_SECRET` en tu entorno.
- Error de tablas/relaciones: ejecuta `npx prisma db push` o `npx prisma migrate deploy` contra la DB configurada en `DATABASE_URL`.
- Problemas de CORS: asegúrate de incluir exactamente tu dominio en `CORS_ORIGINS`.