const { hasPermission } = require('../utils/rbac');

describe('rbac - permisos por rol', () => {
  test('admin tiene users:list y recycling:submission:verify', () => {
    const user = { roles: ['admin'] };
    expect(hasPermission(user, 'users:list')).toBe(true);
    expect(hasPermission(user, 'recycling:submission:verify')).toBe(true);
  });

  test('super_admin tiene users:list y recycling:point:manage:any', () => {
    const user = { roles: ['super_admin'] };
    expect(hasPermission(user, 'users:list')).toBe(true);
    expect(hasPermission(user, 'recycling:point:manage:any')).toBe(true);
  });

  test('accountType=company infiere rol company y puede crear puntos', () => {
    const user = { roles: ['user'], accountType: 'company' };
    expect(hasPermission(user, 'recycling:point:create')).toBe(true);
    expect(hasPermission(user, 'users:list')).toBe(false);
  });

  test('user base no tiene users:list', () => {
    const user = { roles: ['user'] };
    expect(hasPermission(user, 'users:list')).toBe(false);
  });
});
