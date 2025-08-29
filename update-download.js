const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateDownloadInfo() {
  try {
    // Tìm product đầu tiên
    const product = await prisma.product.findFirst({
      where: {
        status: 'PUBLISHED',
        deletedAt: null
      }
    })

    if (!product) {
      console.log('Không tìm thấy product nào')
      return
    }

    console.log('Đang cập nhật product:', product.title)

    // Cập nhật thông tin download
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        downloadUrl: 'https://example.com/downloads/mod-skin.zip',
        filename: 'mod-skin.zip',
        fileSize: '2.5MB',
        version: '1.0.0',
        externalUrl: 'https://example.com/external-link'
      }
    })

    console.log('Đã cập nhật thành công!')
    console.log('Product ID:', updated.id)
    console.log('Download URL:', updated.downloadUrl)
    console.log('External URL:', updated.externalUrl)

  } catch (error) {
    console.error('Lỗi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDownloadInfo()
