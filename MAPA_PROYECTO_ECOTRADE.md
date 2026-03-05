# Mapa del proyecto EcoTrade

Generado automáticamente: 2026-03-05T03:06:45.810Z

Este archivo describe:
- Para qué sirve cada carpeta y qué contiene
- Para qué sirve cada archivo (heurística + convenciones)
- Conexiones entre archivos (imports/require relativos): qué importa y quién lo usa

Notas:
- No se listan ni exponen valores de `.env` (secretos).
- El grafo de conexiones es aproximado (regex), no un parser completo de JS/TS.
- Por defecto se excluye `legacy/` y `backend/legacy-mongoose/`.
- Modo legacy incluido: sí (usar '--include-legacy')

## Entrypoints y flujo (alto nivel)

- Backend (Express): `server-main.js`
  - Monta routers en `backend/routers/*` bajo `/api/*`
  - Conecta DB vía `backend/config/database-config.js` (Prisma/PostgreSQL)
  - Swagger via `backend/swagger.js`
- Serverless (Vercel): `api/index.js`
  - Importa la app Express y asegura conexión DB fuera de healthchecks
- Frontend (Vite/React/TS): `frontend/src/main.tsx`
  - Arranca la app y usa rutas definidas en `frontend/src/app/routes.ts`

## Carpetas (qué son y qué contienen)

- (root): Raíz del repo: entrypoints, configuración y documentación (archivos: 14)
- .github: Configuración/guías para herramientas (Copilot, etc.) (archivos: 1)
- api: Wrapper serverless (Vercel) que expone el backend Express (archivos: 1)
- backend: Backend canónico (Express + Prisma) (archivos: 1)
- frontend: Frontend (Vite/React/TypeScript) (archivos: 6)
- prisma: Prisma: esquema y modelo de datos (archivos: 1)
- scripts: Scripts auxiliares (build/deploy) (archivos: 2)
- backend/config: Conectores y configuración (DB/Prisma/Supabase) (archivos: 3)
- backend/controllers: Controladores: lógica por endpoint (archivos: 10)
- backend/middleware: Middlewares: auth, RBAC, error handling (archivos: 5)
- backend/routers: Routers Express: endpoints y wiring hacia controllers (archivos: 5)
- backend/scripts: Scripts operativos: backfills, bootstrapping, checks (archivos: 6)
- backend/tests: Tests Jest/Supertest del backend (archivos: 8)
- backend/utils: Utilidades: validación, RBAC, cálculos ecoCoins, stores demo (archivos: 5)
- frontend/guidelines: Guías de UI/uso para el frontend (archivos: 1)
- frontend/src: Código fuente del frontend (archivos: 1)
- legacy/root: Legacy archivado (no runtime) (archivos: 15)
- backend/legacy-mongoose/controllers: Legacy: stack Mongo/Mongoose archivado (archivos: 1)
- backend/legacy-mongoose/models: Legacy: stack Mongo/Mongoose archivado (archivos: 5)
- backend/legacy-mongoose/scripts: Legacy: stack Mongo/Mongoose archivado (archivos: 1)
- frontend/src/app: App (rutas, layout, páginas, componentes, libs) (archivos: 2)
- frontend/src/app/layouts: Layouts compartidos (archivos: 1)
- frontend/src/app/lib: Clientes/SDKs y helpers (API, auth, Supabase) (archivos: 3)
- frontend/src/app/pages: Pantallas/páginas de la app (rutas) (archivos: 11)
- frontend/src/app/components/figma: Componentes importados/adaptados (figma) (archivos: 1)
- frontend/src/app/components/ui: Componentes UI (shadcn/Radix wrappers) (archivos: 48)

## Inventario por carpeta (detallado)

### (root)

- Para qué sirve: Raíz del repo: entrypoints, configuración y documentación
- CHECKLIST_IMPLEMENTACION_AUDITORIA.md — Documentación del proyecto (docs)
- CONFIGURACION_PRODUCCION.md — Documentación del proyecto (docs)
- DESCRIPCION_PROYECTO_ECOTRADE.txt — Documentación del proyecto (docs)
- INFORME_INVERSION_ECOTRADE.md — Documentación del proyecto (docs)
- MAPA_PROYECTO_ECOTRADE.md — Documentación del proyecto (docs)
- PLAN_IMPLEMENTACION_ECOTRADE.md — Documentación del proyecto (docs)
- README.md — Documentación del proyecto (docs)
- env-example.txt — Documentación del proyecto (docs)
- package-lock.json — Lockfile de npm (resolución exacta) (lockfile)
- package.json — Manifiesto de Node (scripts/deps) (config)
- product-routes.js — Archivo del proyecto (other)
- project-structure.md — Documentación del proyecto (docs)
- server-main.js — Entrypoint del backend Express (entrypoint)
- vercel.json — Config de despliegue (Vercel) (config)

### .github

- Para qué sirve: Configuración/guías para herramientas (Copilot, etc.)
- copilot-instructions.md — Documentación del proyecto (docs)

### api

- Para qué sirve: Wrapper serverless (Vercel) que expone el backend Express
- index.js — Wrapper serverless (Vercel) para el backend (serverless)

### backend

- Para qué sirve: Backend canónico (Express + Prisma)
- swagger.js — Archivo del proyecto (other)

### frontend

