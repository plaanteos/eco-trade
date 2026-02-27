# EcoTrade - AI Coding Agent Instructions

## Architecture Overview
EcoTrade is a circular economy platform with a Node.js/Express backend and React frontend. The core business logic revolves around **ecoCoins** - a reward system where users earn digital currency through sustainable product transactions.

### Key Concepts
- **EcoCoins**: Earned through transactions (1 ecoCoin per 10 units traded) via `backend/utils/ecoCoinCalculator.js`
- **Circular Economy**: Users trade products and build sustainable credit through the ecoCoin system
- **Three Core Entities**: Users, Products, Transactions (with MongoDB references between them)

## Project Structure & Patterns

### Backend Architecture (`backend/`)
- **Controllers**: Business logic in `controllers/` (minimal validation, focus on data operations)
- **Models**: Mongoose schemas with ObjectId references: `Product.owner → User`, `Transaction.{buyer,seller} → User`
- **Routes**: RESTful endpoints in `routers/` following `/api/{resource}` pattern
- **Utils**: Shared logic like `ecoCoinCalculator.js` and basic `validationSchemas.js`

### Frontend Architecture (`frontend/src/`)
- **Screen-based navigation**: `screens/` contains main app pages (Home, Login, Profile, etc.)
- **State management**: Uses React hooks, JWT token stored in component state
- **Navigation**: Simple screen switcher in `App.js` with nav buttons

## Critical Development Workflows

### Environment Setup
```bash
# Backend setup (from project root)
cp env-example.txt .env  # Configure MongoDB URI and Firebase credentials
npm install
npm run dev  # Uses nodemon for hot reload

# Testing
npm test  # Jest with supertest for API integration tests
```

### Database Connection
- MongoDB via Mongoose in `backend/config/database-config.js`
- **IMPORTANT**: Connection errors cause `process.exit(1)` - ensure proper MongoDB URI in `.env`

### API Testing Pattern
Tests use supertest against the main server (`server-main.js`). See `backend/tests/product.test.js` for the established pattern of testing API endpoints directly.

## Project-Specific Conventions

### Error Handling
- Controllers use try-catch with manual status codes (500 for server errors, 400 for validation)
- Global error handler in `backend/middleware/errorHandler.js` catches unhandled errors
- Frontend handles auth failures by clearing token state

### Validation Strategy
- **Backend**: Manual field checking in controllers (`if (!name || !price)`) 
- **Frontend**: Basic form validation in screen components
- Schema definitions in `backend/utils/validationSchemas.js` (currently just documentation)

### File Organization Anti-patterns
⚠️ **Note**: Some files exist in both root and `backend/` directories (e.g., `productController.js` in both locations). When editing, always work with files inside the `backend/` directory for active code.

## Integration Points

### Authentication Flow
1. Login via `LoginScreen` → API call → JWT token stored in App state
2. Protected routes check token in headers: `Authorization: Bearer {jwt}`
3. User profile fetched on login success and stored in App state

### Data Flow Example
Product creation: `Frontend form → POST /api/products → productController.createProduct → MongoDB → Product model → Response`

### External Dependencies
- **MongoDB**: Primary database (connection required for app start)
- **Firebase**: Admin SDK configured but implementation pending (see `firebase-config.js`)
- **Security**: Helmet + CORS middleware configured in `server-main.js`

## Key Files for Understanding
- `server-main.js`: Main entry point, middleware stack, route registration
- `backend/models/`: Data schemas and relationships
- `frontend/src/App.js`: Client-side routing and state management
- `backend/utils/ecoCoinCalculator.js`: Core business logic for rewards system