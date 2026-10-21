import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('parcelamento: criação, persistência, edição isolada, próximas e cancelamento', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00-03:00'));
  await page.goto('/');
  await page.getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await page.getByRole('button', { name: /Nova Transação/ }).first().click();
  await page.getByLabel('Repetição', { exact: true }).selectOption('installments');
  await page.getByLabel('Descrição', { exact: true }).fill('Compra parcelada teste');
  await page.getByLabel('Valor total da compra (R$)', { exact: true }).fill('100,00');
  await page.getByLabel('Número de parcelas').fill('3');
  await page.getByLabel('Data', { exact: true }).fill('2026-10-31');
  await page.getByRole('button', { name: 'Cadastrar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('gf_local_transactions')!));
  const rows = (await state()).transactions.filter((t: { descricao: string }) => t.descricao === 'Compra parcelada teste');
  expect(rows.map((t: { valor: number }) => t.valor)).toEqual([33.34, 33.33, 33.33]);
  expect(rows.map((t: { status: string }) => t.status)).toEqual(['pendente','pendente','pendente']);
  await page.getByLabel('Ano dos lançamentos').selectOption('2026');
  await page.getByLabel('Mês dos lançamentos').selectOption('9');
  await page.getByRole('textbox', { name: 'Buscar transações' }).fill('Compra parcelada teste');
  await expect(page.getByText('(1 de 3)').first()).toBeVisible();
  await page.getByRole('button', { name: 'Editar Compra parcelada teste', exact: true }).first().click();
  await page.getByLabel('Valor (R$)', { exact: true }).fill('40');
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  let saved = (await state()).transactions.filter((t: { serie_id: string }) => t.serie_id === rows[0].serie_id);
  expect(saved.map((t: { valor: number }) => t.valor)).toEqual([40,33.33,33.33]);
  await page.getByRole('button', { name: 'Alterar situação de Compra parcelada teste', exact: true }).first().click();
  await expect.poll(async () => (await state()).transactions.find((t: {id:string})=>t.id===rows[0].id).status).toBe('pago');
  await page.getByRole('button', { name: 'Editar Compra parcelada teste', exact: true }).first().click();
  await page.getByLabel('Aplicar alteração').selectOption('following');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('50');
  const axe = await new AxeBuilder({page}).include('dialog').analyze();
  expect(axe.violations.map(v=>v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  saved = (await state()).transactions.filter((t: { serie_id: string }) => t.serie_id === rows[0].serie_id);
  expect(saved.map((t: { valor: number }) => t.valor)).toEqual([40,50,50]);
  await page.getByRole('button', { name: 'Editar Compra parcelada teste', exact: true }).first().click();
  await page.getByLabel('Aplicar alteração').selectOption('following');
  await page.getByLabel('Cancelar este e os próximos pendentes').check();
  await page.getByRole('button', { name: 'Atualizar Transação' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  saved = (await state()).transactions.filter((t: { serie_id: string }) => t.serie_id === rows[0].serie_id);
  expect(saved).toHaveLength(1);
  expect(saved[0].status).toBe('pago');
  await page.reload();
  await expect.poll(async () => (await state()).transactions.filter((t: { serie_id: string }) => t.serie_id === rows[0].serie_id).length).toBe(1);
  expect(errors).toEqual([]);
});

test('mensal com término e sem término mantém datas e não duplica ao recarregar',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-20T12:00:00-03:00'));
 await page.goto('/');
 await page.getByRole('link',{name:/Explorar.*(?:Demonstração|sem login)/i}).first().click();
 for(const end of ['2027-01-31','']) {
  await page.getByRole('button',{name:/Nova Transação/}).first().click();
  await page.getByLabel('Repetição',{exact:true}).selectOption('monthly');
  await page.getByLabel('Descrição',{exact:true}).fill(end ? 'Internet finita':'Aluguel contínuo');
  await page.getByLabel('Valor (R$)',{exact:true}).fill('200');
  await page.getByLabel('Data',{exact:true}).fill('2026-10-31');
  if(end) await page.getByLabel('Repetir até (opcional)').fill(end);
  await page.getByRole('button',{name:'Cadastrar Transação'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
 }
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
 const before=await snapshot();
 const finite=before.transactions.filter((t:{descricao:string})=>t.descricao==='Internet finita');
 expect(finite.map((t:{data:string})=>t.data)).toEqual(['2026-10-31','2026-11-30','2026-12-31','2027-01-31']);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Lançamentos & Extrato',exact:false})).toBeVisible();
 expect((await snapshot()).transactions.length).toBe(before.transactions.length);
 await page.screenshot({path:'test-results/recorrencias.png',fullPage:true});
});


test('formulário mensal em celular permite concluir sem transbordamento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: /Explorar.*(?:Demonstração|sem login)/i }).first().click();
  await page.getByRole('button', { name: /Nova Transação/ }).first().click();
  await page.getByLabel('Repetição', { exact: true }).selectOption('monthly');
  await page.getByLabel('Descrição', { exact: true }).fill('Recorrência no celular');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('90');
  const dialog=page.getByRole('dialog');
  const axe=await new AxeBuilder({page}).include('dialog').analyze();
  expect(axe.violations.map(v=>v.id)).toEqual([]);
  await expect(page.getByLabel('Repetir até (opcional)')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await dialog.screenshot({path:'test-results/recorrencia-formulario-mobile.png'});
  await page.getByRole('button', { name:'Cadastrar Transação' }).click();
  await expect(dialog).toHaveCount(0);
});