- Para qué sirve: Frontend (Vite/React/TypeScript)
- ATTRIBUTIONS.md — Documentación del proyecto (docs)
- README.md — Documentación del proyecto (docs)
- package-lock.json — Lockfile de npm (resolución exacta) (lockfile)
- package.json — Manifiesto de Node (scripts/deps) (config)
- postcss.config.mjs — Config/build del frontend (Vite/Tailwind/etc.) (frontend-config)
- vite.config.ts — Config/build del frontend (Vite/Tailwind/etc.) (frontend-config)

### prisma

- Para qué sirve: Prisma: esquema y modelo de datos
- schema.prisma — Esquema de base de datos (Prisma) (schema)

### scripts

- Para qué sirve: Scripts auxiliares (build/deploy)
- generate-project-map.js — Scripts de build/deploy/soporte (script)
- vercel-build.js — Scripts de build/deploy/soporte (script)

### backend/config

- Para qué sirve: Conectores y configuración (DB/Prisma/Supabase)
- database-config.js — Config/clients (Prisma/Supabase/DB) (config)
- prismaClient.js — Config/clients (Prisma/Supabase/DB) (config)
- supabaseClient.js — Config/clients (Prisma/Supabase/DB) (config)

### backend/controllers

- Para qué sirve: Controladores: lógica por endpoint
- productController.js — Controlador: lógica de negocio para endpoints (controller)
- productController_demo.js — Controlador: lógica de negocio para endpoints (controller)
- recyclingPointController.js — Controlador: lógica de negocio para endpoints (controller)
- recyclingPointController_demo.js — Controlador: lógica de negocio para endpoints (controller)
- recyclingSubmissionController.js — Controlador: lógica de negocio para endpoints (controller)
- recyclingSubmissionController_demo.js — Controlador: lógica de negocio para endpoints (controller)
- transactionController.js — Controlador: lógica de negocio para endpoints (controller)
- uploadController.js — Controlador: lógica de negocio para endpoints (controller)
- userController.js — Controlador: lógica de negocio para endpoints (controller)
- userController_demo.js — Controlador: lógica de negocio para endpoints (controller)

### backend/middleware

- Para qué sirve: Middlewares: auth, RBAC, error handling
- authMiddleware.js — Middleware Express: auth/errores/roles (middleware)
- authMiddleware_demo.js — Middleware Express: auth/errores/roles (middleware)
- errorHandler.js — Middleware Express: auth/errores/roles (middleware)
- recyclingAccess.js — Middleware Express: auth/errores/roles (middleware)
- recyclingAccess_demo.js — Middleware Express: auth/errores/roles (middleware)

### backend/routers

- Para qué sirve: Routers Express: endpoints y wiring hacia controllers
- productRoutes.js — Router Express: define endpoints y middlewares (router)
- recyclingRoutes.js — Router Express: define endpoints y middlewares (router)
- transactionRoutes.js — Router Express: define endpoints y middlewares (router)
- uploadRoutes.js — Router Express: define endpoints y middlewares (router)
- userRoutes.js — Router Express: define endpoints y middlewares (router)

### backend/scripts

- Para qué sirve: Scripts operativos: backfills, bootstrapping, checks
- backfillCompanies.js — Scripts de mantenimiento/bootstrapping (script)
- backfillEcoCoinLedger.js — Scripts de mantenimiento/bootstrapping (script)
- bootstrapSuperAdmin.js — Scripts de mantenimiento/bootstrapping (script)
- dbCheck.js — Scripts de mantenimiento/bootstrapping (script)
- demoRecyclingE2E.js — Scripts de mantenimiento/bootstrapping (script)
- initDatabase.js — Scripts de mantenimiento/bootstrapping (script)

### backend/tests

- Para qué sirve: Tests Jest/Supertest del backend
- demoHardening.test.js — Pruebas de integración (Jest/Supertest) (test)
- ecocoinsLedger.test.js — Pruebas de integración (Jest/Supertest) (test)
- product.test.js — Pruebas de integración (Jest/Supertest) (test)
- rbac.test.js — Pruebas de integración (Jest/Supertest) (test)
- recycling.test.js — Pruebas de integración (Jest/Supertest) (test)
- transaction.test.js — Pruebas de integración (Jest/Supertest) (test)
- user.test.js — Pruebas de integración (Jest/Supertest) (test)
- validationSchemas.test.js — Pruebas de integración (Jest/Supertest) (test)

### backend/utils

- Para qué sirve: Utilidades: validación, RBAC, cálculos ecoCoins, stores demo
- demoProductsStore.js — Utilidades compartidas (validación, rbac, cálculos) (util)
- demoStore.js — Utilidades compartidas (validación, rbac, cálculos) (util)
- ecoCoinCalculator.js — Utilidades compartidas (validación, rbac, cálculos) (util)
- rbac.js — Utilidades compartidas (validación, rbac, cálculos) (util)
- validationSchemas.js — Utilidades compartidas (validación, rbac, cálculos) (util)

### frontend/guidelines

- Para qué sirve: Guías de UI/uso para el frontend
- Guidelines.md — Documentación del proyecto (docs)

### frontend/src

- Para qué sirve: Código fuente del frontend
- main.tsx — Código del frontend (React/Vite/TS) (frontend)

### legacy/root

