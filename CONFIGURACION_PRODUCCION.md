# 🚀 Configuración de EcoTrade para Producción

## 📋 Guía Paso a Paso

### **Paso 1: Configurar MongoDB Atlas (Base de Datos en la Nube)**

1. **Ve a MongoDB Atlas**: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Crea tu cuenta gratuita** (si no la tienes)

3. **Crea un nuevo cluster**:
   - Haz clic en "Create a Free Cluster"
   - Selecciona tu región (recomendado: **US East** para mejor rendimiento)
   - Deja las demás opciones por defecto
   - Haz clic en "Create Cluster" (tardará 1-3 minutos)

4. **Configura la seguridad**:
   
   **4.1 Crear usuario de base de datos:**
   - Ve a "Database Access" en el menú lateral
   - Haz clic en "Add New Database User"
   - Selecciona "Password"
   - Usuario: `ecotrade_user`
   - Contraseña: Genera una contraseña segura (¡guárdala!)
   - Database User Privileges: "Read and write to any database"
   - Haz clic en "Add User"

   **4.2 Configurar acceso de red:**
   - Ve a "Network Access" en el menú lateral
   - Haz clic en "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - Haz clic en "Confirm"

5. **Obtener cadena de conexión**:
   - Ve a "Clusters" en el menú lateral
   - En tu cluster, haz clic en "Connect"
   - Selecciona "Connect your application"
   - Selecciona "Node.js" y versión "4.1 or later"
   - Copia la cadena de conexión que se ve así:
   ```
   mongodb+srv://ecotrade_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### **Paso 2: Configurar Variables de Entorno**

1. **Copia el ejemplo de configuración**:
   ```powershell
   copy env-example.txt .env
   ```

2. **Edita el archivo `.env` (obligatorio en producción)**:
   - Abre el archivo `.env` en VS Code
   - Reemplaza `TU_USUARIO:TU_PASSWORD` con tus datos reales
   - Agrega el nombre de la base de datos al final: `/ecotrade`
   - Configura `JWT_SECRET` (sin esto la API no inicia en producción)
   - Configura `CORS_ORIGINS` con el/los dominios reales del frontend
   - Asegúrate de `DEMO_MODE=false`
   - Asegúrate de `NODE_ENV=production`
   
   **Ejemplo:**
   ```
   MONGODB_URI=mongodb+srv://ecotrade_user:mi_password_123@cluster0.abc123.mongodb.net/ecotrade?retryWrites=true&w=majority
   ```

### **Paso 3: Inicializar la Base de Datos**

1. **Ejecuta el script de inicialización**:
   ```powershell
   npm run init-db
   ```
   
   Esto creará:
   - ✅ Un usuario administrador
   - ✅ 10 productos de muestra
   - ✅ Índices optimizados para búsquedas

### **Paso 4: Iniciar EcoTrade**

1. **Iniciar el backend (producción)**:
   ```powershell
   npm start
   ```
   
   Deberías ver:
   ```
   🔌 Conectando a MongoDB...
   ✅ MongoDB conectado exitosamente: cluster0.xxxxx.mongodb.net
   📊 Base de datos: ecotrade
   🚀 Servidor EcoTrade corriendo en puerto 5000
   ```

2. **Construir el frontend (Vite + React + TypeScript)**:
   ```powershell
   npm run frontend:build
   ```

   Luego publica la carpeta generada por Vite (normalmente `EcoTrade project overview/dist`) en un servidor estático (Nginx/Apache/Vercel/Netlify).

   Importante: en el hosting del frontend define `VITE_API_URL` apuntando a tu API, por ejemplo:
   ```
   VITE_API_URL=https://api.tu-dominio.com/api
   ```

3. **¡Acceder a EcoTrade!**
   - Frontend: (tu dominio / hosting estático)
   - API: http://localhost:5000
   - Documentación: http://localhost:5000/api-docs

### **Paso 5: Verificar Funcionamiento**

1. **Probar el login**:
   - Usuario: `admin@ecotrade.com`
   - Contraseña: `admin123`

2. **Verificar productos**:
   - Ve a la sección de búsqueda
   - Deberías ver 10 productos disponibles

3. **Crear un producto nuevo**:
   - Llena el formulario de producto
   - Verifica que se guarde en la base de datos real

## 🔧 Solución de Problemas

### Error: "Error conectando a MongoDB"
- ✅ Verifica que la cadena de conexión sea correcta
- ✅ Asegúrate de que tu IP esté en la lista blanca
- ✅ Confirma que el usuario y contraseña sean correctos

### Error: "EADDRINUSE puerto 5000"
```powershell
Stop-Process -Name "node" -Force
npm run dev
```

### Base de datos vacía
```powershell
npm run init-db
```

## 🌍 Siguientes Pasos para Producción Real

1. **Deploy a Heroku/Railway/Vercel**
2. **Configurar dominio personalizado**
3. **Implementar SSL/HTTPS**
4. **Monitoreo y analytics**
5. **Backups automáticos**

## 📞 Soporte

Si tienes problemas, verifica:
1. ✅ MongoDB Atlas configurado correctamente
2. ✅ Variables de entorno en archivo `.env`
3. ✅ Internet funcionando
4. ✅ Puertos 3000 y 5000 disponibles

**¡EcoTrade estará listo para cambiar el mundo! 🌱💚**