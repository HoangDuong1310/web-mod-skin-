import { Role } from '@prisma/client'
import { prisma } from './prisma'

export const roleUtils = {
  // Check if user has admin role
  isAdmin: (role: string | undefined): boolean => {
    return role === 'ADMIN'
  },

  // Check if user has staff role or higher
  isStaffOrAdmin: (role: string | undefined): boolean => {
    return role === 'ADMIN' || role === 'STAFF'
  },

  // Get role hierarchy level (higher number = more permissions)
  getRoleLevel: (role: string | undefined): number => {
    switch (role) {
      case 'ADMIN':
        return 3
      case 'STAFF':
        return 2
      case 'USER':
        return 1
      default:
        return 0
    }
  },

  // Check if user can access resource
  canAccess: (userRole: string | undefined, requiredRole: Role): boolean => {
    const userLevel = roleUtils.getRoleLevel(userRole)
    const requiredLevel = roleUtils.getRoleLevel(requiredRole)
    return userLevel >= requiredLevel
  },

  // Promote user to admin (for development/setup purposes)
  promoteToAdmin: async (email: string): Promise<boolean> => {
    try {
      await prisma.user.update({
        where: { email },
        data: { role: Role.ADMIN },
      })
      return true
    } catch (error) {
      console.error('Failed to promote user:', error)
      return false
    }
  },

  // Get users by role
  getUsersByRole: async (role: Role) => {
    return await prisma.user.findMany({
      where: { 
        role,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  // Change user role (admin only)
  changeUserRole: async (userId: string, newRole: Role, adminUserId: string) => {
    try {
      // Verify admin permissions
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      })

      if (!admin || admin.role !== 'ADMIN') {
        throw new Error('Admin permissions required')
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return updatedUser
    } catch (error) {
      console.error('Failed to change user role:', error)
      throw error
    }
  },
}

// Role constants for easy reference
export const ROLES = {
  USER: 'USER' as const,
  STAFF: 'STAFF' as const,
  ADMIN: 'ADMIN' as const,
} as const

// Permission constants
export const PERMISSIONS = {
  DASHBOARD_ACCESS: 'ADMIN',
  USER_MANAGEMENT: 'ADMIN',
  CONTENT_MANAGEMENT: 'STAFF',
  REVIEW_MODERATION: 'STAFF',
} as const