- Para qué sirve: Legacy archivado (no runtime)
- Transaction.js — Código/archivos legacy archivados (no runtime) (legacy)
- backend-setup.js — Código/archivos legacy archivados (no runtime) (legacy)
- error-handler.js — Código/archivos legacy archivados (no runtime) (legacy)
- firebase-config.js — Código/archivos legacy archivados (no runtime) (legacy)
- package-json.json — Archivo JSON (config/datos) (data)
- product-model.js — Código/archivos legacy archivados (no runtime) (legacy)
- productController.js — Código/archivos legacy archivados (no runtime) (legacy)
- productRoutes.js — Código/archivos legacy archivados (no runtime) (legacy)
- swagger.js — Código/archivos legacy archivados (no runtime) (legacy)
- transactionController.js — Código/archivos legacy archivados (no runtime) (legacy)
- transactionRoutes.js — Código/archivos legacy archivados (no runtime) (legacy)
- user-model.js — Código/archivos legacy archivados (no runtime) (legacy)
- userController.js — Código/archivos legacy archivados (no runtime) (legacy)
- userRoutes.js — Código/archivos legacy archivados (no runtime) (legacy)
- validationSchemas.js — Código/archivos legacy archivados (no runtime) (legacy)

### backend/legacy-mongoose/controllers

- Para qué sirve: Legacy: stack Mongo/Mongoose archivado
- productController_new.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)

### backend/legacy-mongoose/models

- Para qué sirve: Legacy: stack Mongo/Mongoose archivado
- Product.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)
- RecyclingPoint.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)
- RecyclingSubmission.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)
- Transaction.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)
- User.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)

### backend/legacy-mongoose/scripts

- Para qué sirve: Legacy: stack Mongo/Mongoose archivado
- initDatabase_legacy_mongoose.js — Stack legacy Mongo/Mongoose archivado (no runtime) (legacy)

### frontend/src/app

- Para qué sirve: App (rutas, layout, páginas, componentes, libs)
- App.tsx — Código del frontend (React/Vite/TS) (frontend)
- routes.ts — Código del frontend (React/Vite/TS) (frontend)

### frontend/src/app/layouts

- Para qué sirve: Layouts compartidos
- main-layout.tsx — Código del frontend (React/Vite/TS) (frontend)

### frontend/src/app/lib

- Para qué sirve: Clientes/SDKs y helpers (API, auth, Supabase)
- api.ts — Código del frontend (React/Vite/TS) (frontend)
- auth-context.tsx — Código del frontend (React/Vite/TS) (frontend)
- supabase.ts — Código del frontend (React/Vite/TS) (frontend)

### frontend/src/app/pages

- Para qué sirve: Pantallas/páginas de la app (rutas)
- auth-callback.tsx — Código del frontend (React/Vite/TS) (frontend)
- ecocoins.tsx — Código del frontend (React/Vite/TS) (frontend)
- home.tsx — Código del frontend (React/Vite/TS) (frontend)
- landing.tsx — Código del frontend (React/Vite/TS) (frontend)
- login.tsx — Código del frontend (React/Vite/TS) (frontend)
- onboarding.tsx — Código del frontend (React/Vite/TS) (frontend)
- profile.tsx — Código del frontend (React/Vite/TS) (frontend)
- recycling.tsx — Código del frontend (React/Vite/TS) (frontend)
- register.tsx — Código del frontend (React/Vite/TS) (frontend)
- search.tsx — Código del frontend (React/Vite/TS) (frontend)
- sell.tsx — Código del frontend (React/Vite/TS) (frontend)

### frontend/src/app/components/figma

- Para qué sirve: Componentes importados/adaptados (figma)
- ImageWithFallback.tsx — Código del frontend (React/Vite/TS) (frontend)

### frontend/src/app/components/ui

- Para qué sirve: Componentes UI (shadcn/Radix wrappers)
- accordion.tsx — Código del frontend (React/Vite/TS) (frontend)
- alert-dialog.tsx — Código del frontend (React/Vite/TS) (frontend)
- alert.tsx — Código del frontend (React/Vite/TS) (frontend)
- aspect-ratio.tsx — Código del frontend (React/Vite/TS) (frontend)
- avatar.tsx — Código del frontend (React/Vite/TS) (frontend)
- badge.tsx — Código del frontend (React/Vite/TS) (frontend)
- breadcrumb.tsx — Código del frontend (React/Vite/TS) (frontend)
- button.tsx — Código del frontend (React/Vite/TS) (frontend)
- calendar.tsx — Código del frontend (React/Vite/TS) (frontend)
- card.tsx — Código del frontend (React/Vite/TS) (frontend)
- carousel.tsx — Código del frontend (React/Vite/TS) (frontend)
- chart.tsx — Código del frontend (React/Vite/TS) (frontend)
- checkbox.tsx — Código del frontend (React/Vite/TS) (frontend)
- collapsible.tsx — Código del frontend (React/Vite/TS) (frontend)
- command.tsx — Código del frontend (React/Vite/TS) (frontend)
- context-menu.tsx — Código del frontend (React/Vite/TS) (frontend)
- dialog.tsx — Código del frontend (React/Vite/TS) (frontend)
- drawer.tsx — Código del frontend (React/Vite/TS) (frontend)
- dropdown-menu.tsx — Código del frontend (React/Vite/TS) (frontend)
- form.tsx — Código del frontend (React/Vite/TS) (frontend)
- hover-card.tsx — Código del frontend (React/Vite/TS) (frontend)
- input-otp.tsx — Código del frontend (React/Vite/TS) (frontend)
- input.tsx — Código del frontend (React/Vite/TS) (frontend)
- label.tsx — Código del frontend (React/Vite/TS) (frontend)
- menubar.tsx — Código del frontend (React/Vite/TS) (frontend)
- navigation-menu.tsx — Código del frontend (React/Vite/TS) (frontend)
- pagination.tsx — Código del frontend (React/Vite/TS) (frontend)
- popover.tsx — Código del frontend (React/Vite/TS) (frontend)
- progress.tsx — Código del frontend (React/Vite/TS) (frontend)
- radio-group.tsx — Código del frontend (React/Vite/TS) (frontend)
- resizable.tsx — Código del frontend (React/Vite/TS) (frontend)
- scroll-area.tsx — Código del frontend (React/Vite/TS) (frontend)
- select.tsx — Código del frontend (React/Vite/TS) (frontend)
- separator.tsx — Código del frontend (React/Vite/TS) (frontend)
- sheet.tsx — Código del frontend (React/Vite/TS) (frontend)
- sidebar.tsx — Código del frontend (React/Vite/TS) (frontend)
- skeleton.tsx — Código del frontend (React/Vite/TS) (frontend)
- slider.tsx — Código del frontend (React/Vite/TS) (frontend)
- sonner.tsx — Código del frontend (React/Vite/TS) (frontend)
- switch.tsx — Código del frontend (React/Vite/TS) (frontend)
- table.tsx — Código del frontend (React/Vite/TS) (frontend)
- tabs.tsx — Código del frontend (React/Vite/TS) (frontend)
- textarea.tsx — Código del frontend (React/Vite/TS) (frontend)
- toggle-group.tsx — Código del frontend (React/Vite/TS) (frontend)
- toggle.tsx — Código del frontend (React/Vite/TS) (frontend)
- tooltip.tsx — Código del frontend (React/Vite/TS) (frontend)
- use-mobile.ts — Código del frontend (React/Vite/TS) (frontend)
- utils.ts — Código del frontend (React/Vite/TS) (frontend)

