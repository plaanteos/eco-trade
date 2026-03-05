/* eslint-disable no-console */
// Genera un mapa del proyecto (carpetas/archivos) y un grafo simple de dependencias
// basado en imports/requires relativos.
//
// Uso:
//   node scripts/generate-project-map.js
//   node scripts/generate-project-map.js --out MAPA_PROYECTO_ECOTRADE.md
//   node scripts/generate-project-map.js --include-legacy

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

const DEFAULT_OUT = 'MAPA_PROYECTO_ECOTRADE.md';

const TEXT_EXTS = new Set([
  '.js', '.cjs', '.mjs',
  '.ts', '.tsx', '.jsx',
  '.json', '.md', '.txt',
  '.yml', '.yaml',
  '.prisma',
  '.mjs',
]);

const CODE_EXTS = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx']);

const DEFAULT_EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.vercel',
  '.cache',
]);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function rel(p) {
  return toPosix(path.relative(WORKSPACE_ROOT, p));
}

function isUnder(p, relDirPosix) {
  const rp = rel(p);
  return rp === relDirPosix || rp.startsWith(`${relDirPosix}/`);
}

function parseArgs(argv) {
  const outIndex = argv.indexOf('--out');
  const out = outIndex >= 0 ? argv[outIndex + 1] : DEFAULT_OUT;
  const includeLegacy = argv.includes('--include-legacy');
  return { out, includeLegacy };
}

function shouldExcludeDir(dirName, dirRelPosix, includeLegacy) {
  if (DEFAULT_EXCLUDE_DIRS.has(dirName)) return true;
  if (!includeLegacy) {
    if (dirRelPosix === 'legacy' || dirRelPosix.startsWith('legacy/')) return true;
    if (dirRelPosix === 'backend/legacy-mongoose' || dirRelPosix.startsWith('backend/legacy-mongoose/')) return true;
  }
  return false;
}

function walkFiles(rootDirAbs, includeLegacy) {
  const out = [];

  /** @param {string} dirAbs */
  const visit = (dirAbs) => {
    const items = fs.readdirSync(dirAbs, { withFileTypes: true });
    for (const item of items) {
      const abs = path.join(dirAbs, item.name);
      const r = rel(abs);
      if (item.isDirectory()) {
        const dirRel = r;
        if (shouldExcludeDir(item.name, dirRel, includeLegacy)) continue;
        visit(abs);
        continue;
      }

      const ext = path.extname(item.name).toLowerCase();
      if (!TEXT_EXTS.has(ext)) continue;
      out.push(abs);
    }
  };

  visit(rootDirAbs);
  out.sort((a, b) => rel(a).localeCompare(rel(b)));
  return out;
}

function readTextSafe(fileAbs) {
  try {
    return fs.readFileSync(fileAbs, 'utf8');
  } catch {
    return '';
  }
}

function extractImports(code) {
  // Heurístico: no intenta parsear TS/JS completo.
  // Soporta:
  //  - import x from '...'
  //  - import {x} from "..."
  //  - export {x} from '...'
  //  - export * from '...'
  //  - require('...')
  //  - import('...')

  const results = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[^;\n]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bexport\s+\*\s+from\s*['"]([^'"]+)['"]/g,
    /\bexport\s+\{[^}]*\}\s+from\s*['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(code)) !== null) {
      if (m[1]) results.push(m[1]);
    }
  }

  return results;
}

function tryResolveRelative(fromFileAbs, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('..')) return null;
  const fromDir = path.dirname(fromFileAbs);
  const base = path.resolve(fromDir, spec);

  const candidates = [];
  // Exacto
  candidates.push(base);
  // Extensiones
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']) {
    candidates.push(base + ext);
  }
  // Directorio index
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
    candidates.push(path.join(base, 'index' + ext));
  }

  for (const c of candidates) {
    try {
      const st = fs.statSync(c);
      if (st.isFile()) return c;
    } catch {
      // ignore
    }
  }

  return null;
}

