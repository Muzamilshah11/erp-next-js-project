import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding default tax rates...')

  const defaultTaxes = [
    { name: 'Standard Sales Tax (16%)', rate: 16, isDefault: true, applicableTo: 'both', status: 'active' },
    { name: 'Zero Rated (0%)', rate: 0, isDefault: false, applicableTo: 'both', status: 'active' },
    { name: 'Sales Tax (5%)', rate: 5, isDefault: false, applicableTo: 'sales', status: 'active' },
    { name: 'Withholding Tax (10%)', rate: 10, isDefault: false, applicableTo: 'purchase', status: 'active' },
  ]

  for (const tax of defaultTaxes) {
    const existing = await prisma.taxRate.findFirst({ where: { name: tax.name } })
    if (!existing) {
      await prisma.taxRate.create({ data: tax })
      console.log(`  Created tax rate: ${tax.name}`)
    }
  }

  console.log('Seeding default system settings...')

  const defaultSettings = [
    { key: 'company_name', value: 'ERP Pro', group: 'company', type: 'string' },
    { key: 'company_address', value: '', group: 'company', type: 'string' },
    { key: 'company_phone', value: '', group: 'company', type: 'string' },
    { key: 'company_email', value: '', group: 'company', type: 'string' },
    { key: 'default_currency', value: 'PKR', group: 'general', type: 'string' },
    { key: 'date_format', value: 'DD/MM/YYYY', group: 'display', type: 'string' },
    { key: 'timezone', value: 'Asia/Karachi', group: 'display', type: 'string' },
    { key: 'items_per_page', value: '25', group: 'display', type: 'number' },
    { key: 'theme', value: 'dark', group: 'display', type: 'string' },
  ]

  for (const setting of defaultSettings) {
    const existing = await prisma.systemSetting.findUnique({ where: { key: setting.key } })
    if (!existing) {
      await prisma.systemSetting.create({ data: setting })
      console.log(`  Created setting: ${setting.key} = ${setting.value}`)
    }
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