## Conexiones por archivo (imports/require internos)

### .github/copilot-instructions.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### api/index.js

- Propósito: Wrapper serverless (Vercel) para el backend
- Tipo: serverless
- Importa (interno): backend/config/database-config.js, server-main.js
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/config/database-config.js

- Propósito: Config/clients (Prisma/Supabase/DB)
- Tipo: config
- Importa (interno): backend/config/prismaClient.js
- Importa (externo): dotenv
- Usado por: api/index.js, backend/controllers/productController.js, backend/controllers/recyclingPointController.js, backend/controllers/recyclingSubmissionController.js, backend/controllers/transactionController.js, backend/controllers/userController.js, backend/middleware/recyclingAccess.js, server-main.js

### backend/config/prismaClient.js

- Propósito: Config/clients (Prisma/Supabase/DB)
- Tipo: config
- Importa (interno): (ninguno detectado)
- Importa (externo): @prisma/client
- Usado por: backend/config/database-config.js, backend/controllers/productController.js, backend/controllers/recyclingPointController.js, backend/controllers/recyclingSubmissionController.js, backend/controllers/transactionController.js, backend/controllers/userController.js, backend/middleware/authMiddleware.js, backend/middleware/recyclingAccess.js, backend/scripts/backfillCompanies.js, backend/scripts/backfillEcoCoinLedger.js, backend/scripts/bootstrapSuperAdmin.js, backend/scripts/dbCheck.js

### backend/config/supabaseClient.js

- Propósito: Config/clients (Prisma/Supabase/DB)
- Tipo: config
- Importa (interno): (ninguno detectado)
- Importa (externo): @supabase/supabase-js
- Usado por: backend/controllers/uploadController.js, backend/controllers/userController.js

### backend/controllers/productController_demo.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/controllers/productController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js, backend/utils/demoProductsStore.js, backend/utils/rbac.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/productRoutes.js

### backend/controllers/recyclingPointController_demo.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/utils/demoStore.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/recyclingRoutes.js

### backend/controllers/recyclingPointController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js, backend/utils/rbac.js
- Importa (externo): bcryptjs, crypto
- Usado por: backend/routers/recyclingRoutes.js

### backend/controllers/recyclingSubmissionController_demo.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/utils/demoStore.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/recyclingRoutes.js

### backend/controllers/recyclingSubmissionController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js, backend/utils/rbac.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/recyclingRoutes.js

### backend/controllers/transactionController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js, backend/utils/demoProductsStore.js, backend/utils/demoStore.js, backend/utils/ecoCoinCalculator.js, backend/utils/rbac.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/transactionRoutes.js

### backend/controllers/uploadController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/supabaseClient.js
- Importa (externo): crypto, multer
- Usado por: backend/routers/uploadRoutes.js

### backend/controllers/userController_demo.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/utils/demoStore.js
- Importa (externo): jsonwebtoken
- Usado por: backend/routers/userRoutes.js, backend/tests/demoHardening.test.js

### backend/controllers/userController.js

- Propósito: Controlador: lógica de negocio para endpoints
- Tipo: controller
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js, backend/config/supabaseClient.js, backend/utils/rbac.js, backend/utils/validationSchemas.js
- Importa (externo): bcryptjs, crypto, jsonwebtoken
- Usado por: backend/routers/userRoutes.js

### backend/legacy-mongoose/controllers/productController_new.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): backend/legacy-mongoose/models/Product.js, backend/legacy-mongoose/models/User.js
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/legacy-mongoose/models/Product.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: backend/legacy-mongoose/controllers/productController_new.js, backend/legacy-mongoose/scripts/initDatabase_legacy_mongoose.js

### backend/legacy-mongoose/models/RecyclingPoint.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: (nadie detectado)

