# EcoTrade - Frontend

Aplicación web frontend para EcoTrade, una plataforma de economía circular sostenible.

## 🌱 Características

### Completamente Implementadas

✅ **Sistema de Autenticación**
- Login y registro con validación completa
- Gestión de sesiones con JWT
- Context API para manejo de estado de autenticación
- Soporte multi-país con monedas locales

✅ **Marketplace de Productos**
- Búsqueda avanzada con filtros (categoría, condición, precio)
- Publicación de productos con cálculo de EcoCoins
- Vista de productos propios
- Sistema de interés en productos

✅ **Sistema de EcoCoins**
- Visualización de balance actual
- Recompensas canjeables
- Sistema de logros y achievements
- Historial de transacciones
- Puntuación de sostenibilidad

✅ **Módulo de Reciclaje** (Conectado al Backend Real)
- Búsqueda de puntos de reciclaje
- Registro de entregas de reciclaje
- Historial de reciclajes con códigos de seguimiento
- Estadísticas de impacto ambiental (CO₂, energía, agua, árboles)
- Cálculo automático de recompensas por material

✅ **Perfil de Usuario**
- Gestión de información personal
- Vista de productos publicados
- Estadísticas de cuenta
- Edición de perfil

### Mejoras Implementadas

✅ **React Router**
- Navegación completa con rutas protegidas
- Layout principal con header y footer
- Navegación responsiva móvil/desktop

✅ **Consistencia Backend/Frontend**
- Campo `country` incluido en registro (requerido por backend)
- Mapeo correcto de `title` -> `name` en productos
- Cliente API centralizado con manejo de tokens
- Integración completa con todos los endpoints del backend

✅ **UI/UX Mejorada**
- Componentes de UI modernos (shadcn/ui)
- Diseño responsivo completo
- Feedback visual con toast notifications
- Estados de carga y errores
- Gradientes y animaciones

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ 
- Backend de EcoTrade corriendo en `http://localhost:5000`

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env si el backend está en otra URL

# Iniciar servidor de desarrollo
npm run dev
```

### Backend

El frontend está configurado para conectarse al backend de EcoTrade en `http://localhost:5000/api` por defecto.

Para cambiar la URL del backend, actualiza `VITE_API_URL` en tu archivo `.env`.

## 📁 Estructura del Proyecto

```
/src/app/
├── lib/
│   ├── api.ts              # Cliente API centralizado
│   └── auth-context.tsx    # Context de autenticación
├── layouts/
│   └── main-layout.tsx     # Layout principal con navegación
├── pages/
│   ├── home.tsx            # Página de inicio
│   ├── login.tsx           # Inicio de sesión
│   ├── register.tsx        # Registro (con campo country)
│   ├── search.tsx          # Búsqueda de productos
│   ├── sell.tsx            # Publicar producto
│   ├── ecocoins.tsx        # Sistema de recompensas
│   ├── recycling.tsx       # Módulo de reciclaje (conectado)
│   └── profile.tsx         # Perfil de usuario
├── components/
│   └── ui/                 # Componentes reutilizables
├── routes.ts               # Configuración de React Router
└── App.tsx                 # Componente raíz
```

## 🔧 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **React Router 7** - Navegación
- **Tailwind CSS 4** - Estilos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconos
- **Sonner** - Toast notifications

## 🌍 Integración con Backend

### Endpoints Conectados

#### Autenticación
- `POST /api/users/register` - Registro con username, email, password, **country**
- `POST /api/users/login` - Login con email y password
- `GET /api/users/profile` - Obtener perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/stats` - Estadísticas del usuario

#### Productos
- `GET /api/products/search` - Búsqueda con filtros
- `GET /api/products/:id` - Detalle de producto
- `POST /api/products` - Crear producto (con `title` -> `name` mapping)
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/user/my-products` - Mis productos
- `POST /api/products/:id/interest` - Mostrar interés

#### Reciclaje (Totalmente Conectado)
- `GET /api/recycling/points` - Listar puntos de reciclaje
- `GET /api/recycling/points/nearby` - Puntos cercanos
- `GET /api/recycling/points/:id` - Detalle de punto
- `GET /api/recycling/points/:id/materials` - Materiales aceptados
- `GET /api/recycling/points/:id/stats` - Estadísticas del punto
- `POST /api/recycling/submissions` - Crear entrega de reciclaje
- `GET /api/recycling/submissions/my-submissions` - Mis entregas
- `GET /api/recycling/submissions/stats` - Estadísticas de reciclaje
- `PATCH /api/recycling/submissions/:id/cancel` - Cancelar entrega
- `GET /api/recycling/submissions/code/:code` - Buscar por código

#### Transacciones
- `GET /api/transactions` - Listar transacciones
- `POST /api/transactions` - Crear transacción

## 🔒 Modo Demo

El backend incluye un modo demo que permite:
- Login/registro con cualquier credencial
- Datos simulados cuando MongoDB no está disponible
- Perfecto para desarrollo y pruebas

## 📝 Notas de Consistencia

### Resueltas ✅
- ✅ Campo `country` agregado al formulario de registro
- ✅ Mapeo `title` -> `name` en creación de productos
- ✅ Cliente API centralizado con gestión de tokens
- ✅ Módulo de reciclaje completamente conectado
- ✅ Manejo de campos tanto `name` como `title` en productos (retrocompatibilidad)

## 🎨 Características de UI/UX

- **Diseño Responsivo**: Adaptado a móvil, tablet y desktop
- **Navegación Intuitiva**: Header sticky con navegación clara
- **Feedback Visual**: Toast notifications para todas las acciones
- **Estados de Carga**: Spinners y mensajes durante operaciones async
- **Validación de Formularios**: Validación client-side con mensajes claros
- **Temas Consistentes**: Paleta de colores verde/azul para sostenibilidad

## 🌟 Próximas Mejoras Sugeridas

- [ ] Implementar búsqueda geolocalizada de productos cercanos
- [ ] Chat en tiempo real entre compradores y vendedores
- [ ] Upload de imágenes para productos
- [ ] Sistema de ratings y reviews
- [ ] Notificaciones push
- [ ] Dashboard de analytics
- [ ] Integración con mapas para puntos de reciclaje
- [ ] PWA (Progressive Web App) para uso offline

## 📄 Licencia

Este es un proyecto de EcoTrade - Economía Circular Sostenible.

## 🤝 Contribución

Para contribuir al proyecto:
1. Asegúrate de que el backend esté corriendo
2. Prueba todas las funcionalidades antes de hacer commit
3. Mantén la consistencia con el diseño existente
4. Documenta cualquier cambio en la API

---

**EcoTrade** - Juntos por un futuro más sostenible 🌱
