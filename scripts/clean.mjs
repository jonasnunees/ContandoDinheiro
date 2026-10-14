import { rmSync } from 'node:fs';
// Remove apenas as saídas listadas, resolvidas a partir deste script, sem depender do diretório atual.
for (const name of ['dist', 'server.js']) rmSync(new URL(`../${name}`, import.meta.url), { recursive: true, force: true });
