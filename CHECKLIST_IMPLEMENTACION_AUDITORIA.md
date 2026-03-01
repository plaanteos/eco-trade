# EcoTrade — Checklist de Implementación (post-auditoría)

**Fecha:** 27 feb 2026  
**Objetivo:** convertir los hallazgos + backlog (P0–P3) en un checklist ejecutable, verificable y “mergeable” sin perder foco.

---

## Cómo usar este checklist

- Trabajá en orden: **Sprint 0 → Sprint 1 → Sprint 2**.
- Cada ítem tiene una **Definition of Done (DoD)** y, cuando aplica, una **verificación**.
- Regla: **ningún P0 se considera “done” si no tiene test de integración** (Jest + Supertest) o una verificación automática equivalente.

### Definiciones
- **P0 (Bloqueante):** riesgo de fraude/seguridad/integridad económica o exposición de datos.
- **P1 (Alta):** inconsistencias severas, contratos rotos FE/BE, deuda técnica que amplifica P0.
- **P2 (Media):** escalabilidad/observabilidad/performance sin riesgo inmediato.
- **P3 (Baja):** pulido, refactors no críticos, documentación.

### DoD mínimo por ticket
- [ ] Cambios implementados en backend y/o frontend según corresponda.
- [ ] Tests agregados/actualizados en `backend/tests/*` (si el cambio impacta API).
- [ ] La suite relevante pasa: `npm test` (o al menos los tests del módulo afectado).
- [ ] Contrato de API consistente (status codes + shape) o documentado explícitamente.

---

## Preflight (antes de tocar lógica)

- [ ] Confirmar que el **código activo** a editar está en `backend/` (no duplicados en raíz).
- [ ] Revisar flags de entorno: `DEMO_MODE`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
- [ ] Acordar estándar de respuesta de API (ej. `{ success, data, error }`) y mantenerlo estable.
- [ ] Correr tests actuales para baseline:
  - [x] `npm test`
  - [ ] (Opcional) `npm run dev` y smoke test manual de rutas críticas.

---

# Sprint 0 — P0 Bloqueantes (Seguridad + Integridad ecoCoins)

## A. Autorización / IDOR (Productos)

- [x] **Bloquear update/delete de productos ajenos (ownership guard)** (P0)
  - DoD:
    - [x] Solo el owner/seller del producto puede editar o borrar.
    - [x] Admin puede operar si aplica a tu política.
  - Verificación:
    - [x] Test: seller A no puede `PUT/PATCH/DELETE` producto de seller B.
  - Archivos típicos:
    - Backend: `backend/controllers/productController.js`, `backend/routers/productRoutes.js`
    - Middleware: `backend/middleware/authMiddleware.js`

- [x] **Revisar endpoints “public + optionalAuth” para no filtrar datos sensibles** (P0)
  - DoD:
    - [x] Respuesta pública de productos no incluye PII del owner.
    - [x] Si hay `include`/joins a usuario, devolver solo campos permitidos.
  - Verificación:
    - [x] Test: `/api/products` y `/api/products/:id` no exponen `email`/`password`/`recyclingCode`.

## B. EcoCoins — Pago con ecoCoins (subpago / manipulación cliente)

- [x] **Eliminar/ignorar `ecoCoinsAmount` enviado por el cliente** (P0)
  - DoD:
    - [x] El servidor calcula ecoCoins requeridos basado en el producto y reglas.
    - [x] Se rechaza cualquier request que intente imponer monto o saldo inconsistente.
  - Verificación:
    - [x] Test: cliente manda `ecoCoinsAmount` menor → 400/403 y NO se marca producto como sold.
  - Archivos típicos:
    - `backend/controllers/transactionController.js`

- [x] **Prevenir saldo negativo y carreras (race conditions)** (P0)
  - DoD:
    - [x] Debit/credit ecoCoins ocurre dentro de una transacción DB.
    - [x] No es posible que el buyer quede con ecoCoins < 0 por concurrencia.
  - Verificación:
    - [x] Test de doble request (simulado) no produce balances inválidos.

- [x] **Asegurar “idempotencia” en creación/confirmación de transacciones** (P0)
  - DoD:
    - [x] No se puede ejecutar dos veces el mismo movimiento económico.
    - [x] Si hay reintentos (cliente/red), el resultado es estable.

## C. EcoCoins — Recompensas (fiat y publicación)

- [x] **Definir regla única de acreditación** (P0/P1 según alcance)
  - DoD:
    - [x] Opción implementada:
      - [x] (Opción 1) Acreditar ecoCoins al balance al completar transacción (fiat).
      - [ ] (Opción 2) No mantener balance “mutable”, sino derivarlo de un ledger (Sprint 1).
    - [x] `ecoCoinsBuyer`/`ecoCoinsSeller` en transacciones fiat representan el delta aplicado al balance.
  - Verificación:
    - [x] Test: transacción `paymentMethod: card` acredita buyer+4 y seller+6 para precio 100.

- [x] **Unificar cálculo usando una sola fuente (ecoCoinCalculator)** (P1)
  - DoD:
    - [x] Cálculos de ecoCoins se hacen con `backend/utils/ecoCoinCalculator.js` o equivalente central.
  - Verificación:
    - [x] Test: precio 101 requiere 11 ecoCoins (ceil) y se rechaza 10.

## D. Reciclaje — PII en tracking público

- [x] **Sanitizar endpoint público por `submissionCode` para no exponer PII** (P0)
  - DoD:
    - [x] La vista pública no devuelve email, ids internos, recyclingCode del usuario, ni data de acceso.
    - [x] Solo devuelve estado, timestamps mínimos y datos agregados no sensibles.
  - Verificación:
    - [x] Test: response no contiene `email`, `userId`, `recyclingCode`, etc.
  - Archivos típicos:
    - `backend/controllers/recyclingSubmissionController.js`, `backend/routers/recyclingRoutes.js`

- [x] **Rate limit / antifuerza bruta para `submissionCode`** (P0)
  - DoD:
    - [x] Límite por IP / ventana para evitar enumeración de códigos.

## E. Reciclaje — “Minting” / fraude (crear puntos + rewards)

- [x] **Restringir creación de RecyclingPoints** (P0)
  - DoD:
    - [x] Solo `admin` (o rol explícito) puede crear puntos.
    - [x] Nadie obtiene privilegios por auto-creación sin validación.
  - Verificación:
    - [x] Test: user normal no puede crear punto.
  - Archivos típicos:
    - `backend/controllers/recyclingPointController.js`, `backend/middleware/authMiddleware.js`, `backend/middleware/recyclingAccess.js`

- [x] **Bloquear parámetros peligrosos de rewards** (P0)
  - DoD:
    - [x] `rewardPerKg` (o equivalente) tiene límites razonables server-side y/o configuración central.
    - [x] No puede ser arbitrario por request.
  - Verificación:
    - [x] Test: crear/actualizar punto con `rewardPerKg` fuera de rango → 400.

- [x] **Revisar flujo operator: registerDelivery/verify para evitar doble acreditación** (P0)
  - DoD:
    - [x] Un submission no acredita dos veces (idempotente).
    - [x] Estados y transiciones están validadas.
  - Verificación:
    - [x] Test: `verify` doble no incrementa ecoCoins dos veces.

## F. Contratos FE/BE que rompen pantallas

- [x] **Alinear shape de `GET /api/users/stats` con el frontend** (P0)
  - DoD:
    - [x] O backend devuelve lo que FE consume, o FE se adapta (una sola verdad).
  - Verificación:
    - [x] Test de contrato: `data.ecoCoins`, `data.transactionsCount`, `data.sustainabilityScore`, `data.monthlyGrowth`.
  - Archivos típicos:
    - Backend: `backend/controllers/userController.js`
    - Frontend: `frontend/src/app/pages/ecocoins.tsx`, `frontend/src/app/lib/api.ts`

- [ ] **Estandarizar responses (mínimo para rutas críticas)** (P1)
  - DoD:
    - [ ] `products`, `transactions`, `recycling`, `users` responden con estructura consistente.
    - [ ] Se actualizan tests que esperan arrays “planos” si corresponde.

## G. Tests P0 (obligatorios)

- [ ] Agregar tests de regresión para:
  - [x] IDOR productos.
  - [x] Subpago ecoCoins.
  - [x] Tracking público sin PII.
  - [x] Restricción create recycling point.
  - [x] Bloqueo rewardPerKg fuera de rango.

---

# Sprint 1 — P1 Consistencia (Ledger ecoCoins + RBAC por permisos + API estable)

## A. Ledger/contabilidad ecoCoins (fuente de verdad)

- [ ] **Crear modelo de ledger ecoCoins (Prisma) + migración** (P1)
  - DoD:
    - [x] Tabla/entidad `EcoCoinLedger` (Prisma) en `prisma/schema.prisma`.
    - [ ] Schema aplicado en entorno con `DATABASE_URL` (ej. `npx prisma db push` o migración).
    - [x] Paridad en `DEMO_MODE`: ledger in-memory en `backend/utils/demoStore.js`.
    - [x] Regla: cada operación económica genera 1 entry (al menos en DEMO_MODE + handlers principales).
    - [x] Script de backfill preparado: `npm run ecocoins:backfill-ledger` (idempotente).
    - [ ] Backfill ejecutado en staging/producción (una sola vez, verificando métricas/tiempos).