### backend/legacy-mongoose/models/RecyclingSubmission.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: (nadie detectado)

### backend/legacy-mongoose/models/Transaction.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: (nadie detectado)

### backend/legacy-mongoose/models/User.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): bcryptjs, crypto, mongoose
- Usado por: backend/legacy-mongoose/controllers/productController_new.js, backend/legacy-mongoose/scripts/initDatabase_legacy_mongoose.js

### backend/legacy-mongoose/scripts/initDatabase_legacy_mongoose.js

- Propósito: Stack legacy Mongo/Mongoose archivado (no runtime)
- Tipo: legacy
- Importa (interno): backend/legacy-mongoose/models/Product.js, backend/legacy-mongoose/models/User.js
- Importa (externo): dotenv, mongoose
- Usado por: (nadie detectado)

### backend/middleware/authMiddleware_demo.js

- Propósito: Middleware Express: auth/errores/roles
- Tipo: middleware
- Importa (interno): (ninguno detectado)
- Importa (externo): jsonwebtoken
- Usado por: backend/routers/productRoutes.js, backend/routers/recyclingRoutes.js, backend/routers/transactionRoutes.js, backend/routers/uploadRoutes.js, backend/routers/userRoutes.js, backend/tests/demoHardening.test.js

### backend/middleware/authMiddleware.js

- Propósito: Middleware Express: auth/errores/roles
- Tipo: middleware
- Importa (interno): backend/config/prismaClient.js, backend/utils/rbac.js
- Importa (externo): jsonwebtoken
- Usado por: backend/routers/productRoutes.js, backend/routers/recyclingRoutes.js, backend/routers/transactionRoutes.js, backend/routers/uploadRoutes.js, backend/routers/userRoutes.js

### backend/middleware/errorHandler.js

- Propósito: Middleware Express: auth/errores/roles
- Tipo: middleware
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: server-main.js

### backend/middleware/recyclingAccess_demo.js

- Propósito: Middleware Express: auth/errores/roles
- Tipo: middleware
- Importa (interno): backend/utils/demoStore.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/recyclingRoutes.js

### backend/middleware/recyclingAccess.js

- Propósito: Middleware Express: auth/errores/roles
- Tipo: middleware
- Importa (interno): backend/config/database-config.js, backend/config/prismaClient.js
- Importa (externo): (ninguno detectado)
- Usado por: backend/routers/recyclingRoutes.js

### backend/routers/productRoutes.js

- Propósito: Router Express: define endpoints y middlewares
- Tipo: router
- Importa (interno): backend/controllers/productController.js, backend/middleware/authMiddleware.js, backend/middleware/authMiddleware_demo.js
- Importa (externo): express
- Usado por: server-main.js

### backend/routers/recyclingRoutes.js

- Propósito: Router Express: define endpoints y middlewares
- Tipo: router
- Importa (interno): backend/controllers/recyclingPointController.js, backend/controllers/recyclingPointController_demo.js, backend/controllers/recyclingSubmissionController.js, backend/controllers/recyclingSubmissionController_demo.js, backend/middleware/authMiddleware.js, backend/middleware/authMiddleware_demo.js, backend/middleware/recyclingAccess.js, backend/middleware/recyclingAccess_demo.js, backend/utils/rbac.js
- Importa (externo): express, express-rate-limit
- Usado por: server-main.js

### backend/routers/transactionRoutes.js

- Propósito: Router Express: define endpoints y middlewares
- Tipo: router
- Importa (interno): backend/controllers/transactionController.js, backend/middleware/authMiddleware.js, backend/middleware/authMiddleware_demo.js, backend/utils/validationSchemas.js
- Importa (externo): express
- Usado por: server-main.js

### backend/routers/uploadRoutes.js

- Propósito: Router Express: define endpoints y middlewares
- Tipo: router
- Importa (interno): backend/controllers/uploadController.js, backend/middleware/authMiddleware.js, backend/middleware/authMiddleware_demo.js
- Importa (externo): express
- Usado por: server-main.js

### backend/routers/userRoutes.js

- Propósito: Router Express: define endpoints y middlewares
- Tipo: router
- Importa (interno): backend/controllers/userController.js, backend/controllers/userController_demo.js, backend/middleware/authMiddleware.js, backend/middleware/authMiddleware_demo.js
- Importa (externo): express
- Usado por: server-main.js

### backend/scripts/backfillCompanies.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): backend/config/prismaClient.js
- Importa (externo): dotenv
- Usado por: (nadie detectado)

### backend/scripts/backfillEcoCoinLedger.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): backend/config/prismaClient.js
- Importa (externo): dotenv
- Usado por: (nadie detectado)

### backend/scripts/bootstrapSuperAdmin.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): backend/config/prismaClient.js
- Importa (externo): bcryptjs, crypto, dotenv, node:readline
- Usado por: (nadie detectado)

### backend/scripts/dbCheck.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): backend/config/prismaClient.js
- Importa (externo): dotenv
- Usado por: (nadie detectado)

### backend/scripts/demoRecyclingE2E.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/scripts/initDatabase.js

- Propósito: Scripts de mantenimiento/bootstrapping
- Tipo: script
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/swagger.js

- Propósito: Archivo del proyecto
- Tipo: other
- Importa (interno): (ninguno detectado)
- Importa (externo): swagger-ui-express
- Usado por: server-main.js

### backend/tests/demoHardening.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): backend/controllers/userController_demo.js, backend/middleware/authMiddleware_demo.js
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/tests/ecocoinsLedger.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): server-main.js
- Importa (externo): supertest
- Usado por: (nadie detectado)

