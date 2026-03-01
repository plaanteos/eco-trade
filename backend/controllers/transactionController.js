const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');
const { store } = require('../utils/demoStore');
const demoProductsStore = require('../utils/demoProductsStore');
const { EcoCoinCalculator } = require('../utils/ecoCoinCalculator');
const { normalizeRoles } = require('../utils/rbac');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

// Almacenamiento in-memory para idempotencia en DEMO_MODE
const demoIdempotencyByUserKey = new Map();

function requiredEcoCoinsForPrice(price) {
  const required = EcoCoinCalculator.calculateRequiredEcoCoinsForPayment(price);
  return required > 0 ? required : null;
}

// Controlador base para transacciones
exports.getAllTransactions = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const hasPaginationParams = page !== undefined || limit !== undefined;
    const take = Math.min(100, Math.max(1, Number(limit) || (hasPaginationParams ? 20 : 100)));
    const p = Math.max(1, Number(page) || 1);
    const skip = (p - 1) * take;

    // Sin base de datos: en DEMO_MODE devolver vacío; fuera de DEMO_MODE es un error (no esconderlo en prod).
    if (!isConnected()) {
      if (isDemoMode) {
        return res.json({
          success: true,
          data: {
            transactions: [],
            total: 0,
            pagination: { page: p, limit: take, total: 0, pages: 1 },
          }
        });
      }
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const userRoles = normalizeRoles(req.user);
    const isAdmin = userRoles.includes('admin');

    const prisma = getPrisma();
    const where = isAdmin
      ? {}
      : { OR: [{ buyerId: String(req.userId) }, { sellerId: String(req.userId) }] };

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          product: { select: { id: true, name: true, price: true, status: true } },
          buyer: { select: { id: true, username: true, email: true } },
          seller: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        pagination: { page: p, limit: take, total, pages: Math.ceil(total / take) || 1 },
      }
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
    const { product: productId, paymentMethod, delivery, paymentDetails, ecoCoinsAmount } = req.body;

    const idempotencyKey = String(req.get('Idempotency-Key') || req.get('idempotency-key') || '').trim() || null;

    if (!productId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: product, paymentMethod'
      });
    }

    if (!isConnected() && !isDemoMode) {
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Flujo demo/in-memory (permite tests P0 y smoke sin DB)
    if (!isConnected() && isDemoMode) {
      if (idempotencyKey) {
        const userKey = `${String(req.userId)}:${idempotencyKey}`;
        const existing = demoIdempotencyByUserKey.get(userKey);
        if (existing) {
          if (String(existing.productId) !== String(productId)) {
            return res.status(409).json({
              success: false,
              message: 'Idempotency-Key ya fue usado para otro producto'
            });
          }
          return res.status(200).json({
            success: true,
            message: 'Transacción ya procesada',
            data: { transaction: existing.transaction }
          });
        }
      }

      const product = demoProductsStore.getById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      if (!product.sellerId) {
        return res.status(400).json({ success: false, message: 'El producto no tiene vendedor asociado' });
      }

      if (String(product.sellerId) === String(req.userId)) {
        return res.status(400).json({ success: false, message: 'No puedes comprar tu propio producto' });
      }

      if (product.status !== 'available') {
        return res.status(400).json({ success: false, message: 'El producto no está disponible' });
      }

      const pm = String(paymentMethod);

      if (pm.toLowerCase() === 'ecocoins') {
        const requiredEcoCoins = requiredEcoCoinsForPrice(product.price);
        if (!requiredEcoCoins) {
          return res.status(400).json({ success: false, message: 'Precio inválido del producto' });
        }

        const provided = ecoCoinsAmount ?? paymentDetails?.ecoCoinsAmount;
        if (provided !== undefined && Number(provided) !== requiredEcoCoins) {
          return res.status(400).json({
            success: false,
            message: 'ecoCoinsAmount no es válido para este producto'
          });
        }

        const buyer = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
        const seller = store.ensureUser({ id: product.sellerId, email: undefined, username: 'demo_user', country: 'MX' });

        if (Number(buyer.ecoCoins) < requiredEcoCoins) {
          return res.status(400).json({
            success: false,
            message: 'Saldo insuficiente de ecoCoins'
          });
        }

        // Evita doble compra: debe seguir disponible justo antes de cambiar estado
        const fresh = demoProductsStore.getById(product._id);
        if (!fresh || fresh.status !== 'available') {
          return res.status(400).json({ success: false, message: 'El producto no está disponible' });
        }

        const txId = `demo_tx_${Date.now()}`;

        store.addEcoCoins(buyer.id, -requiredEcoCoins, {
          reason: 'transaction:ecocoins:spend',
          transactionId: txId,
          metadata: { productId: product._id, productName: product.name, role: 'buyer', ecoCoinsTotal: requiredEcoCoins },
        });
        store.addEcoCoins(seller.id, requiredEcoCoins, {
          reason: 'transaction:ecocoins:earn',
          transactionId: txId,
          metadata: { productId: product._id, productName: product.name, role: 'seller', ecoCoinsTotal: requiredEcoCoins },
        });
        demoProductsStore.update(product._id, { status: 'sold' });

        const txPayload = {
          id: txId,
          productId: product._id,
          buyerId: buyer.id,
          sellerId: seller.id,
          amount: Number(product.price),
          paymentMethod: 'ecoCoins',
          paymentDetails: { ...(paymentDetails || {}), ecoCoinsAmount: requiredEcoCoins },
          delivery: delivery || undefined,
          ecoCoinsBuyer: -requiredEcoCoins,
          ecoCoinsSeller: requiredEcoCoins,
          ecoCoinsTotal: requiredEcoCoins,
          metadata: idempotencyKey ? { idempotencyKey } : undefined,
          createdAt: new Date().toISOString(),
        };

        if (idempotencyKey) {
          const userKey = `${String(req.userId)}:${idempotencyKey}`;
          demoIdempotencyByUserKey.set(userKey, { productId: product._id, transaction: txPayload });
        }

        return res.status(201).json({
          success: true,
          message: 'Transacción creada exitosamente',
          data: {
            transaction: txPayload
          }
        });
      }

      // Otros métodos (fiat): acreditar ecoCoins de recompensa al completar la transacción.
      // Regla: ecoCoinsBuyer/Seller representan el delta aplicado al balance.
      const baseEcoCoins = EcoCoinCalculator.calculateBaseEcoCoins(product.price, 'floor');
      const ecoCoinsSeller = Math.round(baseEcoCoins * 0.6);
      const ecoCoinsBuyer = Math.round(baseEcoCoins * 0.4);

      const buyer = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
      const seller = store.ensureUser({ id: product.sellerId, email: undefined, username: 'demo_user', country: 'MX' });

      // Evita doble compra: debe seguir disponible justo antes de cambiar estado
      const fresh = demoProductsStore.getById(product._id);
      if (!fresh || fresh.status !== 'available') {
        return res.status(400).json({ success: false, message: 'El producto no está disponible' });
      }

      const txId = `demo_tx_${Date.now()}`;

      store.addEcoCoins(buyer.id, ecoCoinsBuyer, {
        reason: 'transaction:fiat:reward:buyer',
        transactionId: txId,
        metadata: { productId: product._id, productName: product.name, role: 'buyer', ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller },
      });
      store.addEcoCoins(seller.id, ecoCoinsSeller, {
        reason: 'transaction:fiat:reward:seller',
        transactionId: txId,
        metadata: { productId: product._id, productName: product.name, role: 'seller', ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller },
      });
      demoProductsStore.update(product._id, { status: 'sold' });

      const txPayload = {
        id: txId,
        productId: product._id,
        buyerId: buyer.id,
        sellerId: seller.id,
        amount: Number(product.price),
        paymentMethod: pm,
        paymentDetails: paymentDetails || undefined,
        delivery: delivery || undefined,
        ecoCoinsBuyer,
        ecoCoinsSeller,
        ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller,
        metadata: idempotencyKey ? { idempotencyKey } : undefined,
        createdAt: new Date().toISOString(),
      };

      if (idempotencyKey) {
        const userKey = `${String(req.userId)}:${idempotencyKey}`;
        demoIdempotencyByUserKey.set(userKey, { productId: product._id, transaction: txPayload });
      }

      return res.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: {
          transaction: txPayload
        }
      });
    }

    const prisma = getPrisma();

    // Idempotencia (si el cliente reintenta, no duplicar movimientos)
    if (idempotencyKey) {
      try {
        const byKey = await prisma.transaction.findFirst({
          where: {
            buyerId: String(req.userId),
            metadata: { path: ['idempotencyKey'], equals: idempotencyKey },
          },
          include: {
            product: { select: { id: true, name: true, price: true, status: true } },
            buyer: { select: { id: true, username: true, email: true } },
            seller: { select: { id: true, username: true, email: true } },
          },
        });

        if (byKey) {
          if (String(byKey.productId) !== String(productId)) {
            return res.status(409).json({
              success: false,
              message: 'Idempotency-Key ya fue usado para otro producto'
            });
          }
          return res.status(200).json({
            success: true,
            message: 'Transacción ya procesada',
            data: { transaction: byKey }
          });
        }
      } catch (e) {
        // Si el filtro JSON por path no está disponible en la versión de Prisma,
        // igual seguimos con protecciones de carrera (producto y saldo) dentro de la transacción.
      }
    }

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
      // Evita compra doble por carrera: solo 1 transacción puede marcar available -> sold.
      // Si no se puede, abortamos antes de tocar saldos.
      const productUpdate = await tx.product.updateMany({
        where: { id: product.id, status: 'available' },
        data: { status: 'sold' },
      });
      if (productUpdate.count !== 1) {
        const err = new Error('El producto no está disponible');
        err.code = 'PRODUCT_NOT_AVAILABLE';
        throw err;
      }

      // Pago con ecoCoins: transferencia buyer -> seller
      if (pm.toLowerCase() === 'ecocoins') {
        const requiredEcoCoins = requiredEcoCoinsForPrice(product.price);
        if (!requiredEcoCoins) {
          const err = new Error('Precio inválido del producto');
          err.code = 'INVALID_PRODUCT_PRICE';
          throw err;
        }

        // Si el cliente manda ecoCoinsAmount, solo se acepta si coincide con lo calculado server-side.
        // Esto evita subpago y evita que el cliente imponga el monto.
        const provided = ecoCoinsAmount ?? paymentDetails?.ecoCoinsAmount;
        if (provided !== undefined && Number(provided) !== requiredEcoCoins) {
          const err = new Error('ecoCoinsAmount no es válido para este producto');
          err.code = 'INVALID_ECOCOINS_AMOUNT';
          throw err;
        }

        const buyer = await tx.user.findUnique({ where: { id: String(req.userId) }, select: { id: true } });
        if (!buyer) {
          const err = new Error('Comprador no encontrado');
          err.code = 'BUYER_NOT_FOUND';
          throw err;
        }

        // Previene saldo negativo por condiciones de carrera: solo decrementa si ecoCoins >= requerido
        const dec = await tx.user.updateMany({
          where: { id: buyer.id, ecoCoins: { gte: requiredEcoCoins } },
          data: { ecoCoins: { decrement: requiredEcoCoins } },
        });

        if (dec.count !== 1) {
          const err = new Error('Saldo insuficiente de ecoCoins');
          err.code = 'INSUFFICIENT_ECOCOINS';
          throw err;
        }

        await tx.user.update({ where: { id: String(product.sellerId) }, data: { ecoCoins: { increment: requiredEcoCoins } } });

        const createdTx = await tx.transaction.create({
          data: {
            productId: product.id,
            buyerId: String(req.userId),
            sellerId: String(product.sellerId),
            amount: Number(product.price),
            paymentMethod: 'ecoCoins',
            paymentDetails: { ...(paymentDetails || {}), ecoCoinsAmount: requiredEcoCoins },
            delivery: delivery || undefined,
            ecoCoinsBuyer: -requiredEcoCoins,
            ecoCoinsSeller: requiredEcoCoins,
            ecoCoinsTotal: requiredEcoCoins,
            metadata: {
              platform: 'web',
              userAgent: req.get('user-agent'),
              ipAddress: req.ip,
              ecoCoinsPayment: true,
              idempotencyKey: idempotencyKey || undefined,
            },
          },
          include: {
            product: { select: { id: true, name: true, price: true, status: true } },
            buyer: { select: { id: true, username: true, email: true } },
            seller: { select: { id: true, username: true, email: true } },
          },
        });

        if (typeof tx.ecoCoinLedger?.createMany === 'function') {
          await tx.ecoCoinLedger
            .createMany({
              data: [
                {
                  userId: String(req.userId),
                  delta: -requiredEcoCoins,
                  reason: 'transaction:ecocoins:spend',
                  transactionId: createdTx.id,
                  metadata: { productId: product.id, productName: product.name, role: 'buyer', ecoCoinsTotal: requiredEcoCoins },
                },
                {
                  userId: String(product.sellerId),
                  delta: requiredEcoCoins,
                  reason: 'transaction:ecocoins:earn',
                  transactionId: createdTx.id,
                  metadata: { productId: product.id, productName: product.name, role: 'seller', ecoCoinsTotal: requiredEcoCoins },
                },
              ],
            })
            .catch(() => null);
        }

        return createdTx;
      }

      // Otros métodos: mantener recompensa basada en precio (legacy)
      const baseEcoCoins = EcoCoinCalculator.calculateBaseEcoCoins(product.price, 'floor');
      const ecoCoinsSeller = Math.round(baseEcoCoins * 0.6);
      const ecoCoinsBuyer = Math.round(baseEcoCoins * 0.4);

      // Acreditar ecoCoins de recompensa al completar transacción fiat.
      // Esto evita que el sistema “prometa” ecoCoins pero no los aplique al balance.
      const buyer = await tx.user.findUnique({ where: { id: String(req.userId) }, select: { id: true } });
      if (!buyer) {
        const err = new Error('Comprador no encontrado');
        err.code = 'BUYER_NOT_FOUND';
        throw err;
      }

      await tx.user.update({ where: { id: buyer.id }, data: { ecoCoins: { increment: ecoCoinsBuyer } } });
      await tx.user.update({ where: { id: String(product.sellerId) }, data: { ecoCoins: { increment: ecoCoinsSeller } } });

      const createdTx = await tx.transaction.create({
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
            idempotencyKey: idempotencyKey || undefined,
          },
        },
        include: {
          product: { select: { id: true, name: true, price: true, status: true } },
          buyer: { select: { id: true, username: true, email: true } },
          seller: { select: { id: true, username: true, email: true } },
        },
      });

      if (typeof tx.ecoCoinLedger?.createMany === 'function') {
        await tx.ecoCoinLedger
          .createMany({
            data: [
              {
                userId: String(req.userId),
                delta: ecoCoinsBuyer,
                reason: 'transaction:fiat:reward:buyer',
                transactionId: createdTx.id,
                metadata: { productId: product.id, productName: product.name, role: 'buyer', ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller },
              },
              {
                userId: String(product.sellerId),
                delta: ecoCoinsSeller,
                reason: 'transaction:fiat:reward:seller',
                transactionId: createdTx.id,
                metadata: { productId: product.id, productName: product.name, role: 'seller', ecoCoinsTotal: ecoCoinsBuyer + ecoCoinsSeller },
              },
            ],
          })
          .catch(() => null);
      }

      return createdTx;
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
    if (err?.code === 'INVALID_PRODUCT_PRICE') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err?.code === 'INSUFFICIENT_ECOCOINS') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err?.code === 'BUYER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err?.code === 'PRODUCT_NOT_AVAILABLE') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(400).json({
      success: false,
      message: 'Error al crear transacción',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