- [ ] **Derivar balance desde ledger o mantener balance + constraints** (P1)
  - DoD:
    - [ ] Definir estrategia:
      - [ ] (A) `User.ecoCoins` se calcula (view/cached) desde ledger.
      - [ ] (B) `User.ecoCoins` se mantiene, pero cada cambio crea entry y se valida atomicidad.

- [x] **Actualizar historial ecoCoins para leer del ledger** (P1)
  - DoD:
    - [x] `GET /users/ecoCoins/history` devuelve entries del ledger (DEMO_MODE) y en DB mode usa ledger si hay datos (con fallback derivado mientras no haya backfill).

## B. RBAC real (roles + permisos aplicados consistentemente)

- [x] **Aplicar `requirePermission()` en endpoints sensibles** (P1)
  - DoD:
    - [x] Acciones admin (listar usuarios, crear puntos, asignar roles) requieren permisos explícitos.
  - Verificación:
    - [x] Test: `backend/tests/rbac.test.js`
    - [x] Rutas: `backend/routers/userRoutes.js`, `backend/routers/recyclingRoutes.js`

- [x] **Normalización de roles + hardening** (P1)
  - DoD:
    - [x] Roles se normalizan en un único lugar.
    - [x] No hay bypass en `*_demo` fuera de `DEMO_MODE`.
  - Verificación:
    - [x] Test: `backend/tests/demoHardening.test.js`

## C. Validaciones coherentes con Prisma IDs

- [x] **Eliminar validaciones legacy tipo Mongo ObjectId (24-hex) si no aplican** (P1)
  - DoD:
    - [x] Validación de IDs alineada con `cuid()`/Prisma.
  - Verificación:
    - [x] Test: `backend/tests/validationSchemas.test.js` acepta `cuid`/UUID/ObjectId y rechaza inválidos.
  - Archivos típicos:
    - `backend/utils/validationSchemas.js`

## D. API: paginación y filtros mínimos

- [x] **Paginación en listados grandes** (P1/P2)
  - DoD:
    - [x] `GET /products`, `GET /transactions`, `GET /recycling/submissions` aceptan `limit/offset` o `cursor`.
    - [x] Tests ajustados.
  - Verificación:
    - [x] Test: `backend/tests/product.test.js` (limit/page)
    - [x] Test: `backend/tests/transaction.test.js` (pagination metadata)
    - [x] Test: `backend/tests/recycling.test.js` (my-submissions pagination)

---

# Sprint 2 — P2/P3 Escalabilidad, Observabilidad y Docs

## A. Índices y performance

- [ ] **Agregar/ajustar índices Prisma para queries calientes** (P2)
  - DoD:
    - [ ] Índices en campos de búsqueda/joins frecuentes (sellerId, buyerId, status, createdAt, etc.).

## B. Uploads y límites

- [ ] **Hardening de uploads** (P2)
  - DoD:
    - [ ] Validación de MIME/size.
    - [ ] Rate limit específico para uploads.

## C. Observabilidad

- [ ] **Logs de auditoría para eventos económicos y roles** (P2)
  - DoD:
    - [ ] Registrar (sin PII) quién cambió roles, quién acreditó ecoCoins, referenceId.

## D. Documentación (alinear con stack real)

- [ ] **Actualizar docs legacy (Mongo/Mongoose) a Prisma/Postgres** (P3)
  - DoD:
    - [ ] README y docs internas reflejan el stack real.
    - [ ] Se clarifica que el código activo está en `backend/`.

---

## Checklist de cierre (antes de “Producción”)

- [ ] `DEMO_MODE` bloqueado en producción y verificado.
- [ ] CORS restringido a orígenes esperados.
- [ ] Rate limiting adecuado en auth, tracking público y uploads.
- [ ] No hay endpoints públicos que devuelvan PII.
- [ ] ecoCoins: reglas definidas, consistentes y testeadas (incluye antifraude básico).
- [ ] Suite de tests estable (ideal: CI).

---

## Notas / decisiones (para evitar drift)

- [ ] Decisión: balance ecoCoins derivado vs mutable.
- [ ] Decisión: cuándo se acredita ecoCoins (publicación vs transacción vs reciclaje).
- [ ] Decisión: roles/permisos definitivos (tabla de permisos y responsables).
