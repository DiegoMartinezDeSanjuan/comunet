import { expect, test } from '@playwright/test'

test('office admin can create, assign, comment and trace an incident end to end', async ({ page }) => {
  const uniqueId = Date.now()
  const title = `Smoke incidencia ${uniqueId}`
  const comment = `Comentario smoke ${uniqueId}`

  await page.goto('/login')

  await page.getByTestId('login-email').fill('admin@fincasmartinez.es')
  await page.getByTestId('login-password').fill('Demo1234!')
  await page.getByTestId('login-submit').click()

  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto('/incidents')

  await page.getByTestId('incident-create-title').fill(title)
  await page.getByTestId('incident-create-description').fill(
    'Incidencia creada por el smoke test para validar el flujo operativo.',
  )
  await page.getByTestId('incident-create-community').selectOption({ index: 1 })
  await page.getByTestId('incident-create-unit').selectOption({ label: '1A' })
  await page.getByTestId('incident-create-priority').selectOption('HIGH')
  await page.getByTestId('incident-create-submit').click()

  await expect(page).toHaveURL(/\/incidents\/.+/)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page
    .getByTestId('incident-provider-select')
    .selectOption({ label: 'Fontanería Rápida 24h · Fontanería' })
  await page.getByTestId('incident-assign-provider-submit').click()

  await expect(page.getByTestId('incident-timeline')).toContainText('Proveedor asignado')

  await page.getByTestId('incident-status-select').selectOption('IN_PROGRESS')
  await page.getByTestId('incident-status-submit').click()

  await expect(page.getByTestId('incident-timeline')).toContainText(
    'Cambio de estado: ASSIGNED -> IN_PROGRESS',
  )

  await page.getByTestId('incident-comment-body').fill(comment)
  await page.getByTestId('incident-comment-visibility').selectOption('SHARED')
  await page.getByTestId('incident-comment-submit').click()

  await expect(page.getByTestId('incident-timeline')).toContainText(comment)
  await expect(page.getByTestId('incident-timeline')).toContainText('Comentario SHARED')
})
