import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const path = '/ferramentas/conversor-de-moedas';
const api = '**/economia.awesomeapi.com.br/json/last/**';
const historyApi = '**/economia.awesomeapi.com.br/json/daily/**';
const historical = [
  { bid: '5', timestamp: String(Date.parse('2026-10-20T20:00Z') / 1000) },
  { bid: '4', timestamp: String(Date.parse('2026-10-19T20:00Z') / 1000) },
];
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-26T15:00Z'));
  await page.route(historyApi, (route) => route.fulfill({ json: historical }));
});
const quotes = {
  USDBRL: { code: 'USD', codein: 'BRL', bid: '5', timestamp: '1792950000' },
  EURBRL: { code: 'EUR', codein: 'BRL', bid: '6', timestamp: '1792950010' },
};
test('acesso isolado, recarga, conversões e cache sem painel', async ({ page }) => {
  let calls = 0;
  const financial: string[] = [];
  page.on('request', (request) => {
    if (/AccountWorkspace|rest\/v1|FinancialCharts/.test(request.url()))
      financial.push(request.url());
  });
  await page.route(api, async (route) => {
    calls++;
    await route.fulfill({ json: quotes });
  });
  await page.goto(path);
  await expect(page).toHaveTitle('Conversor de moedas — ContandoDinheiro');
  await expect(page.getByRole('status')).toContainText('5,00');
  await page.getByLabel('Valor', { exact: true }).fill('1.234,56');
  await expect(page.getByRole('status')).toContainText('6.172,80');
  await page.getByRole('button', { name: 'Inverter moedas' }).click();
  await expect(page.getByLabel('Valor', { exact: true })).toHaveValue('1.234,56');
  await expect(page.getByRole('status')).toContainText('246,91');
  await page.getByRole('button', { name: 'Atualizar cotação' }).click();
  expect(calls).toBe(1);
  await page.getByLabel('Para', { exact: true }).selectOption('BRL');
  await expect(page.getByRole('status')).toContainText('Mesma moeda');
  expect(calls).toBe(1);
  await page.getByLabel('Valor', { exact: true }).fill('-1');
  await expect(page.getByText('Informe um valor válido', { exact: false })).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('NaN');
  expect(financial).toEqual([]);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /demo|transaction/i.test(key)),
    ),
  ).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Conversor de moedas' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('5,00');
  expect(financial).toEqual([]);
});
test('carregamento, erro e nova tentativa', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(api, async (route) => {
    await gate;
    await route.fulfill({ status: 429, json: {} });
  });
  await page.goto(path);
  await expect(page.getByRole('status')).toContainText('Consultando');
  await expect(page.getByRole('button', { name: 'Atualizar cotação' })).toBeDisabled();
  release();
  await expect(page.getByRole('alert')).toContainText('Limite');
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('status')).toContainText('5,00');
});
for (const width of [320, 1280])
  for (const theme of ['light', 'dark']) {
    test(`tema ${theme} e largura ${width}, axe e teclado`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem('gf_app_theme', theme), theme);
      await page.route(api, (route) => route.fulfill({ json: quotes }));
      await page.goto(path);
      await expect(page.getByRole('status')).toContainText('5,00');
      const button = page.getByRole('button', { name: 'Ferramentas' });
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Conversor de moedas' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await button.click();
      await page.getByRole('heading', { name: 'Conversor de moedas', exact: true }).click();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: `test-results/currency-${theme}-${width}.png`,
        fullPage: true,
      });
    });
  }
