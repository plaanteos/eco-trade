const ROLE_PERMISSIONS = {
  // Usuario base
  user: [
    'profile:read',
    'profile:update',
    'recycling:submission:create',
    'recycling:submission:list:own',
    'ecocoins:balance:read',
    'ecocoins:history:read',
    'product:list',
    'product:buy',
  ],

  // Empresa vendedora (usuario + permisos extra)
  seller: [
    'product:create',
    'product:update:own',
    'product:delete:own',
    'sales:stats:read:own',
  ],

  // Empresa (Opción A): tipo de usuario distinto.
  // Administra sus puntos de reciclaje y su catálogo/ventas.
  company: [
    'profile:read',
    'profile:update',
    'ecocoins:balance:read',
    'ecocoins:history:read',
    'product:list',
    'product:create',
    'product:update:own',
    'product:delete:own',
    'sales:stats:read:own',
    'recycling:point:create',
    'recycling:point:dashboard',
    'recycling:operator:create',
    'recycling:operator:manage',
    'recycling:submission:verify',
  ],

  // Operador de punto (asignación por punto; este rol es útil para UI)
  recycling_operator: [
    'recycling:delivery:register',
    'recycling:point:stats:read',
  ],

  // Admin de reciclaje (administra al menos un punto)
  recycling_admin: [
    'recycling:point:create',
    'recycling:point:dashboard',
    'recycling:operator:create',
    'recycling:operator:manage',
    'recycling:submission:verify',
  ],

  // Admin global (plataforma)
  admin: [
    'users:list',
    'users:manage',
    'recycling:point:manage:any',
    'recycling:submission:verify',
  ],

  // Alias explícito (Opción A): superusuario de plataforma.
  super_admin: [
    'users:list',
    'users:manage',
    'recycling:point:manage:any',
    'recycling:submission:verify',
  ],
};

function normalizeRoles(user) {
  if (!user) return [];
  const roles = [];

  if (Array.isArray(user.roles)) roles.push(...user.roles.map(String));
  if (user.role) roles.push(String(user.role));

  // Opción A: accountType=company implica rol company (para permisos RBAC).
  if (String(user.accountType || '') === 'company') roles.push('company');

  // Compatibilidad: tratar admin como super_admin también.
  if (roles.includes('admin') && !roles.includes('super_admin')) roles.push('super_admin');

  return Array.from(new Set(roles));
}

function getPermissionsForRoles(roles) {
  const perms = new Set();
  for (const role of Array.isArray(roles) ? roles : []) {
    const list = ROLE_PERMISSIONS[String(role)] || [];
    for (const p of list) perms.add(p);
  }
  return perms;
}

function hasPermission(user, permission) {
  const roles = normalizeRoles(user);
  const perms = getPermissionsForRoles(roles);
  return perms.has(String(permission));
}

module.exports = {
  ROLE_PERMISSIONS,
  normalizeRoles,
  getPermissionsForRoles,
  hasPermission,
};
