import { PrismaClient, Status } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed script for V2 Mod Skin Tutorial Blog Posts
 * Creates comprehensive tutorial/guide posts about using V2 mod skin
 * 
 * Features:
 * - Step-by-step installation guides
 * - Troubleshooting sections
 * - Tips and best practices
 * - Visual content placeholders
 * 
 * Usage: npx tsx scripts/seed-mod-skin-v2-tutorial.ts
 */
async function seedModSkinV2Tutorial() {
  console.log('Starting V2 Mod Skin Tutorial seeding...')
  console.log('============================================================')

  try {
    // Step 0: Delete existing tutorial posts
    console.log('\nStep 0: Deleting existing tutorial posts...')
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        slug: {
          in: [
            'mod-skin-v2-huong-dan-chi-tiet',
            'mod-skin-v2-cai-dat',
            'mod-skin-v2-tinh-nang-moi',
            'mod-skin-v2-xu-ly-loi',
            'mod-skin-v2-faq',
            'mod-skin-v2-meo-thu-thuat'
          ]
        }
      }
    })
    console.log(`   Deleted ${deletedPosts.count} existing posts`)

    // Delete old tags related to tutorials
    const deletedTags = await prisma.tag.deleteMany({
      where: {
        slug: {
          in: [
            'huong-dan',
            'mod-skin-v2',
            'league-of-legends',
            'cai-dat',
            'tinh-nang-moi',
            'xu-ly-loi',
            'meo-hay',
            'faq'
          ]
        }
      }
    })
    console.log(`   Deleted ${deletedTags.count} existing tags`)

    // Step 1: Create tags for the tutorial
    console.log('\nStep 1: Creating tutorial tags...')
    const tags = await createTags()
    console.log(`   Created ${tags.length} tags`)

    // Step 2: Get admin user for author
    console.log('\nStep 2: Getting admin user...')
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      throw new Error('Admin user not found. Please run the main seed first.')
    }
    console.log(`   Using author: ${adminUser.name}`)

    // Step 3: Create blog posts (tutorials)
    console.log('\nStep 3: Creating tutorial blog posts...')
    const posts = await createTutorialPosts(adminUser.id, tags)
    console.log(`   Created ${posts.length} tutorial posts`)

    // Step 4: Link tags to posts
    console.log('\nStep 4: Linking tags to posts...')
    await linkTagsToPosts(posts, tags)
    console.log('   Tags linked successfully')

    console.log('\n============================================================')
    console.log('V2 Mod Skin Tutorial seeding completed!')
    console.log('\nSummary:')
    console.log(`   - ${tags.length} tags created`)
    console.log(`   - ${posts.length} tutorial posts created`)
    console.log('\nNext steps:')
    console.log('   - View tutorials at: /blog/mod-skin-v2-huong-dan-chi-tiet')
    console.log('   - Check API posts at: /api/posts')
    console.log('   - Edit content in admin dashboard')

  } catch (error) {
    console.error('Tutorial seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Create tags for the tutorials
 */
async function createTags() {
  const tagData = [
    {
      name: 'Hướng Dẫn',
      slug: 'huong-dan',
      description: 'Bài viết hướng dẫn chi tiết từng bước'
    },
    {
      name: 'Mod Skin V2',
      slug: 'mod-skin-v2',
      description: 'Tất cả về mod skin phiên bản 2'
    },
    {
      name: 'League of Legends',
      slug: 'league-of-legends',
      description: 'Game League of Legends và cộng đồng'
    },
    {
      name: 'Cài Đặt',
      slug: 'cai-dat',
      description: 'Hướng dẫn cài đặt phần mềm'
    },
    {
      name: 'Tính Năng Mới',
      slug: 'tinh-nang-moi',
      description: 'Các tính năng mới và cập nhật'
    },
    {
      name: 'Xử Lý Lỗi',
      slug: 'xu-ly-loi',
      description: 'Giải pháp các lỗi thường gặp'
    },
    {
      name: 'Mẹo Hay',
      slug: 'meo-hay',
      description: 'Mẹo và thủ thuật sử dụng'
    },
    {
      name: 'FAQ',
      slug: 'faq',
      description: 'Câu hỏi thường gặp'
    }
  ]

  const createdTags = []
  for (const tag of tagData) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag
    })
    createdTags.push(created)
  }

  return createdTags
}

/**
 * Create comprehensive tutorial blog posts
 */
async function createTutorialPosts(authorId: string, tags: any[]) {
  const posts = []

  // Main tutorial post
  const mainTutorial = {
    title: 'Hướng Dẫn Sử Dụng Mod Skin V2 Chi Tiết Từ A-Z',
    slug: 'mod-skin-v2-huong-dan-chi-tiet',
    excerpt: 'Hướng dẫn toàn diện cách cài đặt và sử dụng Mod Skin V2 cho League of Legends. Từ cơ bản đến nâng cao, dành cho cả người mới và người đã có kinh nghiệm.',
    content: generateMainTutorialContent(),
    status: Status.PUBLISHED,
    featured: true,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'Hướng Dẫn Mod Skin V2 - Cài Đặt & Sử Dụng Chi Tiết',
    metaDescription: 'Hướng dẫn toàn bộ cách cài đặt và sử dụng Mod Skin V2 cho League of Legends. Bao gồm video hướng dẫn, mẹo và xử lý lỗi.',
    featuredImage: '/images/mod-skin-v2-tutorial-banner.jpg'
  }
  posts.push(mainTutorial)

  // Installation guide post
  const installGuide = {
    title: 'Hướng Dẫn Cài Đặt Mod Skin V2 - 5 Phút Là Xong',
    slug: 'mod-skin-v2-cai-dat',
    excerpt: 'Cài đặt Mod Skin V2 chỉ trong 5 phút với hướng dẫn từng bước có hình ảnh. Không cần kiến thức kỹ thuật, ai cũng có thể làm được.',
    content: generateInstallationGuideContent(),
    status: Status.PUBLISHED,
    featured: false,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'Cài Đặt Mod Skin V2 - Hướng Dẫn Từng Bước',
    metaDescription: 'Hướng dẫn cài đặt Mod Skin V2 chi tiết, có hình ảnh minh họa. Chỉ cần 5 phút để hoàn thành.',
    featuredImage: '/images/mod-skin-v2-install-banner.jpg'
  }
  posts.push(installGuide)

  // Features post
  const featuresPost = {
    title: 'Tính Năng Mới Trong Mod Skin V2 - Có Gì Hot?',
    slug: 'mod-skin-v2-tinh-nang-moi',
    excerpt: 'Khám phá tất cả tính năng mới trong Mod Skin V2: hỗ trợ 170+ tướng, VFX nâng cao, auto-update, và nhiều hơn nữa.',
    content: generateFeaturesContent(),
    status: Status.PUBLISHED,
    featured: false,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'Tính Năng Mới Mod Skin V2 - Đầy Đủ Chi Tiết',
    metaDescription: 'Tổng hợp tất cả tính năng mới trong Mod Skin V2. Cập nhật 2025 với nhiều cải tiến vượt trội.',
    featuredImage: '/images/mod-skin-v2-features-banner.jpg'
  }
  posts.push(featuresPost)

  // Troubleshooting post
  const troubleshootingPost = {
    title: 'Xử Lý Lỗi Thường Gặp Trong Mod Skin V2',
    slug: 'mod-skin-v2-xu-ly-loi',
    excerpt: 'Gặp lỗi khi sử dụng Mod Skin V2? Đây là giải pháp cho tất cả các lỗi phổ biến: game không nhận skin, crash, lag, và nhiều lỗi khác.',
    content: generateTroubleshootingContent(),
    status: Status.PUBLISHED,
    featured: false,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'Xử Lý Lỗi Mod Skin V2 - Giải Pháp Chi Tiết',
    metaDescription: 'Hướng dẫn xử lý tất cả các lỗi thường gặp trong Mod Skin V2. Giải pháp nhanh chóng và hiệu quả.',
    featuredImage: '/images/mod-skin-v2-troubleshooting-banner.jpg'
  }
  posts.push(troubleshootingPost)

  // FAQ post
  const faqPost = {
    title: 'Câu Hỏi Thường Gặp Về Mod Skin V2',
    slug: 'mod-skin-v2-faq',
    excerpt: 'Giải đáp mọi thắc mắc về Mod Skin V2: có bị ban không, có virus không, hỗ trợ champion nào, và nhiều câu hỏi khác.',
    content: generateFAQContent(),
    status: Status.PUBLISHED,
    featured: false,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'FAQ Mod Skin V2 - Giải Đáp Thắc Mắc',
    metaDescription: 'Câu hỏi thường gặp về Mod Skin V2. Giải đáp chi tiết từ A-Z về mod skin.',
    featuredImage: '/images/mod-skin-v2-faq-banner.jpg'
  }
  posts.push(faqPost)

  // Tips & tricks post
  const tipsPost = {
    title: 'Mẹo Và Thủ Thuật Sử Dụng Mod Skin V2 Hiệu Quả',
    slug: 'mod-skin-v2-meo-thu-thuat',
    excerpt: 'Tổng hợp mẹo và thủ thuật để sử dụng Mod Skin V2 hiệu quả nhất: tối ưu hiệu suất, quản lý skin, và nhiều hơn nữa.',
    content: generateTipsContent(),
    status: Status.PUBLISHED,
    featured: false,
    authorId: authorId,
    publishedAt: new Date(),
    metaTitle: 'Mẹo Hay Mod Skin V2 - Thủ Thuật Sử Dụng',
    metaDescription: 'Mẹo và thủ thuật để sử dụng Mod Skin V2 hiệu quả. Tối ưu trải nghiệm chơi game của bạn.',
    featuredImage: '/images/mod-skin-v2-tips-banner.jpg'
  }
  posts.push(tipsPost)

  // Create all posts in database
  const createdPosts = []
  for (const post of posts) {
    const created = await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post
    })
    createdPosts.push(created)
  }

  return createdPosts
}

