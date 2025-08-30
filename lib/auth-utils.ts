import type { Session } from 'next-auth'

// Define role hierarchy and permissions
export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF', 
  USER: 'USER'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  STAFF: 2,
  ADMIN: 3
}

// Permission definitions
export const PERMISSIONS = {
  // Dashboard access
  ACCESS_DASHBOARD: 'ACCESS_DASHBOARD',
  
  // Software management
  VIEW_SOFTWARE: 'VIEW_SOFTWARE',
  CREATE_SOFTWARE: 'CREATE_SOFTWARE',
  EDIT_SOFTWARE: 'EDIT_SOFTWARE',
  DELETE_SOFTWARE: 'DELETE_SOFTWARE',
  UPLOAD_SOFTWARE: 'UPLOAD_SOFTWARE',
  
  // Review management
  VIEW_REVIEWS: 'VIEW_REVIEWS',
  MODERATE_REVIEWS: 'MODERATE_REVIEWS',
  DELETE_REVIEWS: 'DELETE_REVIEWS',
  
  // User management
  VIEW_USERS: 'VIEW_USERS',
  CREATE_USERS: 'CREATE_USERS',
  EDIT_USERS: 'EDIT_USERS',
  EDIT_USER_ROLES: 'EDIT_USER_ROLES',
  DELETE_USERS: 'DELETE_USERS',
  
  // Analytics
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  VIEW_DETAILED_ANALYTICS: 'VIEW_DETAILED_ANALYTICS',
  
  // Categories
  VIEW_CATEGORIES: 'VIEW_CATEGORIES',
  MANAGE_CATEGORIES: 'MANAGE_CATEGORIES',
  
  // System management
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SYSTEM_DEBUG: 'SYSTEM_DEBUG',
  SEO_MANAGEMENT: 'SEO_MANAGEMENT',
  
  // Content management
  VIEW_POSTS: 'VIEW_POSTS',
  CREATE_POSTS: 'CREATE_POSTS',
  EDIT_POSTS: 'EDIT_POSTS',
  DELETE_POSTS: 'DELETE_POSTS',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  
  STAFF: [
    // Dashboard access
    PERMISSIONS.ACCESS_DASHBOARD,
    
    // Software management (limited)
    PERMISSIONS.VIEW_SOFTWARE,
    PERMISSIONS.CREATE_SOFTWARE,
    PERMISSIONS.EDIT_SOFTWARE,
    PERMISSIONS.UPLOAD_SOFTWARE,
    
    // Review management
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.MODERATE_REVIEWS,
    
    // Analytics (basic)
    PERMISSIONS.VIEW_ANALYTICS,
    
    // Categories (view only)
    PERMISSIONS.VIEW_CATEGORIES,
    
    // Content management
    PERMISSIONS.VIEW_POSTS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.EDIT_POSTS,
  ],
  
  ADMIN: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ]
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: string | undefined, permission: Permission): boolean {
  if (!userRole || !(userRole in ROLE_PERMISSIONS)) {
    return false
  }
  
  const role = userRole as Role
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: string | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: string | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user role is at least the specified minimum role
 */
export function hasMinimumRole(userRole: string | undefined, minimumRole: Role): boolean {
  if (!userRole || !(userRole in ROLE_HIERARCHY) || !(minimumRole in ROLE_HIERARCHY)) {
    return false
  }
  
  return ROLE_HIERARCHY[userRole as Role] >= ROLE_HIERARCHY[minimumRole]
}

/**
 * Check if user can access dashboard
 */
export function canAccessDashboard(userRole: string | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.ACCESS_DASHBOARD)
}

/**
 * Check if user can manage software
 */
export function canManageSoftware(userRole: string | undefined): boolean {
  return hasAnyPermission(userRole, [
    PERMISSIONS.VIEW_SOFTWARE,
    PERMISSIONS.CREATE_SOFTWARE,
    PERMISSIONS.EDIT_SOFTWARE
  ])
}

/**
 * Check if user can delete software (admin only)
 */
export function canDeleteSoftware(userRole: string | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.DELETE_SOFTWARE)
}

/**
 * Check if user can manage reviews
 */
export function canManageReviews(userRole: string | undefined): boolean {
  return hasAnyPermission(userRole, [
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.MODERATE_REVIEWS
  ])
}

/**
 * Check if user can manage users (admin only)
 */
export function canManageUsers(userRole: string | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.VIEW_USERS)
}

/**
 * Check if user can edit user roles (admin only)
 */
export function canEditUserRoles(userRole: string | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.EDIT_USER_ROLES)
}

/**
 * Check if user can access analytics
 */
export function canAccessAnalytics(userRole: string | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.VIEW_ANALYTICS)
}

/**
 * Check if user can perform system operations (admin only)
 */
export function canPerformSystemOperations(userRole: string | undefined): boolean {
  return hasAnyPermission(userRole, [
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_MAINTENANCE,
    PERMISSIONS.SYSTEM_DEBUG,
    PERMISSIONS.SEO_MANAGEMENT
  ])
}

/**
 * Get user permissions list
 */
export function getUserPermissions(userRole: string | undefined): Permission[] {
  if (!userRole || !(userRole in ROLE_PERMISSIONS)) {
    return []
  }
  
  return ROLE_PERMISSIONS[userRole as Role]
}

/**
 * Validate session and check permissions
 */
export function validateSessionPermission(
  session: Session | null,
  permission: Permission
): { isValid: boolean; error?: string } {
  if (!session?.user) {
    return { isValid: false, error: 'Authentication required' }
  }
  
  if (!hasPermission(session.user.role, permission)) {
    return { isValid: false, error: 'Insufficient permissions' }
  }
  
  return { isValid: true }
}

/**
 * Validate session and check minimum role
 */
export function validateSessionRole(
  session: Session | null,
  minimumRole: Role
): { isValid: boolean; error?: string } {
  if (!session?.user) {
    return { isValid: false, error: 'Authentication required' }
  }
  
  if (!hasMinimumRole(session.user.role, minimumRole)) {
    return { isValid: false, error: 'Insufficient role level' }
  }
  
  return { isValid: true }
}