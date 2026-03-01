const {
  transactionValidationSchemas,
  ValidationSchemas,
} = require('../utils/validationSchemas');

describe('validationSchemas - IDs compatibles con Prisma', () => {
  test('transactionCreate acepta cuid/uuid/objectId como productId', () => {
    const cuid = `c${'a'.repeat(24)}`;
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const objectId = '507f1f77bcf86cd799439011';

    for (const productId of [cuid, uuid, objectId]) {
      const { error } = transactionValidationSchemas.create.validate(
        { productId, paymentMethod: 'Efectivo' },
        { abortEarly: false }
      );
      expect(error).toBeUndefined();
    }
  });

  test('rating y transactionMessage aceptan IDs Prisma y rechazan inválidos', () => {
    const cuid = `c${'b'.repeat(24)}`;
    const uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

    expect(
      ValidationSchemas.rating.validate({ transactionId: cuid, score: 5 }).error
    ).toBeUndefined();

    expect(
      ValidationSchemas.transactionMessage.validate({
        transactionId: uuid,
        message: 'hola',
      }).error
    ).toBeUndefined();

    expect(
      ValidationSchemas.transactionMessage.validate({
        transactionId: 'not-an-id',
        message: 'hola',
      }).error
    ).toBeDefined();
  });
});
