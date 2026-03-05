const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');
const { hasPermission, normalizeRoles } = require('../utils/rbac');

function isMissingTableError(err) {
  if (err?.code === 'P2021') return true;
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('does not exist') || (msg.includes('relation') && msg.includes('does not exist'));
}

async function safeGetPrimaryCompanyId(prisma, userId) {
  try {
    if (!userId) return null;
    const membership = await prisma.companyMember.findFirst({
      where: { userId: String(userId), status: 'active' },
      select: { companyId: true },
      orderBy: { createdAt: 'asc' },
    });
    return membership?.companyId ? String(membership.companyId) : null;
  } catch (err) {
    if (isMissingTableError(err)) return null;
    throw err;
  }
}

async function addUserRole(prisma, userId, role) {
  if (!userId || !role) return;
  const user = await prisma.user.findUnique({ where: { id: String(userId) }, select: { roles: true } }).catch(() => null);
  if (!user) return;
  const currentRoles = Array.isArray(user.roles) ? user.roles : [];
  if (currentRoles.includes(String(role))) return;
  await prisma.user.update({
    where: { id: String(userId) },
    data: { roles: { set: [...currentRoles, String(role)] } },
  });
}

function ensureDb(res) {
  if (!isConnected()) {
    res.status(503).json({ success: false, message: 'Base de datos no disponible' });
    return false;
  }
  return true;
}

function normalizeAcceptedMaterials(acceptedMaterials) {
  const defaults = [
    { materialType: 'Plástico PET', rewardPerKg: 2 },
    { materialType: 'Cartón', rewardPerKg: 1 },
    { materialType: 'Vidrio Transparente', rewardPerKg: 1 },
  ];

  const maxRewardPerKg = Math.max(0, Number(process.env.RECYCLING_MAX_REWARD_PER_KG) || 50);

  const list = Array.isArray(acceptedMaterials) && acceptedMaterials.length > 0
    ? acceptedMaterials
    : defaults;

  const normalized = list.map((m) => {
    const materialType = String(m?.materialType || '').trim();
    const rewardPerKg = Number(m?.rewardPerKg);
    if (!materialType) return null;
    if (!Number.isFinite(rewardPerKg) || rewardPerKg < 0 || rewardPerKg > maxRewardPerKg) return null;
    return { materialType, rewardPerKg };
  });

  if (normalized.some((x) => x === null)) {
    const err = new Error(`acceptedMaterials inválido: rewardPerKg debe estar entre 0 y ${maxRewardPerKg}`);
    err.code = 'INVALID_ACCEPTED_MATERIALS';
    throw err;
  }

  return normalized;
}

