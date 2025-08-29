import { PrismaClient, Role, Status } from '@prisma/client'
import { hash } from 'bcryptjs'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
        emailVerified: new Date(),
        password: await hash('admin123', 12), // Default admin password
      },
    })

    // Create regular users
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'John Developer',
        role: Role.USER,
        emailVerified: new Date(),
      },
    })

    const secondUser = await prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        name: 'Sarah Johnson',
        role: Role.USER,
        emailVerified: new Date(),
      },
    })

    const thirdUser = await prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        name: 'Mike Wilson',
        role: Role.USER,
        emailVerified: new Date(),
      },
    })

    console.log('✅ Users created')

    // Create categories for software products
    const developerToolsCategory = await prisma.category.upsert({
      where: { slug: 'developer-tools' },
      update: {},
      create: {
        name: 'Developer Tools',
        slug: 'developer-tools',
        description: 'Professional tools for software developers',
        status: Status.PUBLISHED,
        metaTitle: 'Developer Tools - Free Professional Software',
        metaDescription: 'Download free professional developer tools and IDE extensions',
      },
    })

    const productivityCategory = await prisma.category.upsert({
      where: { slug: 'productivity' },
      update: {},
      create: {
        name: 'Productivity',
        slug: 'productivity',
        description: 'Apps to boost your productivity',
        status: Status.PUBLISHED,
        metaTitle: 'Productivity Apps - Free Tools',
        metaDescription: 'Free productivity apps to organize your work and life',
      },
    })

    const utilitiesCategory = await prisma.category.upsert({
      where: { slug: 'utilities' },
      update: {},
      create: {
        name: 'Utilities',
        slug: 'utilities',
        description: 'Essential utility software',
        status: Status.PUBLISHED,
        metaTitle: 'Utility Software - Free Essential Tools',
        metaDescription: 'Download free utility software for daily tasks',
      },
    })

    const aiToolsCategory = await prisma.category.upsert({
      where: { slug: 'ai-tools' },
      update: {},
      create: {
        name: 'AI Tools',
        slug: 'ai-tools',
        description: 'AI-powered software and tools',
        parentId: developerToolsCategory.id,
        status: Status.PUBLISHED,
        metaTitle: 'AI Tools - Free AI Software',
        metaDescription: 'Free AI-powered tools and software for developers',
      },
    })

    console.log('✅ Categories created')

    // Create software products with $0 pricing
    const products = [
      {
        title: 'CodeCraft Pro - VS Code Extensions Bundle',
        slug: 'codecraft-pro-vscode-bundle',
        description: 'Complete collection of VS Code extensions for professional developers',
        content: '<h2>Features</h2><ul><li>AI-powered code completion</li><li>Advanced debugging tools</li><li>Git integration enhancements</li><li>Theme customization pack</li><li>Productivity boosters</li></ul><p>Transform your VS Code into a powerful development environment with our curated extension bundle.</p>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        comparePrice: new Decimal(0),
        stock: 9999,
        categoryId: developerToolsCategory.id,
        metaTitle: 'CodeCraft Pro - Free VS Code Extensions Bundle',
        metaDescription: 'Download the complete VS Code extensions bundle for professional developers - 100% free',
        images: [
          'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500',
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'TaskMaster Pro - Project Management Suite',
        slug: 'taskmaster-pro',
        description: 'All-in-one project management and task tracking software',
        content: '<h2>Key Features</h2><ul><li>Kanban boards</li><li>Gantt charts</li><li>Time tracking</li><li>Team collaboration</li><li>Resource management</li><li>Reporting dashboard</li></ul><p>Streamline your project workflow with TaskMaster Pro.</p>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        comparePrice: new Decimal(0),
        stock: 9999,
        categoryId: productivityCategory.id,
        metaTitle: 'TaskMaster Pro - Free Project Management Software',
        metaDescription: 'Free professional project management suite with advanced features',
        images: [
          'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'DevNotes - Smart Note-Taking for Developers',
        slug: 'devnotes-app',
        description: 'Markdown-based note-taking app with code syntax highlighting',
        content: '<h2>Features</h2><ul><li>Markdown support</li><li>Syntax highlighting for 100+ languages</li><li>Git integration</li><li>Cloud sync</li><li>Code snippet manager</li></ul>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: productivityCategory.id,
        metaTitle: 'DevNotes - Free Note-Taking App for Developers',
        metaDescription: 'Free markdown-based note-taking application with code syntax highlighting',
        images: [
          'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'API Ninja - REST API Testing Suite',
        slug: 'api-ninja',
        description: 'Comprehensive API testing and documentation tool',
        content: '<h2>Capabilities</h2><ul><li>REST/GraphQL testing</li><li>Automated testing workflows</li><li>API documentation generator</li><li>Performance monitoring</li><li>Mock server creation</li></ul>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: developerToolsCategory.id,
        metaTitle: 'API Ninja - Free API Testing Suite',
        metaDescription: 'Professional API testing and documentation tool - completely free',
        images: [
          'https://images.unsplash.com/photo-1623282033815-40b05d96c903?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'DataVault - Database Management Studio',
        slug: 'datavault-studio',
        description: 'Multi-database management and query tool',
        content: '<h2>Supported Databases</h2><ul><li>MySQL</li><li>PostgreSQL</li><li>MongoDB</li><li>Redis</li><li>SQLite</li></ul><p>Visual query builder, schema designer, and data migration tools included.</p>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: utilitiesCategory.id,
        metaTitle: 'DataVault - Free Database Management Studio',
        metaDescription: 'Free multi-database management tool with visual query builder',
        images: [
          'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'CloudSync Pro - File Synchronization Tool',
        slug: 'cloudsync-pro',
        description: 'Sync files across multiple cloud storage services',
        content: '<h2>Features</h2><ul><li>Multi-cloud support</li><li>Real-time sync</li><li>Version control</li><li>Encryption</li><li>Selective sync</li></ul>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: utilitiesCategory.id,
        metaTitle: 'CloudSync Pro - Free File Synchronization',
        metaDescription: 'Free cloud file synchronization tool with encryption',
        images: [
          'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'AI Code Assistant - Intelligent Coding Companion',
        slug: 'ai-code-assistant',
        description: 'AI-powered code completion and refactoring tool',
        content: '<h2>AI Features</h2><ul><li>Intelligent code completion</li><li>Bug detection</li><li>Code refactoring suggestions</li><li>Documentation generation</li><li>Code review assistance</li></ul>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: aiToolsCategory.id,
        metaTitle: 'AI Code Assistant - Free AI Coding Tool',
        metaDescription: 'Free AI-powered code assistant for intelligent development',
        images: [
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
      {
        title: 'SecureVault - Password Manager & 2FA',
        slug: 'securevault',
        description: 'Enterprise-grade password manager with two-factor authentication',
        content: '<h2>Security Features</h2><ul><li>AES-256 encryption</li><li>2FA/MFA support</li><li>Biometric authentication</li><li>Secure password sharing</li><li>Password generator</li></ul>',
        status: Status.PUBLISHED,
        price: new Decimal(0),
        stock: 9999,
        categoryId: utilitiesCategory.id,
        metaTitle: 'SecureVault - Free Password Manager',
        metaDescription: 'Free enterprise-grade password manager with 2FA support',
        images: [
          'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=500',
        ],
        averageRating: new Decimal(0),
        totalReviews: 0,
      },
    ]

    // Create products
    const createdProducts = []
    for (const product of products) {
      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: product,
      })
      createdProducts.push(created)
    }

    console.log('✅ Products created')

    // Create reviews for each product
    const reviews = []
    
    // Reviews for CodeCraft Pro
    reviews.push(
      {
        productId: createdProducts[0].id,
        rating: 5,
        title: 'Essential for any VS Code developer!',
        content: 'This extension bundle has everything I needed. The AI code completion alone saves me hours every week. The debugging tools are top-notch and the Git integration enhancements make version control a breeze.',
        userId: regularUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[0].id,
        rating: 4,
        title: 'Great bundle, minor issues',
        content: 'Most extensions work perfectly. Had some conflicts with my existing theme but support helped me resolve it quickly. The productivity boosters are genuinely helpful.',
        userId: secondUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[0].id,
        rating: 5,
        title: 'Transformed my coding experience',
        content: 'As a senior developer, I was skeptical about these "bundle" packages, but this one is actually well-curated. Each extension serves a purpose and they work well together.',
        guestName: 'Alex Chen',
        guestEmail: 'alex.c@techcorp.com',
      },
      {
        productId: createdProducts[0].id,
        rating: 3,
        title: 'Good but not for everyone',
        content: 'If you\'re new to VS Code, this might be overwhelming. Some extensions overlap with built-in features. Still, it\'s free so worth trying.',
        guestName: 'Maria Rodriguez',
        guestEmail: 'maria.dev@email.com',
      },
    )

    // Reviews for TaskMaster Pro
    reviews.push(
      {
        productId: createdProducts[1].id,
        rating: 5,
        title: 'Best free project management tool',
        content: 'I\'ve tried Jira, Trello, and Asana. This combines the best features of all of them. The Gantt charts are particularly impressive for a free tool.',
        userId: thirdUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[1].id,
        rating: 4,
        title: 'Solid PM tool for small teams',
        content: 'Perfect for our startup. The resource management features help us stay on budget. Only missing some advanced reporting features.',
        guestName: 'David Kim',
        guestEmail: 'dkim@startup.io',
      },
      {
        productId: createdProducts[1].id,
        rating: 5,
        title: 'Surprisingly feature-rich',
        content: 'Can\'t believe this is free! The time tracking integration with the Kanban boards is seamless. Reporting dashboard gives great insights.',
        userId: adminUser.id,
        isVerified: true,
      },
    )

    // Reviews for DevNotes
    reviews.push(
      {
        productId: createdProducts[2].id,
        rating: 4,
        title: 'Perfect for technical documentation',
        content: 'The syntax highlighting for code snippets is excellent. Git integration means I can version control my notes. Cloud sync works flawlessly.',
        userId: regularUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[2].id,
        rating: 5,
        title: 'Finally, a developer-focused note app',
        content: 'Been looking for something like this for years. Markdown support is robust and the code snippet manager is a game-changer.',
        guestName: 'Tom Anderson',
        guestEmail: 'tanderson@dev.com',
      },
      {
        productId: createdProducts[2].id,
        rating: 3,
        title: 'Good but needs mobile app',
        content: 'Desktop app is great but I really need a mobile companion app. The web version works on mobile but isn\'t optimized.',
        guestName: 'Lisa Chang',
        guestEmail: 'lchang@gmail.com',
      },
    )

    // Reviews for API Ninja
    reviews.push(
      {
        productId: createdProducts[3].id,
        rating: 5,
        title: 'Postman killer',
        content: 'More features than Postman and it\'s free! The automated testing workflows save so much time. Mock server creation is intuitive.',
        userId: secondUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[3].id,
        rating: 4,
        title: 'Excellent for API development',
        content: 'The documentation generator alone is worth it. Creates beautiful, interactive API docs. GraphQL support is comprehensive.',
        guestName: 'Robert James',
        guestEmail: 'rj@apidev.net',
      },
      {
        productId: createdProducts[3].id,
        rating: 5,
        title: 'Performance monitoring is outstanding',
        content: 'The performance monitoring features helped us identify bottlenecks we didn\'t know existed. Response time graphs are very detailed.',
        userId: thirdUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[3].id,
        rating: 4,
        title: 'Great tool, slight learning curve',
        content: 'Powerful features but takes time to learn everything. The UI could be more intuitive. Still, it\'s become essential to our workflow.',
        guestName: 'Jennifer Wu',
        guestEmail: 'jwu@techstartup.com',
      },
    )

    // Reviews for DataVault
    reviews.push(
      {
        productId: createdProducts[4].id,
        rating: 5,
        title: 'Manages all our databases perfectly',
        content: 'We use MySQL, PostgreSQL, and MongoDB. This tool handles all three beautifully. The visual query builder is a lifesaver for complex queries.',
        userId: adminUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[4].id,
        rating: 4,
        title: 'Great for database migrations',
        content: 'The migration tools are robust and reliable. Schema designer helps visualize database structure. Would like more Redis features.',
        guestName: 'Carlos Mendez',
        guestEmail: 'cmendez@dataops.com',
      },
      {
        productId: createdProducts[4].id,
        rating: 3,
        title: 'Good but resource heavy',
        content: 'Feature-rich but uses a lot of system resources when connected to multiple databases. Works well for smaller datasets.',
        userId: regularUser.id,
        isVerified: true,
      },
    )

    // Reviews for CloudSync Pro
    reviews.push(
      {
        productId: createdProducts[5].id,
        rating: 4,
        title: 'Reliable multi-cloud sync',
        content: 'Syncs between Dropbox, Google Drive, and OneDrive seamlessly. Encryption gives peace of mind. Selective sync saves bandwidth.',
        guestName: 'Patricia Lee',
        guestEmail: 'plee@cloudsolutions.net',
      },
      {
        productId: createdProducts[5].id,
        rating: 5,
        title: 'Version control is excellent',
        content: 'The version control feature has saved me multiple times. Can easily restore previous versions. Real-time sync is truly real-time.',
        userId: secondUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[5].id,
        rating: 4,
        title: 'Great for team collaboration',
        content: 'We use this to keep our team files in sync across different cloud services. Works well, though initial setup took some time.',
        guestName: 'Michael Brown',
        guestEmail: 'mbrown@enterprise.com',
      },
    )

    // Reviews for AI Code Assistant
    reviews.push(
      {
        productId: createdProducts[6].id,
        rating: 5,
        title: 'The future of coding',
        content: 'The AI suggestions are eerily accurate. It\'s like having a senior developer looking over your shoulder. Bug detection has caught issues before they hit production.',
        userId: thirdUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[6].id,
        rating: 5,
        title: 'Incredible refactoring suggestions',
        content: 'Suggested refactoring that improved our codebase performance by 30%. The documentation generation is also top-notch.',
        guestName: 'Kevin Zhang',
        guestEmail: 'kzhang@aitech.com',
      },
      {
        productId: createdProducts[6].id,
        rating: 4,
        title: 'Impressive but needs fine-tuning',
        content: 'Sometimes suggests overly complex solutions for simple problems. Still, it\'s improved my productivity significantly.',
        userId: regularUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[6].id,
        rating: 5,
        title: 'Code review game-changer',
        content: 'The code review assistance catches things human reviewers often miss. Has definitely improved our code quality.',
        guestName: 'Rachel Green',
        guestEmail: 'rgreen@techcorp.io',
      },
      {
        productId: createdProducts[6].id,
        rating: 3,
        title: 'Good for some languages, not all',
        content: 'Works great with JavaScript and Python. Less impressive with Go and Rust. Still evolving but shows promise.',
        guestName: 'Steve Miller',
        guestEmail: 'smiller@dev.net',
      },
    )

    // Reviews for SecureVault
    reviews.push(
      {
        productId: createdProducts[7].id,
        rating: 5,
        title: 'Enterprise-grade security for free',
        content: 'AES-256 encryption, biometric auth, and 2FA - this has everything. Password sharing feature is perfect for team credentials.',
        userId: adminUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[7].id,
        rating: 4,
        title: 'Finally ditched my paid password manager',
        content: 'Was paying $5/month for fewer features. The password generator creates strong, memorable passwords. Browser extension works smoothly.',
        guestName: 'Emma Wilson',
        guestEmail: 'ewilson@secure.com',
      },
      {
        productId: createdProducts[7].id,
        rating: 5,
        title: 'Best free password manager available',
        content: 'The biometric authentication on mobile is flawless. Secure sharing has made team password management so much easier.',
        userId: secondUser.id,
        isVerified: true,
      },
      {
        productId: createdProducts[7].id,
        rating: 4,
        title: 'Solid security, minor UI issues',
        content: 'Security features are top-notch but the UI could use some polish. Still, for a free tool, it\'s exceptional.',
        guestName: 'James Taylor',
        guestEmail: 'jtaylor@business.org',
      },
    )

    // Create all reviews
    for (const review of reviews) {
      await prisma.review.create({
        data: review,
      })
    }

    console.log('✅ Reviews created')

    // Update product ratings based on reviews
    for (const product of createdProducts) {
      const productReviews = await prisma.review.findMany({
        where: { productId: product.id },
      })

      if (productReviews.length > 0) {
        const avgRating = productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            averageRating: new Decimal(avgRating.toFixed(2)),
            totalReviews: productReviews.length,
          },
        })
      }
    }

    console.log('✅ Product ratings updated')

    // Create tags
    const techTag = await prisma.tag.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest technology trends and news',
      },
    })

    const reviewTag = await prisma.tag.upsert({
      where: { slug: 'reviews' },
      update: {},
      create: {
        name: 'Reviews',
        slug: 'reviews',
        description: 'Product reviews and comparisons',
      },
    })

    console.log('✅ Tags created')

    // Create posts
    const posts = [
      {
        title: 'The Future of Smartphone Technology',
        slug: 'future-smartphone-technology',
        excerpt: 'Explore the latest trends in smartphone innovation and what to expect in the coming years.',
        content: '<h2>Revolutionary Changes Ahead</h2><p>The smartphone industry continues to evolve with groundbreaking features...</p>',
        status: Status.PUBLISHED,
        featured: true,
        authorId: adminUser.id,
        publishedAt: new Date(),
        metaTitle: 'The Future of Smartphone Technology - Tech Insights',
        metaDescription: 'Discover the latest smartphone technology trends and innovations shaping the future',
        featuredImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
      },
      {
        title: 'iPhone 15 Pro vs Samsung Galaxy S24 Comparison',
        slug: 'iphone-15-pro-vs-galaxy-s24',
        excerpt: 'A detailed comparison of two flagship smartphones to help you make the right choice.',
        content: '<h2>Performance Comparison</h2><p>Both devices offer exceptional performance, but each has its unique advantages...</p>',
        status: Status.PUBLISHED,
        featured: false,
        authorId: adminUser.id,
        publishedAt: new Date(),
        metaTitle: 'iPhone 15 Pro vs Galaxy S24 - Detailed Comparison',
        metaDescription: 'Compare iPhone 15 Pro and Samsung Galaxy S24 features, performance, and value',
        featuredImage: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800',
      },
    ]

    for (const post of posts) {
      const createdPost = await prisma.post.upsert({
        where: { slug: post.slug },
        update: {},
        create: post,
      })

      // Add tags to posts
      if (post.slug.includes('smartphone') || post.slug.includes('iphone')) {
        await prisma.postTag.upsert({
          where: {
            postId_tagId: {
              postId: createdPost.id,
              tagId: techTag.id,
            },
          },
          update: {},
          create: {
            postId: createdPost.id,
            tagId: techTag.id,
          },
        })
      }

      if (post.slug.includes('vs') || post.slug.includes('comparison')) {
        await prisma.postTag.upsert({
          where: {
            postId_tagId: {
              postId: createdPost.id,
              tagId: reviewTag.id,
            },
          },
          update: {},
          create: {
            postId: createdPost.id,
            tagId: reviewTag.id,
          },
        })
      }
    }

    console.log('✅ Posts and tags created')

    // Create sample downloads
    const downloadData = []
    const users = [regularUser, secondUser, thirdUser]
    
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const daysAgo = Math.floor(Math.random() * 30)
      const downloadDate = new Date()
      downloadDate.setDate(downloadDate.getDate() - daysAgo)
      
      downloadData.push({
        userId: randomUser.id,
        productId: randomProduct.id,
        downloadIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: downloadDate
      })
    }

    await prisma.download.createMany({
      data: downloadData,
      skipDuplicates: true
    })

    console.log('✅ Sample downloads created')

    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

