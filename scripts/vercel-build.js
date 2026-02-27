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

  if (hasDatabaseUrl) {
    console.log('🔧 Prisma: aplicando esquema (db push)...');
    const status = run('npx', ['prisma', 'db', 'push']);
    if (status !== 0) {
      console.warn('⚠️  Prisma db push falló durante build. Se continúa para no bloquear el deploy.');
      console.warn('    Revisá DATABASE_URL / permisos / SSL y corré prisma db push manualmente.');
    }
  } else {
    console.warn('⚠️  DATABASE_URL no está configurado en build. Se omite prisma db push.');
  }

  console.log('🏗️  Build frontend...');
  const buildStatus = run('npm', ['--prefix', 'frontend', 'run', 'build']);
  if (buildStatus !== 0) {
    process.exit(buildStatus);
  }
}

main();