exports.getAllRecyclingPoints = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { city, state, status, materialType } = req.query || {};
    const prisma = getPrisma();

    const where = {};
    if (city) where.city = { contains: String(city), mode: 'insensitive' };
    if (state) where.state = { contains: String(state), mode: 'insensitive' };
    if (status) where.status = String(status);

    let points = await prisma.recyclingPoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        administrator: { select: { id: true, username: true, email: true, profileImage: true } },
      },
    });

    if (materialType) {
      const mt = String(materialType);
      points = points.filter((p) => Array.isArray(p.acceptedMaterials) && p.acceptedMaterials.some((m) => m?.materialType === mt));
    }

    const mapped = points.map((p) => ({ ...p, _id: p.id }));
    return res.json({ success: true, data: { recyclingPoints: mapped, total: mapped.length } });
  } catch (error) {
    console.error('Error en getAllRecyclingPoints:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.findNearbyRecyclingPoints = async (req, res) => {
  try {
    // MVP: sin geocálculo real, devolvemos todo.
    return exports.getAllRecyclingPoints(req, res);
  } catch (error) {
    console.error('Error en findNearbyRecyclingPoints:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getRecyclingPointById = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const point = await prisma.recyclingPoint.findUnique({
      where: { id: String(req.params.id) },
      include: {
        administrator: { select: { id: true, username: true, email: true, profileImage: true } },
      },
    });

    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }

    return res.json({ success: true, data: { recyclingPoint: { ...point, _id: point.id } } });
  } catch (error) {
    console.error('Error en getRecyclingPointById:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getAcceptedMaterials = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const point = await prisma.recyclingPoint.findUnique({ where: { id: String(req.params.id) }, select: { acceptedMaterials: true } });
    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }
    return res.json({ success: true, data: { acceptedMaterials: point.acceptedMaterials || [] } });
  } catch (error) {
    console.error('Error en getAcceptedMaterials:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getRecyclingPointStats = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const pointId = String(req.params.id);

    const subs = await prisma.recyclingSubmission.findMany({
      where: { recyclingPointId: pointId },
      select: { verificationStatus: true, rewards: true, submissionDetails: true },
    });

    const approved = subs.filter((s) => ['approved', 'partially_approved'].includes(String(s.verificationStatus)));
    const totalEcoCoins = approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0);
    const totalKg = approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0);

    return res.json({
      success: true,
      data: {
        stats: {
          totalEcoCoins,
          totalKg,
          totalSubmissions: subs.length,
          approvedSubmissions: approved.length,
        },
      },
    });
  } catch (error) {
    console.error('Error en getRecyclingPointStats:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.createRecyclingPoint = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    // La autorización (RBAC) se aplica en el router. Aquí sólo validamos inputs y consistencia.

    const {
      name,
      description,
      address,
      city,
      state,
      country,
      coordinates,
      contactInfo,
      operatingHours,
      acceptedMaterials,
      capacity,
      features,
      certifications,
      status,
      administratorId,
    } = req.body || {};

    if (!name || !address || !city) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios: name, address, city' });
    }

    const prisma = getPrisma();

    // Por defecto el admin del punto es el creador.
    // Un admin global puede crear el punto asignándolo a otra cuenta (p. ej. una empresa).
    const callerRoles = normalizeRoles(req.user);
    const isPlatformAdmin = callerRoles.includes('admin') || hasPermission(req.user, 'recycling:point:manage:any');
    const resolvedAdministratorId = administratorId && isPlatformAdmin
      ? String(administratorId)
      : String(req.userId);

    if (administratorId && !isPlatformAdmin) {
      return res.status(403).json({ success: false, message: 'Solo un admin global puede asignar administratorId' });
    }

    // Si se asigna a un tercero, validar que exista y que sea una cuenta apta.
    if (resolvedAdministratorId !== String(req.userId)) {
      const target = await prisma.user.findUnique({
        where: { id: resolvedAdministratorId },
        select: { id: true, accountType: true, roles: true },
      }).catch(() => null);

      if (!target) {
        return res.status(400).json({ success: false, message: 'administratorId inválido: usuario no existe' });
      }

      const targetRoles = Array.isArray(target.roles) ? target.roles.map(String) : [];
      const isTargetPlatformAdmin = targetRoles.includes('admin');
      const isTargetCompany = String(target.accountType || '') === 'company';

      if (!isTargetCompany && !isTargetPlatformAdmin) {
        return res.status(400).json({
          success: false,
          message: 'administratorId inválido: el administrador del punto debe ser una cuenta company (o admin global)'
        });
      }
    }

    const ownerData = {};
    // Si el admin del punto es una cuenta company, intentamos asociar el punto a su Company.
    // Esto habilita multi-tenant sin romper compatibilidad si la migración aún no está aplicada.
    try {
      const adminUser = await prisma.user.findUnique({
        where: { id: resolvedAdministratorId },
        select: { id: true, accountType: true },
      }).catch(() => null);

      const isCompanyAdmin = String(adminUser?.accountType || '') === 'company';
      if (isCompanyAdmin) {
        const companyId = await safeGetPrimaryCompanyId(prisma, resolvedAdministratorId);
        if (companyId) {
          ownerData.ownerType = 'company';
          ownerData.companyId = companyId;
        }
      }
    } catch (e) {
      console.warn('No se pudo asociar el punto a Company (continuando):', e?.code || e?.message);
    }

    const point = await prisma.recyclingPoint.create({
      data: {
        name: String(name),
        description: description ? String(description) : undefined,
        address: String(address),
        city: String(city),
        state: state ? String(state) : undefined,
        country: country ? String(country) : undefined,
        coordinates: coordinates || undefined,
        contactInfo: contactInfo || undefined,
        operatingHours: operatingHours || undefined,
        acceptedMaterials: normalizeAcceptedMaterials(acceptedMaterials),
        capacity: capacity || undefined,
        features: features || undefined,
        certifications: certifications || undefined,
        status: status || 'active',
        administratorId: resolvedAdministratorId,
        ...ownerData,
      },
    });

    // Marca al administrador real del punto como admin de reciclaje (útil para gating UI y permisos RBAC).
    await addUserRole(prisma, resolvedAdministratorId, 'recycling_admin');

    return res.status(201).json({ success: true, message: 'Punto de reciclaje creado exitosamente', data: { recyclingPoint: { ...point, _id: point.id } } });
  } catch (error) {
    if (error?.code === 'INVALID_ACCEPTED_MATERIALS') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error en createRecyclingPoint:', error);
    return res.status(500).json({ success: false, message: 'Error al crear punto de reciclaje', details: error.message });
  }
};

