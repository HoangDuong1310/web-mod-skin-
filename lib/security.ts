import { getSettings } from './settings'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export interface SecuritySettings {
  minPasswordLength: number
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  passwordHistoryCount: number
  maxPasswordAge: number
  sessionTimeout: number
  maxConcurrentSessions: number
  requireTwoFactor: boolean
  maxLoginAttempts: number
  lockoutDuration: number
  enableCaptcha: boolean
  adminIpWhitelist: string
  enableAuditLog: boolean
  requireAdminApproval: boolean
}

export class SecurityService {
  private settings: SecuritySettings | null = null

  async loadSettings(): Promise<SecuritySettings> {
    if (!this.settings) {
      const savedSettings = await getSettings('security')
      
      // Default settings
      this.settings = {
        minPasswordLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordHistoryCount: 3,
        maxPasswordAge: 90,
        sessionTimeout: 24,
        maxConcurrentSessions: 5,
        requireTwoFactor: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        enableCaptcha: false,
        adminIpWhitelist: '',
        enableAuditLog: true,
        requireAdminApproval: false,
        ...savedSettings
      }
    }
    
    return this.settings
  }

  async validatePassword(password: string, userId?: string): Promise<PasswordValidationResult> {
    const settings = await this.loadSettings()
    const errors: string[] = []

    // Check minimum length
    if (password.length < settings.minPasswordLength) {
      errors.push(`Password must be at least ${settings.minPasswordLength} characters long`)
    }

    // Check uppercase requirement
    if (settings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    // Check numbers requirement
    if (settings.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    // Check special characters requirement
    if (settings.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check password history (if userId provided)
    if (userId && settings.passwordHistoryCount > 0) {
      const isRepeated = await this.checkPasswordHistory(userId, password, settings.passwordHistoryCount)
      if (isRepeated) {
        errors.push(`Password cannot be one of your last ${settings.passwordHistoryCount} passwords`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async checkPasswordHistory(userId: string, newPassword: string, historyCount: number): Promise<boolean> {
    try {
      // Get recent password hashes from user's password history
      const recentPasswords = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: historyCount,
      })

      // Check if new password matches any recent password
      for (const historyEntry of recentPasswords) {
        const isMatch = await bcrypt.compare(newPassword, historyEntry.passwordHash)
        if (isMatch) {
          return true // Password was used before
        }
      }

      return false // Password is not in history
    } catch (error) {
      console.error('Error checking password history:', error)
      return false // Allow password if check fails
    }
  }

  async savePasswordToHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      const settings = await this.loadSettings()
      
      if (settings.passwordHistoryCount === 0) {
        return // Password history disabled
      }

      // Add new password to history
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        }
      })

      // Clean up old password history entries
      const allHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (allHistory.length > settings.passwordHistoryCount) {
        const toDelete = allHistory.slice(settings.passwordHistoryCount)
        await prisma.passwordHistory.deleteMany({
          where: {
            id: {
              in: toDelete.map(h => h.id)
            }
          }
        })
      }
    } catch (error) {
      console.error('Error saving password to history:', error)
    }
  }

