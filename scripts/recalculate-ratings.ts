import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recalculateAllRatings() {
  console.log('🔄 Starting to recalculate all product ratings...')
  
  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true }
    })

    console.log(`📊 Found ${products.length} products to process`)

    for (const product of products) {
      console.log(`🔄 Processing: ${product.title}`)
      
      // Get visible and verified reviews for this product
      const visibleReviews = await prisma.review.findMany({
        where: {
          productId: product.id,
          isVerified: true,
          isVisible: true,
          deletedAt: null
        },
        select: {
          rating: true
        }
      })

      const totalReviews = visibleReviews.length
      const averageRating = totalReviews > 0 
        ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0

      // Update product with new stats
      await prisma.product.update({
        where: { id: product.id },
        data: {
          averageRating: averageRating,
          totalReviews: totalReviews
        }
      })

      console.log(`✅ Updated ${product.title}: ${averageRating.toFixed(1)} stars (${totalReviews} reviews)`)
    }

    console.log('🎉 All product ratings have been recalculated successfully!')
    
  } catch (error) {
    console.error('❌ Error recalculating ratings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
recalculateAllRatings()