for (const location of ['/', '/demo'])
  for (const width of [320, 1280]) {
    test(`menu em ${location} largura ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(api, (route) => route.fulfill({ json: quotes }));
      await page.goto(location);
      if (width === 320)
        await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await page.getByRole('button', { name: 'Ferramentas', exact: true }).click();
      await page.getByRole('link', { name: 'Conversor de moedas', exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { name: 'Conversor de moedas' })).toBeVisible();
    });
  }
test('atualização identifica cotação anterior e mantém data em caso de falha', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(api, async (route) => {
    calls++;
    if (calls === 1) await route.fulfill({ json: quotes });
    else {
      await gate;
      await route.fulfill({ status: 503, json: {} });
    }
  });
  await page.goto(path);
  await expect(page.getByRole('status')).toContainText('5,00');
  await page.clock.fastForward(60001);
  await page.getByRole('button', { name: 'Atualizar cotação' }).click();
  await expect(page.getByRole('status')).toContainText('Cotação anterior');
  await expect(page.getByRole('status')).toContainText('25/10/2026');
  release();
  await expect(page.getByRole('alert')).toContainText('indisponível');
  await expect(page.getByRole('status')).toContainText('Cotação anterior');
  expect(calls).toBe(2);
});

test('novas moedas, períodos, inversão, tabela e valor local', async ({ page }) => {
  let current = 0,
    history = 0;
  await page.route(api, (route) => {
    current++;
    const data = Object.fromEntries(
      ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'ARS', 'CLP', 'MXN', 'CNY'].map((code) => [
        `${code}BRL`,
        { code, codein: 'BRL', bid: code === 'EUR' ? '6' : '5', timestamp: '1792950000' },
      ]),
    );
    return route.fulfill({ json: data });
  });
  await page.route(historyApi, (route) => {
    history++;
    return route.fulfill({ json: historical });
  });
  await page.goto(path);
  const card = page.getByRole('region', { name: 'Histórico da cotação' });
  await expect(card.getByRole('img')).toHaveAccessibleName('Histórico de 1 USD em BRL');
  await expect(page.getByRole('button', { name: '3 meses', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await card.getByText('Ver tabela de datas e taxas').click();
  await expect(card.getByRole('row')).toHaveCount(3);
  await expect(card.getByRole('table')).toContainText('20/10/2026');
  const before = [current, history];
  await page.getByLabel('Valor', { exact: true }).fill('999');
  expect([current, history]).toEqual(before);
  await page.getByRole('button', { name: 'Inverter moedas' }).click();
  await expect(card.getByRole('img')).toHaveAccessibleName('Histórico de 1 BRL em USD');
  await card.getByText('Ver tabela de datas e taxas').click();
  await expect(card.getByRole('table')).toContainText('0,20');
  expect(history).toBe(1);
  await page.getByRole('button', { name: '1 mês', exact: true }).click();
  await expect(card.getByRole('button', { name: '1 mês', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(history).toBe(1);
  await page.getByRole('button', { name: '6 meses', exact: true }).click();
  await expect.poll(() => history).toBe(2);
  for (const code of ['GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'ARS', 'CLP', 'MXN', 'CNY']) {
    await page.getByLabel('De', { exact: true }).selectOption(code);
    await expect(card.getByRole('img')).toHaveAccessibleName(`Histórico de 1 ${code} em USD`);
  }
  await page.getByLabel('De', { exact: true }).selectOption('USD');
  await expect(card).toContainText('taxa constante 1');
  const same = [current, history];
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByLabel('Valor', { exact: true }).fill('2');
  expect([current, history]).toEqual(same);
});

test('histórico falha independentemente, recupera e mostra cobertura insuficiente', async ({
  page,
}) => {
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  await page.route(historyApi, (route) => route.fulfill({ status: 429, json: {} }));
  await page.goto(path);
  await expect(page.getByRole('status')).toContainText('5,00');
  const card = page.getByRole('region', { name: 'Histórico da cotação' });
  await expect(card.getByRole('alert')).toContainText('Limite');
  await page.route(historyApi, (route) => route.fulfill({ json: [historical[0]] }));
  await card.getByRole('button', { name: 'Tentar histórico novamente' }).click();
  await expect(card).toContainText('Histórico insuficiente');
  await expect(card.getByRole('img')).toHaveCount(0);
});

test('cotação falha sem apagar histórico válido', async ({ page }) => {
  await page.route(api, (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto(path);
  await expect(page.getByRole('alert')).toContainText('indisponível');
  await expect(page.getByRole('img', { name: 'Histórico de 1 USD em BRL' })).toBeVisible();
});

test('respostas atrasadas não recebem rótulos de outra seleção', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(api, async (route) => {
    if (route.request().url().includes('USD-BRL')) await gate;
    return route.fulfill({ json: quotes });
  });
  await page.route(historyApi, async (route) => {
    if (route.request().url().includes('USD-BRL')) await gate;
    return route.fulfill({ json: historical });
  });
  await page.goto(path);
  await page.getByLabel('De', { exact: true }).selectOption('EUR');
  await expect(page.getByRole('status')).toContainText('6,00');
  await expect(page.getByRole('img')).toHaveAccessibleName('Histórico de 1 EUR em BRL');
  release();
  await expect(page.getByRole('status')).toContainText('6,00');
  await expect(page.getByRole('img')).toHaveAccessibleName('Histórico de 1 EUR em BRL');
});

test('toque e alternativa textual disponíveis em tela móvel', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 800 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-10-26T15:00Z'));
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  await page.route(historyApi, (route) => route.fulfill({ json: historical }));
  await page.goto(path);
  await page.getByText('Ver tabela de datas e taxas').tap();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: '1 mês', exact: true }).tap();
  await expect(page.getByRole('button', { name: '1 mês', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await context.close();
});

test('histórico preserva a seleção e identifica dados anteriores em falha de atualização', async ({
  page,
}) => {
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  await page.goto(path);
  const card = page.getByRole('region', { name: 'Histórico da cotação' });
  await expect(card.getByRole('img')).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(3600001);
  await page.route(historyApi, (route) => route.fulfill({ status: 503, json: {} }));
  await card.getByRole('button', { name: 'Atualizar histórico' }).click();
  await expect(card.getByRole('alert')).toContainText('indisponível');
  await expect(card).toContainText('Histórico anterior, consultado em');
  await expect(card.getByRole('img')).toBeVisible();
  await page.route(historyApi, (route) =>
    route.fulfill({ json: [...historical, { bid: 'x', timestamp: 'bad' }] }),
  );
  await card.getByRole('button', { name: 'Tentar histórico novamente' }).click();
  await expect(card).toContainText('Cobertura parcial');
  await expect(card.getByRole('alert')).toHaveCount(0);
});

test('troca rápida de período descarta histórico antigo', async ({ page }) => {
  await page.route(api, (route) => route.fulfill({ json: quotes }));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(historyApi, async (route) => {
    const url = route.request().url();
    if (url.includes('start_date=20260726')) await gate;
    return route.fulfill({ json: url.includes('start_date=20260426') ? historical : [] });
  });
  await page.goto(path);
  await page.getByRole('button', { name: '6 meses', exact: true }).click();
  const card = page.getByRole('region', { name: 'Histórico da cotação' });
  await expect(card.getByRole('img')).toBeVisible();
  release();
  await expect(card.getByRole('img')).toBeVisible();
  await expect(card).not.toContainText('Histórico insuficiente');
});

for (const theme of ['light', 'dark']) {
  test(`tooltip compartilhado no histórico: ${theme}, toque, teclado e limites da tela`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 800 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-26T15:00Z'));
    await page.addInitScript((theme) => localStorage.setItem('gf_app_theme', theme), theme);
    await page.route(api, (route) => route.fulfill({ json: quotes }));
    await page.route(historyApi, (route) => route.fulfill({ json: historical }));
    await page.goto(path);
    const chart = page.getByRole('img', { name: 'Histórico de 1 USD em BRL' });
    await chart.scrollIntoViewIfNeeded();
    const box = (await chart.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width - 50, box.y + 80);
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Histórico da cotação');
    await expect(tooltip).toContainText('20/10/2026');
    await expect(tooltip).toContainText('1 USD em BRL');
    await expect(tooltip).toContainText('5,00');
    const bounds = (await tooltip.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(800);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await tooltip.screenshot({ path: `test-results/currency-tooltip-${theme}.png` });
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await page.touchscreen.tap(box.x + box.width - 50, box.y + 80);
    await expect(tooltip).toBeVisible();
    await tooltip.getByRole('button', { name: 'Fechar detalhes do gráfico' }).click();
    await expect(tooltip).toHaveCount(0);
    await page.getByText('Ver tabela de datas e taxas').click();
    await expect(page.getByRole('table')).toContainText('5,00');
    await context.close();
  });
}

for (const width of [320, 390, 1280]) {
  test(`histórico longo rola dentro do cartão sem alargar a página em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route(api, (route) => route.fulfill({ json: quotes }));
    const series = Array.from({ length: 183 }, (_, i) => ({
      bid: String(5 + i / 1000),
      timestamp: String((Date.UTC(2026, 9, 26, 20) - (i + 1) * 86400000) / 1000),
    }));
    await page.route(historyApi, (route) => route.fulfill({ json: series }));
    await page.goto(path);
    const scroller = page.getByRole('region', { name: 'Gráfico com rolagem horizontal' });
    await expect(page.getByRole('img')).toBeVisible();
    const dimensions = () =>
      scroller.evaluate((element) => ({
        visible: element.clientWidth,
        total: element.scrollWidth,
      }));
    const three = await dimensions();
    if (width < 1024) {
      expect(three.total).toBeGreaterThan(three.visible);
      await scroller.focus();
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => scroller.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
    } else {
      expect(three.total).toBeLessThanOrEqual(three.visible + 1);
    }
    await page.getByRole('button', { name: '6 meses', exact: true }).click();
    await expect(page.getByText(/183 observações/)).toBeVisible();
    const six = await dimensions();
    if (width < 1024) {
      expect(six.total).toBeGreaterThan(three.total);
      await scroller.scrollIntoViewIfNeeded();
      const box = (await scroller.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + 100);
      await page.mouse.wheel(500, 0);
      await expect
        .poll(() => scroller.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(100);
    } else {
      expect(six.total).toBeLessThanOrEqual(six.visible + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/currency-scroll-${width}.png`, fullPage: true });
  });
}