exports.updateRecyclingPoint = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const pointId = String(req.params.id);

    const data = { ...req.body };
    if (data.acceptedMaterials) data.acceptedMaterials = normalizeAcceptedMaterials(data.acceptedMaterials);

    // Endurecimiento: cambiar administratorId sólo se permite a admin global.
    if (Object.prototype.hasOwnProperty.call(data, 'administratorId')) {
      const userRoles = normalizeRoles(req.user);
      const isPlatformAdmin = userRoles.includes('admin') || hasPermission(req.user, 'recycling:point:manage:any');
      if (!isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No puedes cambiar el administrador del punto'
        });
      }

      const nextAdminId = data.administratorId ? String(data.administratorId) : '';
      if (!nextAdminId) {
        return res.status(400).json({ success: false, message: 'administratorId inválido' });
      }

      const target = await prisma.user.findUnique({
        where: { id: nextAdminId },
        select: { id: true, accountType: true, roles: true },
      }).catch(() => null);

      if (!target) {
        return res.status(400).json({ success: false, message: 'administratorId inválido: usuario no existe' });
      }

      const targetRoles = Array.isArray(target.roles) ? target.roles.map(String) : [];
      const isTargetPlatformAdmin = targetRoles.includes('admin');
      const isTargetCompany = String(target.accountType || '') === 'company';

      if (!isTargetCompany && !isTargetPlatformAdmin) {
        return res.status(400).json({
          success: false,
          message: 'administratorId inválido: el administrador del punto debe ser una cuenta company (o admin global)'
        });
      }

      await addUserRole(prisma, nextAdminId, 'recycling_admin');
      data.administratorId = nextAdminId;
    }

    const updated = await prisma.recyclingPoint.update({ where: { id: pointId }, data });
    return res.json({ success: true, message: 'Punto actualizado', data: { recyclingPoint: { ...updated, _id: updated.id } } });
  } catch (error) {
    if (error?.code === 'INVALID_ACCEPTED_MATERIALS') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }
    console.error('Error en updateRecyclingPoint:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.deleteRecyclingPoint = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    // MVP: soft delete (evita fallas por FK si hay submissions)
    const prisma = getPrisma();
    const pointId = String(req.params.id);
    await prisma.recyclingPoint.update({ where: { id: pointId }, data: { status: 'inactive' } });
    return res.json({ success: true, message: 'Punto eliminado exitosamente' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }
    console.error('Error en deleteRecyclingPoint:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getPointDashboard = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const point = req.recyclingPoint;
    const prisma = getPrisma();

    const subs = await prisma.recyclingSubmission.findMany({
      where: { recyclingPointId: String(point.id) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { id: true, username: true, email: true, recyclingCode: true } } },
    });

    const statusCounts = subs.reduce((acc, s) => {
      const st = String(s.verificationStatus || 'pending');
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    const approved = subs.filter((s) => ['approved', 'partially_approved'].includes(String(s.verificationStatus)));
    const totals = {
      totalSubmissions: approved.length,
      totalEcoCoins: approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0),
      totalKg: approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0),
    };

    return res.json({
      success: true,
      data: {
        point: { id: point.id, _id: point.id, name: point.name, city: point.city, status: point.status },
        statusCounts,
        totals,
        recentSubmissions: subs.map((s) => ({ ...s, _id: s.id })),
      },
    });
  } catch (error) {
    console.error('Error en getPointDashboard:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.listPointOperators = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.recyclingPoint.id);
    const prisma = getPrisma();

    const memberships = await prisma.recyclingPointOperator.findMany({
      where: { pointId },
      include: { user: { select: { id: true, username: true, email: true, isActive: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const operators = memberships.map((m) => ({ ...m.user, _id: m.user.id }));
    return res.json({ success: true, data: { operators, total: operators.length } });
  } catch (error) {
    console.error('Error en listPointOperators:', error);
    return res.status(500).json({ success: false, message: 'Error al listar operadores' });
  }
};

exports.createPointOperator = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.recyclingPoint.id);
    const { username, email, password, userId } = req.body || {};

    const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
    const normalizedUsername = username ? String(username).trim() : undefined;
    const normalizedUserId = userId ? String(userId).trim() : undefined;

    const prisma = getPrisma();

    // Caso 1: asignar un usuario existente como operador del punto (por email o userId)
    let existingUser = null;
    if (normalizedUserId) {
      existingUser = await prisma.user.findUnique({
        where: { id: normalizedUserId },
        select: { id: true, username: true, email: true, isActive: true, roles: true },
      }).catch(() => null);
    } else if (normalizedEmail) {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, username: true, email: true, isActive: true, roles: true },
      }).catch(() => null);
    }

    if (existingUser) {
      // Asegurar rol de operador (sin sobrescribir otros roles)
      const roles = Array.isArray(existingUser.roles) ? existingUser.roles : [];
      const nextRoles = Array.from(new Set([...(roles.length ? roles : ['user']), 'recycling_operator']));
      if (JSON.stringify(nextRoles) !== JSON.stringify(roles)) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { roles: nextRoles },
        });
      }

      // Upsert membresía punto-operador
      await prisma.recyclingPointOperator.upsert({
        where: { pointId_userId: { pointId, userId: existingUser.id } },
        update: {},
        create: { pointId, userId: existingUser.id },
      });

      return res.status(200).json({
        success: true,
        message: 'Operador asignado al punto',
        data: { operator: { ...existingUser, _id: existingUser.id } },
      });
    }

    // Caso 2: crear un usuario nuevo y asignarlo como operador
    if (!normalizedUsername || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios: username, email' });
    }

    const plainPassword = password
      ? String(password)
      : crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);

    if (String(plainPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Email o nombre de usuario ya registrado' });
    }

    // Nota: el operador es un usuario normal, el rol operativo es por punto.
    const passwordHash = await bcrypt.hash(String(plainPassword), 10);

    // recyclingCode único
    let recyclingCode = `ET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    for (let i = 0; i < 3; i++) {
      const taken = await prisma.user.findUnique({ where: { recyclingCode }, select: { id: true } }).catch(() => null);
      if (!taken) break;
      recyclingCode = `ET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    }

    const operator = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        accountType: 'individual',
        country: undefined,
        recyclingCode,
        roles: ['user', 'recycling_operator'],
        isActive: true,
      },
      select: { id: true, username: true, email: true, isActive: true },
    });

    await prisma.recyclingPointOperator.create({
      data: { pointId, userId: operator.id },
    });

    return res.status(201).json({
      success: true,
      message: 'Operador creado y asignado al punto',
      data: {
        operator: { ...operator, _id: operator.id },
        generatedPassword: password ? undefined : plainPassword,
      },
    });
  } catch (error) {
    console.error('Error en createPointOperator:', error);
    return res.status(500).json({ success: false, message: 'Error al crear operador' });
  }
};

