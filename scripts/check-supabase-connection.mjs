import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd());
const origin = process.argv[2] || 'https://contando-dinheiro.vercel.app';
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY };
const settings = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/settings`, { headers });
const config = await settings.json();
console.log(JSON.stringify({ authStatus: settings.status, googleEnabled: config.external?.google }));
const page = await fetch(origin);
const html = await page.text();
const asset = html.match(/src="([^"]+\.js)"/)[1];
const js = await (await fetch(new URL(asset, origin))).text();
console.log(JSON.stringify({
  siteStatus: page.status,
  asset,
  expectedProjectPresent: js.includes('szdipyjehiaupvuqtwvy'),
  configuredPublicKeyPresent: js.includes(env.VITE_SUPABASE_ANON_KEY),
  anyPublicKeyPresent: /sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(js),
  authenticatedServicePresent: js.includes('Sessão inválida. Entre novamente com o Google.'),
}));