  async checkAccountLockout(identifier: string): Promise<{ locked: boolean; remainingTime?: number }> {
    const settings = await this.loadSettings()
    
    try {
      const lockout = await prisma.accountLockout.findUnique({
        where: { identifier }
      })

      if (!lockout) {
        return { locked: false }
      }

      const now = new Date()
      const lockoutEnd = new Date(lockout.lockedUntil)

      if (now < lockoutEnd) {
        const remainingTime = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 60000) // minutes
        return { locked: true, remainingTime }
      } else {
        // Lockout expired, remove it
        await prisma.accountLockout.delete({
          where: { identifier }
        })
        return { locked: false }
      }
    } catch (error) {
      console.error('Error checking account lockout:', error)
      return { locked: false }
    }
  }

  async recordFailedLogin(identifier: string): Promise<void> {
    const settings = await this.loadSettings()
    
    try {
      // Get or create failed login attempts record
      let failedAttempts = await prisma.failedLoginAttempts.findUnique({
        where: { identifier }
      })

      if (!failedAttempts) {
        failedAttempts = await prisma.failedLoginAttempts.create({
          data: {
            identifier,
            attempts: 1,
            lastAttempt: new Date()
          }
        })
      } else {
        failedAttempts = await prisma.failedLoginAttempts.update({
          where: { identifier },
          data: {
            attempts: failedAttempts.attempts + 1,
            lastAttempt: new Date()
          }
        })
      }

      // Check if lockout should be applied
      if (failedAttempts.attempts >= settings.maxLoginAttempts) {
        const lockoutEnd = new Date()
        lockoutEnd.setMinutes(lockoutEnd.getMinutes() + settings.lockoutDuration)

        await prisma.accountLockout.upsert({
          where: { identifier },
          create: {
            identifier,
            lockedUntil: lockoutEnd,
            reason: 'Too many failed login attempts'
          },
          update: {
            lockedUntil: lockoutEnd,
            reason: 'Too many failed login attempts'
          }
        })

        // Reset failed attempts after lockout
        await prisma.failedLoginAttempts.delete({
          where: { identifier }
        })

        console.log(`🔒 Account locked: ${identifier} for ${settings.lockoutDuration} minutes`)
      }
    } catch (error) {
      console.error('Error recording failed login:', error)
    }
  }

  async recordSuccessfulLogin(identifier: string): Promise<void> {
    try {
      // Clear failed login attempts on successful login
      await prisma.failedLoginAttempts.deleteMany({
        where: { identifier }
      })
    } catch (error) {
      console.error('Error recording successful login:', error)
    }
  }

  async isAdminIpAllowed(clientIp: string): Promise<boolean> {
    const settings = await this.loadSettings()
    
    if (!settings.adminIpWhitelist || settings.adminIpWhitelist.trim() === '') {
      return true // No IP restriction
    }

    const allowedIps = settings.adminIpWhitelist
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip !== '')

    return allowedIps.includes(clientIp) || allowedIps.includes('*')
  }

  async logAuditEvent(userId: string, action: string, details?: any): Promise<void> {
    const settings = await this.loadSettings()
    
    if (!settings.enableAuditLog) {
      return
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: details ? JSON.stringify(details) : null,
          ipAddress: '', // You can pass this as parameter if needed
          userAgent: '', // You can pass this as parameter if needed
        }
      })
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  async getPasswordStrengthScore(password: string): Promise<{ score: number; feedback: string[] }> {
    const feedback: string[] = []
    let score = 0

    // Length scoring
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1

    // Pattern detection (negative scoring)
    if (/(.)\1{2,}/.test(password)) {
      score -= 1
      feedback.push('Avoid repeated characters')
    }
    
    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 2
      feedback.push('Avoid common patterns and words')
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(7, score))

    // Generate feedback based on score
    if (score <= 2) {
      feedback.unshift('Very weak password')
    } else if (score <= 3) {
      feedback.unshift('Weak password')
    } else if (score <= 4) {
      feedback.unshift('Fair password')
    } else if (score <= 5) {
      feedback.unshift('Good password')
    } else {
      feedback.unshift('Strong password')
    }

    return { score, feedback }
  }

  async checkPasswordExpiry(userId: string): Promise<{ expired: boolean; daysUntilExpiry?: number }> {
    const settings = await this.loadSettings()
    
    if (settings.maxPasswordAge === 0) {
      return { expired: false } // Password expiry disabled
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordUpdatedAt: true
        }
      })

      if (!user?.passwordUpdatedAt) {
        return { expired: true } // No password update date, consider expired
      }

      const now = new Date()
      const passwordAge = Math.floor((now.getTime() - user.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
      
      if (passwordAge >= settings.maxPasswordAge) {
        return { expired: true }
      }

      const daysUntilExpiry = settings.maxPasswordAge - passwordAge
      return { expired: false, daysUntilExpiry }
    } catch (error) {
      console.error('Error checking password expiry:', error)
      return { expired: false }
    }
  }
}

// Singleton instance
export const securityService = new SecurityService()