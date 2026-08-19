import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const shots = 'qa-screenshots'
const navLabels = ['Me ajude a escolher', 'Reservatórios', 'Por produto', 'Por sistema', 'Projeto / Obra', 'Banco técnico']

function navButton(page: Parameters<typeof test>[0] extends never ? never : any, label: string) {
  return page.locator('nav.appNav').getByRole('button', { name: label, exact: false })
}

test.beforeAll(() => { fs.mkdirSync(shots, { recursive: true }) })

test('carrega a V9 e navega por todos os módulos', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Calculadora Técnica V9.0' })).toBeVisible()
  for (const label of navLabels) {
    await navButton(page, label).click()
  }
  await page.screenshot({ path: `${shots}/catalogo-${testInfo.project.name}.png`, fullPage: true })
})

test('reservatório padrão gera materiais e entra no projeto', async ({ page }, testInfo) => {
  await page.goto('/')
  await navButton(page, 'Reservatórios').click()
  await page.getByRole('button', { name: 'Calcular materiais' }).click()
  await expect(page.getByText('RESULTADO V9')).toBeVisible()
  await expect(page.getByText('24.000 L')).toBeVisible()
  await page.screenshot({ path: `${shots}/reservatorio-${testInfo.project.name}.png`, fullPage: true })

  await page.getByRole('button', { name: 'Adicionar ao Projeto/Obra' }).click()
  await navButton(page, 'Projeto / Obra').click()
  await expect(page.getByText('Cálculos da obra')).toBeVisible()
  await expect(page.getByText(/Reservatório/).first()).toBeVisible()
  await page.screenshot({ path: `${shots}/projeto-${testInfo.project.name}.png`, fullPage: true })
})

test('não apresenta overflow horizontal nas telas principais', async ({ page }) => {
  await page.goto('/')
  for (const label of navLabels) {
    await navButton(page, label).click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `overflow horizontal em ${label}`).toBeLessThanOrEqual(2)
  }
})