exports.setOperatorStatus = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.recyclingPoint.id);
    const operatorUserId = String(req.params.operatorUserId);
    const { isActive } = req.body || {};

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive debe ser boolean' });
    }

    const prisma = getPrisma();

    // Verificar que el usuario pertenece como operador al punto
    const membership = await prisma.recyclingPointOperator.findUnique({
      where: { pointId_userId: { pointId, userId: operatorUserId } },
      select: { id: true },
    }).catch(() => null);

    if (!membership) {
      return res.status(404).json({ success: false, message: 'El usuario no es operador de este punto' });
    }

    const updated = await prisma.user.update({
      where: { id: operatorUserId },
      data: { isActive },
      select: { id: true, username: true, email: true, isActive: true },
    });

    return res.json({
      success: true,
      message: isActive ? 'Operador activado' : 'Operador desactivado',
      data: { operator: { ...updated, _id: updated.id } },
    });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Operador no encontrado' });
    }
    console.error('Error en setOperatorStatus:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado del operador' });
  }
};

exports.removePointOperator = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.recyclingPoint.id);
    const { operatorUserId } = req.params;

    const prisma = getPrisma();
    await prisma.recyclingPointOperator.delete({
      where: { pointId_userId: { pointId, userId: String(operatorUserId) } },
    });

    return res.json({ success: true, message: 'Operador removido' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Operador no encontrado en este punto' });
    }
    console.error('Error en removePointOperator:', error);
    return res.status(500).json({ success: false, message: 'Error al remover operador' });
  }
};

exports.getPointDeliveryStats = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.recyclingPoint.id);
    const prisma = getPrisma();

    const subs = await prisma.recyclingSubmission.findMany({
      where: { recyclingPointId: pointId },
      select: { tracking: true, rewards: true, submissionDetails: true },
    });

    const map = new Map();
    for (const s of subs) {
      const st = String(s.tracking?.currentStatus || 'submitted');
      const row = map.get(st) || { _id: st, count: 0, ecoCoins: 0, kg: 0 };
      row.count += 1;
      row.ecoCoins += Number(s.rewards?.totalEcoCoins) || 0;
      row.kg += Number(s.submissionDetails?.actualTotalWeight) || 0;
      map.set(st, row);
    }

    return res.json({ success: true, data: { stats: Array.from(map.values()) } });
  } catch (error) {
    console.error('Error en getPointDeliveryStats:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
