const crypto = require('crypto');

function randomId24() {
  return crypto.randomBytes(12).toString('hex');
}

function seedDemoProducts() {
  return [
    {
      _id: randomId24(),
      name: 'iPhone 12 Pro',
      description: 'iPhone 12 Pro en excelente estado, usado por 1 año. Incluye cargador y auriculares.',
      price: 45000,
      category: 'Electrónicos',
      condition: 'Muy bueno',
      locationText: 'CDMX, México',
      owner: 'demo_user',
      sellerId: randomId24(),
      status: 'available',
      createdAt: new Date(),
    },
    {
      _id: randomId24(),
      name: 'Laptop Dell Inspiron',
      description: 'Laptop Dell en buen estado, ideal para trabajo y estudio. 8GB RAM, SSD 256GB.',
      price: 32000,
      category: 'Electrónicos',
      condition: 'Bueno',
      locationText: 'Guadalajara, México',
      owner: 'demo_user',
      sellerId: randomId24(),
      status: 'available',
      createdAt: new Date(),
    },
    {
      _id: randomId24(),
      name: 'Bicicleta de montaña',
      description: 'Bicicleta Trek en excelente estado, perfecta para aventuras al aire libre.',
      price: 15000,
      category: 'Deportes',
      condition: 'Excelente',
      locationText: 'Monterrey, México',
      owner: 'demo_user',
      sellerId: randomId24(),
      status: 'available',
      createdAt: new Date(),
    },
    {
      _id: randomId24(),
      name: 'Sofá 3 plazas',
      description: 'Sofá cómodo y en buen estado, color gris. Ideal para sala de estar.',
      price: 8500,
      category: 'Hogar',
      condition: 'Bueno',
      locationText: 'Puebla, México',
      owner: 'demo_user',
      sellerId: randomId24(),
      status: 'available',
      createdAt: new Date(),
    },
    {
      _id: randomId24(),
      name: 'Libros de programación',
      description: 'Colección de 5 libros sobre desarrollo web y JavaScript. Excelente para estudiantes.',
      price: 1200,
      category: 'Libros',
      condition: 'Muy bueno',
      locationText: 'CDMX, México',
      owner: 'demo_user',
      sellerId: randomId24(),
      status: 'available',
      createdAt: new Date(),
    },
  ];
}

let tempProducts = seedDemoProducts();

function list() {
  return tempProducts;
}

function getById(id) {
  return tempProducts.find((p) => String(p._id) === String(id)) || null;
}

function create(productData) {
  const product = { _id: randomId24(), ...productData, createdAt: new Date() };
  tempProducts.unshift(product);
  return product;
}

function update(id, updateData) {
  const idx = tempProducts.findIndex((p) => String(p._id) === String(id));
  if (idx === -1) return null;
  tempProducts[idx] = { ...tempProducts[idx], ...updateData };
  return tempProducts[idx];
}

function remove(id) {
  const before = tempProducts.length;
  tempProducts = tempProducts.filter((p) => String(p._id) !== String(id));
  return tempProducts.length !== before;
}

function resetForTests() {
  tempProducts = seedDemoProducts();
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  resetForTests,
};
