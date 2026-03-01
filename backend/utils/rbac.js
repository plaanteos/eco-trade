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
};

function normalizeRoles(user) {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles.map(String);
  if (user.role) return [String(user.role)];
  return [];
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
