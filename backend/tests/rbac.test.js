const { hasPermission } = require('../utils/rbac');

describe('rbac - permisos por rol', () => {
  test('admin tiene users:list y recycling:submission:verify', () => {
    const user = { roles: ['admin'] };
    expect(hasPermission(user, 'users:list')).toBe(true);
    expect(hasPermission(user, 'recycling:submission:verify')).toBe(true);
  });

  test('user base no tiene users:list', () => {
    const user = { roles: ['user'] };
    expect(hasPermission(user, 'users:list')).toBe(false);
  });
});
