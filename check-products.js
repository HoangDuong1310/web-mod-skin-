const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        downloadUrl: true,
        filename: true,
        fileSize: true,
        externalUrl: true
      }
    })

    console.log('=== PRODUCTS WITH DOWNLOAD INFO ===')
    products.forEach(product => {
      console.log(`\nProduct: ${product.title}`)
      console.log(`ID: ${product.id}`)
      console.log(`Download URL: ${product.downloadUrl || 'NULL'}`)
      console.log(`Filename: ${product.filename || 'NULL'}`)
      console.log(`File Size: ${product.fileSize || 'NULL'}`)
      console.log(`External URL: ${product.externalUrl || 'NULL'}`)
      console.log(`Has Download: ${!!(product.downloadUrl || product.externalUrl)}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()
