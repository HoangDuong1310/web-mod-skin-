import { z } from 'zod'

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'USER']).default('USER'),
})

export const updateUserSchema = createUserSchema.partial().omit({
  password: true,
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metaTitle: z.string().max(60, 'Meta title should not exceed 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should not exceed 160 characters').optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export const categoryQuerySchema = paginationSchema.extend({
  parentId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

// Product schemas
export const createProductSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  price: z.number().min(0, 'Price must be non-negative'),
  comparePrice: z.number().min(0, 'Compare price must be non-negative').optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative').default(0),
  images: z.array(z.string().url()).optional(),
  categoryId: z.string().optional(),
  metaTitle: z.string().max(60, 'Meta title should not exceed 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should not exceed 160 characters').optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const productQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  price_gte: z.coerce.number().min(0).optional(),
  price_lte: z.coerce.number().min(0).optional(),
  in_stock: z.coerce.boolean().optional(),
})

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Post title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  excerpt: z.string().max(300, 'Excerpt should not exceed 300 characters').optional(),
  content: z.string().min(1, 'Post content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  featuredImage: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  metaTitle: z.string().max(60, 'Meta title should not exceed 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should not exceed 160 characters').optional(),
  tags: z.array(z.string()).optional(),
})

export const updatePostSchema = createPostSchema.partial()

export const postQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.coerce.boolean().optional(),
  authorId: z.string().optional(),
  tag: z.string().optional(),
})

// Download schemas
export const createDownloadSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
})

export const downloadQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  userId: z.string().optional(),
  productId: z.string().optional(),
})

// Review schemas
export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z.number().min(1).max(5),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().optional(),
})

export const reviewQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sort: z.string().optional(),
})

// Review Reply schemas
export const createReviewReplySchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  content: z.string().min(1, 'Reply content is required').max(2000, 'Reply must not exceed 2000 characters'),
})

export const updateReviewReplySchema = z.object({
  id: z.string().min(1, 'Reply ID is required'),
  content: z.string().min(1, 'Reply content is required').max(2000, 'Reply must not exceed 2000 characters'),
})

export type CreateDownloadInput = z.infer<typeof createDownloadSchema>
export type DownloadQueryInput = z.infer<typeof downloadQuerySchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>
export type CreateReviewReplyInput = z.infer<typeof createReviewReplySchema>
export type UpdateReviewReplyInput = z.infer<typeof updateReviewReplySchema>

