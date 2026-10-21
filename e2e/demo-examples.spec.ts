import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390,1280]) {
 test(`demonstração apresenta exemplos funcionais e próximos meses em ${width}px`, async({page})=>{
  await page.clock.setFixedTime(new Date('2026-12-20T12:00:00-03:00'));
  await page.setViewportSize({width,height:900});
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:/Explorar.*(?:Demonstração|sem login)/i}).first().click();
  const guide=page.getByRole('region',{name:'Explore a demonstração'});
  await expect(guide).toBeVisible();
  const results=await new AxeBuilder({page}).include('main').analyze();
  expect(results.violations.map(v=>v.id)).toEqual([]);
  await guide.screenshot({path:`test-results/demo-exemplos-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Ver parcelas do notebook',exact:true}).click();
  await expect(page.getByText('(3 de 10)').filter({ visible: true }).first()).toBeVisible();
  await page.getByRole('button',{name:'Editar Notebook para trabalho',exact:true}).first().click();
  await expect(page.getByLabel('Aplicar alteração')).toHaveValue('one');
  await page.getByLabel('Aplicar alteração').selectOption('following');
  await page.getByLabel('Valor (R$)',{exact:true}).fill('400');
  await page.getByRole('button',{name:'Atualizar Transação'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Explorar próximo mês',exact:true}).click();
  await expect(page.getByLabel('Mês dos lançamentos')).toHaveValue('0');
  await expect(page.getByLabel('Ano dos lançamentos')).toHaveValue('2027');
  await expect(page.getByText('(4 de 10)').filter({ visible: true }).first()).toBeVisible();
  const section=page.locator('#transactions-section');
  await expect(section.getByRole('button',{name:'Editar Aulas particulares',exact:true}).first()).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
  const next=state.transactions.filter((t:{data:string})=>t.data.startsWith('2027-01'));
  expect(next.length).toBeGreaterThanOrEqual(5);
  expect(next.every((t:{status:string})=>t.status==='pendente')).toBe(true);
  expect(next.find((t:{descricao:string})=>t.descricao==='Notebook para trabalho').valor).toBe(400);
  expect(state.transactions.find((t:{id:string})=>t.id==='demo-series-notebook-1').valor).toBe(349.99);
  await page.reload();
  await expect(page.getByRole('region',{name:'Explore a demonstração'})).toBeVisible();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
  expect(after.transactions.length).toBe(state.transactions.length);
  expect(errors).toEqual([]);
 });
}

test('demonstração existente recebe novos exemplos uma vez sem perder edições ou recriar excluídos',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-20T12:00:00-03:00'));
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('gf_local_transactions',JSON.stringify([
  {id:'demo-1',user_id:'demo-user-id',descricao:'Meu salário editado',valor:7000,tipo:'receita',data:'2026-10-05',forma_pagamento:'Pix',status:'pago',categoria:'Salário'}
 ])));
 await page.reload();
 await page.getByRole('button',{name:/Explorar.*(?:Demonstração|sem login)/i}).first().click();
 await expect(page.getByRole('region',{name:'Explore a demonstração'})).toBeVisible();
 let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
 expect(state.examplesVersion).toBe(2);
 expect(state.transactions.find((t:{id:string})=>t.id==='demo-1').valor).toBe(7000);
 expect(state.series).toHaveLength(5);
 await page.getByRole('button',{name:'Ver conta mensal'}).click();
 await page.getByRole('button',{name:'Excluir Internet residencial',exact:true}).first().click();
 await page.getByRole('button',{name:'Confirmar exclusão de Internet residencial',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Editar Internet residencial',exact:true})).toHaveCount(0);
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
 await page.reload();
 await expect(page.getByRole('region',{name:'Explore a demonstração'})).toBeVisible();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('gf_local_transactions')!));
 expect(after.transactions.length).toBe(state.transactions.length);
 expect(after.transactions.find((t:{id:string})=>t.id==='demo-1').descricao).toBe('Meu salário editado');
 expect(after.transactions.some((t:{id:string})=>t.id==='demo-series-internet-1')).toBe(false);
});
