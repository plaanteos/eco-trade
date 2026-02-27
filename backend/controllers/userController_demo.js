const jwt = require('jsonwebtoken');
const { store } = require('../utils/demoStore');

// Mantener compatibilidad: si no llega username, se deriva del email.

/**
 * Registro de usuario simplificado para demo
 */
exports.register = async (req, res) => {
  try {
    console.log('Datos recibidos para registro:', req.body);
    
    const { username, email, password, fullName, country } = req.body;
    
    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios'
      });
    }

    // Mapeo de países y monedas
    const currencies = {
      'AR': { currency: 'ARS', symbol: '$', name: 'Argentina' },
      'MX': { currency: 'MXN', symbol: '$', name: 'México' },
      'CO': { currency: 'COP', symbol: '$', name: 'Colombia' },
      'ES': { currency: 'EUR', symbol: '€', name: 'España' },
      'US': { currency: 'USD', symbol: '$', name: 'Estados Unidos' },
      'BR': { currency: 'BRL', symbol: 'R$', name: 'Brasil' },
      'CL': { currency: 'CLP', symbol: '$', name: 'Chile' },
      'PE': { currency: 'PEN', symbol: 'S/', name: 'Perú' }
    };

    const userCurrency = currencies[country] || currencies['US'];

    const demoUser = store.ensureUser({
      email,
      username: username || (String(email).split('@')[0] || 'demo_user'),
      country
    });

    // Simulación temporal sin base de datos
    const token = jwt.sign(
      { userId: demoUser.id, email: demoUser.email, username: demoUser.username, country: demoUser.country },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente (modo demo)',
      data: {
        token,
        user: {
          id: demoUser.id,
          _id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          fullName,
          country: demoUser.country,
          accountType: demoUser.accountType,
          recyclingCode: demoUser.recyclingCode,
          currency: userCurrency,
          ecoCoins: demoUser.ecoCoins,
          sustainabilityScore: demoUser.sustainabilityScore,
          location: demoUser.location,
          preferences: demoUser.preferences
        }
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Login de usuario simplificado para demo
 */
exports.login = async (req, res) => {
  try {
    console.log('Datos recibidos para login:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    const demoUser = store.ensureUser({
      email,
      username: String(email).split('@')[0] || 'demo_user',
      country: 'MX'
    });

    // Simulación temporal sin base de datos
    const token = jwt.sign(
      { userId: demoUser.id, email: demoUser.email, username: demoUser.username, country: demoUser.country },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login exitoso (modo demo)',
      data: {
        token,
        user: {
          id: demoUser.id,
          _id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          country: demoUser.country,
          accountType: demoUser.accountType,
          recyclingCode: demoUser.recyclingCode,
          currency: { currency: 'MXN', symbol: '$', name: 'México' },
          ecoCoins: demoUser.ecoCoins,
          sustainabilityScore: demoUser.sustainabilityScore,
          location: demoUser.location,
          preferences: demoUser.preferences
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// OAuth vía Supabase no aplica en demo mode.
exports.loginWithSupabase = async (_req, res) => {
  return res.status(501).json({
    success: false,
    message: 'OAuth Supabase no está disponible en DEMO_MODE',
  });
};

/**
 * Obtener perfil simplificado para demo
 */
exports.getProfile = async (req, res) => {
  try {
    const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
    return res.json({
      success: true,
      data: {
        user: {
          id: demoUser.id,
          _id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          country: demoUser.country,
          accountType: demoUser.accountType,
          recyclingCode: demoUser.recyclingCode,
          currency: { currency: 'MXN', symbol: '$', name: 'México' },
          ecoCoins: demoUser.ecoCoins,
          sustainabilityScore: demoUser.sustainabilityScore,
          location: demoUser.location,
          preferences: demoUser.preferences,
          transactionsCount: 5,
          createdAt: new Date()
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
 * Actualizar perfil simplificado para demo
 */
exports.updateProfile = async (req, res) => {
  try {
    const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
    const { username, country, accountType } = req.body || {};
    const updated = store.setUser({
      ...demoUser,
      username: username || demoUser.username,
      country: (country || demoUser.country || 'MX').toUpperCase(),
      accountType: accountType || demoUser.accountType,
    });

    return res.json({
      success: true,
      message: 'Perfil actualizado (modo demo)',
      data: {
        user: {
          id: updated.id,
          _id: updated.id,
          username: updated.username,
          email: updated.email,
          country: updated.country,
          accountType: updated.accountType,
          recyclingCode: updated.recyclingCode,
          currency: { currency: 'MXN', symbol: '$', name: 'México' },
          ecoCoins: updated.ecoCoins,
          sustainabilityScore: updated.sustainabilityScore
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Completar onboarding (modo demo)
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
    const { accountType, location, preferences } = req.body || {};

    const updated = store.setUser({
      ...demoUser,
      accountType: accountType || demoUser.accountType,
      location: location || demoUser.location,
      preferences: {
        ...(demoUser.preferences || {}),
        ...(preferences || {}),
        onboardingCompleted: true,
      },
    });

    return res.json({
      success: true,
      message: 'Onboarding completado (modo demo)',
      data: {
        user: {
          id: updated.id,
          _id: updated.id,
          username: updated.username,
          email: updated.email,
          country: updated.country,
          accountType: updated.accountType,
          recyclingCode: updated.recyclingCode,
          currency: { currency: 'MXN', symbol: '$', name: 'México' },
          ecoCoins: updated.ecoCoins,
          sustainabilityScore: updated.sustainabilityScore,
          location: updated.location,
          preferences: updated.preferences,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * Obtener estadísticas simplificadas para demo
 */
exports.getStats = async (req, res) => {
  try {
    const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
    return res.json({
      success: true,
      data: {
        ecoCoins: demoUser.ecoCoins,
        transactionsCount: 5,
        sustainabilityScore: demoUser.sustainabilityScore,
        monthlyGrowth: 15
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener todos los usuarios - solo para admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: Array.from(store.usersById.values()).map((u) => ({
        id: u.id,
        _id: u.id,
        username: u.username,
        email: u.email,
        ecoCoins: u.ecoCoins,
        sustainabilityScore: u.sustainabilityScore,
        recyclingCode: u.recyclingCode,
        accountType: u.accountType,
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Empresa vendedora (modo demo)
exports.becomeCompanySeller = async (req, res) => {
  const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
  const { companyProfile } = req.body || {};

  const next = {
    ...demoUser,
    accountType: 'company',
    roles: Array.from(new Set([...(demoUser.roles || ['user']), 'seller'])),
    preferences: { ...(demoUser.preferences || {}), ...(companyProfile ? { companyProfile } : {}) },
  };
  store.usersById.set(String(next.id), next);

  return res.json({
    success: true,
    message: 'Cuenta actualizada a empresa vendedora (modo demo)',
    data: { user: next },
  });
};

// Activar rol seller (modo demo)
exports.becomeSeller = async (req, res) => {
  const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });

  const next = {
    ...demoUser,
    roles: Array.from(new Set([...(demoUser.roles || ['user']), 'seller'])),
  };
  store.usersById.set(String(next.id), next);

  return res.json({
    success: true,
    message: 'Rol seller activado (modo demo)',
    data: { user: next },
  });
};

// Historial de ecoCoins (modo demo)
exports.getEcoCoinsHistory = async (req, res) => {
  const demoUser = store.ensureUser({ id: req.userId, email: req.user?.email, username: req.user?.username, country: 'MX' });
  return res.json({
    success: true,
    data: {
      history: [
        {
          type: 'demo',
          at: new Date().toISOString(),
          ecoCoinsDelta: 0,
          reference: 'demo',
          metadata: { ecoCoinsBalance: demoUser.ecoCoins },
        },
      ],
    },
  });
};