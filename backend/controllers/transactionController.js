const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');

// Controlador base para transacciones
exports.getAllTransactions = async (req, res) => {
  try {
    // Sin base de datos (modo demo/local): devolver vacío de forma explícita
    if (!isConnected()) {
      return res.json({
        success: true,
        data: { transactions: [], total: 0 }
      });
    }

    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const isAdmin = userRoles.includes('admin');

    const query = isAdmin
      ? {}
      : { $or: [{ buyer: req.userId }, { seller: req.userId }] };

    const prisma = getPrisma();
    const where = isAdmin
      ? {}
      : { OR: [{ buyerId: String(req.userId) }, { sellerId: String(req.userId) }] };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, price: true, status: true } },
        buyer: { select: { id: true, username: true, email: true } },
        seller: { select: { id: true, username: true, email: true } },
      },
    });

    res.json({
      success: true,
      data: { transactions, total: transactions.length }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones'
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const { product: productId, paymentMethod, delivery, paymentDetails } = req.body;

    if (!productId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: product, paymentMethod'
      });
    }

    const prisma = getPrisma();
    const product = await prisma.product.findUnique({
      where: { id: String(productId) },
      select: { id: true, price: true, status: true, sellerId: true, name: true },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!product.sellerId) {
      return res.status(400).json({
        success: false,
        message: 'El producto no tiene vendedor asociado'
      });
    }

    if (String(product.sellerId) === String(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes comprar tu propio producto'
      });
    }

    if (product.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'El producto no está disponible'
      });
    }

    const baseEcoCoins = Math.floor(Number(product.price) / 10);
    const ecoCoinsSeller = Math.round(baseEcoCoins * 0.6);
    const ecoCoinsBuyer = Math.round(baseEcoCoins * 0.4);

    const transaction = await prisma.transaction.create({
      data: {
        productId: product.id,
        buyerId: String(req.userId),
        sellerId: String(product.sellerId),
        amount: Number(product.price),
        paymentMethod: String(paymentMethod),
        paymentDetails: paymentDetails || undefined,
        delivery: delivery || undefined,
        ecoCoinsBuyer,
        ecoCoinsSeller,
        ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller,
        metadata: {
          platform: 'web',
          userAgent: req.get('user-agent'),
          ipAddress: req.ip,
        },
      },
      include: {
        product: { select: { id: true, name: true, price: true, status: true } },
        buyer: { select: { id: true, username: true, email: true } },
        seller: { select: { id: true, username: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: { transaction }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Error al crear transacción',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