function classifyFile(fileRelPosix) {
  const lower = fileRelPosix.toLowerCase();

  if (lower.endsWith('.md') || lower.endsWith('.txt')) return { kind: 'docs', purpose: 'Documentación del proyecto' };
  if (lower.endsWith('.prisma')) return { kind: 'schema', purpose: 'Esquema de base de datos (Prisma)' };
  if (lower.endsWith('.json')) {
    if (lower.endsWith('package.json')) return { kind: 'config', purpose: 'Manifiesto de Node (scripts/deps)' };
    if (lower.endsWith('package-lock.json')) return { kind: 'lockfile', purpose: 'Lockfile de npm (resolución exacta)' };
    if (lower.endsWith('vercel.json')) return { kind: 'config', purpose: 'Config de despliegue (Vercel)' };
    return { kind: 'data', purpose: 'Archivo JSON (config/datos)' };
  }

  if (lower.startsWith('backend/tests/')) return { kind: 'test', purpose: 'Pruebas de integración (Jest/Supertest)' };
  if (lower.startsWith('backend/controllers/')) return { kind: 'controller', purpose: 'Controlador: lógica de negocio para endpoints' };
  if (lower.startsWith('backend/routers/')) return { kind: 'router', purpose: 'Router Express: define endpoints y middlewares' };
  if (lower.startsWith('backend/middleware/')) return { kind: 'middleware', purpose: 'Middleware Express: auth/errores/roles' };
  if (lower.startsWith('backend/config/')) return { kind: 'config', purpose: 'Config/clients (Prisma/Supabase/DB)' };
  if (lower.startsWith('backend/utils/')) return { kind: 'util', purpose: 'Utilidades compartidas (validación, rbac, cálculos)' };
  if (lower.startsWith('backend/scripts/')) return { kind: 'script', purpose: 'Scripts de mantenimiento/bootstrapping' };

  if (lower.startsWith('frontend/src/')) return { kind: 'frontend', purpose: 'Código del frontend (React/Vite/TS)' };
  if (lower.startsWith('frontend/')) return { kind: 'frontend-config', purpose: 'Config/build del frontend (Vite/Tailwind/etc.)' };

  if (lower.startsWith('api/')) return { kind: 'serverless', purpose: 'Wrapper serverless (Vercel) para el backend' };

  if (lower.startsWith('legacy/')) return { kind: 'legacy', purpose: 'Código/archivos legacy archivados (no runtime)' };
  if (lower.startsWith('backend/legacy-mongoose/')) return { kind: 'legacy', purpose: 'Stack legacy Mongo/Mongoose archivado (no runtime)' };

  if (lower === 'server-main.js') return { kind: 'entrypoint', purpose: 'Entrypoint del backend Express' };
  if (lower.startsWith('scripts/')) return { kind: 'script', purpose: 'Scripts de build/deploy/soporte' };

  return { kind: 'other', purpose: 'Archivo del proyecto' };
}

