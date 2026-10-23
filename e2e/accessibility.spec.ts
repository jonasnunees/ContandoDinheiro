import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1280]) {
    test(`página inicial acessível no tema ${theme} com largura ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem('gf_app_theme', value), theme);
      const chartRequests: string[] = [];
      page.on('request', (request) => {
        if (/FinancialCharts|AccountWorkspace|demoStorage|demoExamples/.test(request.url()))
          chartRequests.push(request.url());
      });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.evaluate(() => document.fonts.ready);
      // O overflow oculto do documento não pode mascarar texto cortado no título.
      const headingFits = await page.getByRole('heading', { level: 1 }).evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].every(
          (rect) => rect.left >= 0 && rect.right <= innerWidth,
        );
      });
      expect(headingFits).toBe(true);
      // A ilustração é uma imagem acessível única; audita também o contraste dos textos internos.
      await page.locator('.finance-scene').evaluate((element) => element.removeAttribute('role'));
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })),
      ).toEqual([]);
      expect(chartRequests).toEqual([]);
      expect(await page.evaluate(() => localStorage.getItem('gf_local_transactions'))).toBeNull();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}

// Exercita a interface real em modo demo: foco, validação, gravação local e alternativa aos gráficos.
// axe verifica regras automatizáveis; as expectativas de teclado conferem o ciclo de foco do modal.
test('fluxo demonstrativo acessível: teclado, valores, gráficos e persistência', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Lançamentos & Extrato', exact: false }),
  ).toBeVisible();
  const newTransaction = page.getByRole('button', { name: /Nova Transação/ }).first();
  await newTransaction.click();
  const dialog = page.getByRole('dialog', { name: 'Nova Transação' });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)),
    )
    .toBe(true);
  const results = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
    [],
  );
  await page.keyboard.press('Shift+Tab');
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(newTransaction).toBeFocused();
  await newTransaction.click();
  await page.getByLabel('Valor (R$)', { exact: true }).fill('123abc');
  await page.getByLabel('Descrição', { exact: true }).fill('Teste de acessibilidade');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog.getByRole('alert')).toContainText('valor válido');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('1.234,56');
  await dialog.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('Teste de acessibilidade');
  await expect(page.getByRole('cell', { name: /1.234,56/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Teste de acessibilidade', { exact: true }).first()).toBeVisible();
  await page.getByText('Consultar valores dos gráficos em tabela').click();
  await expect(page.getByRole('table').last()).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
});

test('painel em celular e tema claro mantém nomes acessíveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Mudar para tema claro' }).first().click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
    [],
  );
  await page
    .getByRole('textbox', { name: 'Buscar transações' })
    .fill('Nenhum lançamento com este nome');
  await expect(page.getByText('Nenhuma transação encontrada', { exact: true })).toBeVisible();
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(
    emptyResults.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })),
  ).toEqual([]);
});

test('falha de armazenamento mostra erro e preserva a transação', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Excluir Salário Mensal', exact: true }).first().click();
  await page
    .getByRole('button', { name: 'Confirmar exclusão de Salário Mensal', exact: true })
    .first()
    .click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir');
  await expect(page.getByRole('cell', { name: 'Salário Mensal', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmar exclusão de Salário Mensal', exact: true }).first(),
  ).toBeEnabled();
});

test('acesso com Google tem diálogo nomeado e fecha por teclado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar com Google', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Acesso com a Conta Google' });
  await expect(dialog).toBeVisible();
  const results = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
    [],
  );
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('editar, alterar situação e excluir mantém os dados após recarregar', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Editar Salário Mensal', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Editar Lançamento' });
  await page.getByLabel('Descrição', { exact: true }).fill('Receita editada');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('777,77');
  await dialog.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('cell', { name: 'Receita editada', exact: true })).toBeVisible();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: 'Receita editada', exact: true }) });
  await row
    .getByRole('button', { name: 'Alterar situação de Receita editada', exact: true })
    .click();
  await expect(row.getByText('Pendente', { exact: true })).toBeVisible();
  await page.reload();
  await expect(row.getByText('Pendente', { exact: true })).toBeVisible();
  await expect(row.getByRole('cell', { name: /777,77/ })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir Receita editada', exact: true }).first().click();
  await page
    .getByRole('button', { name: 'Confirmar exclusão de Receita editada', exact: true })
    .first()
    .click();
  await expect(page.getByText('Receita editada', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Receita editada', { exact: true })).toHaveCount(0);
});

test('dados locais corrompidos apresentam aviso e não são sobrescritos', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('gf_local_transactions', '{"id":"incompleto"}'),
  );
  await page.goto('/');
  await page
    .getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i })
    .first()
    .click();
  await expect(page.getByRole('alert')).toContainText('conteúdo salvo foi preservado');
  await page
    .getByRole('button', { name: /Nova Transação/ })
    .first()
    .click();
  await page.getByLabel('Descrição', { exact: true }).fill('Novo lançamento');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Cadastrar Transação', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gf_local_transactions'))).toBe(
    '{"id":"incompleto"}',
  );
});

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1280]) {
    test(`demo direta acessível no tema ${theme} em ${width}px, incluindo rodapé`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('gf_app_theme', value), theme);
      await page.goto('/demo');
      await expect(page.getByRole('region', { name: 'Explore a demonstração' })).toBeVisible();
      await expect(page).toHaveTitle('Demonstração — ContandoDinheiro');
      const result = await new AxeBuilder({ page }).analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}
