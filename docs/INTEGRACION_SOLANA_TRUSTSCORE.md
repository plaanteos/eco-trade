# Integración: TrustScore + Recibo verificable (Solana)

> Documento vivo. **Regla de mantenimiento:** cada vez que se modifique algún archivo relacionado a esta integración, se debe actualizar la sección **“Historial de cambios”** y, si aplica, **“Mapa de archivos”**, **“Modelo de datos”** y **“API”**.

## Objetivo
Añadir a la vertical de reciclaje:
- **TrustScore** explicable (0–100) con señales (`signals`) y versionado de algoritmo.
- **Hash de evidencia** reproducible (para verificación pública).
- **Recibo verificable** en Solana (por defecto `devnet`), almacenando `signature` y link a Explorer.
- Mantener hardening existente: el tracking público por `submissionCode` no debe exponer PII.

## Alcance (qué cubre este documento)
- Cubre **solo** archivos y componentes involucrados en TrustScore/recibo on-chain dentro de reciclaje.
- No pretende documentar todo el repo; para eso ver `README.md` y `MAPA_PROYECTO_ECOTRADE.md`.

## Principios de diseño
- **Idempotencia:** verificar dos veces una submission no debe duplicar ecoCoins ni emitir 2 receipts.
- **No PII en tracking público:** `GET /api/recycling/submissions/code/:code` debe seguir siendo seguro.
- **Configuración por entorno:** emisión Solana se habilita con env vars; en tests puede ir deshabilitada o mockeada.
- **Separación de responsabilidades:**
  - Controller coordina.
  - Utilidades calculan trust/evidenceHash.
  - Integración Solana encapsulada en un módulo.

## Modelo de datos (estado actual)
Actualmente `RecyclingSubmission` (Prisma) tiene JSONs: `submissionDetails`, `rewards`, `tracking`.

Cambios aplicados en este repo:
- Se añadió el enum `ReceiptStatus`.
- Se añadieron campos explícitos en `RecyclingSubmission` para trust/evidence/receipt.

## Configuración (env vars) — propuesto
- `SOLANA_RECEIPTS_ENABLED` ("true"/"false"): habilita emisión.
- `SOLANA_CLUSTER` ("devnet"|"mainnet-beta"), default: `devnet`.
- `SOLANA_RPC_URL`: opcional; si no, se usa el endpoint estándar del cluster.
- `SOLANA_PAYER_SECRET`: clave del payer (formato a definir en implementación).

### Formato de `SOLANA_PAYER_SECRET`
Este repo acepta 2 formatos:
- JSON array: `[...]` (bytes del `secretKey`)
- Base64: bytes del `secretKey`

Regla: **nunca** comitear el secreto real en git. Usar `.env` local / secret manager.

#### Generar un payer (dev)
Incluye un script para generar un Keypair y obtener el secret en ambos formatos:
- `npm run solana:keygen`

En `devnet`, la `PublicKey` generada debe tener SOL para pagar fees (faucet).

## Migración de base de datos
Se agregaron campos nuevos a `RecyclingSubmission` en `prisma/schema.prisma`.

Estado del repo: actualmente **no** hay carpeta `prisma/migrations/`.

### Opción A (recomendada para este repo hoy): `db push`
Si venís trabajando sin migraciones, la forma más simple y con menos fricción es:
- `npm run db:push`

Esto sincroniza el esquema con tu DB sin requerir historial de migraciones.

### Opción B (recomendada a futuro): migraciones (más “prod”)
Cuando quieras formalizar:
1) Definir un plan de “baseline” (para no forzar resets por drift)
2) Empezar a crear migraciones nuevas desde ese baseline
3) En producción aplicar con `npm run prisma:migrate:deploy`

### Checklist de activación (recomendado)
1) DB
- Asegurar `DATABASE_URL` correcto.
- Aplicar schema (dev): `npm run prisma:migrate`
- Aplicar schema (prod): `npm run prisma:migrate:deploy`

2) Solana receipts (opcional)
- Generar payer (dev): `npm run solana:keygen`
- Setear env vars:
  - `SOLANA_RECEIPTS_ENABLED=true`
  - `SOLANA_CLUSTER=devnet` (primero)
  - `SOLANA_PAYER_SECRET=...`
- Verificar flujo:
  - Verificar una entrega aprobada y confirmar que `receiptStatus=issued` y existe `solanaExplorerUrl`.

3) Operación / reintentos
- Si queda `receiptStatus=failed`, usar el endpoint de reintento:
  - `POST /api/recycling/submissions/:submissionId/receipt/retry`

## Seguridad (secrets)
- `.env` debe permanecer fuera de git (ver `.gitignore`).
- Si alguna credencial real (DB/JWT/Solana) fue compartida o subida por accidente, **rotarla**.
- Para `SOLANA_PAYER_SECRET`:
  - Usar `devnet` primero.
  - En producción, idealmente usar secret manager/KMS.

## API (estado actual)
- Verificación: `PATCH /api/recycling/submissions/:submissionId/verify`
- Tracking público: `GET /api/recycling/submissions/code/:code` (rate limited)

Cambios aplicados en este repo:
- Reintento de emisión: `POST /api/recycling/submissions/:submissionId/receipt/retry`
  - En real mode, el handler valida que seas admin de plataforma.
  - En demo mode, emite un signature fake determinístico.

## Mapa de archivos (se irá llenando)
### Backend
- `backend/controllers/recyclingSubmissionController.js`: verificación real (Prisma).
- `backend/controllers/recyclingSubmissionController_demo.js`: verificación demo (demoStore).
- `backend/routers/recyclingRoutes.js`: rutas de reciclaje (incluye tracking público).

Utilidades nuevas:
- `backend/utils/stableStringify.js`: stringify canónico (keys ordenadas) para hashing reproducible.
- `backend/utils/evidenceHash.js`: construye payload y calcula `sha256` hex.
- `backend/utils/trustScore.js`: calcula TrustScore explicable y versionado.
- `backend/utils/solanaReceipt.js`: emite recibo en Solana (Memo Program) si está habilitado.

### Prisma
- `prisma/schema.prisma`: modelos y enums.

### Frontend
- `frontend/src/app/pages/recycling.tsx`: UI principal de reciclaje.
- `frontend/src/app/lib/api.ts`: cliente HTTP.

### Tests
- `backend/tests/recycling.test.js`: hardening (no PII, rate limit, idempotencia).

## Historial de cambios
- 2026-03-06: Creación del documento vivo.
- 2026-03-06: Extensión de `prisma/schema.prisma` con TrustScore/Evidence/Receipt + utilidades backend.
- 2026-03-06: Integración en controllers y nueva ruta de reintento de receipt.
- 2026-03-06: UI mínima en historial para mostrar TrustScore + receipt.
- 2026-03-06: Script `solana:keygen` + scripts de migración deploy.

## Contrato del tracking público (importante)
Endpoint: `GET /api/recycling/submissions/code/:code`
- Debe seguir sin PII (sin email, sin recyclingCode, sin ids internos).
- Ahora puede incluir opcionalmente:
  - `trust`: `{ score, signals, algorithmVersion, computedAt }`
  - `receipt`: `{ status, issuedAt, network, cluster, signature, explorerUrl, evidenceHash }`