### backend/tests/product.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): server-main.js
- Importa (externo): supertest
- Usado por: (nadie detectado)

### backend/tests/rbac.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): backend/utils/rbac.js
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/tests/recycling.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): server-main.js
- Importa (externo): supertest
- Usado por: (nadie detectado)

### backend/tests/transaction.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): server-main.js
- Importa (externo): supertest
- Usado por: (nadie detectado)

### backend/tests/user.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): server-main.js
- Importa (externo): supertest
- Usado por: (nadie detectado)

### backend/tests/validationSchemas.test.js

- Propósito: Pruebas de integración (Jest/Supertest)
- Tipo: test
- Importa (interno): backend/utils/validationSchemas.js
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### backend/utils/demoProductsStore.js

- Propósito: Utilidades compartidas (validación, rbac, cálculos)
- Tipo: util
- Importa (interno): (ninguno detectado)
- Importa (externo): crypto
- Usado por: backend/controllers/productController.js, backend/controllers/transactionController.js

### backend/utils/demoStore.js

- Propósito: Utilidades compartidas (validación, rbac, cálculos)
- Tipo: util
- Importa (interno): (ninguno detectado)
- Importa (externo): crypto
- Usado por: backend/controllers/recyclingPointController_demo.js, backend/controllers/recyclingSubmissionController_demo.js, backend/controllers/transactionController.js, backend/controllers/userController_demo.js, backend/middleware/recyclingAccess_demo.js

### backend/utils/ecoCoinCalculator.js

- Propósito: Utilidades compartidas (validación, rbac, cálculos)
- Tipo: util
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: backend/controllers/transactionController.js

### backend/utils/rbac.js

- Propósito: Utilidades compartidas (validación, rbac, cálculos)
- Tipo: util
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: backend/controllers/productController.js, backend/controllers/recyclingPointController.js, backend/controllers/recyclingSubmissionController.js, backend/controllers/transactionController.js, backend/controllers/userController.js, backend/middleware/authMiddleware.js, backend/routers/recyclingRoutes.js, backend/tests/rbac.test.js

### backend/utils/validationSchemas.js

- Propósito: Utilidades compartidas (validación, rbac, cálculos)
- Tipo: util
- Importa (interno): (ninguno detectado)
- Importa (externo): joi
- Usado por: backend/controllers/userController.js, backend/routers/transactionRoutes.js, backend/tests/validationSchemas.test.js

### CHECKLIST_IMPLEMENTACION_AUDITORIA.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### CONFIGURACION_PRODUCCION.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### DESCRIPCION_PROYECTO_ECOTRADE.txt

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### env-example.txt

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/ATTRIBUTIONS.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/guidelines/Guidelines.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/package-lock.json

- Propósito: Lockfile de npm (resolución exacta)
- Tipo: lockfile
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/package.json

- Propósito: Manifiesto de Node (scripts/deps)
- Tipo: config
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/postcss.config.mjs

- Propósito: Config/build del frontend (Vite/Tailwind/etc.)
- Tipo: frontend-config
- Importa (interno): (ninguno detectado)
- Importa (externo): postcss-nested
- Usado por: (nadie detectado)

### frontend/README.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### frontend/src/app/App.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/sonner.tsx, frontend/src/app/lib/auth-context.tsx, frontend/src/app/routes.ts
- Importa (externo): react-router
- Usado por: frontend/src/main.tsx

### frontend/src/app/components/figma/ImageWithFallback.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/accordion.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-accordion, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/alert-dialog.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-alert-dialog, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/alert.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): class-variance-authority, react
- Usado por: frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/aspect-ratio.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): @radix-ui/react-aspect-ratio
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/avatar.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-avatar, react
- Usado por: frontend/src/app/layouts/main-layout.tsx, frontend/src/app/pages/profile.tsx

### frontend/src/app/components/ui/badge.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-slot, class-variance-authority, react
- Usado por: frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/search.tsx

### frontend/src/app/components/ui/breadcrumb.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-slot, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/button.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-slot, class-variance-authority, react
- Usado por: frontend/src/app/components/ui/alert-dialog.tsx, frontend/src/app/components/ui/calendar.tsx, frontend/src/app/components/ui/carousel.tsx, frontend/src/app/components/ui/pagination.tsx, frontend/src/app/components/ui/sidebar.tsx, frontend/src/app/layouts/main-layout.tsx, frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/home.tsx, frontend/src/app/pages/landing.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/calendar.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): lucide-react, react, react-day-picker
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/card.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react
- Usado por: frontend/src/app/pages/auth-callback.tsx, frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/home.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/carousel.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/chart.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react, recharts
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/checkbox.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-checkbox, lucide-react, react
- Usado por: frontend/src/app/pages/onboarding.tsx

### frontend/src/app/components/ui/collapsible.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): @radix-ui/react-collapsible
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/command.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): cmdk, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/context-menu.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-context-menu, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/dialog.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-dialog, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/drawer.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react, vaul
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/dropdown-menu.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-dropdown-menu, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/form.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-label, @radix-ui/react-slot, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/hover-card.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-hover-card, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/input-otp.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): input-otp, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/input.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react
- Usado por: frontend/src/app/components/ui/sidebar.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/label.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-label, react
- Usado por: frontend/src/app/components/ui/form.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/menubar.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-menubar, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/navigation-menu.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-navigation-menu, class-variance-authority, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/pagination.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/popover.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-popover, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/progress.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-progress, react
- Usado por: frontend/src/app/pages/ecocoins.tsx

