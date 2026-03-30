import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const providerId = 'cmncfzti7000kpq01q9z6gvnw'
  const provider = await db.provider.findUnique({
    where: { id: providerId }
  })
  
  if (!provider) {
    console.log('Provider not found')
    return
  }
  
  const existing = await db.user.findUnique({
    where: { email: 'didimdsj@gmail.com' }
  })
  
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { linkedProviderId: providerId, role: 'PROVIDER', status: 'ACTIVE', officeId: provider.officeId }
    })
    console.log('User updated!')
  } else {
    await db.user.create({
      data: {
        officeId: provider.officeId,
        name: 'Diego (Ascensores)',
        email: 'didimdsj@gmail.com',
        passwordHash: '$2b$10$Epuv/.mQo.6c/0jZpZ0iCOyq8PqV4vS/I7X2y.Z/.Z4l', // dummy
        role: 'PROVIDER',
        status: 'ACTIVE',
        linkedProviderId: provider.id,
      }
    })
    console.log('User created!')
  }
}

main().finally(() => db.$disconnect())
