# EcoTrade

Plataforma de economía circular para intercambio de productos y ecoCoins.

## Estructura del proyecto
- **backend/**: API REST con Node.js + Express.
- **prisma/**: esquema y migraciones (Prisma + PostgreSQL).
- **api/**: wrapper serverless para Vercel (usa el app exportado por `server-main.js`).
- **frontend/**: interfaz web (Vite + React + TypeScript).

> Nota: existen archivos legacy/duplicados en la raíz (controladores/rutas estilo Mongoose). El backend activo está dentro de `backend/` y se conecta vía Prisma.

## Requisitos
- Node.js 18+ recomendado
- PostgreSQL (local o Supabase) con `DATABASE_URL`

## Instalación y ejecución (monorepo)
1. Copia `env-example.txt` a `.env` y completa variables (especialmente `DATABASE_URL`).
2. Instala dependencias del backend (raíz):
   ```bash
   npm install
   ```
3. (Opcional) Instala dependencias del frontend:
   ```bash
   npm run frontend:install
   ```
4. Dev backend:
   ```bash
   npm run dev
   ```
5. Dev frontend:
   ```bash
   npm run frontend:start
   ```

## Base de datos (Prisma)
- Generar cliente: `npm run prisma:generate`
- Migraciones (dev): `npm run prisma:migrate`
- Push de esquema (dev): `npm run db:push`

## Admin inicial
Hay un script para bootstrap de super admin (Prisma):
```bash
npm run bootstrap:superadmin
```

## Endpoints principales
- `POST /api/users` — Crear usuario
- `GET /api/products` — Listar productos
- `POST /api/transactions` — Crear transacción

## Swagger
El backend expone documentación Swagger (ver `backend/swagger.js` y `server-main.js`).