### frontend/src/app/components/ui/radio-group.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-radio-group, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/resizable.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): lucide-react, react, react-resizable-panels
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/scroll-area.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-scroll-area, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/select.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-select, react
- Usado por: frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/separator.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-separator, react
- Usado por: frontend/src/app/components/ui/sidebar.tsx

### frontend/src/app/components/ui/sheet.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-dialog, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/sidebar.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/separator.tsx, frontend/src/app/components/ui/skeleton.tsx, frontend/src/app/components/ui/use-mobile.ts, frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-slot, class-variance-authority, lucide-react, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/skeleton.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): (ninguno detectado)
- Usado por: frontend/src/app/components/ui/sidebar.tsx

### frontend/src/app/components/ui/slider.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-slider, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/sonner.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): next-themes, sonner
- Usado por: frontend/src/app/App.tsx

### frontend/src/app/components/ui/switch.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-switch, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/table.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/tabs.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-tabs, react
- Usado por: frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx

### frontend/src/app/components/ui/textarea.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): react
- Usado por: frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/components/ui/toggle-group.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/toggle.tsx, frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-toggle-group, class-variance-authority, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/toggle.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-toggle, class-variance-authority, react
- Usado por: frontend/src/app/components/ui/toggle-group.tsx

### frontend/src/app/components/ui/tooltip.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/utils.ts
- Importa (externo): @radix-ui/react-tooltip, react
- Usado por: (nadie detectado)

### frontend/src/app/components/ui/use-mobile.ts

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): react
- Usado por: frontend/src/app/components/ui/sidebar.tsx

### frontend/src/app/components/ui/utils.ts

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): clsx, tailwind-merge
- Usado por: frontend/src/app/components/ui/accordion.tsx, frontend/src/app/components/ui/alert-dialog.tsx, frontend/src/app/components/ui/alert.tsx, frontend/src/app/components/ui/avatar.tsx, frontend/src/app/components/ui/badge.tsx, frontend/src/app/components/ui/breadcrumb.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/calendar.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/carousel.tsx, frontend/src/app/components/ui/chart.tsx, frontend/src/app/components/ui/checkbox.tsx, frontend/src/app/components/ui/command.tsx, frontend/src/app/components/ui/context-menu.tsx, frontend/src/app/components/ui/dialog.tsx, frontend/src/app/components/ui/drawer.tsx, frontend/src/app/components/ui/dropdown-menu.tsx, frontend/src/app/components/ui/form.tsx, frontend/src/app/components/ui/hover-card.tsx, frontend/src/app/components/ui/input-otp.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/menubar.tsx, frontend/src/app/components/ui/navigation-menu.tsx, frontend/src/app/components/ui/pagination.tsx, frontend/src/app/components/ui/popover.tsx, frontend/src/app/components/ui/progress.tsx, frontend/src/app/components/ui/radio-group.tsx, frontend/src/app/components/ui/resizable.tsx, frontend/src/app/components/ui/scroll-area.tsx, frontend/src/app/components/ui/select.tsx, frontend/src/app/components/ui/separator.tsx, frontend/src/app/components/ui/sheet.tsx, frontend/src/app/components/ui/sidebar.tsx, frontend/src/app/components/ui/skeleton.tsx, frontend/src/app/components/ui/slider.tsx, frontend/src/app/components/ui/switch.tsx, frontend/src/app/components/ui/table.tsx, frontend/src/app/components/ui/tabs.tsx, frontend/src/app/components/ui/textarea.tsx, frontend/src/app/components/ui/toggle-group.tsx, frontend/src/app/components/ui/toggle.tsx, frontend/src/app/components/ui/tooltip.tsx

### frontend/src/app/layouts/main-layout.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/avatar.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/lib/auth-context.tsx
- Importa (externo): react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/lib/api.ts

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: frontend/src/app/lib/auth-context.tsx, frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/lib/auth-context.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/lib/api.ts
- Importa (externo): react
- Usado por: frontend/src/app/App.tsx, frontend/src/app/layouts/main-layout.tsx, frontend/src/app/pages/auth-callback.tsx, frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/home.tsx, frontend/src/app/pages/landing.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx

### frontend/src/app/lib/supabase.ts

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): (ninguno detectado)
- Importa (externo): @supabase/supabase-js
- Usado por: frontend/src/app/pages/auth-callback.tsx, frontend/src/app/pages/login.tsx

### frontend/src/app/pages/auth-callback.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/card.tsx, frontend/src/app/lib/auth-context.tsx, frontend/src/app/lib/supabase.ts
- Importa (externo): react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/ecocoins.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/badge.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/progress.tsx, frontend/src/app/components/ui/tabs.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): react
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/home.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/lib/auth-context.tsx
- Importa (externo): lucide-react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/landing.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/button.tsx, frontend/src/app/lib/auth-context.tsx
- Importa (externo): react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/login.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/alert.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/lib/auth-context.tsx, frontend/src/app/lib/supabase.ts
- Importa (externo): lucide-react, react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/onboarding.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/alert.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/checkbox.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): lucide-react, react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/profile.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/avatar.tsx, frontend/src/app/components/ui/badge.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/tabs.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): qrcode, react, sonner
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/recycling.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/badge.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/select.tsx, frontend/src/app/components/ui/tabs.tsx, frontend/src/app/components/ui/textarea.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): react, sonner
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/register.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/alert.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/select.tsx, frontend/src/app/lib/auth-context.tsx
- Importa (externo): lucide-react, react, react-router
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/search.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/badge.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/select.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): lucide-react, react, react-router, sonner
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/pages/sell.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/components/ui/alert.tsx, frontend/src/app/components/ui/button.tsx, frontend/src/app/components/ui/card.tsx, frontend/src/app/components/ui/input.tsx, frontend/src/app/components/ui/label.tsx, frontend/src/app/components/ui/select.tsx, frontend/src/app/components/ui/textarea.tsx, frontend/src/app/lib/api.ts, frontend/src/app/lib/auth-context.tsx
- Importa (externo): lucide-react, react, react-router, sonner
- Usado por: frontend/src/app/routes.ts

