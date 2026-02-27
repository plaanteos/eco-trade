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

    const { product: productId, paymentMethod, delivery, paymentDetails, ecoCoinsAmount } = req.body;

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

    const pm = String(paymentMethod);

    const transaction = await prisma.$transaction(async (tx) => {
      // Pago con ecoCoins: transferencia buyer -> seller
      if (pm.toLowerCase() === 'ecocoins') {
        const requested = ecoCoinsAmount ?? paymentDetails?.ecoCoinsAmount;
        const amountEcoCoins = Number(requested);

        if (!Number.isFinite(amountEcoCoins) || amountEcoCoins <= 0 || !Number.isInteger(amountEcoCoins)) {
          const err = new Error('ecoCoinsAmount debe ser un entero > 0 cuando paymentMethod=ecoCoins');
          err.code = 'INVALID_ECOCOINS_AMOUNT';
          throw err;
        }

        const buyer = await tx.user.findUnique({ where: { id: String(req.userId) }, select: { id: true, ecoCoins: true } });
        if (!buyer) {
          const err = new Error('Comprador no encontrado');
          err.code = 'BUYER_NOT_FOUND';
          throw err;
        }

        if (Number(buyer.ecoCoins) < amountEcoCoins) {
          const err = new Error('Saldo insuficiente de ecoCoins');
          err.code = 'INSUFFICIENT_ECOCOINS';
          throw err;
        }

        await tx.user.update({ where: { id: buyer.id }, data: { ecoCoins: { decrement: amountEcoCoins } } });
        await tx.user.update({ where: { id: String(product.sellerId) }, data: { ecoCoins: { increment: amountEcoCoins } } });

        await tx.product.update({ where: { id: product.id }, data: { status: 'sold' } });

        return tx.transaction.create({
          data: {
            productId: product.id,
            buyerId: String(req.userId),
            sellerId: String(product.sellerId),
            amount: Number(product.price),
            paymentMethod: 'ecoCoins',
            paymentDetails: { ...(paymentDetails || {}), ecoCoinsAmount: amountEcoCoins },
            delivery: delivery || undefined,
            ecoCoinsBuyer: -amountEcoCoins,
            ecoCoinsSeller: amountEcoCoins,
            ecoCoinsTotal: amountEcoCoins,
            metadata: {
              platform: 'web',
              userAgent: req.get('user-agent'),
              ipAddress: req.ip,
              ecoCoinsPayment: true,
            },
          },
          include: {
            product: { select: { id: true, name: true, price: true, status: true } },
            buyer: { select: { id: true, username: true, email: true } },
            seller: { select: { id: true, username: true, email: true } },
          },
        });
      }

      // Otros métodos: mantener recompensa basada en precio (legacy)
      const baseEcoCoins = Math.floor(Number(product.price) / 10);
      const ecoCoinsSeller = Math.round(baseEcoCoins * 0.6);
      const ecoCoinsBuyer = Math.round(baseEcoCoins * 0.4);

      // Marcar producto como vendido en transacciones exitosas
      await tx.product.update({ where: { id: product.id }, data: { status: 'sold' } });

      return tx.transaction.create({
        data: {
          productId: product.id,
          buyerId: String(req.userId),
          sellerId: String(product.sellerId),
          amount: Number(product.price),
          paymentMethod: pm,
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
    });

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: { transaction }
    });
  } catch (err) {
    if (err?.code === 'INVALID_ECOCOINS_AMOUNT') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err?.code === 'INSUFFICIENT_ECOCOINS') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err?.code === 'BUYER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(400).json({
      success: false,
      message: 'Error al crear transacción',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
