import { readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
// Lista explícita de saídas e caches regeneráveis. Preserva dependências e configuração local.
const generated = [
  'dist', 'dev-dist', 'build', 'coverage', 'test-results',
  'playwright-report', 'blob-report', '.vite', '.cache', '.eslintcache',
  'node_modules/.vite', 'playwright/.cache',
];
for (const entry of readdirSync(root)) {
  if (entry.endsWith('.log') || entry.endsWith('.tsbuildinfo')) generated.push(entry);
}
for (const name of generated) {
  const target = path.resolve(root, name);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`Caminho fora do projeto: ${name}`);
  rmSync(target, { recursive: true, force: true });
}
