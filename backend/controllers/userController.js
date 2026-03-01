const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { userValidationSchemas } = require('../utils/validationSchemas');
const crypto = require('crypto');
const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');
const { getSupabaseAdmin } = require('../config/supabaseClient');

const COUNTRY_CURRENCIES = {
  AR: { currency: 'ARS', symbol: '$', name: 'Argentina' },
  MX: { currency: 'MXN', symbol: '$', name: 'México' },
  CO: { currency: 'COP', symbol: '$', name: 'Colombia' },
  ES: { currency: 'EUR', symbol: '€', name: 'España' },
  US: { currency: 'USD', symbol: '$', name: 'Estados Unidos' },
  BR: { currency: 'BRL', symbol: 'R$', name: 'Brasil' },
  CL: { currency: 'CLP', symbol: '$', name: 'Chile' },
  PE: { currency: 'PEN', symbol: 'S/', name: 'Perú' }
};

function getCurrencyForCountry(countryCode) {
  if (!countryCode) return undefined;
  const normalized = String(countryCode).toUpperCase();
  return COUNTRY_CURRENCIES[normalized];
}

function requireJwtSecret() {
  // En producción: obligatorio. En dev: permitir fallback para facilitar arranque local.
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'default_secret');
  if (!secret) {
    const err = new Error('JWT_SECRET no está configurado');
    err.code = 'MISSING_JWT_SECRET';
    throw err;
  }
  return secret;
}

function signToken(user) {
  const secret = requireJwtSecret();
  const expiresIn = process.env.JWT_EXPIRATION || process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { userId: user.id },
    secret,
    { expiresIn }
  );
}

function generateRecyclingCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `ET-${ts}-${rnd}`;
}

async function generateUniqueUsername(prisma, base) {
  const normalizedBase = String(base || 'user').toLowerCase().replace(/[^a-z0-9_\-\.]/g, '').slice(0, 24) || 'user';
  for (let i = 0; i < 5; i++) {
    const suffix = i === 0 ? '' : `_${crypto.randomBytes(2).toString('hex')}`;
    const candidate = `${normalizedBase}${suffix}`.slice(0, 30);
    const exists = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }).catch(() => null);
    if (!exists) return candidate;
  }
  return `${normalizedBase}_${crypto.randomBytes(3).toString('hex')}`.slice(0, 30);
}

function computeSustainabilityScore({ ecoCoins = 0, totalTransactions = 0, ratingAverage = 0 } = {}) {
  const ecoCoinsScore = Math.min(50, Number(ecoCoins || 0) / 20);
  const transactionScore = Math.min(30, Number(totalTransactions || 0) * 2);
  const ratingScore = Number(ratingAverage || 0) * 4;
  return Math.round(ecoCoinsScore + transactionScore + ratingScore);
}

async function getRecyclingAccess(prisma, userId) {
  const uid = String(userId);

  const [adminPoints, operatorMemberships] = await Promise.all([
    prisma.recyclingPoint.findMany({ where: { administratorId: uid }, select: { id: true } }).catch(() => []),
    prisma.recyclingPointOperator.findMany({ where: { userId: uid }, select: { pointId: true } }).catch(() => []),
  ]);

  const adminPointIds = Array.isArray(adminPoints) ? adminPoints.map((p) => p.id) : [];
  const operatorPointIds = Array.isArray(operatorMemberships)
    ? Array.from(new Set(operatorMemberships.map((m) => m.pointId)))
    : [];

  return {
    isAdmin: adminPointIds.length > 0,
    isOperator: operatorPointIds.length > 0,
    isStaff: adminPointIds.length > 0 || operatorPointIds.length > 0,
    adminPointIds,
    operatorPointIds,
  };
}