### frontend/src/app/routes.ts

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/layouts/main-layout.tsx, frontend/src/app/pages/auth-callback.tsx, frontend/src/app/pages/ecocoins.tsx, frontend/src/app/pages/home.tsx, frontend/src/app/pages/landing.tsx, frontend/src/app/pages/login.tsx, frontend/src/app/pages/onboarding.tsx, frontend/src/app/pages/profile.tsx, frontend/src/app/pages/recycling.tsx, frontend/src/app/pages/register.tsx, frontend/src/app/pages/search.tsx, frontend/src/app/pages/sell.tsx
- Importa (externo): react-router
- Usado por: frontend/src/app/App.tsx

### frontend/src/main.tsx

- Propósito: Código del frontend (React/Vite/TS)
- Tipo: frontend
- Importa (interno): frontend/src/app/App.tsx
- Importa (externo): react-dom/client
- Usado por: (nadie detectado)

### frontend/vite.config.ts

- Propósito: Config/build del frontend (Vite/Tailwind/etc.)
- Tipo: frontend-config
- Importa (interno): (ninguno detectado)
- Importa (externo): @tailwindcss/vite, @vitejs/plugin-react, path, vite
- Usado por: (nadie detectado)

### INFORME_INVERSION_ECOTRADE.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### legacy/root/backend-setup.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): cors, dotenv, express, mongoose
- Usado por: (nadie detectado)

### legacy/root/error-handler.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### legacy/root/firebase-config.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): dotenv, firebase-admin
- Usado por: (nadie detectado)

### legacy/root/package-json.json

- Propósito: Archivo JSON (config/datos)
- Tipo: data
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### legacy/root/product-model.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: (nadie detectado)

### legacy/root/productController.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### legacy/root/productRoutes.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): express
- Usado por: (nadie detectado)

### legacy/root/swagger.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): swagger-jsdoc, swagger-ui-express
- Usado por: (nadie detectado)

### legacy/root/Transaction.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): mongoose
- Usado por: (nadie detectado)

### legacy/root/transactionController.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### legacy/root/transactionRoutes.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): express
- Usado por: (nadie detectado)

### legacy/root/user-model.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): bcryptjs, mongoose
- Usado por: (nadie detectado)

### legacy/root/userController.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): jsonwebtoken
- Usado por: (nadie detectado)

### legacy/root/userRoutes.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): express
- Usado por: (nadie detectado)

### legacy/root/validationSchemas.js

- Propósito: Código/archivos legacy archivados (no runtime)
- Tipo: legacy
- Importa (interno): (ninguno detectado)
- Importa (externo): joi
- Usado por: (nadie detectado)

### MAPA_PROYECTO_ECOTRADE.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### package-lock.json

- Propósito: Lockfile de npm (resolución exacta)
- Tipo: lockfile
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### package.json

- Propósito: Manifiesto de Node (scripts/deps)
- Tipo: config
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### PLAN_IMPLEMENTACION_ECOTRADE.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### prisma/schema.prisma

- Propósito: Esquema de base de datos (Prisma)
- Tipo: schema
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### product-routes.js

- Propósito: Archivo del proyecto
- Tipo: other
- Importa (interno): (ninguno detectado)
- Importa (externo): express
- Usado por: (nadie detectado)

### project-structure.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### README.md

- Propósito: Documentación del proyecto
- Tipo: docs
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)

### scripts/generate-project-map.js

- Propósito: Scripts de build/deploy/soporte
- Tipo: script
- Importa (interno): (ninguno detectado)
- Importa (externo): fs, path
- Usado por: (nadie detectado)

### scripts/vercel-build.js

- Propósito: Scripts de build/deploy/soporte
- Tipo: script
- Importa (interno): (ninguno detectado)
- Importa (externo): node:child_process
- Usado por: (nadie detectado)

### server-main.js

- Propósito: Entrypoint del backend Express
- Tipo: entrypoint
- Importa (interno): backend/config/database-config.js, backend/middleware/errorHandler.js, backend/routers/productRoutes.js, backend/routers/recyclingRoutes.js, backend/routers/transactionRoutes.js, backend/routers/uploadRoutes.js, backend/routers/userRoutes.js, backend/swagger.js
- Importa (externo): cors, express, express-rate-limit, helmet
- Usado por: api/index.js, backend/tests/ecocoinsLedger.test.js, backend/tests/product.test.js, backend/tests/recycling.test.js, backend/tests/transaction.test.js, backend/tests/user.test.js

### vercel.json

- Propósito: Config de despliegue (Vercel)
- Tipo: config
- Importa (interno): (ninguno detectado)
- Importa (externo): (ninguno detectado)
- Usado por: (nadie detectado)