/**
 * Link tags to posts based on content
 */
async function linkTagsToPosts(posts: any[], tags: any[]) {
  const tagSlugToId: Record<string, string> = {}
  tags.forEach(tag => {
    tagSlugToId[tag.slug] = tag.id
  })

  // Define tag relationships for each post
  const postTagRelationships: Record<number, string[]> = {
    0: ['huong-dan', 'mod-skin-v2', 'league-of-legends', 'cai-dat'],
    1: ['cai-dat', 'mod-skin-v2', 'league-of-legends', 'meo-hay'],
    2: ['tinh-nang-moi', 'mod-skin-v2', 'league-of-legends'],
    3: ['xu-ly-loi', 'mod-skin-v2', 'faq'],
    4: ['faq', 'mod-skin-v2', 'huong-dan'],
    5: ['meo-hay', 'mod-skin-v2', 'league-of-legends', 'huong-dan']
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const tagSlugs = postTagRelationships[i] || []
    
    for (const tagSlug of tagSlugs) {
      const tagId = tagSlugToId[tagSlug]
      if (tagId) {
        await prisma.postTag.upsert({
          where: {
            postId_tagId: {
              postId: post.id,
              tagId: tagId
            }
          },
          update: {},
          create: {
            postId: post.id,
            tagId: tagId
          }
        })
      }
    }
  }
}

/**
 * Generate main tutorial HTML content
 */
function generateMainTutorialContent(): string {
  return `
|<div class="tutorial-container">
  <section class="intro-section">
    <h2>Giới Thiệu Mod Skin V2</h2>
    <p>
      <strong>Mod Skin V2</strong> là phiên bản nâng cấp của công cụ mod skin League of Legends,
      mang đến cho người chơi trải nghiệm hoàn toàn mới với hàng trăm skin tùy chỉnh chất lượng cao.
    </p>
    <div class="info-box">
      <h4>Điểm Nổi Bật Của V2</h4>
      <ul>
        <li>Hỗ trợ <strong>170+ tướng</strong> từ Riot Games</li>
        <li>Hơn <strong>500+ skin</strong> chất lượng cao</li>
        <li>Cập nhật <strong>tự động</strong> mỗi tuần</li>
        <li>Tương thích Windows 10/11</li>
        <li>An toàn, không bị ban</li>
        <li>Hoàn toàn <strong>miễn phí</strong></li>
      </ul>
    </div>
  </section>

  <section class="toc-section">
    <h2>Mục Lục</h2>
    <div class="toc-grid">
      <a href="#section-1" class="toc-item">1. Yêu Cầu Hệ Thống</a>
      <a href="#section-2" class="toc-item">2. Tải & Cài Đặt</a>
      <a href="#section-3" class="toc-item">3. Cách Sử Dụng</a>
      <a href="#section-4" class="toc-item">4. Quản Lý Skin</a>
      <a href="#section-5" class="toc-item">5. Xử Lý Sự Cố</a>
      <a href="#section-6" class="toc-item">6. Câu Hỏi Thường Gặp</a>
    </div>
  </section>

  <section id="section-1" class="content-section">
    <h2>1. Yêu Cầu Hệ Thống</h2>
    <h3>Tối Thiểu</h3>
    <table class="requirements-table">
      <tr><th>Thành phần</th><th>Yêu cầu</th></tr>
      <tr><td>Hệ điều hành</td><td>Windows 10/11 (64-bit)</td></tr>
      <tr><td>RAM</td><td>4 GB</td></tr>
      <tr><td>Dung lượng trống</td><td>2 GB</td></tr>
      <tr><td>League of Legends</td><td>Phiên bản mới nhất</td></tr>
      <tr><td>.NET Framework</td><td>4.8 trở lên</td></tr>
    </table>
    <h3>Khuyến Nghị</h3>
    <table class="requirements-table recommended">
      <tr><th>Thành phần</th><th>Khuyến nghị</th></tr>
      <tr><td>Hệ điều hành</td><td>Windows 11 (64-bit)</td></tr>
      <tr><td>RAM</td><td>8 GB hoặc hơn</td></tr>
      <tr><td>CPU</td><td>Intel Core i5 / AMD Ryzen 5</td></tr>
      <tr><td>GPU</td><td>Card đồ họa rời</td></tr>
    </table>
    <div class="warning-box">
      <h4>Lưu Ý Quan Trọng</h4>
      <ul>
        <li>Chỉ hỗ trợ <strong>Client Garena</strong> hoặc <strong>Riot Client</strong> chính thức</li>
        <li>Không tương thích với các phiên bản liverun/modified</li>
      </ul>
    </div>
  </section>

  <section id="section-2" class="content-section">
    <h2>2. Tải & Cài Đặt</h2>
    <div class="step-by-step">
      <div class="step">
        <div class="step-number">Bước 1</div>
        <div class="step-content">
          <h4>Tải File Cài Đặt</h4>
          <p>Truy cập trang chủ và nhấn nút <strong>"Tải Về Miễn Phí"</strong>.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">Bước 2</div>
        <div class="step-content">
          <h4>Chạy File Cài Đặt</h4>
          <p>Chạy file <code>ModSkinV2_Setup.exe</code> với quyền Administrator.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">Bước 3</div>
        <div class="step-content">
          <h4>Chọn Thư Mục Cài Đặt</h4>
          <p>Đường dẫn mặc định: <code>C:\\Program Files\\ModSkinV2</code></p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">Bước 4</div>
        <div class="step-content">
          <h4>Chọn Thư Mục Game</h4>
          <ul>
            <li><strong>Garena:</strong> <code>C:\\Garena\\Games\\League of Legends</code></li>
            <li><strong>Riot:</strong> <code>C:\\Riot Games\\League of Legends</code></li>
          </ul>
        </div>
      </div>
      <div class="step">
        <div class="step-number">Bước 5</div>
        <div class="step-content">
          <h4>Hoàn Tất Cài Đặt</h4>
          <p>Nhấn <strong>"Install"</strong> và chờ đợi hoàn tất.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="section-3" class="content-section">
    <h2>3. Cách Sử Dụng</h2>
    <h3>Giao Diện Chính</h3>
    <div class="feature-grid">
      <div class="feature-card"><h5>Thanh Tìm Kiếm</h5><p>Tìm skin theo tên tướng hoặc tên skin</p></div>
      <div class="feature-card"><h5>Danh Sách Tướng</h5><p>Danh sách tất cả tướng có skin mod</p></div>
      <div class="feature-card"><h5>Bảng Skin</h5><p>Xem và chọn skin cho tướng</p></div>
      <div class="feature-card"><h5>Cài Đặt</h5><p>Tùy chỉnh mod skin</p></div>
    </div>
    <h3>Cách Áp Dụng Skin</h3>
    <div class="process-flow">
      <ol>
        <li>Chọn tướng trong danh sách bên trái</li>
        <li>Xem các skin có sẵn trong bảng giữa</li>
        <li>Nhấn vào skin muốn áp dụng</li>
        <li>Skin sẽ được đánh dấu màu xanh</li>
        <li>Khởi động game và tận hưởng!</li>
      </ol>
    </div>
  </section>

  <section id="section-4" class="content-section">
    <h2>4. Quản Lý Skin</h2>
    <h3>Lọc & Tìm Kiếm Nâng Cao</h3>
    <table class="filter-table">
      <tr><th>Bộ lọc</th><th>Mô tả</th></tr>
      <tr><td>Tìm theo tên</td><td>Gõ tên tướng hoặc skin để tìm nhanh</td></tr>
      <tr><td>Theo danh mục</td><td>Lọc theo loại: VFX, Theme, Anime, Chroma...</td></tr>
      <tr><td>Theo đánh giá</td><td>Hiển thị skin theo số sao đánh giá</td></tr>
      <tr><td>Theo lượt tải</td><td>Hiển thị skin phổ biến nhất</td></tr>
      <tr><td>Mới nhất</td><td>Hiển thị skin vừa được thêm</td></tr>
    </table>
  </section>

  <section id="section-5" class="content-section">
    <h2>5. Xử Lý Sự Cố</h2>
    <div class="troubleshooting-grid">
      <div class="trouble-item">
        <h4>Game Không Nhận Skin</h4>
        <p><strong>Giải pháp:</strong></p>
        <ol>
          <li>Đóng hoàn toàn League of Legends</li>
          <li>Chạy Mod Skin V2 với quyền Administrator</li>
          <li>Kiểm tra đường dẫn game trong Cài Đặt</li>
          <li>Nhấn nút "Áp dụng" và khởi động lại game</li>
        </ol>
      </div>
      <div class="trouble-item">
        <h4>Game Bị Crash</h4>
        <p><strong>Giải pháp:</strong></p>
        <ol>
          <li>Gỡ bỏ skin gần đây cài đặt</li>
          <li>Cập nhật Mod Skin V2 lên phiên bản mới nhất</li>
          <li>Tắt tất cả phần mềm overlay (Discord, OBS...)</li>
          <li>Kiểm tra tính toàn vẹn file game</li>
        </ol>
      </div>
    </div>
  </section>

  <section id="section-6" class="content-section">
    <h2>6. Câu Hỏi Thường Gặp</h2>
    <div class="faq-list">
      <details class="faq-item"><summary>Mod Skin V2 có bị ban không?</summary>
        <div class="faq-answer"><p><strong>Không!</strong> Mod Skin V2 sử dụng kỹ thuật client-side modification, không can thiệp vào game server.</p></div>
      </details>
      <details class="faq-item"><summary>Mod Skin V2 có miễn phí không?</summary>
        <div class="faq-answer"><p><strong>Có, hoàn toàn miễn phí!</strong> Chúng tôi không thu phí bất kỳ tính nào.</p></div>
      </details>
      <details class="faq-item"><summary>Mod Skin V2 có hỗ trợ điện thoại không?</summary>
        <div class="faq-answer"><p>Hiện tại, Mod Skin V2 chỉ hỗ trợ <strong>Windows PC</strong>.</p></div>
      </details>
    </div>
  </section>

  <section class="important-note-section">
    <h2>Lưu Ý Quan Trọng Khi Sử Dụng</h2>
    
    <div class="important-box">
      <h3>Nếu Mod Thông Báo Thành Công Nhưng Không Thấy Skin Trong Game</h3>
      <p>Đây là lỗi thường gặp trên một số máy tính. Hãy thực hiện các bước sau:</p>
      
      <div class="solution-steps">
        <h4>Cách 1: Đổi Phương Thức Mod</h4>
        <ol>
          <li>Mở Mod Skin V2</li>
          <li>Vào <strong>Settings</strong> (Cài Đặt)</li>
          <li>Tìm mục <strong>Mod Method</strong> hoặc <strong>Phương Thức Mod</strong></li>
          <li>Chọn <strong>CSLOL GUI</strong> thay vì phương thức mặc định</li>
          <li>Lưu lại và khởi động game</li>
        </ol>
        
        <h4>Cách 2: Cài Đặt C++ Redistributable</h4>
        <p>Nếu vẫn không được, hãy cài đặt C++ Redistributable All-in-One:</p>
        <ol>
          <li>Tải file cài đặt tại: <a href="https://modskinslol.com/products/visual-c-redistributable-runtimes-all-in-one" target="_blank">https://modskinslol.com/products/visual-c-redistributable-runtimes-all-in-one</a></li>
          <li>Chạy file vừa tải với quyền Administrator</li>
          <li>Chọn "Install" và chờ đợi hoàn tất</li>
          <li>Khởi động lại máy tính</li>
          <li>Mở lại Mod Skin V2 và thử lại</li>
        </ol>
      </div>
    </div>

    <div class="download-box">
      <h4>Link Tải Mod Skin V2 Chính Thức</h4>
      <p>Nếu bạn cần tải lại Mod Skin V2, hãy truy cập:</p>
      <a href="https://modskinslol.com/products/mod-skin-lol-v2" target="_blank" class="download-link">Tải Mod Skin V2</a>
    </div>

    <div class="help-box">
      <h4>Cần Hỗ Trợ?</h4>
      <p>Nếu vẫn gặp vấn đề, hãy liên hệ:</p>
      <ul>
        <li>Email: support@webmodskin.com</li>
        <li>Discord: <a href="https://discord.gg/webmodskin">https://discord.gg/webmodskin</a></li>
      </ul>
    </div>
  </section>

  <section class="conclusion-section">
    <h2>Kết Luận</h2>
    <p>Mod Skin V2 là công cụ tuyệt vời để nâng cao trải nghiệm chơi League of Legends của bạn.</p>
    <div class="cta-buttons">
      <a href="/custom-skins" class="btn-primary">Tải Ngay</a>
      <a href="/donate" class="btn-secondary">Ủng Hộ Dự Án</a>
    </div>
  </section>
</div>

<style>
.tutorial-container { max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333; }
.tutorial-container h2 { color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 10px; margin-top: 40px; }
.tutorial-container h3 { color: #4f46e5; margin-top: 25px; }
.info-box { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1; }
.toc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
.toc-item { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; text-decoration: none; color: #4f46e5; font-weight: 500; transition: all 0.3s; border: 2px solid transparent; }
.toc-item:hover { background: #e0e7ff; border-color: #6366f1; transform: translateY(-2px); }
.requirements-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.requirements-table th, .requirements-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
.requirements-table th { background: #4f46e5; color: white; }
.requirements-table.recommended th { background: #059669; }
.warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; }
.step-by-step { margin: 30px 0; }
.step { display: flex; gap: 20px; margin-bottom: 25px; align-items: flex-start; }
.step-number { background: #6366f1; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; flex-shrink: 0; }
.step-content { flex: 1; background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }
.feature-card { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 12px; text-align: center; transition: transform 0.3s; }
.feature-card:hover { transform: translateY(-5px); }
.feature-card h5 { margin: 10px 0; color: #3730a3; }
.feature-card p { margin: 0; font-size: 0.9rem; color: #6b7280; }
.process-flow { background: #f0fdf4; padding: 20px 20px 20px 40px; border-radius: 12px; border-left: 4px solid #22c55e; }
.process-flow ol { margin: 0; padding-left: 20px; }
.process-flow li { margin: 10px 0; }
.filter-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.filter-table th, .filter-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
.filter-table th { background: #f3f4f6; }
.troubleshooting-grid { display: grid; gap: 20px; margin: 20px 0; }
.trouble-item { background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; }
.trouble-item h4 { color: #dc2626; margin-top: 0; }
.faq-list { margin: 20px 0; }
.faq-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 10px 0; overflow: hidden; }
.faq-item summary { padding: 15px 20px; cursor: pointer; font-weight: 600; background: #f3f4f6; list-style: none; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-answer { padding: 20px; border-top: 1px solid #e5e7eb; }
.conclusion-section { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 30px; border-radius: 16px; margin-top: 40px; text-align: center; }
.cta-buttons { display: flex; gap: 15px; justify-content: center; margin-top: 25px; flex-wrap: wrap; }
.btn-primary, .btn-secondary { padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s; }
.btn-primary { background: #6366f1; color: white; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-2px); }
.btn-secondary { background: white; color: #6366f1; border: 2px solid #6366f1; }
.btn-secondary:hover { background: #e0e7ff; }
.important-note-section { background: #fefce8; border: 2px solid #ca8a04; border-radius: 12px; padding: 30px; margin-top: 40px; }
.important-note-section h2 { color: #854d0e; margin-top: 0; }
.important-box { background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
.important-box h3 { color: #b45309; margin-top: 0; font-size: 1.2rem; }
.solution-steps { background: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 15px; }
.solution-steps h4 { color: #92400e; margin: 15px 0 10px 0; }
.solution-steps h4:first-child { margin-top: 0; }
.solution-steps ol { padding-left: 25px; }
.solution-steps li { margin: 8px 0; }
.solution-steps a { color: #6366f1; text-decoration: underline; }
.download-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 25px; margin-bottom: 20px; text-align: center; }
.download-box h4 { color: #1e40af; margin: 0 0 10px 0; }
.download-link { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px; }
.download-link:hover { background: #1d4ed8; transform: translateY(-2px); }
.help-box { background: #f0fdf4; border-radius: 12px; padding: 25px; }
.help-box h4 { color: #166534; margin: 0 0 10px 0; }
.help-box ul { margin: 10px 0 0 0; padding-left: 20px; }
.help-box li { margin: 5px 0; }
.help-box a { color: #6366f1; text-decoration: underline; }
</style>
  `
}

/**
 * Generate installation guide HTML content
 */
function generateInstallationGuideContent(): string {
  return `
|<div class="install-guide">
  <div class="hero-section">
    <h2>Cài Đặt Mod Skin V2 Trong 5 Phút</h2>
    <p>Hướng dẫn từng bước có hình ảnh minh họa. Không cần kiến thức kỹ thuật!</p>
  </div>

  <div class="quick-stats">
    <div class="stat-item"><span class="stat-number">5 phút</span><span class="stat-label">Thời gian cài đặt</span></div>
    <div class="stat-item"><span class="stat-number">150 MB</span><span class="stat-label">Dung lượng file</span></div>
    <div class="stat-item"><span class="stat-number">100%</span><span class="stat-label">An toàn</span></div>
    <div class="stat-item"><span class="stat-number">Miễn phí</span><span class="stat-label">Sử dụng</span></div>
  </div>

  <div class="steps-container">
    <div class="step-item">
      <div class="step-header"><span class="step-icon"></span><h3>Bước 1: Tải File Cài Đặt</h3></div>
      <div class="step-body">
        <p>Truy cập trang chủ và tải file cài đặt mới nhất.</p>
        <div class="download-area"><a href="/download" class="download-btn">Tải Mod Skin V2 Ngay</a></div>
        <p class="file-info"><strong>File:</strong> ModSkinV2_Setup_v2.5.exe<br><strong>Dung lượng:</strong> 150.5 MB<br><strong>Phiên bản:</strong> 2.5.0</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-header"><span class="step-icon"></span><h3>Bước 2: Chạy File Cài Đặt</h3></div>
      <div class="step-body">
        <p>Nhấn đúp vào file vừa tải về. Nếu Windows hiện cảnh báo, nhấn <strong>"Run anyway"</strong>.</p>
        <div class="warning-note">Lưu ý: Chạy với quyền Administrator</div>
      </div>
    </div>

    <div class="step-item">
      <div class="step-header"><span class="step-icon"></span><h3>Bước 3: Chọn Thư Mục</h3></div>
      <div class="step-body">
        <p>Chọn thư mục cài đặt (nên để mặc định):</p>
        <div class="path-box">C:\\Program Files\\ModSkinV2</div>
        <p><strong>Quan trọng:</strong> Thư mục không được chứa dấu tiếng Việt!</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-header"><span class="step-icon"></span><h3>Bước 4: Chọn Thư Mục Game</h3></div>
      <div class="step-body">
        <div class="path-options">
          <div class="path-option"><strong>Garena:</strong> <code>C:\\Garena\\Games\\League of Legends</code></div>
          <div class="path-option"><strong>Riot:</strong> <code>C:\\Riot Games\\League of Legends</code></div>
        </div>
      </div>
    </div>

    <div class="step-item">
      <div class="step-header"><span class="step-icon"></span><h3>Bước 5: Hoàn Tất</h3></div>
      <div class="step-body">
        <p>Nhấn <strong>"Install"</strong> và chờ đợi. Sau khi xong, Mod Skin V2 sẽ tự động mở.</p>
        <div class="success-box">Chúc mừng! Bạn đã cài đặt thành công Mod Skin V2!</div>
      </div>
    </div>
  </div>
</div>

<style>
.install-guide { max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.hero-section { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; color: white; margin-bottom: 30px; }
.hero-section h2 { margin: 0 0 10px 0; font-size: 2rem; }
.quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
.stat-item { background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center; }
.stat-number { display: block; font-size: 1.5rem; font-weight: bold; color: #6366f1; }
.stat-label { font-size: 0.85rem; color: #6b7280; }
.steps-container { margin: 30px 0; }
.step-item { background: white; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 15px; overflow: hidden; }
.step-header { display: flex; align-items: center; gap: 15px; padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.step-icon { font-size: 1.5rem; }
.step-header h3 { margin: 0; color: #3730a3; }
.step-body { padding: 20px; }
.download-area { text-align: center; margin: 20px 0; }
.download-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.file-info { background: #f3f4f6; padding: 10px 15px; border-radius: 8px; font-size: 0.9rem; color: #6b7280; }
.warning-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin-top: 15px; border-radius: 0 8px 8px 0; }
.path-box { background: #1f2937; color: #10b981; padding: 12px 20px; border-radius: 8px; font-family: monospace; margin: 15px 0; }
.path-options { display: grid; gap: 10px; }
.path-option { background: #f9fafb; padding: 12px 15px; border-radius: 8px; }
.path-option code { display: block; margin-top: 5px; color: #6366f1; font-family: monospace; }
.success-box { background: #d1fae5; border: 2px solid #10b981; color: #065f46; padding: 20px; border-radius: 12px; text-align: center; font-size: 1.1rem; margin-top: 20px; }
@media (max-width: 600px) { .quick-stats { grid-template-columns: repeat(2, 1fr); } }
</style>
  `
}

/**
 * Generate features HTML content
 */
function generateFeaturesContent(): string {
  return `
|<div class="features-page">
  <div class="features-header">
    <h2>Tính Năng Mới Trong Mod Skin V2</h2>
    <p>Khám phá tất cả những gì Mod Skin V2 mang đến cho bạn</p>
  </div>

  <div class="version-badge"><span class="badge">Phiên bản 2.5</span><span class="date">Cập nhật: 20/01/2025</span></div>

  <div class="stats-overview">
    <div class="stat-box"><span class="stat-value">170+</span><span class="stat-label">Tướng hỗ trợ</span></div>
    <div class="stat-box"><span class="stat-value">500+</span><span class="stat-label">Skin có sẵn</span></div>
    <div class="stat-box"><span class="stat-value">50k+</span><span class="stat-label">Người dùng</span></div>
    <div class="stat-box"><span class="stat-value">99.9%</span><span class="stat-label">Uptime</span></div>
  </div>

  <div class="features-grid">
    <div class="feature-card"><div class="feature-icon"></div><h3>Tốc Độ Nhanh Hơn</h3><p>Mod Skin V2 được viết lại từ đầu, tốc độ load skin nhanh hơn <strong>3 lần</strong>.</p><ul><li>Load skin trong < 1 giây</li><li>Khởi động nhanh hơn 50%</li><li>Tiêu thụ RAM ít hơn</li></ul></div>
    <div class="feature-card"><div class="feature-icon"></div><h3>Chất Lượng VFX Cao</h3><p>Tất cả VFX được làm mới với chất lượng cao hơn.</p><ul><li>Hỗ trợ 4K resolution</li><li>Tương thích HDR</li><li>Tối ưu cho mọi GPU</li></ul></div>
    <div class="feature-card"><div class="feature-icon"></div><h3>Tự Động Cập Nhật</h3><p>Không cần tải file mới mỗi tuần.</p><ul><li>Cập nhật nền</li><li>Thông báo khi có skin mới</li><li>Rollback nếu cần</li></ul></div>
    <div class="feature-card"><div class="feature-icon"></div><h3>Đa Ngôn Ngữ</h3><p>Giao diện hỗ trợ đa ngôn ngữ.</p><ul><li>Tiếng Việt</li><li>English</li><li>Korea</li><li>Chinese</li></ul></div>
    <div class="feature-card"><div class="feature-icon"></div><h3>Tích Hợp Mobile App</h3><p>Điều khiển mod skin từ điện thoại.</p><ul><li>Chọn skin từ xa</li><li>Kiểm tra trạng thái</li><li>Nhận thông báo mới</li></ul></div>
    <div class="feature-card"><div class="feature-icon"></div><h3>Tìm Kiếm Thông Minh</h3><p>Tìm skin nhanh chóng với bộ lọc thông minh.</p><ul><li>Tìm theo tên tướng</li><li>Lọc theo danh mục</li><li>Sắp xếp theo đánh giá</li></ul></div>
  </div>

  <div class="comparison-section">
    <h3>So Sánh V1 vs V2</h3>
    <table class="compare-table">
      <tr><th>Tính năng</th><th>V1 (Cũ)</th><th>V2 (Mới)</th></tr>
      <tr><td>Thời gian load skin</td><td>~3 giây</td><td>< 1 giây</td></tr>
      <tr><td>Số lượng tướng</td><td>~100</td><td>170+</td></tr>
      <tr><td>Cập nhật</td><td>Thủ công</td><td>Tự động</td></tr>
      <tr><td>Giao diện</td><td>Cơ bản</td><td>Hiện đại UX/UI</td></tr>
      <tr><td>Tương thích</td><td>Win 10</td><td>Win 10/11</td></tr>
      <tr><td>Hỗ trợ mobile</td><td>Không</td><td>Có</td></tr>
    </table>
  </div>

  <div class="coming-soon">
    <h3>Sắp Có Trong Phiên Bản Tới</h3>
    <div class="roadmap">
      <div class="roadmap-item"><span class="version">v2.6</span><span class="feature">Hỗ trợ MacOS</span></div>
      <div class="roadmap-item"><span class="version">v2.7</span><span class="feature">Skin preview 3D</span></div>
      <div class="roadmap-item"><span class="version">v3.0</span><span class="feature">Community skins marketplace</span></div>
    </div>
  </div>
</div>

<style>
.features-page { max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.features-header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); border-radius: 16px; color: white; margin-bottom: 20px; }
.features-header h2 { margin: 0 0 10px 0; }
.version-badge { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
.badge { background: #6366f1; color: white; padding: 5px 15px; border-radius: 20px; font-weight: 600; }
.date { color: #6b7280; }
.stats-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
.stat-box { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 12px; text-align: center; }
.stat-value { display: block; font-size: 2.5rem; font-weight: bold; color: #6366f1; }
.stat-label { color: #6b7280; font-size: 0.9rem; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 30px 0; }
.feature-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 25px; transition: transform 0.3s, box-shadow 0.3s; }
.feature-card:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15); }
.feature-icon { font-size: 2.5rem; margin-bottom: 15px; }
.feature-card h3 { color: #3730a3; margin: 0 0 10px 0; }
.feature-card p { color: #4b5563; line-height: 1.6; }
.feature-card ul { margin-top: 15px; padding-left: 20px; }
.feature-card li { margin: 8px 0; color: #6b7280; }
.comparison-section { background: #f9fafb; padding: 30px; border-radius: 16px; margin: 40px 0; }
.comparison-section h3 { margin-top: 0; text-align: center; }
.compare-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
.compare-table th, .compare-table td { padding: 15px; text-align: center; border-bottom: 1px solid #e5e7eb; }
.compare-table th { background: #4f46e5; color: white; }
.compare-table th:first-child, .compare-table td:first-child { text-align: left; }
.coming-soon { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 16px; margin: 40px 0; }
.coming-soon h3 { margin-top: 0; color: #92400e; }
.roadmap { display: flex; gap: 20px; flex-wrap: wrap; }
.roadmap-item { background: white; padding: 15px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
.roadmap-item .version { background: #6366f1; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
@media (max-width: 600px) { .stats-overview { grid-template-columns: repeat(2, 1fr); } }
</style>
  `
}

/**
 * Generate troubleshooting HTML content
 */
function generateTroubleshootingContent(): string {
  return `
|<div class="troubleshoot-page">
  <div class="troubleshoot-header">
    <h2>Xử Lý Lỗi Thường Gặp</h2>
    <p>Giải pháp nhanh chóng cho mọi vấn đề bạn có thể gặp phải</p>
  </div>

  <div class="error-list">
    <div class="error-card critical">
      <div class="error-header">
        <span class="error-icon"></span>
        <h3>Game Không Nhận Skin</h3>
        <span class="severity critical">Nghiêm trọng</span>
      </div>
      <div class="error-content">
        <p><strong>Mã lỗi:</strong> ERR_SKIN_NOT_LOADED</p>
        <p><strong>Mô tả:</strong> Không hiển thị skin trong game sau khi áp dụng</p>
        <h4>Nguyên nhân có thể:</h4>
        <ul>
          <li>Mod chưa được inject vào game</li>
          <li>Đường dẫn game không chính xác</li>
          <li>Game đang chạy khi áp dụng skin</li>
          <li>Quyền Administrator không đủ</li>
        </ul>
        <h4>Cách khắc phục:</h4>
        <div class="solution-steps">
          <div class="step"><span class="step-num">1</span><span>Đóng hoàn toàn League of Legends</span></div>
          <div class="step"><span class="step-num">2</span><span>Chạy Mod Skin V2 với quyền Administrator</span></div>
          <div class="step"><span class="step-num">3</span><span>Kiểm tra đường dẫn game trong Settings</span></div>
          <div class="step"><span class="step-num">4</span><span>Nhấn "Áp dụng" và khởi động lại game</span></div>
        </div>
      </div>
    </div>

    <div class="error-card critical">
      <div class="error-header">
        <span class="error-icon"></span>
        <h3>Game Bị Crash Khi Load Skin</h3>
        <span class="severity critical">Nghiêm trọng</span>
      </div>
      <div class="error-content">
        <p><strong>Mã lỗi:</strong> ERR_CRASH_LOADING</p>
        <h4>Cách khắc phục:</h4>
        <ol>
          <li>Gỡ bỏ skin gần đây cài đặt</li>
          <li>Cập nhật Mod Skin V2 lên phiên bản mới nhất</li>
          <li>Tắt tất cả phần mềm overlay (Discord, OBS, ShadowPlay)</li>
          <li>Giảm setting đồ họa trong game xuống Medium</li>
          <li>Kiểm tra tính toàn vẹn file game</li>
        </ol>
        <div class="tip-box">Mẹo: Thử gỡ bỏ từng skin một để xác định skin gây lỗi</div>
      </div>
    </div>

    <div class="error-card medium">
      <div class="error-header">
        <span class="error-icon"></span>
        <h3>Game Bị Lag Sau Khi Cài Skin</h3>
        <span class="severity medium">Trung bình</span>
      </div>
      <div class="error-content">
        <p><strong>Nguyên nhân:</strong> Skin VFX quá nặng hoặc thiếu RAM.</p>
        <h4>Giải pháp:</h4>
        <div class="solution-cards">
          <div class="solution-card"><h5>Chọn Skin Nhẹ</h5><p>Ưu tiên skin không có VFX hoặc VFX đơn giản</p></div>
          <div class="solution-card"><h5>Giảm Setting</h5><p>Tắt VFX trong game settings</p></div>
          <div class="solution-card"><h5>Dọn Dẹp</h5><p>Tắt các skin không dùng</p></div>
        </div>
      </div>
    </div>

    <div class="error-card low">
      <div class="error-header">
        <span class="error-icon"></span>
        <h3>Cập Nhật Thất Bại</h3>
        <span class="severity low">Thấp</span>
      </div>
      <div class="error-content">
        <p><strong>Nguyên nhân:</strong> Lỗi kết nối hoặc quyền truy cập.</p>
        <h4>Giải pháp:</h4>
        <ol>
          <li>Chạy Mod Skin V2 với quyền Administrator</li>
          <li>Kiểm tra kết nối internet</li>
          <li>Tắt tường lửa tạm thời</li>
          <li>Thử tải cập nhật thủ công từ website</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="contact-section">
    <h3>Vẫn Gặp Vấn Đề?</h3>
    <p>Liên hệ với chúng tôi qua các kênh sau:</p>
    <div class="contact-options">
      <a href="/contact" class="contact-btn">Chat hỗ trợ</a>
      <a href="https://discord.gg/webmodskin" class="contact-btn">Discord Community</a>
      <a href="mailto:support@webmodskin.com" class="contact-btn">Email hỗ trợ</a>
    </div>
  </div>
</div>

<style>
.troubleshoot-page { max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.troubleshoot-header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 16px; color: white; margin-bottom: 20px; }
.troubleshoot-header h2 { margin: 0 0 10px 0; }
.error-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
.error-header { display: flex; align-items: center; gap: 15px; padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.error-icon { font-size: 1.5rem; }
.error-header h3 { margin: 0; flex: 1; }
.severity { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.severity.critical { background: #fee2e2; color: #dc2626; }
.severity.medium { background: #fef3c7; color: #d97706; }
.severity.low { background: #dbeafe; color: #2563eb; }
.error-content { padding: 20px; }
.error-content h4 { color: #3730a3; margin: 15px 0 10px 0; }
.error-content ul, .error-content ol { padding-left: 20px; }
.error-content li { margin: 8px 0; }
.solution-steps { background: #f0fdf4; border-radius: 8px; padding: 15px; }
.solution-steps .step { display: flex; align-items: center; gap: 12px; margin: 10px 0; }
.step-num { background: #22c55e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; flex-shrink: 0; }
.tip-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px 15px; margin-top: 15px; border-radius: 0 8px 8px 0; }
.solution-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.solution-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
.solution-card h5 { margin: 0 0 8px 0; color: #3730a3; }
.solution-card p { margin: 0; font-size: 0.85rem; color: #6b7280; }
.contact-section { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 30px; border-radius: 16px; margin-top: 40px; text-align: center; }
.contact-section h3 { margin-top: 0; }
.contact-options { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
.contact-btn { background: white; color: #6366f1; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style>
  `
}

/**
 * Generate FAQ HTML content
 */
function generateFAQContent(): string {
  return `
|<div class="faq-page">
  <div class="faq-header">
    <h2>Câu Hỏi Thường Gặp</h2>
    <p>Tất cả những gì bạn cần biết về Mod Skin V2</p>
  </div>

  <div class="faq-list">
    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Mod Skin V2 có bị Riot Games phát hiện và ban không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Không! Mod Skin V2 hoàn toàn an toàn và không bị phát hiện.</strong></p>
          <div class="detailed-answer">
            <h4>Giải thích chi tiết:</h4>
            <p>Mod Skin V2 sử dụng kỹ thuật <strong>client-side modification</strong>, nghĩa là nó chỉ thay đổi cách game hiển thị trên máy của bạn mà không can thiệp vào game server.</p>
            <ul>
              <li>Không sửa đổi file game gốc</li>
              <li>Không can thiệp packet mạng</li>
              <li>Không affect gameplay server-side</li>
              <li>Không thể bị phát hiện bởi anti-cheat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Mod Skin V2 có miễn phí không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Có! Mod Skin V2 hoàn toàn miễn phí và sẽ luôn như vậy.</strong></p>
          <p>Chúng tôi không thu phí bất kỳ tính nào. Tất cả skin, tính năng cơ bản và nâng cao đều miễn phí 100%.</p>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Mod Skin V2 hoạt động trên Windows 11 không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Có! Mod Skin V2 tương thích hoàn hảo với Windows 10 và Windows 11.</strong></p>
          <h4>Yêu cầu hệ thống:</h4>
          <ul>
            <li>Windows 10 (64-bit) trở lên</li>
            <li>.NET Framework 4.8</li>
            <li>4GB RAM</li>
            <li>2GB dung lượng trống</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Tôi có thể sử dụng skin trên Garena Client không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Có! Mod Skin V2 hỗ trợ cả Garena Client và Riot Client.</strong></p>
          <ul>
            <li><strong>Garena:</strong> <code>C:\\Garena\\Games\\League of Legends</code></li>
            <li><strong>Riot:</strong> <code>C:\\Riot Games\\League of Legends</code></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Có bao nhiêu skin có sẵn trong Mod Skin V2?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Hiện có hơn 500+ skin chất lượng cao từ 170+ tướng.</strong></p>
          <p>Chúng tôi liên tục cập nhật skin mới mỗi tuần. Danh sách skin bao gồm:</p>
          <ul>
            <li>Skin từ các nhà thiết kế cộng đồng</li>
            <li>Chroma và phiên bản nâng cao</li>
            <li>Skin theo chủ đề (Anime, Movie, Game...)</li>
            <li>Skin được đánh giá cao nhất</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Mod Skin V2 có virus không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Không! Mod Skin V2 hoàn toàn sạch và an toàn.</strong></p>
          <div class="security-badges">
            <span class="badge">Windows Defender</span>
            <span class="badge">VirusTotal</span>
            <span class="badge">Malwarebytes</span>
          </div>
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-question">
        <span class="q-icon">Q</span>
        <span>Tôi có thể gỡ cài đặt Mod Skin V2 không?</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="faq-answer">
        <div class="answer-content">
          <p class="short-answer"><strong>Có! Việc gỡ cài đặt rất đơn giản.</strong></p>
          <h4>Cách gỡ cài đặt:</h4>
          <ol>
            <li>Đóng Mod Skin V2 hoàn toàn</li>
            <li>Vào Control Panel -> Programs and Features</li>
            <li>Tìm "Mod Skin V2" và chọn Uninstall</li>
            <li>Hoặc chạy file <code>uninstall.exe</code> trong thư mục cài đặt</li>
          </ol>
        </div>
      </div>
    </div>
  </div>

  <div class="more-questions">
    <h3>Câu Hỏi Khác?</h3>
    <p>Nếu bạn không tìm thấy câu trả lời, hãy liên hệ với chúng tôi!</p>
    <a href="/contact" class="contact-btn">Liên Hệ Ngay</a>
  </div>
</div>

<style>
.faq-page { max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.faq-header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; color: white; margin-bottom: 20px; }
.faq-header h2 { margin: 0 0 10px 0; }
.faq-item { background: white; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
.faq-question { display: flex; align-items: center; gap: 15px; padding: 18px 20px; cursor: pointer; transition: background 0.3s; }
.faq-question:hover { background: #f9fafb; }
.q-icon { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
.faq-question span:nth-child(2) { flex: 1; font-weight: 500; }
.expand-icon { color: #9ca3af; transition: transform 0.3s; }
.faq-item[open] .expand-icon { transform: rotate(180deg); }
.faq-answer { display: none; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.faq-item[open] .faq-answer { display: block; }
.answer-content { padding: 20px; }
.short-answer { font-size: 1.1rem; color: #059669; margin-bottom: 15px; }
.detailed-answer { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e5e7eb; }
.detailed-answer h4 { color: #3730a3; margin: 15px 0 10px 0; }
.detailed-answer ul { padding-left: 20px; }
.detailed-answer li { margin: 8px 0; }
.security-badges { display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0; }
.badge { background: #d1fae5; color: #065f46; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; }
.more-questions { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 16px; margin-top: 40px; }
.more-questions h3 { margin: 0 0 10px 0; }
.contact-btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
</style>
  `
}

/**
 * Generate tips & tricks HTML content
 */
function generateTipsContent(): string {
  return `
|<div class="tips-page">
  <div class="tips-header">
    <h2>Mẹo Và Thủ Thuật Mod Skin V2 Hiệu Quả</h2>
    <p>Những bí quyết để sử dụng Mod Skin V2 hiệu quả nhất</p>
  </div>

  <div class="tips-grid">
    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Tối Ưu Hiệu Suất</h3>
      <div class="tip-content">
        <h4>1. Tắt Skin Không Dùng</h4>
        <p>Nếu bạn không chơi một tướng thường xuyên, hãy tắt skin của tướng đó. Điều này giảm tải cho hệ thống và cải thiện FPS.</p>
        <div class="code-block">Cách làm: Nhấn vào skin -> Nút "Tắt"</div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Sử Dụng Bộ Lọc</h3>
      <div class="tip-content">
        <h4>2. Lọc Skin Theo Nhiều Tiêu Chí</h4>
        <p>Đơn giản phí thời gian scroll qua hàng trăm skin. Sử dụng bộ lọc để tìm nhanh hơn.</p>
        <div class="filter-list">
          <span class="filter-tag">Tìm theo tên</span>
          <span class="filter-tag">Theo danh mục</span>
          <span class="filter-tag">Theo đánh giá</span>
        </div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Tạo Bộ Sưu Tập</h3>
      <div class="tip-content">
        <h4>3. Yêu Thích Skin Quan Trọng</h4>
        <p>Đánh dấu skin yêu thích để truy cập nhanh chóng mà không cần tìm kiếm.</p>
        <div class="code-block">Cách làm: Nhấn biểu tượng sao trên skin</div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Đổi Skin Nhanh</h3>
      <div class="tip-content">
        <h4>4. Sử Dụng Phím Tắt</h4>
        <p>Mod Skin V2 hỗ trợ phím tắt để đổi skin nhanh chóng.</p>
        <table class="shortcut-table">
          <tr><td><kbd>Ctrl</kbd> + <kbd>F</kbd></td><td>Tìm kiếm nhanh</td></tr>
          <tr><td><kbd>Ctrl</kbd> + <kbd>S</kbd></td><td>Lưu cấu hình</td></tr>
          <tr><td><kbd>Ctrl</kbd> + <kbd>R</kbd></td><td>Tải lại danh sách</td></tr>
        </table>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Sao Lưu Cấu Hình</h3>
      <div class="tip-content">
        <h4>5. Xuất/Nhập Cấu Hình</h4>
        <p>Sao lưu cấu hình skin để tránh mất dữ liệu hoặc chuyển sang máy khác.</p>
        <div class="code-block">Vào Settings -> Data -> Export/Import</div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Chọn Skin Phù Hợp</h3>
      <div class="tip-content">
        <h4>6. Theo Setting Đồ Họa</h4>
        <p>Nếu máy bạn yếu, hãy chọn skin VFX nhẹ.</p>
        <div class="recommendation">
          <div class="rec-item"><span class="rec-label">Máy yếu:</span><span>Chroma, Theme đơn giản</span></div>
          <div class="rec-item"><span class="rec-label">Máy trung bình:</span><span>Anime, VFX cơ bản</span></div>
          <div class="rec-item"><span class="rec-label">Máy mạnh:</span><span>Tất cả VFX phức tạp</span></div>
        </div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Nhận Thông Báo</h3>
      <div class="tip-content">
        <h4>7. Bật Thông Báo Skin Mới</h4>
        <p>Đừng bỏ lỡ skin mới nào! Bật thông báo để nhận alert khi có skin mới.</p>
        <div class="code-block">Vào Settings -> Notifications -> Bật "New Skin Alerts"</div>
      </div>
    </div>

    <div class="tip-card">
      <div class="tip-icon"></div>
      <h3>Điều Khiển Từ Xa</h3>
      <div class="tip-content">
        <h4>8. Sử Dụng Mobile App</h4>
        <p>Điều khiển mod skin từ điện thoại. Rất tiện khi bạn muốn đổi skin mà không cần mở Mod Skin V2 trên PC.</p>
        <div class="app-links">
          <a href="#" class="app-btn">iOS</a>
          <a href="#" class="app-btn">Android</a>
        </div>
      </div>
    </div>
  </div>

  <div class="advanced-tips">
    <h3>Thủ Thuật Nâng Cao</h3>
    <div class="advanced-item">
      <h4>Sử Dụng Command Line</h4>
      <p>Mod Skin V2 hỗ trợ điều khiển qua command line cho người dùng nâng cao:</p>
      <div class="cli-commands">
        <div class="cli-command"><code>ModSkinV2.exe --apply-skin "Yasuo" "Dark Star"</code><span class="cli-desc">Áp dụng skin cho tướng</span></div>
        <div class="cli-command"><code>ModSkinV2.exe --list-skins "Ahri"</code><span class="cli-desc">Liệt kê skin của tướng</span></div>
        <div class="cli-command"><code>ModSkinV2.exe --export-config config.json</code><span class="cli-desc">Xuất cấu hình</span></div>
      </div>
    </div>
  </div>

  <div class="pro-tips">
    <h3>Pro Tips Từ Cộng Đồng</h3>
    <div class="community-tips">
      <div class="community-tip">
        <div class="tip-author"><span class="avatar"></span><span class="author-name">SkinMaster_VN</span></div>
        <p>"Mình thường tạo preset cho mỗi champion role. Khi cần đổi style, chỉ cần load preset là xong!"</p>
      </div>
      <div class="community-tip">
        <div class="tip-author"><span class="avatar"></span><span class="author-name">ProGamer_HCM</span></div>
        <p>"Đừng bỏ qua tính năng preview! Xem trước giúp bạn chọn được skin ưng ý nhất."</p>
      </div>
    </div>
  </div>

  <div class="share-section">
    <h3>Chia Sẻ Mẹo Của Bạn</h3>
    <p>Bạn có mẹo hay? Hãy chia sẻ với cộng đồng!</p>
    <a href="/custom-skins/submit" class="share-btn">Gửi Mẹo Của Bạn</a>
  </div>
</div>

<style>
.tips-page { max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.tips-header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; color: white; margin-bottom: 30px; }
.tips-header h2 { margin: 0 0 10px 0; }
.tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 30px 0; }
.tip-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
.tip-card:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15); }
.tip-icon { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 20px; text-align: center; font-size: 2rem; }
.tip-content { padding: 20px; }
.tip-content h4 { color: #065f46; margin: 0 0 10px 0; }
.tip-content p { color: #4b5563; line-height: 1.6; }
.code-block { background: #1f2937; color: #10b981; padding: 12px 15px; border-radius: 8px; font-family: monospace; font-size: 0.9rem; margin-top: 15px; }
.filter-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
.filter-tag { background: #f3f4f6; padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; }
.shortcut-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
.shortcut-table td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
.shortcut-table kbd { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; border: 1px solid #d1d5db; }
.rec-item { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
.rec-label { background: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
.app-links { display: flex; gap: 10px; margin-top: 15px; }
.app-btn { background: #f3f4f6; padding: 8px 16px; border-radius: 8px; text-decoration: none; color: #374151; font-size: 0.9rem; }
.advanced-tips, .pro-tips { background: #f9fafb; padding: 30px; border-radius: 16px; margin: 40px 0; }
.advanced-tips h3, .pro-tips h3 { margin-top: 0; color: #065f46; }
.advanced-item { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
.advanced-item h4 { color: #047857; margin-top: 0; }
.cli-commands { margin-top: 15px; }
.cli-command { display: flex; flex-direction: column; background: #1f2937; padding: 12px 15px; border-radius: 8px; margin: 10px 0; }
.cli-command code { color: #10b981; font-family: monospace; font-size: 0.9rem; }
.cli-desc { color: #9ca3af; font-size: 0.85rem; margin-top: 5px; }
.community-tips { display: grid; gap: 15px; }
.community-tip { background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; }
.tip-author { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; }
.author-name { font-weight: 600; color: #065f46; }
.share-section { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 16px; margin: 40px 0; }
.share-section h3 { margin: 0 0 10px 0; color: #065f46; }
.share-btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
@media (max-width: 600px) { .tips-grid { grid-template-columns: 1fr; } }
</style>
  `
}

// Run the seed function
if (require.main === module) {
  seedModSkinV2Tutorial()
    .then(() => {
      console.log('Tutorial seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Tutorial seeding failed:', error)
      process.exit(1)
    })
}

export { seedModSkinV2Tutorial }
