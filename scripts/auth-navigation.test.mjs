import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

// Exercise App with controlled auth events and deferred server validation.
function mountApp() {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let authCallback;
  let validatedUser;
  let signOutError = null;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useMemo(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) slots[index] = { deps, value: callback() };
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    },
  };
  const client = { auth: {
    onAuthStateChange(callback) { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    getUser: async () => ({ data: { user: validatedUser }, error: null }),
    signOut: async () => {
      if (!signOutError) authCallback('SIGNED_OUT', null);
      return { error: signOutError };
    },
  } };
  const service = { getSupabaseClient: () => client, fetchTransactionsService: async () => [] };
  const compiled = transformSync(readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'), { loader: 'tsx', format: 'cjs' }).code;
  const context = {
    module: { exports: {} }, setTimeout, console: { error() {} },
    require(name) {
      if (name === 'react') return react;
      if (name === './services/supabase') return service;
      return new Proxy({}, { get: (_, key) => key });
    },
  };
  vm.runInNewContext(compiled, context);
  const render = () => {
    cursor = 0;
    const tree = context.module.exports.default();
    effects.splice(0).forEach(effect => effect());
    return tree;
  };
  return {
    render,
    async event(event, user = null) {
      validatedUser = user;
      authCallback(event, user ? { user } : null);
      const pending = render();
      await new Promise(resolve => setTimeout(resolve, 5));
      return { pending, settled: render() };
    },
    failSignOut() { signOutError = new Error('offline'); },
  };
}

function find(tree, type) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (tree.type === type) return tree;
  for (const child of tree.props?.children?.flat(Infinity) ?? []) {
    const found = find(child, type);
    if (found) return found;
  }
}

const account = { id: 'account-a', email: 'a@example.invalid' };

for (const event of ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED']) {
  test(`${event}: sessão validada abre painel sem exibir landing durante recuperação`, async () => {
    const app = mountApp();
    assert.equal(app.render().props.role, 'status');
    const { pending, settled } = await app.event(event, account);
    assert.equal(pending.props.role, 'status');
    assert.equal(find(settled, 'LandingPage'), undefined);
    assert.equal(find(settled, 'Header').props.user.id, account.id);
    assert.equal(find(settled, 'Header').props.onOpenLanding, undefined);
    assert.equal(find(settled, 'Home'), undefined);
  });
}

test('visitante acessa landing e demonstração; sair retorna à landing', async () => {
  const app = mountApp();
  app.render();
  const { settled } = await app.event('INITIAL_SESSION');
  find(settled, 'LandingPage').props.onGoToDashboard();
  const demo = app.render();
  assert.equal(find(demo, 'Header').props.user.isDemo, true);
  assert.equal(typeof find(demo, 'Header').props.onOpenLanding, 'function');
  const loggedIn = (await app.event('SIGNED_IN', account)).settled;
  await find(loggedIn, 'Header').props.onLogout();
  assert.ok(find(app.render(), 'LandingPage'));
});

test('falha ao sair preserva usuário autenticado no painel', async () => {
  const app = mountApp();
  app.render();
  const { settled } = await app.event('INITIAL_SESSION', account);
  app.failSignOut();
  await find(settled, 'Header').props.onLogout();
  assert.equal(find(app.render(), 'Header').props.user.id, account.id);
});
