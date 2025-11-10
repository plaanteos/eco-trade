# EcoTrade

Plataforma de economía circular para intercambio de productos y ecoCoins.

## Estructura del proyecto
- **backend/**: API REST con Node.js, Express y MongoDB
- **frontend/**: Interfaz de usuario (React Native sugerido)

## Instalación backend
1. Clona el repositorio
2. Copia `.env-example.txt` a `.env` y completa los datos
3. Instala dependencias:
   ```
npm install
   ```
4. Inicia el servidor:
   ```
npm run dev
   ```

## Endpoints principales
- `POST /api/users` — Crear usuario
- `GET /api/products` — Listar productos
- `POST /api/transactions` — Crear transacción

## Pendiente
- Implementar frontend
- Mejorar validaciones y seguridad
- Agregar pruebas automáticas
- Documentar API con Swagger