/**
 * Registro de usuario con validaciones mejoradas
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: username, email, password, country'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedUsername = String(username).trim();
    const normalizedCountry = String(country).toUpperCase().trim();

    const prisma = getPrisma();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email o nombre de usuario ya registrado'
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const ecoCoins = 50;
    const sustainabilityScore = computeSustainabilityScore({ ecoCoins, totalTransactions: 0, ratingAverage: 0 });

    let recyclingCode = generateRecyclingCode();
    for (let i = 0; i < 3; i++) {
      const taken = await prisma.user.findUnique({ where: { recyclingCode }, select: { id: true } }).catch(() => null);
      if (!taken) break;
      recyclingCode = generateRecyclingCode();
    }

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        country: normalizedCountry,
        accountType: 'individual',
        recyclingCode,
        ecoCoins,
        sustainabilityScore,
        roles: ['user'],
        isActive: true,
        preferences: { onboardingCompleted: false },
      },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        roles: true,
        location: true,
        preferences: true,
      },
    });

    const token = signToken(user);

    const recyclingAccess = await getRecyclingAccess(prisma, user.id);

    const safeUser = {
      id: user.id,
      _id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      country: user.country,
      recyclingCode: user.recyclingCode,
      currency: getCurrencyForCountry(user.country),
      ecoCoins: user.ecoCoins,
      sustainabilityScore: user.sustainabilityScore,
      profileImage: user.profileImage,
      roles: user.roles,
      recyclingAccess,
      location: user.location,
      preferences: user.preferences,
    };

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: safeUser,
        welcomeReward: 50
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({
        success: false,
        message: 'Configuración inválida del servidor: JWT_SECRET faltante'
      });
    }

    // Errores típicos cuando la DB aún no tiene las tablas (Prisma)
    const msg = String(error?.message || '');
    if (error?.code === 'P2021' || msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('relation')) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no inicializada o esquema incompleto. Ejecuta Prisma (db push/migrate) en la DB de Supabase.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Login de usuario con validaciones mejoradas
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        roles: true,
        isActive: true,
        location: true,
        preferences: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    const isValid = await bcrypt.compare(String(password), String(user.passwordHash));
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = signToken(user);

    const recyclingAccess = await getRecyclingAccess(prisma, user.id);

    const safeUser = {
      id: user.id,
      _id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      country: user.country,
      recyclingCode: user.recyclingCode,
      currency: getCurrencyForCountry(user.country),
      ecoCoins: user.ecoCoins,
      sustainabilityScore: user.sustainabilityScore,
      profileImage: user.profileImage,
      roles: user.roles,
      recyclingAccess,
      location: user.location,
      preferences: user.preferences,
    };

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: safeUser
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    if (error.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({
        success: false,
        message: 'Configuración inválida del servidor: JWT_SECRET faltante'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Login/registro vía Supabase Auth (por ejemplo Google).
 * El frontend obtiene un access_token de Supabase y lo intercambia por nuestro JWT.
 */
