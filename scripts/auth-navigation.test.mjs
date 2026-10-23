import assert from 'node:assert/strict';
import { test } from 'node:test';
import { observeSession } from '../src/features/auth/session.ts';

const account = { id: 'account-a', email: 'a@example.invalid' };
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
// Simula eventos de autenticação e permite atrasar a confirmação de identidade.
// Assim os testes reproduzem trocas de conta e respostas tardias sem login externo.
function sessionHarness() {
  const users = [],
    errors = [];
  let callback,
    response = { data: { user: account }, error: null },
    resolveUser,
    unsubscribed = false;
  let deferred = false;
  const client = {
    auth: {
      onAuthStateChange(fn) {
        callback = fn;
        return {
          data: {
            subscription: {
              unsubscribe() {
                unsubscribed = true;
              },
            },
          },
        };
      },
      getUser() {
        return deferred
          ? new Promise((resolve) => {
              resolveUser = resolve;
            })
          : Promise.resolve(response);
      },
    },
  };
  const stop = observeSession(
    client,
    (user) => users.push(user),
    (error) => errors.push(error),
  );
  return {
    users,
    errors,
    stop,
    event(event, user = account) {
      callback(event, user ? { user } : null);
    },
    response(value) {
      response = value;
    },
    defer() {
      deferred = true;
    },
    resolve(value) {
      deferred = false;
      resolveUser(value);
    },
    get unsubscribed() {
      return unsubscribed;
    },
  };
}

test('sessão inicial só apresenta a conta confirmada no servidor', async () => {
  const h = sessionHarness();
  h.event('INITIAL_SESSION');
  assert.equal(h.users.length, 0);
  await settle();
  assert.equal(h.users.at(-1).id, account.id);
  h.stop();
});

test('renovação e SIGNED_IN repetido preservam a identidade e não reiniciam a tela', async () => {
  const h = sessionHarness();
  h.event('INITIAL_SESSION');
  await settle();
  const initial = h.users[0];
  for (const event of ['TOKEN_REFRESHED', 'SIGNED_IN', 'USER_UPDATED']) {
    h.event(event);
    await settle();
    assert.equal(h.users.length, 1);
    assert.equal(h.users.at(-1), initial);
  }
  h.stop();
});

test('troca de conta oculta a anterior imediatamente e descarta validações antigas', async () => {
  const h = sessionHarness();
  h.event('INITIAL_SESSION');
  await settle();
  h.defer();
  h.event('TOKEN_REFRESHED');
  await settle();
  const other = { id: 'account-b', email: 'b@example.invalid' };
  h.event('SIGNED_IN', other);
  assert.equal(h.users.at(-1), null);
  h.resolve({ data: { user: account }, error: null });
  h.response({ data: { user: other }, error: null });
  await settle();
  assert.equal(h.users.at(-1).id, other.id);
  h.stop();
});

test('falha transitória na renovação informa erro e preserva a conta', async () => {
  const h = sessionHarness();
  h.event('INITIAL_SESSION');
  await settle();
  h.response({ data: { user: null }, error: new Error('offline') });
  h.event('TOKEN_REFRESHED');
  await settle();
  assert.equal(h.users.length, 1);
  assert.match(h.errors.at(-1), /confirmar/);
  h.stop();
});

test('logout impede que uma validação pendente restaure a conta anterior', async () => {
  const h = sessionHarness();
  h.defer();
  h.event('INITIAL_SESSION');
  await settle();
  h.event('SIGNED_OUT', null);
  h.resolve({ data: { user: account }, error: null });
  await settle();
  assert.equal(h.users.at(-1).isDemo, true);
  h.stop();
});

test('desmontagem cancela validação pendente e remove inscrição', async () => {
  const h = sessionHarness();
  h.defer();
  h.event('INITIAL_SESSION');
  await settle();
  h.stop();
  h.resolve({ data: { user: account }, error: null });
  await settle();
  assert.equal(h.users.length, 0);
  assert.equal(h.unsubscribed, true);
});

test('sem configuração disponibiliza apenas demonstração', () => {
  let user;
  observeSession(
    null,
    (value) => {
      user = value;
    },
    () => {},
  )();
  assert.equal(user.isDemo, true);
});
