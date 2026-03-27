import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function loginAsPortalUser(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill('Demo1234!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/portal$/)
}

function portalNavLink(page: Page, label: string) {
  return page.getByRole('link', { name: label, exact: true })
}

test('owner sees a real dashboard, only own receipts and can create an incident without seeing foreign data', async ({
  page,
}) => {
  await loginAsPortalUser(page, 'propietario@comunet.test')

  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tus comunidades' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Incidencias activas de tus unidades' })).toBeVisible()

  await portalNavLink(page, 'Recibos').click()
  await expect(page).toHaveURL(/\/portal\/receipts/)
  await expect(page.getByText('REC-2026-000003')).toBeVisible()
  await expect(page.getByText('REC-2026-000004')).toBeVisible()
  await expect(page.getByText('REC-2026-000001')).toHaveCount(0)
  await expect(page.getByText('REC-2026-000002')).toHaveCount(0)

  await page
    .locator('tr')
    .filter({ hasText: 'REC-2026-000003' })
    .getByRole('link', { name: 'Ver detalle' })
    .click()

  await expect(page).toHaveURL(/\/portal\/receipts\/.+/)
  await expect(page.getByRole('heading', { name: 'REC-2026-000003' })).toBeVisible()
  await expect(page.getByText('Residencial Retiro', { exact: true })).toBeVisible()

  await portalNavLink(page, 'Incidencias').click()
  await expect(page).toHaveURL(/\/portal\/incidents/)
  await expect(page.getByText('Puerta del trastero no cierra')).toBeVisible()
  await expect(page.getByText('Humedad en garaje plaza 14')).toHaveCount(0)
  await expect(page.getByText('Fuga en bajante del portal A')).toHaveCount(0)

  const createSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Alta de incidencia' }),
  })
  const uniqueTitle = `Incidencia portal owner e2e ${Date.now()}`

  await createSection.getByLabel('Comunidad', { exact: true }).selectOption({ label: 'Edificio Los Pinos' })
  await createSection.getByLabel('Unidad', { exact: true }).selectOption({ label: 'Edificio Los Pinos · 3A' })
  await createSection.getByLabel('Título').fill(uniqueTitle)
  await createSection.getByLabel('Descripción').fill('Alta desde Playwright para validar el slice 2.4.')
  await createSection.getByRole('button', { name: 'Crear incidencia' }).click()

  await expect(page).toHaveURL(/\/portal\/incidents\/.+created=1/)
  await expect(page.getByRole('heading', { name: uniqueTitle })).toBeVisible()
  await expect(
    page.getByText('La incidencia se ha creado correctamente en el portal.'),
  ).toBeVisible()
})

test('president sees the aggregate community layer and never sees INTERNAL comments', async ({ page }) => {
  await loginAsPortalUser(page, 'presidenta@comunet.test')

  await expect(page.getByRole('heading', { name: 'Capa de presidencia' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resumen agregado de presidencia' })).toBeVisible()
  await expect(page.getByText('Comunidades con cargo activo')).toBeVisible()

  await portalNavLink(page, 'Incidencias').click()
  await expect(page).toHaveURL(/\/portal\/incidents/)
  await expect(page.getByText('Humedad en garaje plaza 14')).toBeVisible()
  await expect(page.getByText('Fuga en bajante del portal A')).toBeVisible()
  await expect(page.getByText('Avería puntual en ascensor')).toHaveCount(0)

  await page.getByRole('link', { name: 'Humedad en garaje plaza 14' }).click()
  await expect(page).toHaveURL(/\/portal\/incidents\/.+/)
  await expect(page.getByText('Se comparte seguimiento con proveedor y presidencia.')).toBeVisible()
  await expect(
    page.getByText('Proveedor avisado. Pendiente de visita mañana a primera hora.'),
  ).toHaveCount(0)
})