exports.loginWithSupabase = async (req, res) => {
  try {
    const { accessToken } = req.body || {};
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'accessToken es obligatorio' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Supabase no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' });
    }

    const { data, error } = await supabase.auth.getUser(String(accessToken));
    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: 'Token OAuth inválido', details: error?.message });
    }

    const sbUser = data.user;
    const email = String(sbUser.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'El usuario OAuth no trae email' });
    }

    const prisma = getPrisma();

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        roles: true,
        isActive: true,
        location: true,
        preferences: true,
      },
    });

    if (user && user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }

    if (!user) {
      // Crear usuario en nuestra DB usando metadata de Supabase.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

      let recyclingCode = generateRecyclingCode();
      for (let i = 0; i < 3; i++) {
        const taken = await prisma.user.findUnique({ where: { recyclingCode }, select: { id: true } }).catch(() => null);
        if (!taken) break;
        recyclingCode = generateRecyclingCode();
      }

      const baseUsername = (email.split('@')[0] || 'user').slice(0, 24);
      const username = await generateUniqueUsername(prisma, baseUsername);

      const avatarUrl = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || sbUser.user_metadata?.avatar || null;

      user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          accountType: 'individual',
          country: undefined,
          recyclingCode,
          ecoCoins: 0,
          sustainabilityScore: 0,
          roles: ['user'],
          isActive: true,
          profileImage: avatarUrl ? String(avatarUrl) : undefined,
          preferences: { onboardingCompleted: false },
        },
        select: {
          id: true,
          username: true,
          email: true,
          accountType: true,
          country: true,
          recyclingCode: true,
          profileImage: true,
          ecoCoins: true,
          sustainabilityScore: true,
          roles: true,
          location: true,
          preferences: true,
        },
      });
    } else {
      // Si hay avatar en supabase y no tenemos, lo guardamos.
      const avatarUrl = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || sbUser.user_metadata?.avatar || null;
      if (avatarUrl && !user.profileImage) {
        await prisma.user.update({ where: { id: user.id }, data: { profileImage: String(avatarUrl) } }).catch(() => null);
      }
    }

    const token = signToken(user);
    const recyclingAccess = await getRecyclingAccess(prisma, user.id);

    return res.status(200).json({
      success: true,
      message: 'Login OAuth exitoso',
      data: {
        token,
        user: {
          id: user.id,
          _id: user.id,
          username: user.username,
          email: user.email,
          accountType: user.accountType,
          country: user.country,
          recyclingCode: user.recyclingCode,
          currency: getCurrencyForCountry(user.country),
          ecoCoins: user.ecoCoins,
          sustainabilityScore: user.sustainabilityScore,
          profileImage: user.profileImage,
          roles: user.roles,
          recyclingAccess,
          location: user.location,
          preferences: user.preferences,
        },
      },
    });
  } catch (error) {
    console.error('Error en loginWithSupabase:', error);
    if (error?.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({ success: false, message: 'Configuración inválida del servidor: JWT_SECRET faltante' });
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * Obtener perfil del usuario actual
 */
exports.getProfile = async (req, res) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: String(req.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        totalTransactions: true,
        roles: true,
        location: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const recyclingAccess = await getRecyclingAccess(prisma, user.id);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          _id: user.id,
          username: user.username,
          email: user.email,
          accountType: user.accountType,
          country: user.country,
          recyclingCode: user.recyclingCode,
          currency: getCurrencyForCountry(user.country),
          ecoCoins: user.ecoCoins,
          sustainabilityScore: user.sustainabilityScore,
          profileImage: user.profileImage,
          totalTransactions: user.totalTransactions,
          roles: user.roles,
          recyclingAccess,
          location: user.location,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar perfil del usuario
 */
exports.updateProfile = async (req, res) => {
  try {
    const { error, value } = userValidationSchemas.update.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const userId = req.userId;
    const updateData = { ...value };

    const prisma = getPrisma();

    // Si se está actualizando la contraseña
    if (updateData.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    // Normalizaciones
    if (updateData.email) updateData.email = String(updateData.email).toLowerCase().trim();
    if (updateData.username) updateData.username = String(updateData.username).trim();
    if (updateData.country) updateData.country = String(updateData.country).toUpperCase().trim();

    const user = await prisma.user.update({
      where: { id: String(userId) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        totalTransactions: true,
        roles: true,
        isActive: true,
        location: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user }
    });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Completar onboarding (tipo de usuario + preferencias básicas)
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const { error, value } = userValidationSchemas.onboarding.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map((detail) => detail.message),
      });
    }

    const prisma = getPrisma();
    const userId = String(req.userId);

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const incomingPreferences = value.preferences || {};
    const nextPreferences = {
      ...(existing.preferences || {}),
      ...incomingPreferences,
      onboardingCompleted: true,
    };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        accountType: value.accountType,
        location: value.location,
        preferences: nextPreferences,
      },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        totalTransactions: true,
        roles: true,
        location: true,
        preferences: true,
        createdAt: true,
      },
    });

    const recyclingAccess = await getRecyclingAccess(prisma, updated.id);

    return res.json({
      success: true,
      message: 'Onboarding completado',
      data: {
        user: {
          id: updated.id,
          _id: updated.id,
          username: updated.username,
          email: updated.email,
          accountType: updated.accountType,
          country: updated.country,
          recyclingCode: updated.recyclingCode,
          currency: getCurrencyForCountry(updated.country),
          ecoCoins: updated.ecoCoins,
          sustainabilityScore: updated.sustainabilityScore,
          profileImage: updated.profileImage,
          totalTransactions: updated.totalTransactions,
          roles: updated.roles,
          recyclingAccess,
          location: updated.location,
          preferences: updated.preferences,
          createdAt: updated.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error en completeOnboarding:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * Obtener estadísticas del usuario
 */
exports.getStats = async (req, res) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: String(req.userId) },
      select: {
        ecoCoins: true,
        sustainabilityScore: true,
        rating: true,
        createdAt: true,
        totalTransactions: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Frontend (EcoCoinsPage) espera que response.data tenga estos campos directos.
    const payload = {
      ecoCoins: user.ecoCoins,
      transactionsCount: user.totalTransactions ?? 0,
      sustainabilityScore: user.sustainabilityScore,
      monthlyGrowth: 0,
    };

    // Mantener info adicional (legacy) sin romper al frontend.
    const legacyStats = {
      ecoCoins: user.ecoCoins,
      sustainabilityScore: user.sustainabilityScore,
      rating: user.rating?.average ?? 0,
      totalRatings: user.rating?.count ?? 0,
      joinDate: user.createdAt,
      level: calculateUserLevel(user.sustainabilityScore),
      totalTransactions: user.totalTransactions ?? 0,
    };

    res.json({
      success: true,
      data: {
        ...payload,
        stats: legacyStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Listar usuarios (solo admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const prisma = getPrisma();
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { sustainabilityScore: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          accountType: true,
          country: true,
          recyclingCode: true,
          ecoCoins: true,
          sustainabilityScore: true,
          totalTransactions: true,
          roles: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate user level
function calculateUserLevel(sustainabilityScore) {
  if (sustainabilityScore < 20) return 'Beginner';
  if (sustainabilityScore < 50) return 'Intermediate';
  if (sustainabilityScore < 80) return 'Advanced';
  return 'Expert';
}

function ensureDbOr503(res) {
  if (!isConnected()) {
    res.status(503).json({ success: false, message: 'Base de datos no disponible' });
    return false;
  }
  return true;
}

function unionRoles(currentRoles, rolesToAdd) {
  const set = new Set([...(Array.isArray(currentRoles) ? currentRoles : []).map(String)]);
  for (const r of Array.isArray(rolesToAdd) ? rolesToAdd : []) set.add(String(r));
  return Array.from(set);
}

/**
 * Convertir cuenta a empresa vendedora (Opción B: mismo usuario + permisos extra)
 */
exports.becomeCompanySeller = async (req, res) => {
  try {
    if (!ensureDbOr503(res)) return;

    const { companyProfile } = req.body || {};
    const prisma = getPrisma();

    const current = await prisma.user.findUnique({
      where: { id: String(req.userId) },
      select: { id: true, roles: true, accountType: true, preferences: true },
    });
    if (!current) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const nextRoles = unionRoles(current.roles, ['seller']);
    const nextPreferences = {
      ...(current.preferences || {}),
      ...(companyProfile ? { companyProfile } : {}),
    };

    const updated = await prisma.user.update({
      where: { id: String(req.userId) },
      data: {
        accountType: 'company',
        roles: { set: nextRoles },
        preferences: nextPreferences,
      },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        roles: true,
        ecoCoins: true,
        preferences: true,
      },
    });

    return res.json({
      success: true,
      message: 'Cuenta actualizada a empresa vendedora',
      data: { user: { ...updated, _id: updated.id } },
    });
  } catch (error) {
    console.error('Error en becomeCompanySeller:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * Activar rol de vendedor (sin cambiar accountType)
 */
exports.becomeSeller = async (req, res) => {
  try {
    if (!ensureDbOr503(res)) return;

    const prisma = getPrisma();
    const current = await prisma.user.findUnique({
      where: { id: String(req.userId) },
      select: { id: true, roles: true, accountType: true, preferences: true },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const nextRoles = unionRoles(current.roles, ['seller']);

    const updated = await prisma.user.update({
      where: { id: String(req.userId) },
      data: { roles: { set: nextRoles } },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        roles: true,
        ecoCoins: true,
        preferences: true,
      },
    });

    return res.json({
      success: true,
      message: 'Rol seller activado',
      data: { user: { ...updated, _id: updated.id } },
    });
  } catch (error) {
    console.error('Error en becomeSeller:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * Historial de ecoCoins: entregas de reciclaje + pagos con ecoCoins
 */
exports.getEcoCoinsHistory = async (req, res) => {
  try {
    if (!ensureDbOr503(res)) return;

    const prisma = getPrisma();
    const userId = String(req.userId);

    // Si existe el ledger y tiene datos, se usa como fuente de verdad.
    // Fallback: mantener el historial derivado (submissions + ecoCoins txs) para no romper entornos sin migración/backfill.
    if (typeof prisma.ecoCoinLedger?.findMany === 'function') {
      const ledger = await prisma.ecoCoinLedger
        .findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            transaction: {
              select: {
                id: true,
                createdAt: true,
                paymentMethod: true,
                ecoCoinsTotal: true,
                buyerId: true,
                sellerId: true,
                product: { select: { id: true, name: true } },
              },
            },
            recyclingSubmission: {
              select: {
                id: true,
                submissionCode: true,
                createdAt: true,
                verificationStatus: true,
                recyclingPoint: { select: { id: true, name: true, city: true } },
              },
            },
          },
        })
        .catch(() => null);

      if (Array.isArray(ledger) && ledger.length > 0) {
        const rows = ledger.map((e) => {
          const isRecycling = Boolean(e.recyclingSubmissionId || e.recyclingSubmission);
          const isTx = Boolean(e.transactionId || e.transaction);

          if (isRecycling) {
            const s = e.recyclingSubmission;
            return {
              type: 'recycling_submission',
              id: e.id,
              at: e.createdAt,
              ecoCoinsDelta: Number(e.delta) || 0,
              status: s?.verificationStatus,
              reference: s?.submissionCode || e.recyclingSubmissionId,
              metadata: {
                ...(e.metadata || {}),
                recyclingPoint: s?.recyclingPoint ? { id: s.recyclingPoint.id, name: s.recyclingPoint.name, city: s.recyclingPoint.city } : null,
                reason: e.reason,
              },
            };
          }

          if (isTx) {
            const t = e.transaction;
            const pm = String(t?.paymentMethod || '').toLowerCase();
            const type = pm === 'ecocoins' ? 'ecoCoins_payment' : 'transaction_reward';
            const isBuyer = t?.buyerId ? String(t.buyerId) === userId : undefined;
            const role = e.metadata?.role || (isBuyer === true ? 'buyer' : isBuyer === false ? 'seller' : undefined);

            return {
              type,
              id: e.id,
              at: e.createdAt,
              ecoCoinsDelta: Number(e.delta) || 0,
              reference: t?.product?.name || e.transactionId || e.id,
              metadata: {
                ...(e.metadata || {}),
                productId: t?.product?.id,
                role,
                ecoCoinsTotal: t?.ecoCoinsTotal,
                transactionId: t?.id || e.transactionId,
                reason: e.reason,
              },
            };
          }

          return {
            type: 'adjustment',
            id: e.id,
            at: e.createdAt,
            ecoCoinsDelta: Number(e.delta) || 0,
            reference: e.id,
            metadata: { ...(e.metadata || {}), reason: e.reason },
          };
        });

        return res.json({
          success: true,
          data: { history: rows },
        });
      }
    }

    const [submissions, ecoCoinTxs] = await Promise.all([
      prisma.recyclingSubmission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          submissionCode: true,
          createdAt: true,
          verificationStatus: true,
          rewards: true,
          recyclingPoint: { select: { id: true, name: true, city: true } },
        },
      }),
      prisma.transaction.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          paymentMethod: { equals: 'ecoCoins', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          product: { select: { id: true, name: true } },
          buyerId: true,
          sellerId: true,
          ecoCoinsBuyer: true,
          ecoCoinsSeller: true,
          ecoCoinsTotal: true,
        },
      }).catch(() => []),
    ]);

    const rows = [];

    for (const s of submissions) {
      const total = Number(s.rewards?.totalEcoCoins) || 0;
      rows.push({
        type: 'recycling_submission',
        id: s.id,
        at: s.createdAt,
        ecoCoinsDelta: total,
        status: s.verificationStatus,
        reference: s.submissionCode,
        metadata: {
          recyclingPoint: s.recyclingPoint ? { id: s.recyclingPoint.id, name: s.recyclingPoint.name, city: s.recyclingPoint.city } : null,
        },
      });
    }

    for (const t of ecoCoinTxs) {
      const isBuyer = String(t.buyerId) === userId;
      const delta = isBuyer ? Number(t.ecoCoinsBuyer) || 0 : Number(t.ecoCoinsSeller) || 0;
      rows.push({
        type: 'ecoCoins_payment',
        id: t.id,
        at: t.createdAt,
        ecoCoinsDelta: delta,
        reference: t.product?.name || t.id,
        metadata: { productId: t.product?.id, role: isBuyer ? 'buyer' : 'seller', ecoCoinsTotal: t.ecoCoinsTotal },
      });
    }

    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return res.json({
      success: true,
      data: {
        history: rows.slice(0, 200),
      },
    });
  } catch (error) {
    console.error('Error en getEcoCoinsHistory:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
