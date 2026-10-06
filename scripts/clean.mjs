import { rmSync } from 'node:fs';
// Only generated outputs at the known repository root are removed.
for (const name of ['dist', 'server.js']) rmSync(new URL(`../${name}`, import.meta.url), { recursive: true, force: true });
