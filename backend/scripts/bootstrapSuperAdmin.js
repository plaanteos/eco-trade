require('dotenv').config();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const readline = require('node:readline');
const { getPrisma } = require('../config/prismaClient');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env (obligatorio)`);
  }
  return String(value);
}

function generateRecyclingCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `ET-${ts}-${rnd}`;
}

function looksWeakPassword(value) {
  const s = String(value || '');
  const normalized = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  if (s.length < 16) return true;
  const weakFragments = ['password', 'contrasena', '1234', 'qwerty', 'admin', 'ecotrade'];
  if (weakFragments.some((x) => normalized.includes(x))) return true;

  const hasUpper = /[A-Z]/.test(s);
  const hasLower = /[a-z]/.test(s);
  const hasDigit = /\d/.test(s);
  const hasSymbol = /[^A-Za-z0-9]/.test(s);
  const groups = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  return groups < 3;
}

async function promptSecret(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return String(answer || '');
}

async function main() {
  const email = requireEnv('SUPER_ADMIN_EMAIL').toLowerCase().trim();
  const username = requireEnv('SUPER_ADMIN_USERNAME').trim();
  let password = process.env.SUPER_ADMIN_PASSWORD ? String(process.env.SUPER_ADMIN_PASSWORD) : '';
  const country = (process.env.SUPER_ADMIN_COUNTRY || process.env.DEFAULT_COUNTRY || 'AR').toUpperCase().trim();

  if (!password) {
    password = await promptSecret('SUPER_ADMIN_PASSWORD (no se muestra, recomendada >= 16 chars): ');
  }

  if (looksWeakPassword(password)) {
    throw new Error('SUPER_ADMIN_PASSWORD es débil. Usá una contraseña de >=16 caracteres y evitá patrones comunes (password/contraseña/1234/etc.).');
  }

  const prisma = getPrisma();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true, roles: true, accountType: true },
  });

  const nextRoles = ['admin', 'super_admin'];

  if (existing) {
    const currentRoles = Array.isArray(existing.roles) ? existing.roles.map(String) : [];
    const merged = Array.from(new Set([...currentRoles, ...nextRoles]));

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { roles: { set: merged } },
      select: { id: true, email: true, username: true, roles: true, accountType: true },
    });

    console.log('[bootstrapSuperAdmin] super_admin OK (actualizado)');
    console.log(JSON.stringify(updated, null, 2));
    return;
  }

  let recyclingCode = generateRecyclingCode();
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.user.findUnique({ where: { recyclingCode }, select: { id: true } }).catch(() => null);
    if (!taken) break;
    recyclingCode = generateRecyclingCode();
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      accountType: 'individual',
      country,
      recyclingCode,
      ecoCoins: 0,
      sustainabilityScore: 0,
      roles: nextRoles,
      isActive: true,
      preferences: { onboardingCompleted: true },
    },
    select: { id: true, email: true, username: true, roles: true, accountType: true, country: true },
  });

  console.log('[bootstrapSuperAdmin] super_admin OK (creado)');
  console.log(JSON.stringify(created, null, 2));
}

main()
  .catch((err) => {
    console.error('[bootstrapSuperAdmin] ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const prisma = getPrisma();
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });
