# Next.js 14 Software Download Platform

A modern, fully-featured software and application download platform built with Next.js 14 App Router, TypeScript, and a comprehensive tech stack focused on performance, SEO, and user experience.

## 🚀 Features

### Core Features
- **Next.js 14 App Router** - Latest Next.js with server components and streaming
- **TypeScript** - Full type safety throughout the application  
- **Responsive Design** - Mobile-first responsive design with TailwindCSS
- **Dark/Light Theme** - System preference aware theme switching
- **SEO Optimized** - Comprehensive SEO with metadata, JSON-LD, sitemap, robots.txt
- **Internationalization Ready** - i18n support with next-intl
- **Performance Optimized** - Core Web Vitals optimized with lazy loading and caching

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Animations**: Framer Motion (subtle animations)
- **Database**: Prisma ORM with MySQL
- **Authentication**: Auth.js (NextAuth.js) with email/password + OAuth
- **Validation**: Zod schemas for type-safe validation
- **Forms**: React Hook Form with validation
- **Styling**: TailwindCSS with custom design system
- **Testing**: Vitest + Testing Library

### Platform Features
- **Software Management** - Full CRUD for software/apps with categories, screenshots, descriptions
- **Download Tracking** - Download analytics and statistics
- **User Authentication** - Secure auth with multiple providers
- **Review System** ⭐ **NEW** - Complete star rating and review system
  - 1-5 star ratings with interactive UI
  - Anonymous and authenticated user reviews  
  - Review filtering and sorting
  - Duplicate review prevention
  - Rating statistics and distribution
  - Guest review support with name/email
- **Admin Dashboard** - Comprehensive management interface
- **Download Tracking** - Download analytics and statistics  
- **Search & Filtering** - Advanced software search and filtering
- **Blog/CMS** - Content management for posts and pages

### Developer Experience
- **Type Safety** - Full TypeScript coverage
- **Database** - Prisma ORM with migrations and seeding
- **API Layer** - RESTful API with validation and rate limiting
- **Error Handling** - Comprehensive error handling with try-catch blocks
- **Security** - CSRF protection, XSS prevention, secure headers
- **Testing** - Unit and integration tests
- **Code Quality** - ESLint, Prettier, and strict TypeScript config

## 📁 Project Structure

\`\`\`
├── app/                        # Next.js App Router
│   ├── (marketing)/           # Marketing pages (SSG/ISR)
│   │   ├── page.tsx           # Homepage
│   │   └── layout.tsx         # Marketing layout
│   ├── (app)/                 # Protected app pages (SSR)
│   │   ├── dashboard/         # Admin dashboard
│   │   └── layout.tsx         # App layout with auth
│   ├── api/                   # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── products/          # Product CRUD API
│   │   ├── reviews/           # ⭐ Review system API
│   │   │   ├── route.ts       # GET/POST reviews
│   │   │   └── check/         # Check review status
│   │   ├── health/            # Health check endpoint
│   │   └── revalidate/        # ISR revalidation endpoint
│   ├── layout.tsx             # Root layout
│   ├── sitemap.ts             # Dynamic sitemap generation
│   └── robots.ts              # SEO robots configuration
├── components/                 # React components
│   ├── ui/                    # Base UI components (shadcn/ui)
│   │   ├── star-rating.tsx    # ⭐ Interactive star rating
│   │   ├── button.tsx         # Button component
│   │   └── ...                # Other UI components
│   ├── shared/                # Shared components
│   │   ├── review-form.tsx    # ⭐ Review submission form
│   │   ├── review-list.tsx    # ⭐ Reviews display & filtering
│   │   ├── product-reviews.tsx # ⭐ Complete review system
│   │   └── ...                # Other shared components
│   └── dashboard/             # Dashboard-specific components
├── lib/                       # Utility libraries
│   ├── auth.ts                # Authentication configuration
│   ├── prisma.ts              # Database client
│   ├── seo.ts                 # SEO utilities and JSON-LD
│   ├── validations.ts         # Zod schemas
│   ├── utils.ts               # Common utilities
│   └── rate-limit.ts          # API rate limiting
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── styles/                    # Global styles and CSS
├── tests/                     # Test configuration and helpers
└── server/                    # Server-side utilities
\`\`\`

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MySQL database
- npm/yarn/pnpm

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Environment Setup ⚠️ (CRITICAL FIRST STEP!)
Create a \`.env\` file based on \`.env.example\`:

\`\`\`bash
# Copy the template
cp .env.example .env
\`\`\`

Edit \`.env\` with your database credentials:

\`\`\`env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
APP_NAME="Next.js Full-Stack App"
APP_DESCRIPTION="A modern full-stack application"
APP_URL="http://localhost:3000"

# Optional OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""
\`\`\`

### 3. Database Setup (After .env is configured)
\`\`\`bash
# Initialize Prisma
npx prisma generate

# Run migrations (needs DATABASE_URL from .env)
npx prisma migrate dev --name init

# Seed the database
npm run seed
\`\`\`

### 4. Development
\`\`\`bash
# Start development server
npm run dev

# Open http://localhost:3000
\`\`\`

## 📝 Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build production bundle
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript compiler check
- \`npm run test\` - Run tests
- \`npm run prisma:generate\` - Generate Prisma client
- \`npm run prisma:migrate\` - Run database migrations
- \`npm run seed\` - Seed database with sample data

## 🔧 Database Schema

### Core Models
- **User** - User accounts with roles (ADMIN, STAFF, USER)
- **Product** - Products with categories, pricing, inventory
- **Category** - Hierarchical product categories
- **Order/OrderItem** - Order management with line items
- **Post/Tag** - Blog/CMS functionality

### Features
- **Soft Delete** - All models support soft deletion
- **Timestamps** - Automatic created/updated timestamps
- **Indexing** - Optimized database indexes
- **Full-text Search** - Search capability for products/posts
- **Relationships** - Proper foreign key relationships

## 🔒 Security Features

- **Authentication** - Secure JWT-based authentication
- **Authorization** - Role-based access control (RBAC)
- **Rate Limiting** - API rate limiting per IP/user
- **CSRF Protection** - Cross-site request forgery protection
- **XSS Prevention** - Content Security Policy headers
- **Input Validation** - Comprehensive validation with Zod
- **Secure Headers** - Security-focused HTTP headers

## 🎨 UI/UX Features

- **Design System** - Consistent design tokens and components
- **Accessibility** - WCAG compliant with proper ARIA labels
- **Responsive** - Mobile-first responsive design
- **Performance** - Optimized images, fonts, and loading states
- **Animations** - Subtle animations with Framer Motion
- **Dark Mode** - System preference aware theming

## 📈 SEO Features

- **Metadata** - Dynamic metadata generation
- **JSON-LD** - Structured data for products, articles, breadcrumbs
- **Sitemap** - Dynamic XML sitemap generation
- **Robots.txt** - SEO-friendly robots configuration
- **Open Graph** - Social media sharing optimization
- **Twitter Cards** - Twitter sharing optimization
- **Canonical URLs** - Prevent duplicate content issues

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests** - Component and utility testing
- **Integration Tests** - API and database testing
- **Type Testing** - TypeScript compilation testing
- **Coverage Reports** - Test coverage tracking

Run tests:
\`\`\`bash
npm run test
npm run test:coverage
\`\`\`

## 📊 Performance

- **Core Web Vitals** optimized
- **Image Optimization** with Next.js Image component
- **Code Splitting** with dynamic imports
- **Caching Strategy** with ISR and API caching
- **Bundle Analysis** for optimization insights

## 🌐 Deployment Ready

The application is production-ready with:

- **Environment Configuration** - Proper env var handling
- **Build Optimization** - Optimized production builds
- **Database Migrations** - Automated migration system
- **Error Handling** - Comprehensive error boundaries
- **Monitoring Ready** - Health check endpoints

## 📚 Key Libraries & Dependencies

### Production Dependencies
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with server components
- **Prisma** - Type-safe database ORM
- **Auth.js** - Authentication library
- **Zod** - Schema validation
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI primitives
- **Framer Motion** - Animation library

### Development Dependencies
- **TypeScript** - Type safety
- **Vitest** - Fast unit testing
- **Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🤝 Contributing

This is a scaffold/template project. Feel free to:

1. Fork the repository
2. Create feature branches
3. Add new functionality
4. Submit pull requests

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Next.js 14, TypeScript, and modern web technologies.
