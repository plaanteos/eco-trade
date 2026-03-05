// Este archivo se mantenía como "init-db" histórico pero era inconsistente con el
// stack actual Prisma/PostgreSQL y podía confundir al equipo.
//
// Para evitar ejecuciones accidentales, se deshabilita y se deja el script legacy
// completo en: ../legacy-mongoose/scripts/initDatabase_legacy_mongoose.js

console.error('[initDatabase] Deshabilitado: este script era legacy (Mongo/Mongoose) y no aplica al stack actual Prisma/PostgreSQL.');
console.error('[initDatabase] Usá Prisma (prisma:migrate/db:push) y bootstrap:superadmin para inicialización.');
process.exitCode = 1;