function mdEscape(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildGraph(filesAbs) {
  const nodes = new Map(); // relPosix -> { abs, rel, depsInternal:Set, depsExternal:Set }

  for (const abs of filesAbs) {
    const r = rel(abs);
    nodes.set(r, {
      abs,
      rel: r,
      depsInternal: new Set(),
      depsExternal: new Set(),
    });
  }

  for (const node of nodes.values()) {
    const ext = path.extname(node.abs).toLowerCase();
    if (!CODE_EXTS.has(ext)) continue;
    const code = readTextSafe(node.abs);
    const specs = extractImports(code);

    for (const spec of specs) {
      const resolved = tryResolveRelative(node.abs, spec);
      if (resolved) {
        const targetRel = rel(resolved);
        if (nodes.has(targetRel)) {
          node.depsInternal.add(targetRel);
        }
      } else {
        // Paquete externo o import no resoluble (alias, etc.).
        if (!spec.startsWith('.') && !spec.startsWith('..')) {
          node.depsExternal.add(spec);
        }
      }
    }
  }

  // invertimos para "usado por"
  const usedBy = new Map(); // rel -> Set(rel)
  for (const r of nodes.keys()) usedBy.set(r, new Set());
  for (const node of nodes.values()) {
    for (const dep of node.depsInternal) {
      const s = usedBy.get(dep);
      if (s) s.add(node.rel);
    }
  }

  return { nodes, usedBy };
}

function groupByTopFolder(fileRelPosix) {
  const parts = fileRelPosix.split('/');
  if (parts.length === 1) return '(root)';
  return parts[0];
}

function parentDirRel(fileRelPosix) {
  const parts = fileRelPosix.split('/');
  if (parts.length === 1) return '(root)';
  parts.pop();
  return parts.join('/');
}

function describeDir(dirRelPosix) {
  const d = dirRelPosix.toLowerCase();
  if (dirRelPosix === '(root)') {
    return 'Raíz del repo: entrypoints, configuración y documentación';
  }
  if (d === '.github') return 'Configuración/guías para herramientas (Copilot, etc.)';
  if (d === 'api') return 'Wrapper serverless (Vercel) que expone el backend Express';

  if (d === 'backend') return 'Backend canónico (Express + Prisma)';
  if (d === 'backend/config') return 'Conectores y configuración (DB/Prisma/Supabase)';
  if (d === 'backend/controllers') return 'Controladores: lógica por endpoint';
  if (d === 'backend/middleware') return 'Middlewares: auth, RBAC, error handling';
  if (d === 'backend/routers') return 'Routers Express: endpoints y wiring hacia controllers';
  if (d === 'backend/utils') return 'Utilidades: validación, RBAC, cálculos ecoCoins, stores demo';
  if (d === 'backend/scripts') return 'Scripts operativos: backfills, bootstrapping, checks';
  if (d === 'backend/tests') return 'Tests Jest/Supertest del backend';
  if (d === 'backend/legacy-mongoose') return 'Legacy: stack Mongo/Mongoose archivado';
  if (d.startsWith('backend/legacy-mongoose/')) return 'Legacy: stack Mongo/Mongoose archivado';

  if (d === 'frontend') return 'Frontend (Vite/React/TypeScript)';
  if (d === 'frontend/src') return 'Código fuente del frontend';
  if (d === 'frontend/src/app') return 'App (rutas, layout, páginas, componentes, libs)';
  if (d === 'frontend/src/app/pages') return 'Pantallas/páginas de la app (rutas)';
  if (d === 'frontend/src/app/layouts') return 'Layouts compartidos';
  if (d === 'frontend/src/app/lib') return 'Clientes/SDKs y helpers (API, auth, Supabase)';
  if (d === 'frontend/src/app/components') return 'Componentes UI y utilitarios';
  if (d === 'frontend/src/app/components/ui') return 'Componentes UI (shadcn/Radix wrappers)';
  if (d === 'frontend/src/app/components/figma') return 'Componentes importados/adaptados (figma)';
  if (d === 'frontend/public') return 'Assets públicos del frontend';
  if (d === 'frontend/guidelines') return 'Guías de UI/uso para el frontend';
  if (d === 'frontend/dist') return 'Build output (generado)';

  if (d === 'prisma') return 'Prisma: esquema y modelo de datos';
  if (d === 'scripts') return 'Scripts auxiliares (build/deploy)';
  if (d === 'legacy') return 'Legacy archivado (no runtime)';
  if (d.startsWith('legacy/')) return 'Legacy archivado (no runtime)';

  return 'Carpeta del proyecto';
}

function generateMarkdown({ nodes, usedBy }, includeLegacy) {
  const allFiles = Array.from(nodes.keys());

  const nowIso = new Date().toISOString();

  const lines = [];
  lines.push('# Mapa del proyecto EcoTrade');
  lines.push('');
  lines.push(`Generado automáticamente: ${nowIso}`);
  lines.push('');
  lines.push('Este archivo describe:');
  lines.push('- Para qué sirve cada carpeta y qué contiene');
  lines.push('- Para qué sirve cada archivo (heurística + convenciones)');
  lines.push('- Conexiones entre archivos (imports/require relativos): qué importa y quién lo usa');
  lines.push('');
  lines.push('Notas:');
  lines.push('- No se listan ni exponen valores de `.env` (secretos).');
  lines.push('- El grafo de conexiones es aproximado (regex), no un parser completo de JS/TS.');
  lines.push('- Por defecto se excluye `legacy/` y `backend/legacy-mongoose/`.');
  lines.push(`- Modo legacy incluido: ${includeLegacy ? 'sí' : 'no'} (usar \'--include-legacy\')`);
  lines.push('');

  lines.push('## Entrypoints y flujo (alto nivel)');
  lines.push('');
  lines.push('- Backend (Express): `server-main.js`');
  lines.push('  - Monta routers en `backend/routers/*` bajo `/api/*`');
  lines.push('  - Conecta DB vía `backend/config/database-config.js` (Prisma/PostgreSQL)');
  lines.push('  - Swagger via `backend/swagger.js`');
  lines.push('- Serverless (Vercel): `api/index.js`');
  lines.push('  - Importa la app Express y asegura conexión DB fuera de healthchecks');
  lines.push('- Frontend (Vite/React/TS): `frontend/src/main.tsx`');
  lines.push('  - Arranca la app y usa rutas definidas en `frontend/src/app/routes.ts`');
  lines.push('');

  lines.push('## Carpetas (qué son y qué contienen)');
  lines.push('');
  // Listado de directorios presentes (solo los que contienen archivos)
  const dirs = new Map();
  for (const f of allFiles) {
    const d = parentDirRel(f);
    const arr = dirs.get(d) || [];
    arr.push(f);
    dirs.set(d, arr);
  }
  for (const arr of dirs.values()) arr.sort();

  const dirKeys = Array.from(dirs.keys())
    .sort((a, b) => {
      const da = a === '(root)' ? -1 : a.split('/').length;
      const db = b === '(root)' ? -1 : b.split('/').length;
      if (da !== db) return da - db;
      return a.localeCompare(b);
    });

  for (const d of dirKeys) {
    const filesHere = dirs.get(d) || [];
    lines.push(`- ${d}: ${describeDir(d)} (archivos: ${filesHere.length})`);
  }
  lines.push('');

  lines.push('## Inventario por carpeta (detallado)');
  lines.push('');
  for (const d of dirKeys) {
    lines.push(`### ${d}`);
    lines.push('');
    lines.push(`- Para qué sirve: ${describeDir(d)}`);
    const filesHere = dirs.get(d) || [];
    for (const f of filesHere) {
      const meta = classifyFile(f);
      const base = f.split('/').pop();
      lines.push(`- ${base} — ${meta.purpose} (${meta.kind})`);
    }
    lines.push('');
  }

  lines.push('## Conexiones por archivo (imports/require internos)');
  lines.push('');
  for (const f of allFiles) {
    const node = nodes.get(f);
    const meta = classifyFile(f);

    const importsInternal = Array.from(node.depsInternal).sort();
    const importsExternal = Array.from(node.depsExternal).sort();
    const usedByList = Array.from(usedBy.get(f) || []).sort();

    lines.push(`### ${f}`);
    lines.push('');
    lines.push(`- Propósito: ${meta.purpose}`);
    lines.push(`- Tipo: ${meta.kind}`);

    if (importsInternal.length > 0) {
      lines.push(`- Importa (interno): ${importsInternal.map(mdEscape).join(', ')}`);
    } else {
      lines.push('- Importa (interno): (ninguno detectado)');
    }

    if (importsExternal.length > 0) {
      lines.push(`- Importa (externo): ${importsExternal.map(mdEscape).join(', ')}`);
    } else {
      lines.push('- Importa (externo): (ninguno detectado)');
    }

    if (usedByList.length > 0) {
      lines.push(`- Usado por: ${usedByList.map(mdEscape).join(', ')}`);
    } else {
      lines.push('- Usado por: (nadie detectado)');
    }

    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const { out, includeLegacy } = parseArgs(process.argv.slice(2));
  const filesAbs = walkFiles(WORKSPACE_ROOT, includeLegacy);
  const graph = buildGraph(filesAbs);
  const md = generateMarkdown(graph, includeLegacy);

  const outAbs = path.isAbsolute(out) ? out : path.join(WORKSPACE_ROOT, out);
  fs.writeFileSync(outAbs, md, 'utf8');
  console.log(`✅ Mapa generado: ${rel(outAbs)}`);
  console.log(`📦 Archivos incluidos: ${filesAbs.length}`);
}

if (require.main === module) {
  main();
}
