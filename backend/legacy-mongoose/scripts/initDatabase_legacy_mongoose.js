// Script legacy para inicializar la base de datos con datos básicos (Mongo/Mongoose).
//
// ⚠️  EcoTrade migró a Prisma/PostgreSQL. Este script se mantiene SOLO como referencia
// histórica y no forma parte del flujo actual.

// Script para inicializar la base de datos con datos básicos
const mongoose = require('mongoose');
const { connectDB } = require('../config/database-config');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

const initializeDatabase = async () => {
  try {
    console.log('🚀 Inicializando base de datos EcoTrade...');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Verificar si ya existen datos
    const existingProducts = await Product.countDocuments();
    const existingUsers = await User.countDocuments();
    
    console.log(`� Usuarios actuales: ${existingUsers}`);
    console.log(`🛍️  Productos actuales: ${existingProducts}`);
    
    if (existingUsers === 0) {
      console.log('📝 Creando usuario administrador...');
      
      // Crear usuario demo para productos
      const demoUserId = new mongoose.Types.ObjectId();
      const demoUser = new User({
        _id: demoUserId,
        username: 'ecotrade_admin',
        email: 'admin@ecotrade.com',
        password: '$2a$10$8YXyNyGBQX9OfGAkm5l/DeGUFpIqE0aJ3ZGaOzVJYI8GY/m8DVXn.', // password: admin123
        country: 'MX',
        ecoCoins: 1000,
        sustainabilityScore: 100,
        transactionsCount: 0,
        isVerified: true,
        role: 'admin'
      });
      
      await demoUser.save();
      console.log('✅ Usuario administrador creado');
    } else {
      console.log('✅ Usuario administrador ya existe');
    }
    
    if (existingProducts === 0) {
      console.log('📝 Creando productos iniciales...');
      
      // Obtener el ID del usuario admin (existente o recién creado)
      const adminUser = await User.findOne({ email: 'admin@ecotrade.com' });
      const demoUserId = adminUser._id;
    
    // Productos iniciales para el marketplace
    const initialProducts = [
      {
        name: "iPhone 13 Pro",
        description: "iPhone 13 Pro en excelente estado, usado por 8 meses. Incluye cargador original, auriculares EarPods y funda protectora. Batería al 95% de capacidad. Sin rayones ni daños.",
        price: 52000,
        category: "Electrónicos",
        condition: "Usado - Excelente",
        locationText: "Ciudad de México, CDMX",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "MacBook Air M1",
        description: "MacBook Air con chip M1, 8GB RAM, SSD 256GB. Usado para trabajo de oficina, en perfecto estado. Incluye cargador original y funda de protección. Ideal para estudiantes y profesionales.",
        price: 28000,
        category: "Electrónicos",
        condition: "Usado - Excelente",
        locationText: "Guadalajara, Jalisco",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Bicicleta Trek Mountain",
        description: "Bicicleta de montaña Trek en excelente condición. Frame de aluminio, 21 velocidades, frenos de disco. Perfecta para aventuras en montaña y uso urbano. Mantenimiento reciente.",
        price: 18500,
        category: "Deportes y Recreación",
        condition: "Usado - Excelente",
        locationText: "Monterrey, Nuevo León",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Sofá Seccional Gris",
        description: "Sofá seccional de 4 plazas color gris claro. Muy cómodo y en buen estado. Ideal para sala familiar. Dimensiones: 280cm x 180cm. Material: tela antimanchas.",
        price: 12000,
        category: "Hogar y Jardín",
        condition: "Usado - Bueno",
        locationText: "Puebla, Puebla",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Mesa de Comedor Madera",
        description: "Mesa de comedor de madera maciza para 6 personas. Estilo rústico moderno. Incluye 6 sillas. En muy buen estado, solo marcas mínimas de uso normal.",
        price: 8500,
        category: "Hogar y Jardín",
        condition: "Usado - Excelente",
        locationText: "Querétaro, Querétaro",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Colección Libros Programación",
        description: "Colección de 8 libros sobre programación: JavaScript, Python, React, Node.js. Incluye 'Clean Code' y 'The Pragmatic Programmer'. Excelente para estudiantes de desarrollo.",
        price: 2500,
        category: "Libros y Medios",
        condition: "Usado - Excelente",
        locationText: "Tijuana, Baja California",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Samsung Galaxy S22",
        description: "Samsung Galaxy S22 de 128GB en color negro. Usado por 6 meses, en excelente estado. Incluye cargador rápido, auriculares y funda. Pantalla sin rayones.",
        price: 15000,
        category: "Electrónicos",
        condition: "Usado - Excelente",
        locationText: "León, Guanajuato",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Guitarra Acústica Yamaha",
        description: "Guitarra acústica Yamaha FG800 en excelente estado. Cuerdas nuevas, sonido cálido y equilibrado. Incluye funda acolchada y púas. Perfecta para principiantes y intermedios.",
        price: 4200,
        category: "Arte y Artesanías",
        condition: "Usado - Excelente",
        locationText: "Morelia, Michoacán",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Cafetera Espresso Delonghi",
        description: "Cafetera espresso automática DeLonghi. Hace café espresso, cappuccino y latte. Usado poco, en excelente estado. Incluye manual y accesorios originales.",
        price: 3800,
        category: "Hogar y Jardín",
        condition: "Usado - Excelente",
        locationText: "Cancún, Quintana Roo",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      },
      {
        name: "Patineta Eléctrica",
        description: "Patineta eléctrica con autonomía de 25km. Velocidad máxima 25 km/h. Perfecta para movilidad urbana sostenible. Incluye cargador y control remoto. Batería en excelente estado.",
        price: 9500,
        category: "Automóvil",
        condition: "Usado - Excelente",
        locationText: "Mérida, Yucatán",
        owner: demoUserId,
        seller: demoUserId,
        status: "available",
        images: []
      }
    ];
    
    // Insertar productos
    await Product.insertMany(initialProducts);
    console.log(`✅ ${initialProducts.length} productos iniciales creados`);
    } else {
      console.log('✅ Productos ya existen en la base de datos');
    }
    
    // Crear índices para optimizar consultas
    await Product.createIndexes();
    await User.createIndexes();
    console.log('✅ Índices de base de datos creados');
    
    console.log('\n🎉 Base de datos inicializada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`👤 Usuarios: ${await User.countDocuments()}`);
    console.log(`🛍️  Productos: ${await Product.countDocuments()}`);
    console.log('\n🚀 EcoTrade listo para producción!');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('📴 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
