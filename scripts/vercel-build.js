/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  return result.status ?? 0;
}

function main() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
  const allowDbPush = String(process.env.PRISMA_DB_PUSH || '').toLowerCase() === 'true';
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  if (!hasDatabaseUrl) {
    console.warn('⚠️  DATABASE_URL no está configurado en build. Se omite prisma db push.');
  } else if (isProduction && !allowDbPush) {
    console.warn('🛡️  Prisma: se omite db push en producción (setea PRISMA_DB_PUSH=true si querés habilitarlo).');
  } else if (allowDbPush) {
    console.log('🔧 Prisma: aplicando esquema (db push)...');
    const status = run('npx', ['prisma', 'db', 'push']);
    if (status !== 0) {
      console.warn('⚠️  Prisma db push falló durante build. Se continúa para no bloquear el deploy.');
      console.warn('    Revisá DATABASE_URL / permisos / SSL y corré prisma db push manualmente.');
    }
  } else {
    console.log('ℹ️  Prisma: db push deshabilitado por defecto (setea PRISMA_DB_PUSH=true para correrlo).');
  }

  console.log('🏗️  Build frontend...');
  const buildStatus = run('npm', ['--prefix', 'frontend', 'run', 'build']);
  if (buildStatus !== 0) {
    process.exit(buildStatus);
  }
}

main();
