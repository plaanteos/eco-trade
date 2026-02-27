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
  - [ ] `npm test`
  - [ ] (Opcional) `npm run dev` y smoke test manual de rutas críticas.

---

# Sprint 0 — P0 Bloqueantes (Seguridad + Integridad ecoCoins)

## A. Autorización / IDOR (Productos)

- [ ] **Bloquear update/delete de productos ajenos (ownership guard)** (P0)
  - DoD:
    - [ ] Solo el owner/seller del producto puede editar o borrar.
    - [ ] Admin puede operar si aplica a tu política.
  - Verificación:
    - [ ] Test: seller A no puede `PUT/PATCH/DELETE` producto de seller B.
  - Archivos típicos:
    - Backend: `backend/controllers/productController.js`, `backend/routers/productRoutes.js`
    - Middleware: `backend/middleware/authMiddleware.js`

- [ ] **Revisar endpoints “public + optionalAuth” para no filtrar datos sensibles** (P0)
  - DoD:
    - [ ] Respuesta pública de productos no incluye PII del owner.
    - [ ] Si hay `include`/joins a usuario, devolver solo campos permitidos.

## B. EcoCoins — Pago con ecoCoins (subpago / manipulación cliente)

- [ ] **Eliminar/ignorar `ecoCoinsAmount` enviado por el cliente** (P0)
  - DoD:
    - [ ] El servidor calcula ecoCoins requeridos basado en el producto y reglas.
    - [ ] Se rechaza cualquier request que intente imponer monto o saldo inconsistente.
  - Verificación:
    - [ ] Test: cliente manda `ecoCoinsAmount` menor → 400/403 y NO se marca producto como sold.
  - Archivos típicos:
    - `backend/controllers/transactionController.js`

- [ ] **Prevenir saldo negativo y carreras (race conditions)** (P0)
  - DoD:
    - [ ] Debit/credit ecoCoins ocurre dentro de una transacción DB.
    - [ ] No es posible que el buyer quede con ecoCoins < 0 por concurrencia.
  - Verificación:
    - [ ] Test de doble request (o simulado) no produce balances inválidos.

- [ ] **Asegurar “idempotencia” en creación/confirmación de transacciones** (P0)
  - DoD:
    - [ ] No se puede ejecutar dos veces el mismo movimiento económico.
    - [ ] Si hay reintentos (cliente/red), el resultado es estable.

## C. EcoCoins — Recompensas (fiat y publicación)

- [ ] **Definir regla única de acreditación** (P0/P1 según alcance)
  - DoD:
    - [ ] Una de estas opciones queda implementada y documentada:
      - [ ] (Opción 1) Acreditar ecoCoins al balance al completar transacción (fiat/ecoCoins).
      - [ ] (Opción 2) No mantener balance “mutable”, sino derivarlo de un ledger (Sprint 1).
    - [ ] Frontend no promete ecoCoins “por publicar” si backend no acredita.

- [ ] **Unificar cálculo usando una sola fuente (ecoCoinCalculator)** (P1)
  - DoD:
    - [ ] Cálculos de ecoCoins se hacen con `backend/utils/ecoCoinCalculator.js` o equivalente central.

## D. Reciclaje — PII en tracking público

- [ ] **Sanitizar endpoint público por `submissionCode` para no exponer PII** (P0)
  - DoD:
    - [ ] La vista pública no devuelve email, ids internos, recyclingCode del usuario, ni data de acceso.
    - [ ] Solo devuelve estado, timestamps mínimos y datos agregados no sensibles.
  - Verificación:
    - [ ] Test: response no contiene `email`, `userId`, `recyclingCode`, etc.
  - Archivos típicos:
    - `backend/controllers/recyclingSubmissionController.js`, `backend/routers/recyclingRoutes.js`

- [ ] **Rate limit / antifuerza bruta para `submissionCode`** (P0)
  - DoD:
    - [ ] Límite por IP / ventana para evitar enumeración de códigos.

## E. Reciclaje — “Minting” / fraude (crear puntos + rewards)

- [ ] **Restringir creación de RecyclingPoints** (P0)
  - DoD:
    - [ ] Solo `admin` (o rol explícito) puede crear puntos.
    - [ ] Nadie obtiene privilegios por auto-creación sin validación.
  - Verificación:
    - [ ] Test: user normal no puede crear punto.
  - Archivos típicos:
    - `backend/controllers/recyclingPointController.js`, `backend/middleware/authMiddleware.js`, `backend/middleware/recyclingAccess.js`

- [ ] **Bloquear parámetros peligrosos de rewards** (P0)
  - DoD:
    - [ ] `rewardPerKg` (o equivalente) tiene límites razonables server-side y/o configuración central.
    - [ ] No puede ser arbitrario por request.

- [ ] **Revisar flujo operator: registerDelivery/verify para evitar doble acreditación** (P0)
  - DoD:
    - [ ] Un submission no acredita dos veces (idempotente).
    - [ ] Estados y transiciones están validadas.

## F. Contratos FE/BE que rompen pantallas

- [ ] **Alinear shape de `GET /api/users/stats` con el frontend** (P0)
  - DoD:
    - [ ] O backend devuelve lo que FE consume, o FE se adapta (una sola verdad).
  - Verificación:
    - [ ] Pantalla ecoCoins/stats no rompe con usuario real.
  - Archivos típicos:
    - Backend: `backend/controllers/userController.js`
    - Frontend: `frontend/src/app/pages/ecocoins.tsx`, `frontend/src/app/lib/api.ts`

- [ ] **Estandarizar responses (mínimo para rutas críticas)** (P1)
  - DoD:
    - [ ] `products`, `transactions`, `recycling`, `users` responden con estructura consistente.
    - [ ] Se actualizan tests que esperan arrays “planos” si corresponde.

## G. Tests P0 (obligatorios)

- [ ] Agregar tests de regresión para:
  - [ ] IDOR productos.
  - [ ] Subpago ecoCoins.
  - [ ] Tracking público sin PII.
  - [ ] Restricción create recycling point.

---

# Sprint 1 — P1 Consistencia (Ledger ecoCoins + RBAC por permisos + API estable)

## A. Ledger/contabilidad ecoCoins (fuente de verdad)

- [ ] **Crear modelo de ledger ecoCoins (Prisma) + migración** (P1)
  - DoD:
    - [ ] Tabla/entidad `EcoCoinLedger` (o nombre equivalente) con:
      - `userId`, `type` (earn/spend/adjust), `amount`, `source` (transaction/recycling/admin), `referenceId`, `createdAt`.
    - [ ] Regla: cada operación económica genera 1 entry.

- [ ] **Derivar balance desde ledger o mantener balance + constraints** (P1)
  - DoD:
    - [ ] Definir estrategia:
      - [ ] (A) `User.ecoCoins` se calcula (view/cached) desde ledger.
      - [ ] (B) `User.ecoCoins` se mantiene, pero cada cambio crea entry y se valida atomicidad.

- [ ] **Actualizar historial ecoCoins para leer del ledger** (P1)
  - DoD:
    - [ ] `GET /users/ecoCoins/history` (o equivalente) devuelve entries del ledger.

## B. RBAC real (roles + permisos aplicados consistentemente)

- [ ] **Aplicar `requirePermission()` en endpoints sensibles** (P1)
  - DoD:
    - [ ] Acciones admin (listar usuarios, crear puntos, asignar roles) requieren permisos explícitos.

- [ ] **Normalización de roles + hardening** (P1)
  - DoD:
    - [ ] Roles se normalizan en un único lugar.
    - [ ] No hay bypass en `*_demo` fuera de `DEMO_MODE`.

## C. Validaciones coherentes con Prisma IDs

- [ ] **Eliminar validaciones legacy tipo Mongo ObjectId (24-hex) si no aplican** (P1)
  - DoD:
    - [ ] Validación de IDs alineada con `cuid()`/Prisma.
  - Archivos típicos:
    - `backend/utils/validationSchemas.js`

## D. API: paginación y filtros mínimos

- [ ] **Paginación en listados grandes** (P1/P2)
  - DoD:
    - [ ] `GET /products`, `GET /transactions`, `GET /recycling/submissions` aceptan `limit/offset` o `cursor`.
    - [ ] Tests ajustados.

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
